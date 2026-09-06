import { useEffect, useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { User } from '../types'

interface FormData {
  nome: string
  sobrenome: string
  email: string
  cpf: string
  telefone: string
  empresa: string
  formacao: string
  cargo: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
  cep: string
}

const UFS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

const ROTULOS: Record<string, string> = {
  nome: 'Nome',
  sobrenome: 'Sobrenome',
  email: 'E-mail',
  cpf: 'CPF',
  telefone: 'Telefone',
  empresa: 'Empresa / Faculdade',
  formacao: 'Formação',
  cargo: 'Cargo / Função',
  logradouro: 'Logradouro',
  numero: 'Número',
  complemento: 'Complemento',
  bairro: 'Bairro',
  cidade: 'Cidade',
  uf: 'UF',
  cep: 'CEP',
}

function rotuloCampo(campo: string) {
  return ROTULOS[campo] ?? campo
}

/** Traduz as mensagens padrão (inglês) do Pydantic para português amigável. */
function traduzirErroCampo(msg: string) {
  const m = msg.replace(/^Value error,\s*/i, '')
  if (/at least 2 characters/i.test(m)) return 'deve ter ao menos 2 caracteres'
  if (/at least 11 characters|too short/i.test(m)) return 'incompleto'
  if (/valid email address/i.test(m)) return 'e-mail inválido'
  if (/CPF/i.test(m)) return m // mensagens de CPF já vêm em português do backend
  if (/2 characters/i.test(m)) return 'deve ter 2 letras (ex.: SP)'
  if (/Input should/i.test(m)) return 'valor inválido'
  return m.charAt(0).toLowerCase() + m.slice(1)
}

function maskCpf(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 11)
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2')
}

function maskPhone(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 10) {
    return d.replace(/^(\d{2})(\d{4})(\d)/, '($1) $2-$3').replace(/-$/, '')
  }
  return d.replace(/^(\d{2})(\d{5})(\d)/, '($1) $2-$3').replace(/-$/, '')
}

function maskCep(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 8)
  return d.replace(/^(\d{5})(\d)/, '$1-$2').replace(/-$/, '')
}

export default function Perfil() {
  const { user, loading, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [sucesso, setSucesso] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState<FormData>({
    nome: '',
    sobrenome: '',
    email: '',
    cpf: '',
    telefone: '',
    empresa: '',
    formacao: '',
    cargo: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    cep: '',
  })

  useEffect(() => {
    if (!loading && !user) navigate('/login')
  }, [user, loading, navigate])

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        nome: user.nome || '',
        sobrenome: user.sobrenome || '',
        email: user.email || '',
        cpf: user.cpf_masked || '',
        telefone: user.telefone || '',
        empresa: user.empresa || '',
        formacao: user.formacao || '',
        cargo: user.cargo || '',
        logradouro: user.logradouro || '',
        numero: user.numero || '',
        complemento: user.complemento || '',
        bairro: user.bairro || '',
        cidade: user.cidade || '',
        uf: user.uf || '',
        cep: user.cep || '',
      }))
    }
  }, [user])

  const obrigatoriosOk =
    form.nome.trim().length >= 2 &&
    form.sobrenome.trim().length >= 2 &&
    /.+@.+\..+/.test(form.email) &&
    form.cpf.replace(/\D/g, '').length === 11

  const update = (k: keyof FormData, v: string) => {
    setForm((f) => ({ ...f, [k]: v }))
    setFieldErrors((prev) => {
      if (!prev[k]) return prev
      const next = { ...prev }
      delete next[k]
      return next
    })
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErro(null)
    setSucesso(null)
    setFieldErrors({})

    if (!obrigatoriosOk) {
      setErro('Preencha todos os campos obrigatórios: nome, sobrenome, e-mail e CPF.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...form,
        cpf: form.cpf.replace(/\D/g, ''),
        telefone: form.telefone.replace(/\D/g, '') || null,
        cep: form.cep.replace(/\D/g, '') || null,
        uf: form.uf || null,
      }
      const resp = await api.put<User>('/auth/me/perfil', payload)
      await refreshUser()
      setSucesso('Perfil salvo com sucesso!')
      if (resp.data.perfil_completo) {
        setTimeout(() => navigate('/'), 1200)
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail
      if (typeof detail === 'string') {
        setErro(detail)
        setFieldErrors({})
      } else if (Array.isArray(detail)) {
        // FastAPI 422: [{ loc: ['body', '<campo>'], msg: '...' }]
        const mapped: Record<string, string> = {}
        for (const item of detail) {
          const loc: unknown[] = Array.isArray(item?.loc) ? item.loc : []
          const campo = String(loc[loc.length - 1] ?? 'geral')
          mapped[campo] = traduzirErroCampo(String(item?.msg ?? 'Valor inválido'))
        }
        setFieldErrors(mapped)
        const resumo = Object.entries(mapped)
          .map(([campo, msg]) => `${rotuloCampo(campo)}: ${msg}`)
          .join(' | ')
        setErro(resumo || 'Verifique os campos destacados.')
      } else {
        setErro('Falha ao salvar o perfil.')
        setFieldErrors({})
      }
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card shadow-md border border-slate-200 dark:border-slate-800 p-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Complete seu Perfil
        </h1>
        <p className="text-sm text-muted mt-1">
          Preencha os dados abaixo para utilizar todas as funcionalidades do Jar-Test Digital.
          {user.perfil_completo && ' (Atualização de perfil)'}
        </p>

        {erro && <div className="erro-box mt-4">{erro}</div>}
        {sucesso && <div className="sucesso-box mt-4">{sucesso}</div>}

        <form onSubmit={submit} className="space-y-6 mt-6">
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-cyan-700 dark:text-cyan-400 mb-3">
              Dados Pessoais (Obrigatórios)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Nome *</label>
                <input className={`input ${fieldErrors.nome ? 'border-red-500 dark:border-red-500' : ''}`} value={form.nome} onChange={(e) => update('nome', e.target.value)} required />
                {fieldErrors.nome && <p className="text-xs text-red-600 dark:text-red-400 mt-1">Nome {fieldErrors.nome}</p>}
              </div>
              <div>
                <label className="label">Sobrenome *</label>
                <input className={`input ${fieldErrors.sobrenome ? 'border-red-500 dark:border-red-500' : ''}`} value={form.sobrenome} onChange={(e) => update('sobrenome', e.target.value)} required />
                {fieldErrors.sobrenome && <p className="text-xs text-red-600 dark:text-red-400 mt-1">Sobrenome {fieldErrors.sobrenome}</p>}
              </div>
              <div>
                <label className="label">E-mail *</label>
                <input className={`input ${fieldErrors.email ? 'border-red-500 dark:border-red-500' : ''}`} type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
                {fieldErrors.email && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{fieldErrors.email}</p>}
              </div>
              <div>
                <label className="label">CPF *</label>
                <input
                  className={`input ${fieldErrors.cpf ? 'border-red-500 dark:border-red-500' : ''}`}
                  inputMode="numeric"
                  value={form.cpf}
                  onChange={(e) => update('cpf', maskCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  required
                />
                {fieldErrors.cpf && <p className="text-xs text-red-600 dark:text-red-400 mt-1">CPF {fieldErrors.cpf}</p>}
              </div>
              <div>
                <label className="label">Telefone</label>
                <input
                  className="input"
                  inputMode="numeric"
                  value={form.telefone}
                  onChange={(e) => update('telefone', maskPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-cyan-700 dark:text-cyan-400 mb-3">
              Dados Profissionais (Opcionais)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Empresa / Faculdade</label>
                <input className="input" value={form.empresa} onChange={(e) => update('empresa', e.target.value)} />
              </div>
              <div>
                <label className="label">Formação</label>
                <input className="input" value={form.formacao} onChange={(e) => update('formacao', e.target.value)} placeholder="Ex.: Engenheiro Químico" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Cargo / Função</label>
                <input className="input" value={form.cargo} onChange={(e) => update('cargo', e.target.value)} />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-cyan-700 dark:text-cyan-400 mb-3">
              Endereço (Opcional)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
              <div className="sm:col-span-4">
                <label className="label">Logradouro</label>
                <input className="input" value={form.logradouro} onChange={(e) => update('logradouro', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Número</label>
                <input className="input" value={form.numero} onChange={(e) => update('numero', e.target.value)} />
              </div>
              <div className="sm:col-span-3">
                <label className="label">Complemento</label>
                <input className="input" value={form.complemento} onChange={(e) => update('complemento', e.target.value)} />
              </div>
              <div className="sm:col-span-3">
                <label className="label">Bairro</label>
                <input className="input" value={form.bairro} onChange={(e) => update('bairro', e.target.value)} />
              </div>
              <div className="sm:col-span-3">
                <label className="label">Cidade</label>
                <input className="input" value={form.cidade} onChange={(e) => update('cidade', e.target.value)} />
              </div>
              <div className="sm:col-span-1">
                <label className="label">UF</label>
                <select className={`input ${fieldErrors.uf ? 'border-red-500 dark:border-red-500' : ''}`} value={form.uf} onChange={(e) => update('uf', e.target.value)}>
                  <option value="">—</option>
                  {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
                {fieldErrors.uf && <p className="text-xs text-red-600 dark:text-red-400 mt-1">UF {fieldErrors.uf}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="label">CEP</label>
                <input
                  className="input"
                  inputMode="numeric"
                  value={form.cep}
                  onChange={(e) => update('cep', maskCep(e.target.value))}
                  placeholder="00000-000"
                />
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn btn-outline" onClick={() => navigate('/')}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving || !obrigatoriosOk}>
              {saving ? 'Salvando...' : user.perfil_completo ? 'Atualizar Perfil' : 'Salvar e Continuar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
