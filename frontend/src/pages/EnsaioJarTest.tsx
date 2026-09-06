import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../api/client'
import {
  AguaBruta,
  ConfiguracaoETA,
  DosagensPlanta,
  ProjetoDetail,
  ResultadoJarro,
  UnidadeDosagem,
} from '../types'

/** Conversão local (espelha o backend): ppm -> mL/min de produto comercial. */
export function ppmParaMlMinLocal(ppm: number, concStr: string, densStr: string, vazaoLs: number) {
  const c = parseFloat(concStr)
  const d = parseFloat(densStr)
  if (!vazaoLs || !c || !d || !(ppm >= 0)) return 0
  return (ppm * vazaoLs * 0.06) / ((c / 100) * d)
}

/** Conversão local: mL de produto num jarro de 2 L -> ppm. */
export function mlJarroParaPpmLocal(ml: number, concStr: string, densStr: string) {
  const c = parseFloat(concStr)
  const d = parseFloat(densStr)
  if (!c || !d || !(ml >= 0)) return 0
  return (ml * (c / 100) * d * 1000) / 2
}

/** Conversão local: ppm num jarro de 2 L -> mL de produto. */
export function ppmJarroParaMlLocal(ppm: number, concStr: string, densStr: string) {
  const c = parseFloat(concStr)
  const d = parseFloat(densStr)
  if (!c || !d || !(ppm >= 0)) return 0
  return (ppm * 2) / ((c / 100) * d * 1000)
}

export default function EnsaioJarTest() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [projeto, setProjeto] = useState<ProjetoDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)

  // Etapa ativa: 1 = ETA, 2 = Dosagem Planta, 3 = Diluições Jar Test, 4 = Água Bruta & Resultados Jarros
  const [etapa, setEtapa] = useState<1 | 2 | 3 | 4>(1)

  // 1. Configuração ETA
  const [tipoETA, setTipoETA] = useState<'modular' | 'torrezan'>('modular')
  const [vazaoModulo, setVazaoModulo] = useState<number>(20)

  // Modular
  const [qtdFlocMod, setQtdFlocMod] = useState<number>(2)
  const [diaFlocMod, setDiaFlocMod] = useState<number>(2.0)
  const [altFlocMod, setAltFlocMod] = useState<number>(2.5)
  const [qtdDecMod, setQtdDecMod] = useState<number>(2)
  const [diaDecMod, setDiaDecMod] = useState<number>(3.0)
  const [altDecMod, setAltDecMod] = useState<number>(3.0)

  // Torrezan
  const [compFlocTor, setCompFlocTor] = useState<number>(5.0)
  const [largFlocTor, setLargFlocTor] = useState<number>(3.0)
  const [altFlocTor, setAltFlocTor] = useState<number>(2.0)
  const [decPorFlocTor, setDecPorFlocTor] = useState<number>(2)
  const [compDecTor, setCompDecTor] = useState<number>(8.0)
  const [largDecTor, setLargDecTor] = useState<number>(3.0)
  const [altDecTor, setAltDecTor] = useState<number>(2.5)

  const [configETA, setConfigETA] = useState<ConfiguracaoETA | null>(null)

  // 2. Dosagens na Planta (ml/min ou ppm)
  const [unidade, setUnidade] = useState<UnidadeDosagem>('ml_min')
  const [dosPAC, setDosPAC] = useState<number>(30)
  const [dosHipo, setDosHipo] = useState<number>(15)
  const [dosAlc, setDosAlc] = useState<number>(10)
  const [dosFlu, setDosFlu] = useState<number>(5)
  const [ppmPAC, setPpmPAC] = useState<number>(10)
  const [ppmHipo, setPpmHipo] = useState<number>(2)
  const [ppmAlc, setPpmAlc] = useState<number>(5)
  const [ppmFlu, setPpmFlu] = useState<number>(1)
  // Concentração (% m/m do ativo) e densidade (g/mL) de cada produto — obrigatórios no modo ppm
  const [concPAC, setConcPAC] = useState<string>('')
  const [densPAC, setDensPAC] = useState<string>('')
  const [concHipo, setConcHipo] = useState<string>('')
  const [densHipo, setDensHipo] = useState<string>('')
  const [concAlc, setConcAlc] = useState<string>('')
  const [densAlc, setDensAlc] = useState<string>('')
  const [concFlu, setConcFlu] = useState<string>('')
  const [densFlu, setDensFlu] = useState<string>('')
  const [dosagensPlanta, setDosagensPlanta] = useState<DosagensPlanta | null>(null)

  // 4. Água Bruta
  const [aguaBruta, setAguaBruta] = useState<AguaBruta>({
    cor_aparente: 80,
    turbidez: 35,
    ph: 6.8,
    condutividade: 140,
    alcalinidade: 28,
    temperatura_c: 22,
  })

  // 4. Jarros 1 a 6
  const [jarros, setJarros] = useState<ResultadoJarro[]>([
    { numero_jarro: 1, dose_pac_ml: 1.0, dose_hipo_ml: 0.5, dose_alc_ml: 0.3, dose_flu_ml: 0.2, cor_aparente: 20, turbidez: 4.5, ph: 6.6, cloro_residual: 0.8, fluor: 0.7, condutividade: 145, remocao_cor_perc: 75, remocao_turbidez_perc: 87, atende_potabilidade: false, jarro_otimo: false, tamanho_floco: 'Pequeno', velocidade_sedimentacao: 'Lenta' },
    { numero_jarro: 2, dose_pac_ml: 1.5, dose_hipo_ml: 0.5, dose_alc_ml: 0.3, dose_flu_ml: 0.2, cor_aparente: 14, turbidez: 2.2, ph: 6.7, cloro_residual: 0.9, fluor: 0.7, condutividade: 148, remocao_cor_perc: 82.5, remocao_turbidez_perc: 93.7, atende_potabilidade: false, jarro_otimo: false, tamanho_floco: 'Médio', velocidade_sedimentacao: 'Média' },
    { numero_jarro: 3, dose_pac_ml: 2.0, dose_hipo_ml: 0.5, dose_alc_ml: 0.4, dose_flu_ml: 0.2, cor_aparente: 8, turbidez: 1.2, ph: 6.9, cloro_residual: 1.1, fluor: 0.8, condutividade: 152, remocao_cor_perc: 90, remocao_turbidez_perc: 96.5, atende_potabilidade: true, jarro_otimo: true, tamanho_floco: 'Grande', velocidade_sedimentacao: 'Rápida' },
    { numero_jarro: 4, dose_pac_ml: 2.5, dose_hipo_ml: 0.5, dose_alc_ml: 0.4, dose_flu_ml: 0.2, cor_aparente: 6, turbidez: 0.9, ph: 7.0, cloro_residual: 1.2, fluor: 0.8, condutividade: 155, remocao_cor_perc: 92.5, remocao_turbidez_perc: 97.4, atende_potabilidade: true, jarro_otimo: false, tamanho_floco: 'Grande', velocidade_sedimentacao: 'Rápida' },
    { numero_jarro: 5, dose_pac_ml: 3.0, dose_hipo_ml: 0.5, dose_alc_ml: 0.5, dose_flu_ml: 0.2, cor_aparente: 7, turbidez: 1.1, ph: 7.1, cloro_residual: 1.3, fluor: 0.8, condutividade: 160, remocao_cor_perc: 91.2, remocao_turbidez_perc: 96.8, atende_potabilidade: true, jarro_otimo: false, tamanho_floco: 'Médio', velocidade_sedimentacao: 'Rápida' },
    { numero_jarro: 6, dose_pac_ml: 3.5, dose_hipo_ml: 0.5, dose_alc_ml: 0.5, dose_flu_ml: 0.2, cor_aparente: 10, turbidez: 1.8, ph: 7.2, cloro_residual: 1.4, fluor: 0.8, condutividade: 165, remocao_cor_perc: 87.5, remocao_turbidez_perc: 94.8, atende_potabilidade: true, jarro_otimo: false, tamanho_floco: 'Pequeno', velocidade_sedimentacao: 'Média' },
  ])

  useEffect(() => {
    if (!id) return
    api
      .get<ProjetoDetail>(`/projetos/${id}`)
      .then((res) => {
        const p = res.data
        setProjeto(p)
        if (p.configuracao) {
          setConfigETA(p.configuracao)
          setTipoETA(p.configuracao.tipo_eta)
          setVazaoModulo(p.configuracao.vazao_modulo_ls)
          if (p.configuracao.tipo_eta === 'modular') {
            setQtdFlocMod(p.configuracao.qtd_floc_modular || 2)
            setDiaFlocMod(p.configuracao.diametro_floc_modular || 2.0)
            setAltFlocMod(p.configuracao.altura_floc_modular || 2.5)
            setQtdDecMod(p.configuracao.qtd_dec_modular || 2)
            setDiaDecMod(p.configuracao.diametro_dec_modular || 3.0)
            setAltDecMod(p.configuracao.altura_dec_modular || 3.0)
          } else {
            setCompFlocTor(p.configuracao.comp_floc_torrezan || 5.0)
            setLargFlocTor(p.configuracao.larg_floc_torrezan || 3.0)
            setAltFlocTor(p.configuracao.alt_floc_torrezan || 2.0)
            setDecPorFlocTor(p.configuracao.dec_por_floc_torrezan || 2)
            setCompDecTor(p.configuracao.comp_dec_torrezan || 8.0)
            setLargDecTor(p.configuracao.larg_dec_torrezan || 3.0)
            setAltDecTor(p.configuracao.alt_dec_torrezan || 2.5)
          }
        }
        if (p.dosagens) {
          setDosagensPlanta(p.dosagens)
          setUnidade(p.dosagens.unidade === 'ppm' ? 'ppm' : 'ml_min')
          setDosPAC(p.dosagens.dosagem_pac_ml_min)
          setDosHipo(p.dosagens.dosagem_hipo_ml_min)
          setDosAlc(p.dosagens.dosagem_alc_ml_min)
          setDosFlu(p.dosagens.dosagem_flu_ml_min)
          setPpmPAC(p.dosagens.dosagem_pac_ppm ?? 0)
          setPpmHipo(p.dosagens.dosagem_hipo_ppm ?? 0)
          setPpmAlc(p.dosagens.dosagem_alc_ppm ?? 0)
          setPpmFlu(p.dosagens.dosagem_flu_ppm ?? 0)
          const txt = (v: number | null | undefined) => (v === null || v === undefined ? '' : String(v))
          setConcPAC(txt(p.dosagens.pac_conc_perc))
          setDensPAC(txt(p.dosagens.pac_densidade))
          setConcHipo(txt(p.dosagens.hipo_conc_perc))
          setDensHipo(txt(p.dosagens.hipo_densidade))
          setConcAlc(txt(p.dosagens.alc_conc_perc))
          setDensAlc(txt(p.dosagens.alc_densidade))
          setConcFlu(txt(p.dosagens.flu_conc_perc))
          setDensFlu(txt(p.dosagens.flu_densidade))
        }
        if (p.agua_bruta) {
          setAguaBruta(p.agua_bruta)
        }
        if (p.jarros && p.jarros.length > 0) {
          setJarros(p.jarros)
        }
      })
      .catch(() => setErro('Não foi possível carregar os dados do projeto.'))
      .finally(() => setLoading(false))
  }, [id])

  // No modo ppm, completa dose_*_ppm a partir de dose_*_ml ao carregar
  useEffect(() => {
    if (dosagensPlanta?.unidade !== 'ppm') return
    const par = (conc?: number | null, dens?: number | null) => ({
      conc: conc !== null && conc !== undefined ? String(conc) : '',
      dens: dens !== null && dens !== undefined ? String(dens) : '',
    })
    const P = {
      pac: par(dosagensPlanta.pac_conc_perc, dosagensPlanta.pac_densidade),
      alc: par(dosagensPlanta.alc_conc_perc, dosagensPlanta.alc_densidade),
      hipo: par(dosagensPlanta.hipo_conc_perc, dosagensPlanta.hipo_densidade),
      flu: par(dosagensPlanta.flu_conc_perc, dosagensPlanta.flu_densidade),
    }
    setJarros((prev) => {
      let mudou = false
      const novo = prev.map((j) => {
        const n = { ...j }
        const completa = (
          ml: number | null | undefined,
          ppm: number | null | undefined,
          prod: 'pac' | 'alc' | 'hipo' | 'flu',
        ) => {
          if ((ppm === null || ppm === undefined) && ml !== null && ml !== undefined) {
            const c = parseFloat(P[prod].conc)
            const d = parseFloat(P[prod].dens)
            if (c && d) {
              mudou = true
              return mlJarroParaPpmLocal(ml, P[prod].conc, P[prod].dens)
            }
          }
          return ppm
        }
        n.dose_pac_ppm = completa(n.dose_pac_ml, n.dose_pac_ppm, 'pac')
        n.dose_alc_ppm = completa(n.dose_alc_ml, n.dose_alc_ppm, 'alc')
        n.dose_hipo_ppm = completa(n.dose_hipo_ml, n.dose_hipo_ppm, 'hipo')
        n.dose_flu_ppm = completa(n.dose_flu_ml, n.dose_flu_ppm, 'flu')
        return n
      })
      return mudou ? novo : prev
    })
  }, [dosagensPlanta])

  // Salvar Etapa 1
  const handleSalvarConfigETA = async () => {
    setErro(null)
    setSalvando(true)
    try {
      const payload = {
        tipo_eta: tipoETA,
        vazao_modulo_ls: vazaoModulo,
        qtd_floc_modular: tipoETA === 'modular' ? qtdFlocMod : undefined,
        diametro_floc_modular: tipoETA === 'modular' ? diaFlocMod : undefined,
        altura_floc_modular: tipoETA === 'modular' ? altFlocMod : undefined,
        qtd_dec_modular: tipoETA === 'modular' ? qtdDecMod : undefined,
        diametro_dec_modular: tipoETA === 'modular' ? diaDecMod : undefined,
        altura_dec_modular: tipoETA === 'modular' ? altDecMod : undefined,

        comp_floc_torrezan: tipoETA === 'torrezan' ? compFlocTor : undefined,
        larg_floc_torrezan: tipoETA === 'torrezan' ? largFlocTor : undefined,
        alt_floc_torrezan: tipoETA === 'torrezan' ? altFlocTor : undefined,
        dec_por_floc_torrezan: tipoETA === 'torrezan' ? decPorFlocTor : undefined,
        comp_dec_torrezan: tipoETA === 'torrezan' ? compDecTor : undefined,
        larg_dec_torrezan: tipoETA === 'torrezan' ? largDecTor : undefined,
        alt_dec_torrezan: tipoETA === 'torrezan' ? altDecTor : undefined,
      }

      const resp = await api.post<ConfiguracaoETA>(`/projetos/${id}/configuracao`, payload)
      setConfigETA(resp.data)
      setSucesso('Configuração da ETA salva com sucesso!')
      setTimeout(() => setSucesso(null), 3000)
      setEtapa(2)
    } catch (err: any) {
      setErro(err.response?.data?.detail || 'Erro ao salvar configuração da ETA.')
    } finally {
      setSalvando(false)
    }
  }

  // Salvar Etapa 2
  const handleSalvarDosagens = async () => {
    setErro(null)
    setSalvando(true)
    try {
      const num = (s: string) => {
        const v = parseFloat(s.replace(',', '.'))
        return Number.isFinite(v) && v > 0 ? v : undefined
      }
      if (unidade === 'ppm') {
        const faltando: string[] = []
        if ((ppmPAC > 0) && (!num(concPAC) || !num(densPAC))) faltando.push('PAC')
        if ((ppmHipo > 0) && (!num(concHipo) || !num(densHipo))) faltando.push('Hipoclorito')
        if ((ppmAlc > 0) && (!num(concAlc) || !num(densAlc))) faltando.push('Alcalinizante')
        if ((ppmFlu > 0) && (!num(concFlu) || !num(densFlu))) faltando.push('Fluoreto')
        if (faltando.length > 0) {
          setErro(`No modo ppm, informe concentração (% m/m) e densidade (g/mL) de: ${faltando.join(', ')}.`)
          setSalvando(false)
          return
        }
      }
      const payload = {
        unidade,
        dosagem_pac_ml_min: dosPAC,
        dosagem_hipo_ml_min: dosHipo,
        dosagem_alc_ml_min: dosAlc,
        dosagem_flu_ml_min: dosFlu,
        dosagem_pac_ppm: unidade === 'ppm' ? ppmPAC : undefined,
        dosagem_hipo_ppm: unidade === 'ppm' ? ppmHipo : undefined,
        dosagem_alc_ppm: unidade === 'ppm' ? ppmAlc : undefined,
        dosagem_flu_ppm: unidade === 'ppm' ? ppmFlu : undefined,
        pac_conc_perc: num(concPAC),
        pac_densidade: num(densPAC),
        hipo_conc_perc: num(concHipo),
        hipo_densidade: num(densHipo),
        alc_conc_perc: num(concAlc),
        alc_densidade: num(densAlc),
        flu_conc_perc: num(concFlu),
        flu_densidade: num(densFlu),
      }
      const resp = await api.post<DosagensPlanta>(`/projetos/${id}/dosagens`, payload)
      setDosagensPlanta(resp.data)
      setSucesso('Dosagens da planta e diluições calculadas com sucesso!')
      setTimeout(() => setSucesso(null), 3000)
      setEtapa(3)
    } catch (err: any) {
      const detail = err.response?.data?.detail
      setErro(typeof detail === 'string' ? detail : 'Erro ao calcular diluições.')
    } finally {
      setSalvando(false)
    }
  }

  // Atualizar campo de jarro e recalcular remoção
  const handleUpdateJarro = (index: number, campo: keyof ResultadoJarro, valor: any) => {
    setJarros((prev) => {
      const novo = [...prev]
      novo[index] = { ...novo[index], [campo]: valor }

      // Recalcular eficiências em tempo real
      const turbBruta = aguaBruta.turbidez
      const corBruta = aguaBruta.cor_aparente
      const turbFinal = novo[index].turbidez
      const corFinal = novo[index].cor_aparente
      const phFinal = novo[index].ph

      if (turbBruta > 0) {
        novo[index].remocao_turbidez_perc = Math.round(
          Math.max(0, ((turbBruta - turbFinal) / turbBruta) * 100) * 100,
        ) / 100
      }
      if (corBruta > 0) {
        novo[index].remocao_cor_perc = Math.round(
          Math.max(0, ((corBruta - corFinal) / corBruta) * 100) * 100,
        ) / 100
      }

      // Potabilidade: Cor <= 15 uH, Turbidez <= 2.0 NTU (decantada), pH entre 6.0 e 9.0
      novo[index].atende_potabilidade =
        corFinal <= 15.0 && turbFinal <= 2.0 && phFinal >= 6.0 && phFinal <= 9.0

      return novo
    })
  }

  // Atualizar dose de um jarro na unidade visível, mantendo o par (mL, ppm) sincronizado
  const handleUpdateDose = (
    index: number,
    prod: 'pac' | 'alc' | 'hipo',
    valor: number,
    emPPM: boolean,
  ) => {
    const par = paramsJarros[prod]
    const c = parseFloat(par.conc)
    const d = parseFloat(par.dens)
    const temParams = !!(c && d)
    const mlKey = `dose_${prod}_ml` as keyof ResultadoJarro
    const ppmKey = `dose_${prod}_ppm` as keyof ResultadoJarro
    setJarros((prev) => {
      const novo = [...prev]
      const atual = { ...novo[index] }
      if (emPPM) {
        atual[ppmKey] = valor as never
        atual[mlKey] = (temParams ? ppmJarroParaMlLocal(valor, par.conc, par.dens) : (atual[mlKey] ?? null)) as never
      } else {
        atual[mlKey] = valor as never
        atual[ppmKey] = (temParams ? mlJarroParaPpmLocal(valor, par.conc, par.dens) : (atual[ppmKey] ?? null)) as never
      }
      novo[index] = atual
      return novo
    })
  }

  const handleMarcarOtimo = (index: number) => {
    setJarros((prev) =>
      prev.map((j, i) => ({
        ...j,
        jarro_otimo: i === index,
      })),
    )
  }

  // Salvar Etapa 4 (Ensaio Completo)
  const handleSalvarEnsaio = async () => {
    setErro(null)
    setSalvando(true)
    try {
      await api.post(`/projetos/${id}/ensaio/completo`, {
        agua_bruta: aguaBruta,
        jarros: jarros,
      })
      setSucesso('Ensaio de Jar Test salvo com sucesso no banco de dados!')
      setTimeout(() => {
        navigate(`/projetos/${id}/relatorio`)
      }, 1000)
    } catch (err: any) {
      setErro(err.response?.data?.detail || 'Erro ao salvar resultados laboratoriais.')
    } finally {
      setSalvando(false)
    }
  }

  // Config dos 4 produtos para renderização da Etapa 2
  const produtosDosagem = [
    { chave: 'pac' as const, rotulo: 'PAC (Coagulante)', ml: dosPAC, setMl: setDosPAC, ppm: ppmPAC, setPpm: setPpmPAC, conc: concPAC, setConc: setConcPAC, dens: densPAC, setDens: setDensPAC },
    { chave: 'hipo' as const, rotulo: 'Hipoclorito (Pré-Cloração)', ml: dosHipo, setMl: setDosHipo, ppm: ppmHipo, setPpm: setPpmHipo, conc: concHipo, setConc: setConcHipo, dens: densHipo, setDens: setDensHipo },
    { chave: 'alc' as const, rotulo: 'Alcalinizante (Soda / Cal)', ml: dosAlc, setMl: setDosAlc, ppm: ppmAlc, setPpm: setPpmAlc, conc: concAlc, setConc: setConcAlc, dens: densAlc, setDens: setDensAlc },
    { chave: 'flu' as const, rotulo: 'Ácido Fluorsilíssico', ml: dosFlu, setMl: setDosFlu, ppm: ppmFlu, setPpm: setPpmFlu, conc: concFlu, setConc: setConcFlu, dens: densFlu, setDens: setDensFlu },
  ]

  const modoPPM = (dosagensPlanta?.unidade ?? unidade) === 'ppm'
  const paramsJarros = {
    pac: { conc: concPAC || String(dosagensPlanta?.pac_conc_perc ?? ''), dens: densPAC || String(dosagensPlanta?.pac_densidade ?? '') },
    hipo: { conc: concHipo || String(dosagensPlanta?.hipo_conc_perc ?? ''), dens: densHipo || String(dosagensPlanta?.hipo_densidade ?? '') },
    alc: { conc: concAlc || String(dosagensPlanta?.alc_conc_perc ?? ''), dens: densAlc || String(dosagensPlanta?.alc_densidade ?? '') },
    flu: { conc: concFlu || String(dosagensPlanta?.flu_conc_perc ?? ''), dens: densFlu || String(dosagensPlanta?.flu_densidade ?? '') },
  }

  if (loading) {
    return (
      <div className="card text-center py-16 text-muted">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-cyan-500 border-t-transparent mb-3" />
        <p>Carregando ensaio de Jar Test...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header do Ensaio */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/" className="text-xs text-muted hover:text-cyan-600">
              ← Meus Projetos
            </Link>
            <span className="text-xs text-muted">/</span>
            <span className="text-xs font-semibold text-cyan-600">Ensaio Técnico</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {projeto?.nome_projeto}
          </h1>
          <p className="text-xs text-muted">
            {projeto?.cliente && `Cliente: ${projeto.cliente} • `}
            Data: {projeto?.data_ensaio ? new Date(projeto.data_ensaio).toLocaleDateString('pt-BR') : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to={`/projetos/${id}/relatorio`} className="btn btn-outline text-xs">
            📄 Relatório Completo
          </Link>
        </div>
      </div>

      {erro && <div className="erro-box">{erro}</div>}
      {sucesso && <div className="sucesso-box">{sucesso}</div>}

      {/* Navegador de Etapas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <button
          onClick={() => setEtapa(1)}
          className={`p-3 rounded-lg border text-left text-xs font-medium transition-all ${
            etapa === 1
              ? 'border-cyan-500 bg-cyan-50 text-cyan-900 dark:bg-cyan-950/50 dark:text-cyan-200 shadow-sm'
              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900'
          }`}
        >
          <span className="font-bold block text-sm mb-0.5">1. Geometria ETA</span>
          Dimensões e Tempos
        </button>

        <button
          onClick={() => setEtapa(2)}
          className={`p-3 rounded-lg border text-left text-xs font-medium transition-all ${
            etapa === 2
              ? 'border-cyan-500 bg-cyan-50 text-cyan-900 dark:bg-cyan-950/50 dark:text-cyan-200 shadow-sm'
              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900'
          }`}
        >
          <span className="font-bold block text-sm mb-0.5">2. Dosagens Planta</span>
          Vazão e dosagens na ETA
        </button>

        <button
          onClick={() => setEtapa(3)}
          className={`p-3 rounded-lg border text-left text-xs font-medium transition-all ${
            etapa === 3
              ? 'border-cyan-500 bg-cyan-50 text-cyan-900 dark:bg-cyan-950/50 dark:text-cyan-200 shadow-sm'
              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900'
          }`}
        >
          <span className="font-bold block text-sm mb-0.5">3. Diluições 2L</span>
          Soluções 100%, 10% e 1%
        </button>

        <button
          onClick={() => setEtapa(4)}
          className={`p-3 rounded-lg border text-left text-xs font-medium transition-all ${
            etapa === 4
              ? 'border-cyan-500 bg-cyan-50 text-cyan-900 dark:bg-cyan-950/50 dark:text-cyan-200 shadow-sm'
              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900'
          }`}
        >
          <span className="font-bold block text-sm mb-0.5">4. Ensaios & Qualidade</span>
          Água Bruta e Jarros 1 a 6
        </button>
      </div>

      {/* ETAPA 1: Geometria da ETA */}
      {etapa === 1 && (
        <div className="card space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              1. Seleção e Geometria da ETA
            </h2>
            <p className="text-xs text-muted">
              Selecione o modelo hidráulico para calcular os volumes operacionais e os tempos de detenção do Jar Test
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setTipoETA('modular')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center ${
                tipoETA === 'modular'
                  ? 'border-cyan-600 bg-cyan-50/50 dark:bg-cyan-950/30'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <img
                src="/imagens/modular.png"
                alt="ETA Modular"
                className="h-28 object-contain mb-3"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none' }}
              />
              <span className="font-bold text-slate-800 dark:text-slate-100">ETA Modular</span>
              <span className="text-xs text-muted mt-1">Floculadores e decantadores cilíndricos em série</span>
            </div>

            <div
              onClick={() => setTipoETA('torrezan')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center ${
                tipoETA === 'torrezan'
                  ? 'border-cyan-600 bg-cyan-50/50 dark:bg-cyan-950/30'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <img
                src="/imagens/torrezan.png"
                alt="ETA Torrezan"
                className="h-28 object-contain mb-3"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none' }}
              />
              <span className="font-bold text-slate-800 dark:text-slate-100">ETA Torrezan</span>
              <span className="text-xs text-muted mt-1">Floculadores e decantadores retangulares compactos</span>
            </div>
          </div>

          <div className="max-w-xs">
            <label className="label">Vazão do Módulo da ETA (L/s)</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              className="input text-base font-semibold"
              value={vazaoModulo}
              onChange={(e) => setVazaoModulo(parseFloat(e.target.value) || 0)}
            />
          </div>

          {tipoETA === 'modular' ? (
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Floculadores Cilíndricos Modulares
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="label">Quantidade de Floculadores</label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={qtdFlocMod}
                    onChange={(e) => setQtdFlocMod(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="label">Diâmetro dos Floculadores (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    className="input"
                    value={diaFlocMod}
                    onChange={(e) => setDiaFlocMod(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="label">Altura Útil dos Floculadores (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    className="input"
                    value={altFlocMod}
                    onChange={(e) => setAltFlocMod(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 pt-2">
                Decantadores Cilíndricos Modulares
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="label">Quantidade de Decantadores</label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={qtdDecMod}
                    onChange={(e) => setQtdDecMod(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="label">Diâmetro dos Decantadores (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    className="input"
                    value={diaDecMod}
                    onChange={(e) => setDiaDecMod(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="label">Altura Útil dos Decantadores (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    className="input"
                    value={altDecMod}
                    onChange={(e) => setAltDecMod(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Floculador Retangular Torrezan
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="label">Comprimento (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    className="input"
                    value={compFlocTor}
                    onChange={(e) => setCompFlocTor(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="label">Largura (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    className="input"
                    value={largFlocTor}
                    onChange={(e) => setLargFlocTor(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="label">Altura Útil (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    className="input"
                    value={altFlocTor}
                    onChange={(e) => setAltFlocTor(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 pt-2">
                Decantadores Retangulares Torrezan
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="label">Decantadores por Floculador</label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={decPorFlocTor}
                    onChange={(e) => setDecPorFlocTor(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="label">Comprimento (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    className="input"
                    value={compDecTor}
                    onChange={(e) => setCompDecTor(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="label">Largura (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    className="input"
                    value={largDecTor}
                    onChange={(e) => setLargDecTor(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <label className="label">Altura Útil (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    className="input"
                    value={altDecTor}
                    onChange={(e) => setAltDecTor(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          )}

          {configETA && (
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <span className="text-xs text-muted block">Vol. Floculador</span>
                <b className="text-sm">{configETA.vol_floc_unit_m3.toFixed(2)} m³</b>
              </div>
              <div>
                <span className="text-xs text-muted block">Tempo Floculação</span>
                <b className="text-sm text-cyan-600">{configETA.tempo_floc_seg} s</b>
              </div>
              <div>
                <span className="text-xs text-muted block">Vol. Decantador</span>
                <b className="text-sm">{configETA.vol_dec_unit_m3.toFixed(2)} m³</b>
              </div>
              <div>
                <span className="text-xs text-muted block">Tempo Decantação</span>
                <b className="text-sm text-cyan-600">{configETA.tempo_dec_seg} s</b>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleSalvarConfigETA}
              disabled={salvando}
              className="btn btn-primary"
            >
              {salvando ? 'Calculando...' : 'Salvar Geometria e Avançar →'}
            </button>
          </div>
        </div>
      )}

      {/* ETAPA 2: Dosagens na Planta */}
      {etapa === 2 && (
        <div className="card space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              2. Dosagens em Escala Real na ETA
            </h2>
            <p className="text-xs text-muted">
              Escolha a unidade e informe as doses para a vazão operacional de{' '}
              <b>{vazaoModulo} L/s</b>. No modo ppm, informe também a concentração (% m/m do ativo) e a densidade (g/mL) de cada produto.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setUnidade('ml_min')}
              className={`btn text-xs ${unidade === 'ml_min' ? 'btn-primary' : 'btn-outline'}`}
            >
              mL/min (bomba dosadora)
            </button>
            <button
              type="button"
              onClick={() => setUnidade('ppm')}
              className={`btn text-xs ${unidade === 'ppm' ? 'btn-primary' : 'btn-outline'}`}
            >
              ppm (mg/L)
            </button>
          </div>

          {unidade === 'ml_min' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {produtosDosagem.map((p) => (
                <div key={p.chave}>
                  <label className="label">{p.rotulo}</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      className="input pr-16"
                      value={p.ml}
                      onChange={(e) => p.setMl(parseFloat(e.target.value) || 0)}
                    />
                    <span className="absolute right-3 top-2 text-xs text-muted">ml/min</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {produtosDosagem.map((p) => {
                const equiv = ppmParaMlMinLocal(p.ppm, p.conc, p.dens, vazaoModulo)
                return (
                  <div key={p.chave} className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
                    <h3 className="font-bold text-sm text-cyan-600 dark:text-cyan-400">{p.rotulo}</h3>
                    <div>
                      <label className="label">Dose (ppm)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          className="input pr-14"
                          value={p.ppm}
                          onChange={(e) => p.setPpm(parseFloat(e.target.value) || 0)}
                        />
                        <span className="absolute right-3 top-2 text-xs text-muted">ppm</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label">Concentração (% m/m) *</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          className="input"
                          placeholder="Ex.: 10"
                          value={p.conc}
                          onChange={(e) => p.setConc(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="label">Densidade (g/mL) *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="input"
                          placeholder="Ex.: 1.20"
                          value={p.dens}
                          onChange={(e) => p.setDens(e.target.value)}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted">
                      Equivalente: <b>{equiv ? equiv.toFixed(2) : '—'} mL/min</b>
                    </p>
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button onClick={() => setEtapa(1)} className="btn btn-outline">
              ← Voltar para Geometria
            </button>
            <button
              onClick={handleSalvarDosagens}
              disabled={salvando}
              className="btn btn-primary"
            >
              {salvando ? 'Processando...' : 'Calcular Diluições para 2L →'}
            </button>
          </div>
        </div>
      )}

      {/* ETAPA 3: Diluições no Jar Test */}
      {etapa === 3 && (
        <div className="card space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              3. Dosagens e Diluições Calculadas para Jarro de 2L
            </h2>
            <p className="text-xs text-muted">
              Volumes em mililitros (mL) a serem dosados na bancada do Jar Test para simular exatamente a operação real da ETA
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* PAC */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="font-bold text-sm text-cyan-600 dark:text-cyan-400 mb-2">
                PAC (Coagulante)
              </h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                  <span>Puro (100%):</span>
                  <b>{dosagensPlanta?.pac_100_ml.toFixed(4) || '—'} mL</b>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-cyan-700 dark:text-cyan-300 font-semibold">Solução 10%:</span>
                  <b className="text-cyan-700 dark:text-cyan-300 font-semibold">{dosagensPlanta?.pac_10_ml.toFixed(3) || '—'} mL</b>
                </div>
                <div className="flex justify-between py-1">
                  <span>Solução 1%:</span>
                  <b>{dosagensPlanta?.pac_1_ml.toFixed(2) || '—'} mL</b>
                </div>
              </div>
            </div>

            {/* Hipoclorito */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="font-bold text-sm text-cyan-600 dark:text-cyan-400 mb-2">
                Hipoclorito (Pré)
              </h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                  <span>Puro (100%):</span>
                  <b>{dosagensPlanta?.hipo_100_ml.toFixed(4) || '—'} mL</b>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-cyan-700 dark:text-cyan-300 font-semibold">Solução 10%:</span>
                  <b className="text-cyan-700 dark:text-cyan-300 font-semibold">{dosagensPlanta?.hipo_10_ml.toFixed(3) || '—'} mL</b>
                </div>
                <div className="flex justify-between py-1">
                  <span>Solução 1%:</span>
                  <b>{dosagensPlanta?.hipo_1_ml.toFixed(2) || '—'} mL</b>
                </div>
              </div>
            </div>

            {/* Alcalinizante */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="font-bold text-sm text-cyan-600 dark:text-cyan-400 mb-2">
                Alcalinizante
              </h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                  <span>Puro (100%):</span>
                  <b>{dosagensPlanta?.alc_100_ml.toFixed(4) || '—'} mL</b>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-cyan-700 dark:text-cyan-300 font-semibold">Solução 10%:</span>
                  <b className="text-cyan-700 dark:text-cyan-300 font-semibold">{dosagensPlanta?.alc_10_ml.toFixed(3) || '—'} mL</b>
                </div>
                <div className="flex justify-between py-1">
                  <span>Solução 1%:</span>
                  <b>{dosagensPlanta?.alc_1_ml.toFixed(2) || '—'} mL</b>
                </div>
              </div>
            </div>

            {/* Fluoreto */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="font-bold text-sm text-cyan-600 dark:text-cyan-400 mb-2">
                Fluoreto
              </h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                  <span>Puro (100%):</span>
                  <b>{dosagensPlanta?.flu_100_ml.toFixed(4) || '—'} mL</b>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-cyan-700 dark:text-cyan-300 font-semibold">Solução 10%:</span>
                  <b className="text-cyan-700 dark:text-cyan-300 font-semibold">{dosagensPlanta?.flu_10_ml.toFixed(3) || '—'} mL</b>
                </div>
                <div className="flex justify-between py-1">
                  <span>Solução 1%:</span>
                  <b>{dosagensPlanta?.flu_1_ml.toFixed(2) || '—'} mL</b>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 text-xs space-y-1 text-cyan-900 dark:text-cyan-200">
            <p className="font-bold text-sm">💡 Tempos de Operação no Jar Test:</p>
            <p>• <b>Tempo de Floculação:</b> {configETA?.tempo_floc_seg || 0} segundos (ajuste os agitadores para ~30-40 RPM)</p>
            <p>• <b>Tempo de Decantação:</b> {configETA?.tempo_dec_seg || 0} segundos (repouso estático antes da coleta)</p>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button onClick={() => setEtapa(2)} className="btn btn-outline">
              ← Voltar para Dosagens
            </button>
            <button onClick={() => setEtapa(4)} className="btn btn-primary">
              Avançar para Inserir Resultados dos Jarros →
            </button>
          </div>
        </div>
      )}

      {/* ETAPA 4: Água Bruta & Resultados dos Jarros */}
      {etapa === 4 && (
        <div className="space-y-6">
          {/* Card Água Bruta */}
          <div className="card space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>🌊 Parâmetros da Água Bruta (Antes do Teste)</span>
                </h2>
                <p className="text-xs text-muted">
                  Caracterização físico-química inicial da água para cálculo das taxas de remoção e eficiência
                </p>
              </div>
              <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-semibold text-slate-700 dark:text-slate-300">
                Padrão de Entrada
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="label">Cor Aparente (uH)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input font-semibold"
                  value={aguaBruta.cor_aparente}
                  onChange={(e) =>
                    setAguaBruta({ ...aguaBruta, cor_aparente: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>

              <div>
                <label className="label">Turbidez (uT / NTU)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input font-semibold"
                  value={aguaBruta.turbidez}
                  onChange={(e) =>
                    setAguaBruta({ ...aguaBruta, turbidez: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>

              <div>
                <label className="label">pH</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="14"
                  className="input font-semibold"
                  value={aguaBruta.ph}
                  onChange={(e) =>
                    setAguaBruta({ ...aguaBruta, ph: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>

              <div>
                <label className="label">Condutividade (µS/cm)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input font-semibold"
                  value={aguaBruta.condutividade}
                  onChange={(e) =>
                    setAguaBruta({ ...aguaBruta, condutividade: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>

              <div>
                <label className="label">Alcalinidade (mg/L CaCO₃)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input font-semibold"
                  value={aguaBruta.alcalinidade}
                  onChange={(e) =>
                    setAguaBruta({ ...aguaBruta, alcalinidade: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>

              <div>
                <label className="label">Temperatura (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input"
                  value={aguaBruta.temperatura_c || ''}
                  placeholder="20"
                  onChange={(e) =>
                    setAguaBruta({ ...aguaBruta, temperatura_c: parseFloat(e.target.value) || undefined })
                  }
                />
              </div>
            </div>
          </div>

          {/* Tabela de Resultados dos Jarros */}
          <div className="card space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>🧪 Resultados Pós-Ensaio (Jarros 1 a 6)</span>
                </h2>
                <p className="text-xs text-muted">
                  Insira os resultados laboratoriais de Cor, Turbidez, pH, Cloro, Flúor e Condutividade por jarro
                </p>
              </div>
              <div className="text-xs text-muted flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                  Atende Potabilidade (Port. 888)
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-amber-500 font-bold">★</span>
                  Jarro Ótimo
                </span>
              </div>
            </div>

            <div className="table-wrapper">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                    <th className="p-2.5 font-bold">Jarro</th>
                    <th className="p-2.5 font-bold">Coagulante ({modoPPM ? 'ppm' : 'mL'})</th>
                    <th className="p-2.5 font-bold">Alcalinizante ({modoPPM ? 'ppm' : 'mL'})</th>
                    <th className="p-2.5 font-bold">Oxidante ({modoPPM ? 'ppm' : 'mL'})</th>
                    <th className="p-2.5 font-bold">Cor (uH)</th>
                    <th className="p-2.5 font-bold">Turbidez (uT)</th>
                    <th className="p-2.5 font-bold">pH</th>
                    <th className="p-2.5 font-bold">Cloro (mg/L)</th>
                    <th className="p-2.5 font-bold">Flúor (mg/L)</th>
                    <th className="p-2.5 font-bold">Condutividade</th>
                    <th className="p-2.5 font-bold text-center">Remoção</th>
                    <th className="p-2.5 font-bold text-center">Conformidade</th>
                    <th className="p-2.5 font-bold text-center">Ótimo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {jarros.map((j, idx) => (
                    <tr
                      key={j.numero_jarro}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors ${
                        j.jarro_otimo
                          ? 'bg-amber-50/60 dark:bg-amber-950/20 font-medium'
                          : ''
                      }`}
                    >
                      <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">
                        Jarro {j.numero_jarro}
                      </td>

                      {/* Coagulante */}
                      <td className="p-2.5">
                        <input
                          type="number"
                          step="0.1"
                          className="input w-16 py-1 px-2 text-xs"
                          value={modoPPM ? (j.dose_pac_ppm ?? '') : (j.dose_pac_ml ?? '')}
                          onChange={(e) =>
                            handleUpdateDose(idx, 'pac', parseFloat(e.target.value) || 0, modoPPM)
                          }
                        />
                        {modoPPM && j.dose_pac_ml !== null && j.dose_pac_ml !== undefined && (
                          <div className="text-[10px] text-muted mt-0.5">≈ {Number(j.dose_pac_ml).toFixed(3)} mL</div>
                        )}
                      </td>

                      {/* Alcalinizante */}
                      <td className="p-2.5">
                        <input
                          type="number"
                          step="0.1"
                          className="input w-16 py-1 px-2 text-xs"
                          value={modoPPM ? (j.dose_alc_ppm ?? '') : (j.dose_alc_ml ?? '')}
                          onChange={(e) =>
                            handleUpdateDose(idx, 'alc', parseFloat(e.target.value) || 0, modoPPM)
                          }
                        />
                        {modoPPM && j.dose_alc_ml !== null && j.dose_alc_ml !== undefined && (
                          <div className="text-[10px] text-muted mt-0.5">≈ {Number(j.dose_alc_ml).toFixed(3)} mL</div>
                        )}
                      </td>

                      {/* Oxidante */}
                      <td className="p-2.5">
                        <input
                          type="number"
                          step="0.1"
                          className="input w-16 py-1 px-2 text-xs"
                          value={modoPPM ? (j.dose_hipo_ppm ?? '') : (j.dose_hipo_ml ?? '')}
                          onChange={(e) =>
                            handleUpdateDose(idx, 'hipo', parseFloat(e.target.value) || 0, modoPPM)
                          }
                        />
                        {modoPPM && j.dose_hipo_ml !== null && j.dose_hipo_ml !== undefined && (
                          <div className="text-[10px] text-muted mt-0.5">≈ {Number(j.dose_hipo_ml).toFixed(3)} mL</div>
                        )}
                      </td>

                      {/* Cor */}
                      <td className="p-2.5">
                        <input
                          type="number"
                          step="0.1"
                          className="input w-20 py-1 px-2 text-xs font-semibold"
                          value={j.cor_aparente}
                          onChange={(e) =>
                            handleUpdateJarro(idx, 'cor_aparente', parseFloat(e.target.value) || 0)
                          }
                        />
                      </td>

                      {/* Turbidez */}
                      <td className="p-2.5">
                        <input
                          type="number"
                          step="0.1"
                          className="input w-20 py-1 px-2 text-xs font-semibold"
                          value={j.turbidez}
                          onChange={(e) =>
                            handleUpdateJarro(idx, 'turbidez', parseFloat(e.target.value) || 0)
                          }
                        />
                      </td>

                      {/* pH */}
                      <td className="p-2.5">
                        <input
                          type="number"
                          step="0.01"
                          className="input w-16 py-1 px-2 text-xs"
                          value={j.ph}
                          onChange={(e) =>
                            handleUpdateJarro(idx, 'ph', parseFloat(e.target.value) || 0)
                          }
                        />
                      </td>

                      {/* Cloro */}
                      <td className="p-2.5">
                        <input
                          type="number"
                          step="0.05"
                          className="input w-16 py-1 px-2 text-xs"
                          value={j.cloro_residual}
                          onChange={(e) =>
                            handleUpdateJarro(idx, 'cloro_residual', parseFloat(e.target.value) || 0)
                          }
                        />
                      </td>

                      {/* Flúor */}
                      <td className="p-2.5">
                        <input
                          type="number"
                          step="0.05"
                          className="input w-16 py-1 px-2 text-xs"
                          value={j.fluor}
                          onChange={(e) =>
                            handleUpdateJarro(idx, 'fluor', parseFloat(e.target.value) || 0)
                          }
                        />
                      </td>

                      {/* Condutividade */}
                      <td className="p-2.5">
                        <input
                          type="number"
                          step="0.5"
                          className="input w-20 py-1 px-2 text-xs"
                          value={j.condutividade}
                          onChange={(e) =>
                            handleUpdateJarro(idx, 'condutividade', parseFloat(e.target.value) || 0)
                          }
                        />
                      </td>

                      {/* Remoção calculada */}
                      <td className="p-2.5 text-center text-[11px] whitespace-nowrap">
                        <span className="text-cyan-700 dark:text-cyan-300 block">
                          Turb: <b>{j.remocao_turbidez_perc}%</b>
                        </span>
                        <span className="text-slate-500 block">
                          Cor: <b>{j.remocao_cor_perc}%</b>
                        </span>
                      </td>

                      {/* Conformidade */}
                      <td className="p-2.5 text-center">
                        {j.atende_potabilidade ? (
                          <span className="inline-block text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-2 py-0.5 rounded">
                            Conforme
                          </span>
                        ) : (
                          <span className="inline-block text-xs bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400 px-2 py-0.5 rounded">
                            Não atende
                          </span>
                        )}
                      </td>

                      {/* Jarro Ótimo Seleção */}
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleMarcarOtimo(idx)}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                            j.jarro_otimo
                              ? 'bg-amber-400 text-amber-950 shadow-sm'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {j.jarro_otimo ? '★ Ótimo' : 'Definir'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setEtapa(3)} className="btn btn-outline">
                ← Voltar para Diluições
              </button>

              <button
                onClick={handleSalvarEnsaio}
                disabled={salvando}
                className="btn btn-success px-6 py-2.5 text-sm"
              >
                {salvando ? 'Salvando no PostgreSQL...' : 'Salvar Ensaio e Ver Relatório Técnico →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
