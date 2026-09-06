import { FormEvent, useEffect, useState } from 'react'
import api from '../api/client'
import { ConcederResponse, Role, User } from '../types'

const ROLES: { value: Role; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'engenheiro', label: 'Engenheiro' },
]

function fmtData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

function detalheErro(err: any, padrao: string): string {
  const d = err?.response?.data?.detail
  if (typeof d === 'string') return d
  if (typeof d?.mensagem === 'string') return d.mensagem
  return padrao
}

export default function Admin() {
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [carregando, setCarregando] = useState(true)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [role, setRole] = useState<Role>('engenheiro')
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  function carregar() {
    api
      .get<User[]>('/users')
      .then((r) => setUsuarios(r.data))
      .catch((err) => setErro(detalheErro(err, 'Não foi possível carregar os usuários.')))
      .finally(() => setCarregando(false))
  }

  useEffect(carregar, [])

  async function criar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setMensagem('')
    try {
      await api.post('/users', { nome, email, senha, role })
      setNome('')
      setEmail('')
      setSenha('')
      setRole('engenheiro')
      setMensagem(`Usuário criado com sucesso (e-mail já verificado).`)
      carregar()
    } catch (err) {
      setErro(detalheErro(err, 'Não foi possível criar o usuário.'))
    }
  }

  async function atualizar(id: string, patch: Partial<User>) {
    setErro('')
    setMensagem('')
    try {
      await api.patch(`/users/${id}`, patch)
      carregar()
    } catch (err) {
      setErro(detalheErro(err, 'Não foi possível atualizar o usuário.'))
    }
  }

  async function excluir(id: string, nomeUsuario: string) {
    if (!window.confirm(`Tem certeza que deseja excluir o usuário "${nomeUsuario}"?`)) return
    setErro('')
    setMensagem('')
    try {
      await api.delete(`/users/${id}`)
      carregar()
    } catch (err) {
      setErro(detalheErro(err, 'Não foi possível excluir o usuário.'))
    }
  }

  async function conceder(email: string, modo: 'teste30' | 'sempre' | 'revogar') {
    setErro('')
    setMensagem('')
    try {
      const resp = await api.post<ConcederResponse>('/pagamentos/admin/conceder', {
        modo,
        usuario_email: email,
      })
      setMensagem(resp.data.mensagem)
      carregar()
    } catch (err) {
      setErro(detalheErro(err, 'Não foi possível alterar a liberação do usuário.'))
    }
  }

  function statusPlano(u: User): string {
    if (u.role === 'admin') return 'Admin'
    if (u.plano_sempre) return 'Acesso Vitalício'
    if (u.plano_ate && new Date(u.plano_ate).getTime() > Date.now()) {
      return `PRO até ${fmtData(u.plano_ate)}`
    }
    return 'Plano Gratuito'
  }

  const temLiberacao = (u: User) =>
    u.role !== 'admin' && (!!u.plano_sempre || !!u.plano_ate)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Administração
        </h1>
        <p className="text-sm text-muted">
          Gerencie usuários, permissões e liberações de acesso (planos).
        </p>
      </div>

      {erro && <div className="erro-box">{erro}</div>}
      {mensagem && <div className="sucesso-box">{mensagem}</div>}

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Criar novo usuário */}
        <div className="card">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
            Criar novo usuário
          </h2>
          <form onSubmit={criar} className="space-y-4">
            <div>
              <label className="label">Nome</label>
              <input
                className="input"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                minLength={2}
              />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Senha</label>
              <input
                type="password"
                className="input"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="label">Perfil</label>
              <select
                className="input"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary w-full">
              Criar usuário
            </button>
            <p className="text-[11px] text-muted text-center">
              O usuário é criado já com e-mail verificado (sem envio de confirmação).
            </p>
          </form>
        </div>

        {/* Lista de usuários */}
        <div className="card lg:col-span-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
            Usuários cadastrados
          </h2>
          {carregando && <div className="text-muted text-sm py-6 text-center">Carregando...</div>}
          {!carregando && usuarios.length === 0 && (
            <div className="text-muted text-sm py-6 text-center">Nenhum usuário cadastrado.</div>
          )}
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {usuarios.map((u) => (
              <div
                key={u.id}
                className="py-3 flex items-center justify-between flex-wrap gap-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 dark:text-slate-200">{u.nome}</p>
                  <p className="text-xs text-muted break-all">{u.email}</p>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    {u.role === 'admin' ? (
                      <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                        🟡 Admin
                      </span>
                    ) : u.plano_sempre ? (
                      <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                        🟠 Acesso Vitalício
                      </span>
                    ) : u.plano_ate && new Date(u.plano_ate).getTime() > Date.now() ? (
                      <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300">
                        🔵 PRO até {fmtData(u.plano_ate)}
                      </span>
                    ) : (
                      <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        ⚪ Gratuito
                      </span>
                    )}
                    <span
                      className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        u.ativo
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                      }`}
                    >
                      {u.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    className="input !w-32 !py-1.5 text-xs"
                    value={u.role}
                    onChange={(e) => atualizar(u.id, { role: e.target.value as Role })}
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>

                  {u.role !== 'admin' && (
                    <>
                      <button
                        onClick={() => conceder(u.email, 'teste30')}
                        title="Libera acesso PRO por 30 dias (independente de pagamento)"
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-md bg-cyan-50 text-cyan-700 hover:bg-cyan-100 dark:bg-cyan-900/40 dark:text-cyan-300 transition-colors"
                      >
                        +30 dias
                      </button>
                      <button
                        onClick={() => conceder(u.email, 'sempre')}
                        title="Liberação permanente (não expira)"
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300 transition-colors"
                      >
                        Vitalício
                      </button>
                      {temLiberacao(u) && (
                        <button
                          onClick={() => conceder(u.email, 'revogar')}
                          title="Remove a liberação (volta ao plano grátis)"
                          className="text-xs font-semibold px-2.5 py-1.5 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 transition-colors"
                        >
                          Revogar
                        </button>
                      )}
                    </>
                  )}

                  <button
                    onClick={() => atualizar(u.id, { ativo: !u.ativo })}
                    title={u.ativo ? 'Desativar conta' : 'Reativar conta'}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                      u.ativo
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/40 dark:text-red-300'
                    }`}
                  >
                    {u.ativo ? 'Desativar' : 'Reativar'}
                  </button>
                  <button
                    onClick={() => excluir(u.id, u.nome)}
                    className="btn btn-danger !px-3 !py-1.5 text-xs"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
