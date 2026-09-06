import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { TokenResponse } from '../types'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErro(null)
    setInfo(null)
    setLoading(true)

    try {
      const resp = await api.post<TokenResponse>('/auth/login', { email, senha })
      login(resp.data)
      navigate(resp.data.user.perfil_completo ? '/' : '/perfil')
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Falha ao autenticar. Verifique suas credenciais.'
      setErro(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleReenviarVerificacao = async () => {
    if (!email) {
      setErro('Informe seu e-mail para reenviar a verificação.')
      return
    }
    try {
      await api.post('/auth/resend-verification', { email })
      setInfo('E-mail de verificação reenviado com sucesso! Verifique sua caixa de entrada.')
      setErro(null)
    } catch {
      setErro('Não foi possível reenviar o link de confirmação.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12 transition-colors">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <img
            src="/imagens/logo.jpg"
            alt="Jar Test"
            className="mx-auto h-16 w-16 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none'
            }}
          />
          <h2 className="mt-4 text-2xl font-bold text-slate-900 dark:text-slate-100">
            Jar-Test Digital
          </h2>
          <p className="mt-1 text-sm text-muted">
            Cálculo de dosagens, diluições e controle físico-químico
          </p>
        </div>

        <div className="card shadow-lg border border-slate-200 dark:border-slate-800 p-8">
          {erro && <div className="erro-box mb-4">{erro}</div>}
          {info && <div className="sucesso-box mb-4">{info}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                required
                className="input"
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="label" htmlFor="senha">Senha</label>
              <input
                id="senha"
                type="password"
                required
                className="input"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-2.5 mt-2"
            >
              {loading ? 'Entrando...' : 'Entrar na Plataforma'}
            </button>
          </form>

          {erro && erro.includes('não verificado') && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleReenviarVerificacao}
                className="text-xs text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 font-semibold underline cursor-pointer"
              >
                Reenviar link de confirmação por e-mail
              </button>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700/60 text-center text-sm text-muted">
            Ainda não possui cadastro?{' '}
            <Link to="/registrar" className="text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 font-semibold">
              Criar conta gratuita
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
