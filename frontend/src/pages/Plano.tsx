import { useAuth } from '../auth/AuthContext'

export default function Plano() {
  const { user } = useAuth()

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
          Planos e Assinaturas — Jar Test
        </h1>
        <p className="text-sm text-muted max-w-xl mx-auto">
          Otimize ensaios de tratabilidade, exporte relatórios técnicos completos e tenha histórico ilimitado para todas as suas ETAs.
        </p>
      </div>

      {/* Status Atual */}
      <div className="card border-l-4 border-cyan-600 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Seu Plano Atual:</span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mt-0.5">
            {user?.pago ? (
              <span className="text-emerald-600 dark:text-emerald-400">Plano Profissional (PRO)</span>
            ) : (
              <span className="text-slate-700 dark:text-slate-300">Plano Gratuito (Free)</span>
            )}
            {user?.plano_sempre && (
              <span className="text-xs bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300 font-bold px-2 py-0.5 rounded">
                Acesso Vitalício Liberado
              </span>
            )}
          </h3>
          <p className="text-xs text-muted mt-1">
            {user?.pago
              ? 'Você tem acesso irrestrito a todos os cálculos, histórico e relatórios executivos.'
              : 'Você pode realizar ensaios básicos e gerar relatórios no modelo padrão.'}
          </p>
        </div>

        {!user?.pago && (
          <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-md font-medium text-center">
            Versão de Testes
          </span>
        )}
      </div>

      {/* Grid de Planos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Plano Mensal */}
        <div className="card p-6 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-cyan-500 transition-colors">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Mensal</span>
            <div>
              <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">R$ 9,99</span>
              <span className="text-xs text-muted"> / mês</span>
            </div>
            <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
              <li>✓ Ensaios e projetos ilimitados</li>
              <li>✓ Relatórios em PDF sem marca d'água</li>
              <li>✓ Modelos Modular e Torrezan</li>
              <li>✓ Acesso por 30 dias</li>
            </ul>
          </div>
          <button
            type="button"
            className="btn btn-outline w-full mt-6 text-xs"
            onClick={() => alert('O módulo de pagamento com MercadoPago estará disponível em breve na versão de produção!')}
          >
            Assinar Mensal
          </button>
        </div>

        {/* Plano Trimestral (Destaque) */}
        <div className="card p-6 border-2 border-cyan-600 relative flex flex-col justify-between shadow-lg">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-600 text-white text-[10px] uppercase font-bold tracking-wider px-3 py-0.5 rounded-full">
            Mais Popular
          </div>
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-600">Trimestral</span>
            <div>
              <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">R$ 26,99</span>
              <span className="text-xs text-muted"> / 90 dias</span>
            </div>
            <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
              <li>✓ Ensaios e projetos ilimitados</li>
              <li>✓ Relatórios executivos para clientes</li>
              <li>✓ Modelos Modular e Torrezan</li>
              <li>✓ Economia de 10%</li>
            </ul>
          </div>
          <button
            type="button"
            className="btn btn-primary w-full mt-6 text-xs"
            onClick={() => alert('O módulo de pagamento com MercadoPago estará disponível em breve na versão de produção!')}
          >
            Assinar Trimestral
          </button>
        </div>

        {/* Plano Anual */}
        <div className="card p-6 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-cyan-500 transition-colors">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Anual</span>
            <div>
              <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">R$ 99,99</span>
              <span className="text-xs text-muted"> / ano</span>
            </div>
            <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
              <li>✓ Acesso anual contínuo (365 dias)</li>
              <li>✓ Todos os recursos PRO inclusos</li>
              <li>✓ Suporte técnico prioritário</li>
              <li>✓ Melhor custo-benefício</li>
            </ul>
          </div>
          <button
            type="button"
            className="btn btn-outline w-full mt-6 text-xs"
            onClick={() => alert('O módulo de pagamento com MercadoPago estará disponível em breve na versão de produção!')}
          >
            Assinar Anual
          </button>
        </div>
      </div>
    </div>
  )
}
