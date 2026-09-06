import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { UsoResponse } from '../types'

function fmtPreco(valor: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
}

function fmtData(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

const DESCRICAO_PLANO: Record<string, { titulo: string; texto: string }> = {
  mensal: {
    titulo: 'Mensal',
    texto: 'Ensaios e projetos ilimitados, relatórios executivos e todos os modelos de ETA por 30 dias.',
  },
  trimestral: {
    titulo: 'Trimestral',
    texto: 'Todos os recursos PRO por 90 dias com economia de 10% em relação ao mensal.',
  },
  anual: {
    titulo: 'Anual',
    texto: 'Melhor custo-benefício: acesso contínuo por 365 dias a todos os recursos PRO.',
  },
}

export default function Plano() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [uso, setUso] = useState<UsoResponse | null>(null)
  const [assinando, setAssinando] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    api
      .get<UsoResponse>('/pagamentos/uso')
      .then((r) => setUso(r.data))
      .catch(() => undefined)
  }, [])

  async function assinar(tipo: string) {
    setErro('')
    setAssinando(tipo)
    try {
      const resp = await api.post<{ init_point: string }>('/pagamentos/checkout', { tipo })
      window.location.href = resp.data.init_point
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      setErro(
        typeof detail?.mensagem === 'string'
          ? detail.mensagem
          : 'Não foi possível iniciar o pagamento. Tente novamente em instantes.',
      )
      setAssinando('')
    }
  }

  const progresso =
    uso && !uso.pago ? Math.min(100, Math.round((uso.usados / uso.limite) * 100)) : 100

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
          Planos e Assinaturas — Jar Test
        </h1>
        <p className="text-sm text-muted max-w-xl mx-auto">
          Ensaios ilimitados, histórico completo e relatórios técnicos executivos para todas as
          suas ETAs. Assine para remover o limite do plano gratuito.
        </p>
      </div>

      {/* Status atual */}
      {isAdmin ? (
        <div className="card border-l-4 border-cyan-600 p-5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Acesso administrador
            <span className="text-xs bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300 font-bold px-2 py-0.5 rounded">
              ADMIN
            </span>
          </h3>
          <p className="text-sm text-muted mt-1">
            Contas de administrador são isentas de cobrança e não possuem limite de ensaios.
          </p>
        </div>
      ) : (
        <div className="card border-l-4 border-cyan-600 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Seu Plano Atual:
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mt-0.5">
              {uso === null ? (
                <span className="text-slate-500 dark:text-slate-400">Carregando...</span>
              ) : uso.pago ? (
                <span className="text-emerald-600 dark:text-emerald-400">Plano Profissional (PRO)</span>
              ) : (
                <span className="text-slate-700 dark:text-slate-300">Plano Gratuito (Free)</span>
              )}
              {uso?.pago && uso?.plano_ate && (
                <span className="text-xs bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300 font-bold px-2 py-0.5 rounded">
                  PRO até {fmtData(uso.plano_ate)}
                </span>
              )}
              {user?.plano_sempre && (
                <span className="text-xs bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300 font-bold px-2 py-0.5 rounded">
                  Acesso Vitalício
                </span>
              )}
            </h3>
            {uso && !uso.pago && (
              <div className="mt-3 max-w-sm">
                <div className="flex items-center justify-between text-xs text-muted mb-1">
                  <span>
                    Ensaios usados nesta janela de {uso.janela_dias} dias
                  </span>
                  <span className="font-semibold">
                    {uso.usados}/{uso.limite}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${progresso >= 100 ? 'bg-red-500' : 'bg-cyan-600'}`}
                    style={{ width: `${progresso}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {!uso?.pago && !user?.plano_sempre && (
            <Link
              to="/contrato"
              className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-md font-medium text-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Ver contrato de licença
            </Link>
          )}
        </div>
      )}

      {erro && <div className="erro-box">{erro}</div>}

      {!isAdmin && uso && !uso.configurado && (
        <div className="rounded-md bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 text-sm px-4 py-3 border border-amber-200 dark:border-amber-800">
          <strong>Pagamentos em breve.</strong> O módulo de pagamento com Mercado Pago ainda está
          sendo configurado. Por enquanto você pode usar o plano gratuito normalmente.
        </div>
      )}

      {/* Grid de planos */}
      {!isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(uso?.planos ?? []).map((plano, idx) => {
            const info = DESCRICAO_PLANO[plano.tipo] ?? {
              titulo: plano.tipo,
              texto: `Acesso PRO por ${plano.dias} dias.`,
            }
            const destaque = plano.tipo === 'trimestral'
            const bloqueado = !uso?.configurado
            return (
              <div
                key={plano.tipo}
                className={`card p-6 flex flex-col justify-between ${
                  destaque
                    ? 'border-2 border-cyan-600 relative shadow-lg'
                    : 'border border-slate-200 dark:border-slate-800 hover:border-cyan-500 transition-colors'
                }`}
              >
                {destaque && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-600 text-white text-[10px] uppercase font-bold tracking-wider px-3 py-0.5 rounded-full">
                    Mais Popular
                  </div>
                )}
                <div className="space-y-3">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${destaque ? 'text-cyan-600 dark:text-cyan-400' : 'text-muted'}`}
                  >
                    {info.titulo}
                  </span>
                  <div>
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                      {fmtPreco(plano.preco)}
                    </span>
                    <span className="text-xs text-muted"> / {plano.dias} dias</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{info.texto}</p>
                  <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
                    <li>✓ Ensaios e projetos ilimitados</li>
                    <li>✓ Relatórios executivos sem marca d'água</li>
                    <li>✓ Modelos Modular e Torrezan</li>
                  </ul>
                </div>
                <button
                  type="button"
                  disabled={bloqueado || assinando === plano.tipo}
                  className={`${destaque ? 'btn btn-primary' : 'btn btn-outline'} w-full mt-6 text-xs`}
                  onClick={() => assinar(plano.tipo)}
                  title={bloqueado ? 'Pagamentos em breve' : ''}
                >
                  {assinando === plano.tipo
                    ? 'Redirecionando...'
                    : uso?.pago
                      ? `Renovar ${info.titulo}`
                      : `Assinar ${info.titulo}`}
                </button>
              </div>
            )
          })}
          {uso !== null && uso.planos.length === 0 && (
            <p className="col-span-full text-center text-muted text-sm">
              Nenhum plano disponível no momento.
            </p>
          )}
        </div>
      )}

      {!isAdmin && uso?.pago && (
        <p className="text-center text-xs text-muted">
          Seu acesso PRO está ativo. Para renovar antes do vencimento, assine novamente acima — o
          novo período é somado ao atual.
        </p>
      )}
    </div>
  )
}
