export type TaxRegime = 'SIMPLES_NACIONAL' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL';

export type OperationDirection = 'ENTRADA' | 'SAIDA';

export type DocumentStatus = 'AUTORIZADA' | 'CANCELADA' | 'DENEGADA' | 'DEVOLUCAO';

export type CreditEligibilityStatus = 
  | 'DOCUMENTO'              // Valor expresso no documento fiscal
  | 'POTENCIAL'              // Elegível conforme regras da LC 214/2025
  | 'CONFIRMACAO_PENDENTE'   // Depende do tipo de uso/destinação ou adquirente
  | 'NAO_ELEGIVEL';          // Sem permissão legal ou enquadramento impeditivo

export type ClassificationConfidence = 'CONFIRMADA' | 'RECOMENDADA' | 'NAO_DETERMINADA';

export type DataOrigin = 'LIDO' | 'CALCULADO' | 'ESTIMADO' | 'PENDENTE';

export interface CompanyProfile {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  uf: string;
  municipio: string;
  codigoMunicipioIBGE?: string;
  regimeTributario: TaxRegime;
  cnaePrincipal?: string;
  dataCadastro: string;
  permiteCreditoAmplo: boolean; // se regime não-cumulativo
}

export interface CalculationMemoryStep {
  step: number;
  titulo: string;
  formula: string;
  valoresEntrada: Record<string, string | number>;
  resultadoParcial: string | number;
  arredondamento: string;
  baseLegal: string;
  artigo?: string;
  observacao?: string;
}

export interface TaxLegacyItem {
  // ICMS
  cstIcms: string;
  origem: string;
  vBCIcms: number;
  pICMS: number;
  vICMS: number;
  vBCST: number;
  pICMSST: number;
  vICMSST: number;
  // IPI
  cstIpi?: string;
  vBCIpi: number;
  pIPI: number;
  vIPI: number;
  // PIS
  cstPis?: string;
  vBCPis: number;
  pPIS: number;
  vPIS: number;
  // COFINS
  cstCofins?: string;
  vBCCofins: number;
  pCOFINS: number;
  vCOFINS: number;
  // ISS (se serviço)
  vBCIss?: number;
  pISS?: number;
  vISS?: number;
  // Total somado dos tributos legados destacados
  totalLegadoDestacado: number;
}

export interface TaxReformaSimulationItem {
  ano: number;
  cenarioId: string;
  
  // CBS Federal
  baseCBS: number;
  aliquotaCBSNominal: number;
  fatorReducaoCBS: number;
  aliquotaCBSEfetiva: number;
  valorCBS: number;
  
  // IBS Estadual
  baseIBSEstadual: number;
  aliquotaIBSEstadualNominal: number;
  fatorReducaoIBSEstadual: number;
  aliquotaIBSEstadualEfetiva: number;
  valorIBSEstadual: number;

  // IBS Municipal
  baseIBSMunicipal: number;
  aliquotaIBSMunicipalNominal: number;
  fatorReducaoIBSMunicipal: number;
  aliquotaIBSMunicipalEfetiva: number;
  valorIBSMunicipal: number;

  // IBS Total
  valorIBSTotal: number;
  
  // Imposto Seletivo (IS)
  aplicaIS: boolean;
  baseIS: number;
  aliquotaIS: number;
  valorIS: number;
  
  // Tributos Legados Residuais no ano
  fatorResidualIcmsIss: number;
  valorResidualIcmsIss: number;
  fatorResidualPisCofins: number;
  valorResidualPisCofins: number;
  fatorResidualIpi: number;
  valorResidualIpi: number;
  
  // Totais combinados
  totalCargaEstimada: number;
  
  // Crédito Estimado
  creditoElegivel: boolean;
  creditoEstimadoValor: number;
  creditoStatus: CreditEligibilityStatus;
  creditoExplicacao: string;
  
  // Metadados didáticos, teses e auditoria
  baseCalculoUtilizada: number;
  estrategiaPrecoAplicada: 'PRECO_BRUTO' | 'PRECO_DESONERADO';
  teseIcmsAplicada: 'SIMPLES_HISTORICO' | 'FISCO' | 'CONTRIBUINTE';
  contingenciaIcms: number; // Diferença entre Tese do Fisco e Tese do Contribuinte
  tipoRegraAplicada: 'PADRAO' | 'CESTA_BASICA_ZERO' | 'REDUCAO_60' | 'REDUCAO_30' | 'MONOFASICO' | 'ISENTO_ESPECIFICO';
  descricaoRegra: string;
  baseLegal: string;
  grauCerteza: 'ALTO' | 'MEDIO' | 'PROJECAO_ESTIMADA' | 'NAO_CALCULAVEL';
  memoriaCalculo: CalculationMemoryStep[];
  naoCalculavelMotivo?: string;
}

export interface FiscalItem {
  id: string; // docId_nItem
  documentoId: string;
  nItem: number;
  cProd: string;
  xProd: string;
  ncm: string;
  cest?: string;
  cfop: string;
  uCom: string;
  qCom: number;
  vUnCom: number;
  vProd: number;
  vDesc: number;
  vFrete: number;
  vSeg: number;
  vOutro: number;
  valorTotalLiquido: number; // vProd - vDesc + vFrete + vSeg + vOutro
  
  // Tributos legados do XML
  tributosLegados: TaxLegacyItem;
  
  // Simulação da Reforma Tributária (por ano de 2026 a 2033)
  simulacoesPorAno: Record<number, TaxReformaSimulationItem>;
  
  // Status de auditoria e qualidade
  classificacaoStatus: ClassificationConfidence;
  usuarioConfirmouClassificacao?: string;
  alertasQualidade: string[];
}

export interface FiscalTotals {
  vProd: number;
  vFrete: number;
  vSeg: number;
  vDesc: number;
  vOutro: number;
  vBC: number;
  vICMS: number;
  vBCST: number;
  vST: number;
  vIPI: number;
  vPIS: number;
  vCOFINS: number;
  vISS?: number;
  vNF: number;
  totalTributosLegados: number;
}

export interface FiscalDocument {
  id: string; // Chave de acesso ou hash único
  chaveAcesso: string;
  fileHash: string;
  fileName: string;
  modelo: string; // '55' (NF-e), '65' (NFC-e), 'NFS-e'
  serie: string;
  numero: string;
  dataEmissao: string;
  dataOperacao?: string;
  tipoOperacao: OperationDirection; // ENTRADA ou SAIDA
  tipoOperacaoOrigem: 'AUTOMATICO_CNPJ' | 'CORRECAO_MANUAL' | 'TAG_TPNF';
  naturezaOperacao: string;
  situacao: DocumentStatus;
  isDevolucao: boolean;
  isCancelada: boolean;
  notasReferenciadas: string[];
  
  emitente: {
    cnpjCpf: string;
    razaoSocial: string;
    uf: string;
    municipio?: string;
    codigoMunicipio?: string;
  };
  
  destinatario: {
    cnpjCpf: string;
    razaoSocial: string;
    uf: string;
    municipio?: string;
    codigoMunicipio?: string;
  };
  
  totais: FiscalTotals;
  itens: FiscalItem[];
  
  rawXml: string; // preserva XML original para auditoria e recálculo
  
  metadadosImportacao: {
    dataHora: string;
    usuarioLocal: string;
    versaoParser: string;
    versaoTabelasAplicadas: string;
    divergenciasTotais?: string[];
  };
}

export interface SpecialRuleNCM {
  ncmCodigo: string;
  produtoNome: string;
  tipoRegra: 'isento' | 'reducao_60' | 'reducao_30' | 'monofasico' | 'imposto_seletivo';
  fatorReducao: number; // 1.0 = 100% redução (alíquota zero); 0.6 = 60% redução; 0.3 = 30% redução
  aliquotaSeletivo?: number; // ex: 0.15 para bebidas
  descricao: string;
  baseLegal: string;
  artigo: string;
}

export interface ScenarioPremises {
  id: string;
  nome: string; // 'Base', 'Conservador', 'Otimista', 'Desonerado'
  descricao: string;
  aliquotaReferenciaCBS: number; // ex: 0.088 (8.8%)
  aliquotaReferenciaIBSEstadual: number; // ex: 0.120 (12.0%)
  aliquotaReferenciaIBSMunicipal: number; // ex: 0.057 (5.7%)
  aproveitamentoCreditoFator: number; // 1.0 = 100%, 0.85 = 85% no conservador
  considerarIs: boolean;
  estrategiaPreco?: 'PRECO_BRUTO' | 'PRECO_DESONERADO'; // default: 'PRECO_BRUTO'
  teseIcms?: 'SIMPLES_HISTORICO' | 'FISCO' | 'CONTRIBUINTE'; // default: 'FISCO'
  neutralizarAnoTeste2026?: boolean; // default: true (compensação imediata de CBS/IBS no PIS/COFINS)
  dataAtualizacao: string;
}

export interface TaxRuleSet {
  versao: string;
  dataVigencia: string;
  dataConsulta: string;
  orgaoResponsavel: string;
  fonteOficialUrl: string;
  aliquotasReferencia: {
    cbsPadrao: number; // 8.8%
    ibsPadraoEstadual: number; // 12.0%
    ibsPadraoMunicipal: number; // 5.7%
    totalPadrao: number; // 26.5%
    cbsTeste2026: number; // 0.9%
    ibsTeste2026: number; // 0.1%
  };
  regrasEspeciaisNcm: SpecialRuleNCM[];
  historicoModificacoes: {
    data: string;
    usuario: string;
    descricao: string;
  }[];
}

export interface FilterState {
  empresaId?: string;
  periodoInicio?: string;
  periodoFim?: string;
  direcao?: 'TODAS' | 'ENTRADA' | 'SAIDA';
  modelo?: string;
  uf?: string;
  cfop?: string;
  ncm?: string;
  parceiro?: string;
  termoBusca?: string;
  statusRevisao?: 'TODOS' | 'CONFIRMADA' | 'PENDENTE';
  statusSituacao?: 'TODAS' | 'AUTORIZADA' | 'CANCELADA' | 'DEVOLUCAO';
}

export interface ImportFileResult {
  fileName: string;
  status: 'ACEITO' | 'DUPLICADO' | 'INVALIDO' | 'PARCIAL';
  chaveAcesso?: string;
  motivo?: string;
  documento?: FiscalDocument;
  avisos?: string[];
}

export interface ImportSummary {
  totalArquivos: number;
  totalAceitos: number;
  totalDuplicados: number;
  totalInvalidos: number;
  totalParciais: number;
  detalhesPorArquivo: ImportFileResult[];
}
