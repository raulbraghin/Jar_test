import { useEffect, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../auth/AuthContext'

export default function Contrato() {
  const { user, loading, refreshUser } = useAuth()
  const [texto, setTexto] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [aceitando, setAceitando] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [aceito, setAceito] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login'
    }
  }, [user, loading])

  useEffect(() => {
    api
      .get<string>('/auth/contrato', { responseType: 'text' })
      .then((r) => setTexto(r.data))
      .catch(() => setErro('Não foi possível carregar o contrato.'))
  }, [])

  const aceitar = async () => {
    setAceitando(true)
    setMsg(null)
    try {
      await api.post('/auth/me/contrato', { aceito: true })
      await refreshUser()
      setAceito(true)
      setMsg('Contrato aceito e registrado.')
    } catch (e: any) {
      setMsg(e.response?.data?.detail || 'Falha ao registrar aceite.')
    } finally {
      setAceitando(false)
    }
  }

  const imprimir = () => window.print()

  if (!user) return null

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card shadow-md border border-slate-200 dark:border-slate-800 p-8 print:shadow-none print:border-0">
        <div className="flex items-center justify-between no-print mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Contrato de Licença de Uso — Jar-Test Digital
            </h1>
            <p className="text-sm text-muted mt-1">
              Leia integralmente antes de aceitar.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-outline" onClick={imprimir}>
              Imprimir / Salvar PDF
            </button>
            <button
              className="btn btn-primary"
              onClick={aceitar}
              disabled={aceitando || aceito}
            >
              {aceito ? 'Contrato Aceito ✓' : aceitando ? 'Registrando...' : 'Aceitar Contrato'}
            </button>
          </div>
        </div>

        {msg && <div className="sucesso-box mb-4 no-print">{msg}</div>}
        {erro && <div className="erro-box mb-4 no-print">{erro}</div>}

        {texto ? (
          <pre className="whitespace-pre-wrap text-xs sm:text-sm font-mono leading-relaxed text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 p-6 rounded-md border border-slate-200 dark:border-slate-800 print:bg-white print:text-black print:border-0">
            {texto}
          </pre>
        ) : (
          <p className="text-muted">Carregando contrato…</p>
        )}
      </div>
    </div>
  )
}
