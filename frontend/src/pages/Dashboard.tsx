import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { ProjetoListItem } from '../types'

export default function Dashboard() {
  const [projetos, setProjetos] = useState<ProjetoListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [busca, setBusca] = useState('')

  const carregarProjetos = async () => {
    try {
      setLoading(true)
      const resp = await api.get<ProjetoListItem[]>('/projetos/')
      setProjetos(resp.data)
      setErro(null)
    } catch (err) {
      setErro('Não foi possível carregar os projetos de Jar Test.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarProjetos()
  }, [])

  const handleExcluir = async (id: string, nome: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o ensaio "${nome}"?`)) {
      return
    }
    try {
      await api.delete(`/projetos/${id}`)
      setProjetos((prev) => prev.filter((p) => p.id !== id))
    } catch {
      alert('Falha ao excluir o projeto.')
    }
  }

  const filtrados = projetos.filter(
    (p) =>
      p.nome_projeto.toLowerCase().includes(busca.toLowerCase()) ||
      (p.cliente && p.cliente.toLowerCase().includes(busca.toLowerCase())) ||
      (p.autor && p.autor.toLowerCase().includes(busca.toLowerCase())),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Meus Ensaios de Jar Test
          </h1>
          <p className="text-sm text-muted">
            Histórico de ensaios laboratoriais, dosagens de produtos químicos e relatórios
          </p>
        </div>
        <Link to="/projetos/novo" className="btn btn-primary self-start sm:self-auto">
          + Novo Ensaio
        </Link>
      </div>

      {erro && <div className="erro-box">{erro}</div>}

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-80">
          <input
            type="text"
            className="input"
            placeholder="Buscar por nome, cliente ou autor..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <div className="text-xs text-muted">
          Total de ensaios registrados: <b>{projetos.length}</b>
        </div>
      </div>

      {loading ? (
        <div className="card text-center py-12 text-muted">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-cyan-500 border-t-transparent mb-3" />
          <p>Carregando ensaios...</p>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="card text-center py-12 space-y-4">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto text-2xl">
            🧪
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
              Nenhum ensaio encontrado
            </h3>
            <p className="text-sm text-muted mt-1">
              {busca
                ? 'Nenhum ensaio corresponde aos filtros informados.'
                : 'Você ainda não cadastrou nenhum ensaio de Jar Test.'}
            </p>
          </div>
          <Link to="/projetos/novo" className="btn btn-primary">
            Cadastrar primeiro ensaio
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtrados.map((proj) => (
            <div
              key={proj.id}
              className="card hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100 line-clamp-1">
                    {proj.nome_projeto}
                  </h3>
                  {proj.tipo_eta && (
                    <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
                      {proj.tipo_eta}
                    </span>
                  )}
                </div>

                <div className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
                  {proj.cliente && (
                    <p>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Cliente:</span>{' '}
                      {proj.cliente}
                    </p>
                  )}
                  {proj.autor && (
                    <p>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Responsável:</span>{' '}
                      {proj.autor}
                    </p>
                  )}
                  {proj.vazao_modulo_ls != null && proj.vazao_modulo_ls > 0 && (
                    <p>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Vazão da ETA:</span>{' '}
                      {proj.vazao_modulo_ls} L/s
                    </p>
                  )}
                  <p>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Data do Ensaio:</span>{' '}
                    {new Date(proj.data_ensaio).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-700 dark:text-slate-300">
                    {proj.total_jarros} jarros avaliados
                  </span>
                  {proj.tem_jarro_otimo && (
                    <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold px-2 py-1 rounded">
                      ★ Jarro Ótimo Definido
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <Link
                  to={`/projetos/${proj.id}/ensaio`}
                  className="btn btn-primary text-xs py-1.5 px-3 flex-1"
                >
                  Abrir Ensaio
                </Link>
                <Link
                  to={`/projetos/${proj.id}/relatorio`}
                  className="btn btn-outline text-xs py-1.5 px-3"
                  title="Visualizar Relatório"
                >
                  Relatório
                </Link>
                <button
                  onClick={() => handleExcluir(proj.id, proj.nome_projeto)}
                  className="btn btn-danger text-xs py-1.5 px-2.5"
                  title="Excluir"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
