import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const TENTATIVAS = 20
const INTERVALO_MS = 4000

export default function PlanoStatus() {
  const { user, refreshUser } = useAuth()
  const [params] = useSearchParams()
  const status = params.get('status') || ''
  const [tentativa, setTentativa] = useState(0)
  const [aguardando, setAguardando] = useState(
    status === 'success' || status === 'approved' || status === 'pending',
  )

  useEffect(() => {
    if (!aguardando || user?.pago) return
    if (tentativa >= TENTATIVAS) {
      setAguardando(false)
      return
    }
    const timer = setTimeout(async () => {
      try {
        await refreshUser()
      } catch {
        /* sem token ainda */
      }
      setTentativa((n) => n + 1)
    }, tentativa === 0 ? 1500 : INTERVALO_MS)
    return () => clearTimeout(timer)
  }, [aguardando, tentativa, user?.pago, refreshUser])

  useEffect(() => {
    if (user?.pago) setAguardando(false)
  }, [user?.pago])

  const aprovado = !!user?.pago

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center space-y-2 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
          Status do Pagamento
        </h1>
        <p className="text-sm text-muted">
          Confirmação da sua assinatura do Jar-Test Digital
        </p>
      </div>

      <div className="card p-8 text-center space-y-6">
        {aprovado && (
          <div className="space-y-3">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto text-3xl">
              ✓
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                Pagamento aprovado!
              </h3>
              <p className="text-sm text-muted mt-1">
                Seu acesso PRO foi liberado. Você já pode usar todos os recursos ilimitados do
                Jar-Test Digital.
              </p>
            </div>
          </div>
        )}

        {!aprovado && aguardando && (
          <div className="space-y-3">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-cyan-500 border-t-transparent" />
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Aguardando confirmação...
              </h3>
              <p className="text-sm text-muted mt-1">
                Estamos confirmando seu pagamento com o Mercado Pago. Isso pode levar alguns
                instantes.
              </p>
            </div>
          </div>
        )}

        {!aprovado && !aguardando && status === 'failure' && (
          <div className="space-y-3">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto text-3xl">
              ✕
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-600 dark:text-red-400">
                Pagamento não concluído
              </h3>
              <p className="text-sm text-muted mt-1">
                O pagamento não foi aprovado ou foi cancelado. Nenhum valor foi cobrado — tente
                novamente quando quiser.
              </p>
            </div>
          </div>
        )}

        {!aprovado && !aguardando && status !== 'failure' && (
          <div className="space-y-3">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto text-3xl">
              !
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Pagamento não confirmado
              </h3>
              <p className="text-sm text-muted mt-1">
                Não recebemos a confirmação do seu pagamento ainda. Se você já pagou, aguarde alguns
                minutos e volte a esta página.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link to="/plano" className="btn btn-outline text-sm">
            {aprovado ? 'Ver meu plano' : 'Tentar novamente'}
          </Link>
          {aprovado && (
            <Link to="/" className="btn btn-primary text-sm">
              Ir para meus ensaios
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
