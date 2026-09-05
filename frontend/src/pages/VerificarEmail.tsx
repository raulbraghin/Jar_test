import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../api/client'

export default function VerificarEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'validando' | 'sucesso' | 'erro'>('validando')
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('erro')
      setMensagem('Token de verificação ausente ou link inválido.')
      return
    }

    api
      .post('/auth/verify-email', { token })
      .then((res) => {
        setStatus('sucesso')
        setMensagem(res.data.mensagem || 'E-mail verificado com sucesso!')
      })
      .catch((err) => {
        setStatus('erro')
        setMensagem(
          err.response?.data?.detail || 'Link de verificação inválido ou expirado.'
        )
      })
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12">
      <div className="max-w-md w-full card p-8 text-center space-y-4 shadow-lg border border-slate-200 dark:border-slate-800">
        {status === 'validando' && (
          <div>
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-cyan-500 border-t-transparent mb-3" />
            <h3 className="text-lg font-bold">Verificando seu e-mail...</h3>
            <p className="text-sm text-muted">Aguarde alguns instantes.</p>
          </div>
        )}

        {status === 'sucesso' && (
          <div className="space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto text-2xl">
              ✓
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Conta Ativada com Sucesso!
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">{mensagem}</p>
            <div className="pt-4">
              <Link to="/login" className="btn btn-primary w-full">
                Acessar minha conta
              </Link>
            </div>
          </div>
        )}

        {status === 'erro' && (
          <div className="space-y-3">
            <div className="w-12 h-12 bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 rounded-full flex items-center justify-center mx-auto text-2xl">
              ✕
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Não foi possível confirmar o e-mail
            </h3>
            <p className="text-sm text-red-600 dark:text-red-400">{mensagem}</p>
            <div className="pt-4 flex flex-col gap-2">
              <Link to="/login" className="btn btn-outline w-full">
                Ir para o Login e reenviar link
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
