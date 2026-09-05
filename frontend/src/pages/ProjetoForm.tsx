import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { ProjetoDetail } from '../types'

export default function ProjetoForm() {
  const [nome, setNome] = useState('')
  const [cliente, setCliente] = useState('')
  const [autor, setAutor] = useState('')
  const [descricao, setDescricao] = useState('')
  const [dataEnsaio, setDataEnsaio] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErro(null)
    setLoading(true)

    try {
      const resp = await api.post<ProjetoDetail>('/projetos/', {
        nome_projeto: nome,
        cliente: cliente || undefined,
        autor: autor || undefined,
        descricao: descricao || undefined,
        data_ensaio: dataEnsaio ? new Date(dataEnsaio).toISOString() : undefined,
      })
      navigate(`/projetos/${resp.data.id}/ensaio`)
    } catch (err: any) {
      setErro(err.response?.data?.detail || 'Erro ao criar projeto.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Novo Ensaio de Jar Test
        </h1>
        <p className="text-sm text-muted">
          Preencha os dados do ensaio para iniciar a configuração da ETA e o teste de bancada
        </p>
      </div>

      <div className="card shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        {erro && <div className="erro-box mb-4">{erro}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="nome">
              Nome do Ensaio / ETA <span className="text-red-500">*</span>
            </label>
            <input
              id="nome"
              type="text"
              required
              className="input"
              placeholder="Ex: Jar Test ETA Central - Otimização de Coagulante"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="cliente">
                Cliente / Unidade Operacional
              </label>
              <input
                id="cliente"
                type="text"
                className="input"
                placeholder="Ex: Concessionária / Município / Indústria"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
              />
            </div>

            <div>
              <label className="label" htmlFor="autor">
                Responsável Técnico / Operador
              </label>
              <input
                id="autor"
                type="text"
                className="input"
                placeholder="Ex: Eng. Químico / Sanitarista"
                value={autor}
                onChange={(e) => setAutor(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="dataEnsaio">
              Data do Ensaio
            </label>
            <input
              id="dataEnsaio"
              type="date"
              className="input"
              value={dataEnsaio}
              onChange={(e) => setDataEnsaio(e.target.value)}
            />
          </div>

          <div>
            <label className="label" htmlFor="descricao">
              Observações Adicionais (opcional)
            </label>
            <textarea
              id="descricao"
              rows={3}
              className="input"
              placeholder="Ex: Ensaio realizado pós período de chuvas com elevada turbidez na captação..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn btn-outline"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Criando...' : 'Avançar para Configuração da ETA →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
