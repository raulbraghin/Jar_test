export interface User {
  id: string
  nome: string
  sobrenome?: string | null
  email: string
  telefone?: string | null
  cpf_masked?: string | null
  role: string
  ativo: boolean
  email_verificado: boolean
  perfil_completo: boolean
  criado_em: string
  plano_ate?: string | null
  plano_sempre: boolean
  pago: boolean

  empresa?: string | null
  formacao?: string | null
  cargo?: string | null
  logradouro?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  cidade?: string | null
  uf?: string | null
  cep?: string | null
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: User
}

export interface ProjetoListItem {
  id: string
  nome_projeto: string
  cliente?: string | null
  autor?: string | null
  data_ensaio: string
  criado_em: string
  tipo_eta?: string | null
  vazao_modulo_ls?: number | null
  total_jarros: number
  tem_jarro_otimo: boolean
}

export interface ConfiguracaoETA {
  id: string
  projeto_id: string
  tipo_eta: 'modular' | 'torrezan'
  vazao_modulo_ls: number

  qtd_floc_modular?: number | null
  diametro_floc_modular?: number | null
  altura_floc_modular?: number | null

  qtd_dec_modular?: number | null
  diametro_dec_modular?: number | null
  altura_dec_modular?: number | null

  comp_floc_torrezan?: number | null
  larg_floc_torrezan?: number | null
  alt_floc_torrezan?: number | null

  dec_por_floc_torrezan?: number | null
  comp_dec_torrezan?: number | null
  larg_dec_torrezan?: number | null
  alt_dec_torrezan?: number | null

  vol_floc_unit_m3: number
  vol_floc_total_m3: number
  vol_dec_unit_m3: number
  vol_dec_total_m3: number
  tempo_floc_seg: number
  tempo_dec_seg: number
}

export type UnidadeDosagem = 'ml_min' | 'ppm'

export interface DosagensPlanta {
  id: string
  projeto_id: string
  unidade: UnidadeDosagem
  dosagem_pac_ml_min: number
  dosagem_hipo_ml_min: number
  dosagem_alc_ml_min: number
  dosagem_flu_ml_min: number
  dosagem_pac_ppm: number
  dosagem_hipo_ppm: number
  dosagem_alc_ppm: number
  dosagem_flu_ppm: number
  pac_conc_perc?: number | null
  pac_densidade?: number | null
  hipo_conc_perc?: number | null
  hipo_densidade?: number | null
  alc_conc_perc?: number | null
  alc_densidade?: number | null
  flu_conc_perc?: number | null
  flu_densidade?: number | null

  pac_100_ml: number
  pac_10_ml: number
  pac_1_ml: number

  hipo_100_ml: number
  hipo_10_ml: number
  hipo_1_ml: number

  alc_100_ml: number
  alc_10_ml: number
  alc_1_ml: number

  flu_100_ml: number
  flu_10_ml: number
  flu_1_ml: number
}

export interface AguaBruta {
  id?: string
  projeto_id?: string
  cor_aparente: number
  turbidez: number
  ph: number
  condutividade: number
  alcalinidade: number
  temperatura_c?: number | null
}

export interface ResultadoJarro {
  id?: string
  projeto_id?: string
  numero_jarro: number
  dose_pac_ml?: number | null
  dose_hipo_ml?: number | null
  dose_alc_ml?: number | null
  dose_flu_ml?: number | null
  dose_pac_ppm?: number | null
  dose_hipo_ppm?: number | null
  dose_alc_ppm?: number | null
  dose_flu_ppm?: number | null

  cor_aparente: number
  turbidez: number
  ph: number
  cloro_residual: number
  fluor: number
  condutividade: number
  alcalinidade_residual?: number | null

  tamanho_floco?: string | null
  velocidade_sedimentacao?: string | null

  remocao_cor_perc: number
  remocao_turbidez_perc: number
  atende_potabilidade: boolean
  jarro_otimo: boolean
}

export interface ProjetoDetail {
  id: string
  user_id: string
  nome_projeto: string
  cliente?: string | null
  autor?: string | null
  descricao?: string | null
  data_ensaio: string
  criado_em: string
  atualizado_em: string

  configuracao?: ConfiguracaoETA | null
  dosagens?: DosagensPlanta | null
  agua_bruta?: AguaBruta | null
  jarros: ResultadoJarro[]
}

export interface RelatorioExecutivo {
  projeto: {
    id: string
    nome_projeto: string
    cliente?: string | null
    autor?: string | null
    descricao?: string | null
    data_ensaio?: string | null
    criado_em: string
  }
  configuracao_eta?: {
    tipo_eta: string
    vazao_modulo_ls: number
    vol_floc_unit_m3: number
    vol_floc_total_m3: number
    vol_dec_unit_m3: number
    vol_dec_total_m3: number
    tempo_floc_seg: number
    tempo_dec_seg: number
  } | null
  dosagens_planta?: {
    unidade: UnidadeDosagem
    dosagem_pac_ml_min: number
    dosagem_hipo_ml_min: number
    dosagem_alc_ml_min: number
    dosagem_flu_ml_min: number
    dosagem_pac_ppm: number
    dosagem_hipo_ppm: number
    dosagem_alc_ppm: number
    dosagem_flu_ppm: number
    pac?: { c100: number; c10: number; c1: number }
    hipo?: { c100: number; c10: number; c1: number }
    alc?: { c100: number; c10: number; c1: number }
    flu?: { c100: number; c10: number; c1: number }
  } | null
  agua_bruta?: AguaBruta | null
  jarros: ResultadoJarro[]
  jarro_otimo?: {
    numero_jarro: number
    dose_pac_ml?: number
    dose_pac_ppm?: number | null
    turbidez_final: number
    cor_final: number
    ph_final: number
    remocao_turbidez: number
    remocao_cor: number
  } | null
  instrucoes_preparo: Array<{
    produto: string
    solucao_10_perc: string
    solucao_1_perc: string
  }>
  norma_referencia: string
}
