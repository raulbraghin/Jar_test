import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

export default function Registrar() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErro(null)
    setLoading(true)

    try {
      await api.post('/auth/register', { nome, email, senha })
      setSucesso(true)
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Erro ao realizar cadastro.'
      setErro(msg)
    } finally {
      setLoading(false)
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
            Criar Conta no Jar Test
          </h2>
          <p className="mt-1 text-sm text-muted">
            Cadastre-se para calcular dosagens e registrar ensaios
          </p>
        </div>

        <div className="card shadow-lg border border-slate-200 dark:border-slate-800 p-8">
          {sucesso ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto text-2xl">
                ✓
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Cadastro realizado com sucesso!
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Enviamos um e-mail com o link de confirmação para <b>{email}</b>.
                Por favor, verifique sua caixa de entrada (ou pasta de spam) e clique no link para ativar seu acesso.
              </p>
              <div className="pt-4">
                <Link to="/login" className="btn btn-primary w-full">
                  Ir para a página de Login
                </Link>
              </div>
            </div>
          ) : (
            <>
              {erro && <div className="erro-box mb-4">{erro}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label" htmlFor="nome">Nome Completo</label>
                  <input
                    id="nome"
                    type="text"
                    required
                    className="input"
                    placeholder="Eng. Fulano de Tal"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                  />
                </div>

                <div>
                  <label className="label" htmlFor="email">E-mail Profissional</label>
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
                  <label className="label" htmlFor="senha">Senha (mínimo 6 caracteres)</label>
                  <input
                    id="senha"
                    type="password"
                    required
                    minLength={6}
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
                  {loading ? 'Cadastrando...' : 'Cadastrar e Enviar E-mail'}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700/60 text-center text-sm text-muted">
                Já possui conta cadastrada?{' '}
                <Link to="/login" className="text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 font-semibold">
                  Fazer login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
