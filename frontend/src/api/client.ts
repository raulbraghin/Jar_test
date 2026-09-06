import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const api = axios.create({ baseURL: '/api/v1' })

const TOKENS_KEY = 'jartest_tokens'

export function getTokens(): { access_token: string; refresh_token: string } | null {
  try {
    const raw = localStorage.getItem(TOKENS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveTokens(tokens: { access_token: string; refresh_token: string }) {
  localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens))
}

export function clearTokens() {
  localStorage.removeItem(TOKENS_KEY)
}

api.interceptors.request.use((config) => {
  const tokens = getTokens()
  if (tokens) {
    config.headers.Authorization = `Bearer ${tokens.access_token}`
  }
  return config
})

async function refreshAccessToken(): Promise<string | null> {
  const tokens = getTokens()
  if (!tokens) return null
  try {
    const resp = await axios.post('/api/v1/auth/refresh', {
      refresh_token: tokens.refresh_token,
    })
    const data = resp.data
    saveTokens({ access_token: data.access_token, refresh_token: data.refresh_token })
    return data.access_token
  } catch {
    clearTokens()
    return null
  }
}

api.interceptors.response.use(
  (resp) => resp,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes('/auth/login')
    ) {
      original._retry = true
      const token = await refreshAccessToken()
      if (token) {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      }
      window.dispatchEvent(new Event('jartest:logout'))
    }
    const data = error.response?.data as
      | { detail?: { code?: string } }
      | undefined
    if (error.response?.status === 402 && data?.detail?.code === 'LIMITE_ATINGIDO') {
      window.location.assign('/plano')
    }
    return Promise.reject(error)
  },
)

export default api
