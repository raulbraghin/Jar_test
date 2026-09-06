import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api/client'
import { RelatorioExecutivo } from '../types'

export default function Relatorio() {
  const { id } = useParams<{ id: string }>()
  const [relatorio, setRelatorio] = useState<RelatorioExecutivo | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    api
      .get<RelatorioExecutivo>(`/projetos/${id}/relatorio/`)
      .then((res) => setRelatorio(res.data))
      .catch(() => setErro('Não foi possível carregar o relatório técnico.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleImprimir = () => {
    window.print()
  }

  const handleExportarTXT = () => {
    if (!relatorio) return
    const p = relatorio.projeto
    const conf = relatorio.configuracao_eta
    const dos = relatorio.dosagens_planta
    const ab = relatorio.agua_bruta
    const otimo = relatorio.jarro_otimo

    const linhas = [
      '==================================================================',
      '       RELATÓRIO TÉCNICO DE ENSAIO - JAR-TEST DIGITAL',
      '==================================================================',
      `Projeto: ${p.nome_projeto}`,
      `Cliente: ${p.cliente || 'Não informado'}`,
      `Responsável Técnico: ${p.autor || 'Não informado'}`,
      `Data do Ensaio: ${p.data_ensaio ? new Date(p.data_ensaio).toLocaleDateString('pt-BR') : '—'}`,
      '',
      '--- HIDRÁULICA DA ETA ---',
      `Tipo de ETA: ${conf?.tipo_eta.toUpperCase() || '—'}`,
      `Vazão Operacional: ${conf?.vazao_modulo_ls || 0} L/s (${(conf?.vazao_modulo_ls || 0) * 60} L/min)`,
      `Tempo de Floculação: ${conf?.tempo_floc_seg || 0} segundos`,
      `Tempo de Decantação: ${conf?.tempo_dec_seg || 0} segundos`,
      `Volume do Floculador: ${conf?.vol_floc_unit_m3.toFixed(2) || '—'} m³`,
      `Volume do Decantador: ${conf?.vol_dec_unit_m3.toFixed(2) || '—'} m³`,
      '',
      '--- DOSAGENS EM ESCALA REAL (PLANTA) ---',
      `Unidade do projeto: ${dos?.unidade === 'ppm' ? 'ppm (mg/L)' : 'mL/min'}`,
      `PAC: ${dos?.unidade === 'ppm' ? `${dos?.dosagem_pac_ppm || 0} ppm` : `${dos?.dosagem_pac_ml_min || 0} ml/min`}`,
      `Hipoclorito: ${dos?.unidade === 'ppm' ? `${dos?.dosagem_hipo_ppm || 0} ppm` : `${dos?.dosagem_hipo_ml_min || 0} ml/min`}`,
      `Alcalinizante: ${dos?.unidade === 'ppm' ? `${dos?.dosagem_alc_ppm || 0} ppm` : `${dos?.dosagem_alc_ml_min || 0} ml/min`}`,
      `Fluoreto: ${dos?.unidade === 'ppm' ? `${dos?.dosagem_flu_ppm || 0} ppm` : `${dos?.dosagem_flu_ml_min || 0} ml/min`}`,
      '',
      '--- DOSAGENS PARA JARRO DE 2L NO JAR TEST ---',
      `PAC: Puro = ${dos?.pac?.c100.toFixed(4)} mL | 10% = ${dos?.pac?.c10.toFixed(3)} mL | 1% = ${dos?.pac?.c1.toFixed(2)} mL`,
      `Hipoclorito: Puro = ${dos?.hipo?.c100.toFixed(4)} mL | 10% = ${dos?.hipo?.c10.toFixed(3)} mL | 1% = ${dos?.hipo?.c1.toFixed(2)} mL`,
      `Alcalinizante: Puro = ${dos?.alc?.c100.toFixed(4)} mL | 10% = ${dos?.alc?.c10.toFixed(3)} mL | 1% = ${dos?.alc?.c1.toFixed(2)} mL`,
      `Fluoreto: Puro = ${dos?.flu?.c100.toFixed(4)} mL | 10% = ${dos?.flu?.c10.toFixed(3)} mL | 1% = ${dos?.flu?.c1.toFixed(2)} mL`,
      '',
      '--- CARACTERIZAÇÃO DA ÁGUA BRUTA ---',
      `Cor Aparente: ${ab?.cor_aparente || 0} uH`,
      `Turbidez: ${ab?.turbidez || 0} uT / NTU`,
      `pH: ${ab?.ph || 7.0}`,
      `Condutividade: ${ab?.condutividade || 0} µS/cm`,
      `Alcalinidade: ${ab?.alcalinidade || 0} mg/L CaCO3`,
      '',
      '--- RESULTADOS DOS JARROS ---',
      ...relatorio.jarros.map(
        (j) => {
          const doseTxt = dos?.unidade === 'ppm' ? `Dose PAC: ${j.dose_pac_ppm ?? '—'} ppm` : `Dose PAC: ${j.dose_pac_ml} mL`
          return `Jarro ${j.numero_jarro} [${doseTxt}]: Cor=${j.cor_aparente} uH | Turb=${j.turbidez} uT | pH=${j.ph} | Cloro=${j.cloro_residual} mg/L | Flúor=${j.fluor} mg/L | Cond=${j.condutividade} µS/cm | Rem. Turb=${j.remocao_turbidez_perc}% ${j.jarro_otimo ? '★ (ÓTIMO)' : ''}`
        },
      ),
      '',
      '--- RECOMENDAÇÃO OPERACIONAL ---',
      otimo
        ? `Jarro Ótimo: Jarro ${otimo.numero_jarro} com ${dos?.unidade === 'ppm' ? `${otimo.dose_pac_ppm ?? '—'} ppm` : `${otimo.dose_pac_ml} mL`} de dose (Remoção de Turbidez: ${otimo.remocao_turbidez}% e Cor: ${otimo.remocao_cor}%)`
        : 'Nenhum jarro ótimo definido.',
      '',
      `Norma: ${relatorio.norma_referencia}`,
    ]

    const blob = new Blob([linhas.join('\r\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Relatorio_JarTest_${p.nome_projeto.replace(/\s+/g, '_')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="card text-center py-16 text-muted">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-cyan-500 border-t-transparent mb-3" />
        <p>Gerando relatório consolidado...</p>
      </div>
    )
  }

  if (erro || !relatorio) {
    return (
      <div className="card text-center py-12 space-y-4">
        <div className="erro-box">{erro || 'Relatório não disponível.'}</div>
        <Link to="/" className="btn btn-outline">
          Voltar para o Dashboard
        </Link>
      </div>
    )
  }

  const { projeto, configuracao_eta, dosagens_planta, agua_bruta, jarros, jarro_otimo, instrucoes_preparo } = relatorio

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Barra de Ações (Oculta na Impressão) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 no-print bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <Link to={`/projetos/${id}/ensaio`} className="btn btn-outline text-xs">
            ← Voltar ao Ensaio
          </Link>
          <Link to="/" className="btn btn-ghost text-xs">
            Dashboard
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleExportarTXT} className="btn btn-outline text-xs">
            💾 Baixar Arquivo TXT
          </button>
          <button onClick={handleImprimir} className="btn btn-primary text-xs">
            🖨 Imprimir / Salvar PDF
          </button>
        </div>
      </div>

      {/* DOCUMENTO DO RELATÓRIO */}
      <div className="card print-card p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
        {/* Cabeçalho do Relatório */}
        <div className="flex items-center justify-between border-b-2 border-cyan-600 pb-4">
          <div className="flex items-center gap-3">
            <img
              src="/imagens/logo.jpg"
              alt="Logo"
              className="h-12 w-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
              onError={(e) => { (e.target as HTMLElement).style.display = 'none' }}
            />
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                RELATÓRIO TÉCNICO DE JAR TEST
              </h1>
              <p className="text-xs text-muted">
                Jar-Test Digital &bull; Ensaios de Tratabilidade e Otimização de Coagulação
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-muted">
            <p><b>Data do Ensaio:</b> {projeto.data_ensaio ? new Date(projeto.data_ensaio).toLocaleDateString('pt-BR') : '—'}</p>
            <p><b>Norma:</b> Portaria GM/MS nº 888/2021</p>
          </div>
        </div>

        {/* Metadados */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs">
          <div>
            <span className="text-muted block">Nome do Ensaio:</span>
            <b className="text-slate-800 dark:text-slate-100 text-sm">{projeto.nome_projeto}</b>
          </div>
          <div>
            <span className="text-muted block">Cliente / Unidade:</span>
            <b className="text-slate-800 dark:text-slate-100 text-sm">{projeto.cliente || '—'}</b>
          </div>
          <div>
            <span className="text-muted block">Responsável Técnico:</span>
            <b className="text-slate-800 dark:text-slate-100 text-sm">{projeto.autor || '—'}</b>
          </div>
          <div>
            <span className="text-muted block">Modelo da ETA:</span>
            <b className="text-cyan-600 dark:text-cyan-400 text-sm uppercase">
              {configuracao_eta?.tipo_eta || '—'}
            </b>
          </div>
        </div>

        {/* 1. Hidráulica e Tempos */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400 border-b border-slate-200 dark:border-slate-700 pb-1">
            1. Parâmetros Hidráulicos e Tempos de Detenção na ETA
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded border border-slate-200 dark:border-slate-800">
              <span className="text-muted block">Vazão da ETA</span>
              <b className="text-sm">{configuracao_eta?.vazao_modulo_ls || 0} L/s</b>
            </div>
            <div className="p-3 rounded border border-slate-200 dark:border-slate-800">
              <span className="text-muted block">Tempo Floculação</span>
              <b className="text-sm text-cyan-600">{configuracao_eta?.tempo_floc_seg || 0} segundos</b>
            </div>
            <div className="p-3 rounded border border-slate-200 dark:border-slate-800">
              <span className="text-muted block">Tempo Decantação</span>
              <b className="text-sm text-cyan-600">{configuracao_eta?.tempo_dec_seg || 0} segundos</b>
            </div>
            <div className="p-3 rounded border border-slate-200 dark:border-slate-800">
              <span className="text-muted block">Volume Unit. Floculador</span>
              <b className="text-sm">{configuracao_eta?.vol_floc_unit_m3.toFixed(2) || 0} m³</b>
            </div>
          </div>
        </div>

        {/* 2. Dosagens e Diluições no Jar Test */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400 border-b border-slate-200 dark:border-slate-700 pb-1">
            2. Dosagens na Planta e Diluições de Bancada (Jarro de 2L)
          </h2>
          <div className="table-wrapper">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <th className="p-2.5 font-bold">Produto Químico</th>
                  <th className="p-2.5 font-bold">Dose Planta ({dosagens_planta?.unidade === 'ppm' ? 'ppm' : 'ml/min'})</th>
                  <th className="p-2.5 font-bold">Dose 100% (mL)</th>
                  <th className="p-2.5 font-bold text-cyan-700 dark:text-cyan-300">Dose Solução 10% (mL)</th>
                  <th className="p-2.5 font-bold">Dose Solução 1% (mL)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                <tr>
                  <td className="p-2.5 font-semibold">PAC (Coagulante)</td>
                  <td className="p-2.5">{dosagens_planta?.unidade === 'ppm' ? `${dosagens_planta?.dosagem_pac_ppm || 0} ppm` : `${dosagens_planta?.dosagem_pac_ml_min || 0} ml/min`}</td>
                  <td className="p-2.5">{dosagens_planta?.pac?.c100.toFixed(4) || '—'} mL</td>
                  <td className="p-2.5 font-bold text-cyan-700 dark:text-cyan-300">{dosagens_planta?.pac?.c10.toFixed(3) || '—'} mL</td>
                  <td className="p-2.5">{dosagens_planta?.pac?.c1.toFixed(2) || '—'} mL</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold">Hipoclorito (Pré-Cloração)</td>
                  <td className="p-2.5">{dosagens_planta?.unidade === 'ppm' ? `${dosagens_planta?.dosagem_hipo_ppm || 0} ppm` : `${dosagens_planta?.dosagem_hipo_ml_min || 0} ml/min`}</td>
                  <td className="p-2.5">{dosagens_planta?.hipo?.c100.toFixed(4) || '—'} mL</td>
                  <td className="p-2.5 font-bold text-cyan-700 dark:text-cyan-300">{dosagens_planta?.hipo?.c10.toFixed(3) || '—'} mL</td>
                  <td className="p-2.5">{dosagens_planta?.hipo?.c1.toFixed(2) || '—'} mL</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold">Alcalinizante</td>
                  <td className="p-2.5">{dosagens_planta?.unidade === 'ppm' ? `${dosagens_planta?.dosagem_alc_ppm || 0} ppm` : `${dosagens_planta?.dosagem_alc_ml_min || 0} ml/min`}</td>
                  <td className="p-2.5">{dosagens_planta?.alc?.c100.toFixed(4) || '—'} mL</td>
                  <td className="p-2.5 font-bold text-cyan-700 dark:text-cyan-300">{dosagens_planta?.alc?.c10.toFixed(3) || '—'} mL</td>
                  <td className="p-2.5">{dosagens_planta?.alc?.c1.toFixed(2) || '—'} mL</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold">Ácido Fluorsilíssico</td>
                  <td className="p-2.5">{dosagens_planta?.unidade === 'ppm' ? `${dosagens_planta?.dosagem_flu_ppm || 0} ppm` : `${dosagens_planta?.dosagem_flu_ml_min || 0} ml/min`}</td>
                  <td className="p-2.5">{dosagens_planta?.flu?.c100.toFixed(4) || '—'} mL</td>
                  <td className="p-2.5 font-bold text-cyan-700 dark:text-cyan-300">{dosagens_planta?.flu?.c10.toFixed(3) || '—'} mL</td>
                  <td className="p-2.5">{dosagens_planta?.flu?.c1.toFixed(2) || '—'} mL</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Procedimento de Preparo de Soluções */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400 border-b border-slate-200 dark:border-slate-700 pb-1">
            3. Instruções Práticas para Preparo de Soluções de Laboratório
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {instrucoes_preparo.map((inst, i) => (
              <div key={i} className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                <b className="text-slate-900 dark:text-slate-100 block mb-1">{inst.produto}</b>
                <p className="text-slate-600 dark:text-slate-400 mb-1">
                  <b>Solução 10%:</b> {inst.solucao_10_perc}
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  <b>Solução 1%:</b> {inst.solucao_1_perc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Caracterização da Água Bruta vs Resultados dos Jarros */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400 border-b border-slate-200 dark:border-slate-700 pb-1">
            4. Qualidade da Água Bruta e Resultados dos Jarros
          </h2>

          {/* Água Bruta destaque */}
          <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200">Água Bruta (Inicial):</span>
            <span>Cor: <b>{agua_bruta?.cor_aparente || 0} uH</b></span>
            <span>Turbidez: <b>{agua_bruta?.turbidez || 0} uT</b></span>
            <span>pH: <b>{agua_bruta?.ph || 7.0}</b></span>
            <span>Condutividade: <b>{agua_bruta?.condutividade || 0} µS/cm</b></span>
            <span>Alcalinidade: <b>{agua_bruta?.alcalinidade || 0} mg/L CaCO₃</b></span>
            {agua_bruta?.temperatura_c && <span>Temp: <b>{agua_bruta.temperatura_c} °C</b></span>}
          </div>

          <div className="table-wrapper">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <th className="p-2 font-bold">Jarro</th>
                  <th className="p-2 font-bold">Coagulante ({dosagens_planta?.unidade === 'ppm' ? 'ppm' : 'mL'})</th>
                  <th className="p-2 font-bold">Alcalinizante ({dosagens_planta?.unidade === 'ppm' ? 'ppm' : 'mL'})</th>
                  <th className="p-2 font-bold">Oxidante ({dosagens_planta?.unidade === 'ppm' ? 'ppm' : 'mL'})</th>
                  <th className="p-2 font-bold">Cor (uH)</th>
                  <th className="p-2 font-bold">Turbidez (uT)</th>
                  <th className="p-2 font-bold">pH</th>
                  <th className="p-2 font-bold">Cloro (mg/L)</th>
                  <th className="p-2 font-bold">Flúor (mg/L)</th>
                  <th className="p-2 font-bold">Condutividade</th>
                  <th className="p-2 font-bold">Rem. Turbidez</th>
                  <th className="p-2 font-bold">Rem. Cor</th>
                  <th className="p-2 font-bold">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {jarros.map((j) => (
                  <tr
                    key={j.numero_jarro}
                    className={j.jarro_otimo ? 'bg-amber-50 dark:bg-amber-950/30 font-semibold' : ''}
                  >
                    <td className="p-2 font-bold">
                      Jarro {j.numero_jarro} {j.jarro_otimo && '★'}
                    </td>
                    <td className="p-2">{dosagens_planta?.unidade === 'ppm' ? (j.dose_pac_ppm ?? '—') : (j.dose_pac_ml ?? '—')}</td>
                    <td className="p-2">{dosagens_planta?.unidade === 'ppm' ? (j.dose_alc_ppm ?? '—') : (j.dose_alc_ml ?? '—')}</td>
                    <td className="p-2">{dosagens_planta?.unidade === 'ppm' ? (j.dose_hipo_ppm ?? '—') : (j.dose_hipo_ml ?? '—')}</td>
                    <td className="p-2">{j.cor_aparente}</td>
                    <td className="p-2">{j.turbidez}</td>
                    <td className="p-2">{j.ph}</td>
                    <td className="p-2">{j.cloro_residual}</td>
                    <td className="p-2">{j.fluor}</td>
                    <td className="p-2">{j.condutividade}</td>
                    <td className="p-2 text-cyan-600 font-bold">{j.remocao_turbidez_perc}%</td>
                    <td className="p-2">{j.remocao_cor_perc}%</td>
                    <td className="p-2">
                      {j.jarro_otimo ? (
                        <span className="text-[10px] bg-amber-400 text-amber-950 font-bold px-1.5 py-0.5 rounded">
                          JARRO ÓTIMO
                        </span>
                      ) : j.atende_potabilidade ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold px-1.5 py-0.5 rounded">
                          Conforme
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted">Abaixo</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Conclusão e Parecer Técnico */}
        {jarro_otimo && (
          <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20 text-xs space-y-2">
            <h3 className="font-bold text-sm text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
              <span>★</span> Recomendação e Jarro Ótimo Selecionado
            </h3>
            <p className="text-slate-700 dark:text-slate-300">
              O <b>Jarro {jarro_otimo.numero_jarro}</b> apresentou o melhor desempenho operacional com dosagem de{' '}
              <b>{dosagens_planta?.unidade === 'ppm' ? `${jarro_otimo.dose_pac_ppm ?? '—'} ppm` : `${jarro_otimo.dose_pac_ml} mL`}</b> de solução de PAC, atingindo turbidez residual de{' '}
              <b>{jarro_otimo.turbidez_final} uT</b> (remoção de <b>{jarro_otimo.remocao_turbidez}%</b>) e cor aparente de{' '}
              <b>{jarro_otimo.cor_final} uH</b> (remoção de <b>{jarro_otimo.remocao_cor}%</b>), atendendo plenamente aos
              limites preconizados pela <b>{relatorio.norma_referencia}</b>.
            </p>
          </div>
        )}

        {/* Assinatura */}
        <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <div className="border-t border-slate-400 w-48 mx-auto mb-1"></div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              {projeto.autor || 'Responsável Técnico'}
            </p>
            <p className="text-muted">Operador / Engenheiro Químico</p>
          </div>
          <div>
            <div className="border-t border-slate-400 w-48 mx-auto mb-1"></div>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              {projeto.cliente || 'Controle de Qualidade'}
            </p>
            <p className="text-muted">Laboratório de Tratabilidade</p>
          </div>
        </div>
      </div>
    </div>
  )
}
