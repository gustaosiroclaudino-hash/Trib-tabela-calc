import { 
  FiscalItem, 
  TaxLegacyItem, 
  TaxReformaSimulationItem, 
  CalculationMemoryStep, 
  TaxRuleSet, 
  ScenarioPremises,
  CompanyProfile,
  CreditEligibilityStatus
} from '../types';

export const TRANSITION_YEARS = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033] as const;

export interface YearRuleDefinition {
  ano: number;
  descricaoFase: string;
  baseLegal: string;
  getCbsRate: (stdRate: number, isTesteRate: number) => number;
  getIbsFraction: () => number; // Fração da alíquota de referência do IBS
  isTesteYear: boolean;
  fatorResidualIcmsIss: number;
  fatorResidualPisCofins: number;
  fatorResidualIpi: number;
  grauCerteza: 'ALTO' | 'MEDIO' | 'PROJECAO_ESTIMADA';
}

export const YEAR_DEFINITIONS: Record<number, YearRuleDefinition> = {
  2026: {
    ano: 2026,
    descricaoFase: 'Fase de Teste Operacional (CBS 0,9% e IBS 0,1% compensáveis)',
    baseLegal: 'EC 132/2023, Art. 125 e LC 214/2025, Art. 56',
    getCbsRate: (_, testRate) => testRate, // 0.009
    getIbsFraction: () => 0.001 / 0.177,  // IBS nominal de 0.1%
    isTesteYear: true,
    fatorResidualIcmsIss: 1.0,
    fatorResidualPisCofins: 1.0,
    fatorResidualIpi: 1.0,
    grauCerteza: 'ALTO'
  },
  2027: {
    ano: 2027,
    descricaoFase: 'Cobrança efetiva da CBS (-0,1% p.p.); IBS transição (0,1%); Extinção de PIS e COFINS',
    baseLegal: 'EC 132/2023, Art. 126 e LC 214/2025, Art. 58',
    getCbsRate: (stdRate) => Math.max(0, roundCurrency((stdRate - 0.001) * 10000) / 10000), // 8.7% conforme Art. 126 da EC 132
    getIbsFraction: () => 0.001 / 0.177, // 0.1% teste estadual/municipal
    isTesteYear: false,
    fatorResidualIcmsIss: 1.0,
    fatorResidualPisCofins: 0.0, // Extinto
    fatorResidualIpi: 0.0, // Reduzido/Zerar exceto ZFM
    grauCerteza: 'ALTO'
  },
  2028: {
    ano: 2028,
    descricaoFase: 'CBS com redução de 0,1% p.p.; IBS transição (0,1%); PIS/COFINS extintos',
    baseLegal: 'EC 132/2023, Art. 126/127 e LC 214/2025',
    getCbsRate: (stdRate) => Math.max(0, roundCurrency((stdRate - 0.001) * 10000) / 10000), // 8.7%
    getIbsFraction: () => 0.001 / 0.177,
    isTesteYear: false,
    fatorResidualIcmsIss: 1.0,
    fatorResidualPisCofins: 0.0,
    fatorResidualIpi: 0.0,
    grauCerteza: 'ALTO'
  },
  2029: {
    ano: 2029,
    descricaoFase: 'Início da transição do ICMS/ISS: 10% de redução legada e 10% de IBS',
    baseLegal: 'EC 132/2023, Art. 128 e LC 214/2025',
    getCbsRate: (stdRate) => stdRate,
    getIbsFraction: () => 0.10, // 10% da alíquota cheia do IBS
    isTesteYear: false,
    fatorResidualIcmsIss: 0.90, // 90%
    fatorResidualPisCofins: 0.0,
    fatorResidualIpi: 0.0,
    grauCerteza: 'MEDIO'
  },
  2030: {
    ano: 2030,
    descricaoFase: 'Transição progressiva: 20% de redução ICMS/ISS e 20% de IBS',
    baseLegal: 'EC 132/2023, Art. 128 e LC 214/2025',
    getCbsRate: (stdRate) => stdRate,
    getIbsFraction: () => 0.20, // 20%
    isTesteYear: false,
    fatorResidualIcmsIss: 0.80, // 80%
    fatorResidualPisCofins: 0.0,
    fatorResidualIpi: 0.0,
    grauCerteza: 'MEDIO'
  },
  2031: {
    ano: 2031,
    descricaoFase: 'Transição progressiva: 30% de redução ICMS/ISS e 30% de IBS',
    baseLegal: 'EC 132/2023, Art. 128 e LC 214/2025',
    getCbsRate: (stdRate) => stdRate,
    getIbsFraction: () => 0.30, // 30%
    isTesteYear: false,
    fatorResidualIcmsIss: 0.70, // 70%
    fatorResidualPisCofins: 0.0,
    fatorResidualIpi: 0.0,
    grauCerteza: 'MEDIO'
  },
  2032: {
    ano: 2032,
    descricaoFase: 'Transição progressiva: 40% de redução ICMS/ISS e 40% de IBS',
    baseLegal: 'EC 132/2023, Art. 128 e LC 214/2025',
    getCbsRate: (stdRate) => stdRate,
    getIbsFraction: () => 0.40, // 40%
    isTesteYear: false,
    fatorResidualIcmsIss: 0.60, // 60%
    fatorResidualPisCofins: 0.0,
    fatorResidualIpi: 0.0,
    grauCerteza: 'MEDIO'
  },
  2033: {
    ano: 2033,
    descricaoFase: 'Modelo Definitivo Integral: CBS + IBS plenos; Extinção total de ICMS, ISS e IPI',
    baseLegal: 'EC 132/2023, Art. 129 e LC 214/2025',
    getCbsRate: (stdRate) => stdRate,
    getIbsFraction: () => 1.00, // 100% da alíquota cheia
    isTesteYear: false,
    fatorResidualIcmsIss: 0.0, // Extinto
    fatorResidualPisCofins: 0.0, // Extinto
    fatorResidualIpi: 0.0, // Extinto
    grauCerteza: 'PROJECAO_ESTIMADA'
  }
};

/**
 * Função utilitária para arredondamento padrão financeiro (2 casas decimais)
 */
export function roundCurrency(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Normaliza código NCM para 8 dígitos numéricos
 */
export function normalizeNcm(ncm: string | undefined): string {
  if (!ncm) return '';
  return ncm.replace(/\D/g, '').padEnd(8, '0').slice(0, 8);
}

/**
 * Motor de Cálculo Didático e Auditável da Reforma Tributária por Item
 */
export function calculateItemReformaSimulation(
  item: Omit<FiscalItem, 'simulacoesPorAno'>,
  ano: number,
  ruleset: TaxRuleSet,
  scenario: ScenarioPremises,
  companyProfile?: CompanyProfile,
  isEntrada: boolean = false
): TaxReformaSimulationItem {
  const yearDef = YEAR_DEFINITIONS[ano] || YEAR_DEFINITIONS[2033];
  const memoria: CalculationMemoryStep[] = [];
  const cleanNcm = normalizeNcm(item.ncm);

  // Verificação de ausência de NCM válido
  if (!cleanNcm || cleanNcm === '00000000') {
    return {
      ano,
      cenarioId: scenario.id,
      baseCBS: 0,
      aliquotaCBSNominal: 0,
      fatorReducaoCBS: 0,
      aliquotaCBSEfetiva: 0,
      valorCBS: 0,
      baseIBSEstadual: 0,
      aliquotaIBSEstadualNominal: 0,
      fatorReducaoIBSEstadual: 0,
      aliquotaIBSEstadualEfetiva: 0,
      valorIBSEstadual: 0,
      baseIBSMunicipal: 0,
      aliquotaIBSMunicipalNominal: 0,
      fatorReducaoIBSMunicipal: 0,
      aliquotaIBSMunicipalEfetiva: 0,
      valorIBSMunicipal: 0,
      valorIBSTotal: 0,
      aplicaIS: false,
      baseIS: 0,
      aliquotaIS: 0,
      valorIS: 0,
      fatorResidualIcmsIss: yearDef.fatorResidualIcmsIss,
      valorResidualIcmsIss: 0,
      fatorResidualPisCofins: yearDef.fatorResidualPisCofins,
      valorResidualPisCofins: 0,
      fatorResidualIpi: yearDef.fatorResidualIpi,
      valorResidualIpi: 0,
      totalCargaEstimada: 0,
      creditoElegivel: false,
      creditoEstimadoValor: 0,
      creditoStatus: 'NAO_ELEGIVEL',
      creditoExplicacao: 'Item sem código NCM válido no XML. Conforme o Guia, a célula torna-se "não calculável" em vez de presumir dados.',
      baseCalculoUtilizada: 0,
      estrategiaPrecoAplicada: scenario.estrategiaPreco || 'PRECO_BRUTO',
      teseIcmsAplicada: scenario.teseIcms || 'FISCO',
      contingenciaIcms: 0,
      tipoRegraAplicada: 'PADRAO',
      descricaoRegra: 'NCM não informado ou inválido',
      baseLegal: 'Art. 4º da LC 214/2025',
      grauCerteza: 'NAO_CALCULAVEL',
      memoriaCalculo: [
        {
          step: 1,
          titulo: 'Parâmetro Ausente',
          formula: 'NCM ausente no XML da NF-e',
          valoresEntrada: { ncmLido: item.ncm || '(vazio)' },
          resultadoParcial: 'Não Calculável',
          arredondamento: 'N/A',
          baseLegal: 'Princípio de Segurança Fiscal',
          observacao: 'Dados fiscais insuficientes para determinar alíquota e regime específico.'
        }
      ],
      naoCalculavelMotivo: 'NCM ausente ou não estruturado no XML da nota.'
    };
  }

  // 1. Premissas de Cenário: Estratégia de Preço e Tese de ICMS
  const estrategiaPreco = scenario.estrategiaPreco || 'PRECO_BRUTO';
  const teseIcms = scenario.teseIcms || 'FISCO';
  const neutralizar2026 = scenario.neutralizarAnoTeste2026 !== false;

  // Base Operação Contratual = Preço do item - Desconto + Frete + Seguro + Outras Despesas
  const baseOperacao = roundCurrency(item.vProd - item.vDesc + item.vFrete + item.vSeg + item.vOutro);
  
  const legado = item.tributosLegados;
  const totalLegadoItem = roundCurrency(
    legado.vICMS + (legado.vISS || 0) + legado.vPIS + legado.vCOFINS + legado.vIPI
  );

  // Base de Cálculo adotada:
  // Se PRECO_DESONERADO: subtrai os tributos legados embutidos "por dentro" (Receita Líquida Alvo / Metodologia MGK)
  // Se PRECO_BRUTO: mantém o valor da operação integral negociado (Art. 12 da LC 214/2025)
  const baseCalculo = estrategiaPreco === 'PRECO_DESONERADO'
    ? roundCurrency(Math.max(0, baseOperacao - totalLegadoItem))
    : baseOperacao;

  memoria.push({
    step: 1,
    titulo: `Composição da Base de Cálculo (${estrategiaPreco === 'PRECO_DESONERADO' ? 'Receita Líquida Desonerada' : 'Valor da Operação Bruto'})`,
    formula: estrategiaPreco === 'PRECO_DESONERADO'
      ? 'Base = (vProd - vDesc + vFrete + vSeg + vOutro) - TributosLegados'
      : 'Base = vProd - vDesc + vFrete + vSeg + vOutro',
    valoresEntrada: {
      baseOperacao: baseOperacao.toFixed(2),
      tributosLegadosDeduzidos: estrategiaPreco === 'PRECO_DESONERADO' ? totalLegadoItem.toFixed(2) : 'R$ 0,00',
      estrategia: estrategiaPreco
    },
    resultadoParcial: baseCalculo.toFixed(2),
    arredondamento: '2 casas decimais',
    baseLegal: estrategiaPreco === 'PRECO_DESONERADO' ? 'Metodologia MGK / Repasse Competitivo' : 'LC 214/2025, Art. 12',
    observacao: estrategiaPreco === 'PRECO_DESONERADO'
      ? 'Preço expurgado de ICMS, PIS e COFINS para manter margem líquida alvo.'
      : 'Base ampla sobre o valor da operação sem exclusão do legado.'
  });

  // 2. Busca de regra especial por NCM
  const regraNcm = ruleset.regrasEspeciaisNcm.find(r => cleanNcm.startsWith(r.ncmCodigo.slice(0, 4)) || cleanNcm === r.ncmCodigo);

  let tipoRegra: TaxReformaSimulationItem['tipoRegraAplicada'] = 'PADRAO';
  let fatorReducao = 0;
  let descricaoRegra = 'Regra Geral Padrão - Alíquota Plena de Referência';
  let baseLegalRegra = 'LC 214/2025, Art. 4º e Art. 13';

  if (regraNcm) {
    if (regraNcm.tipoRegra === 'isento') {
      tipoRegra = 'CESTA_BASICA_ZERO';
      fatorReducao = 1.0; // 100% redução (alíquota zero)
      descricaoRegra = regraNcm.descricao;
      baseLegalRegra = `${regraNcm.baseLegal}, ${regraNcm.artigo}`;
    } else if (regraNcm.tipoRegra === 'reducao_60') {
      tipoRegra = 'REDUCAO_60';
      fatorReducao = 0.60; // 60% redução
      descricaoRegra = regraNcm.descricao;
      baseLegalRegra = `${regraNcm.baseLegal}, ${regraNcm.artigo}`;
    } else if (regraNcm.tipoRegra === 'reducao_30') {
      tipoRegra = 'REDUCAO_30';
      fatorReducao = 0.30;
      descricaoRegra = regraNcm.descricao;
      baseLegalRegra = `${regraNcm.baseLegal}, ${regraNcm.artigo}`;
    } else if (regraNcm.tipoRegra === 'monofasico') {
      tipoRegra = 'MONOFASICO';
      fatorReducao = 0;
      descricaoRegra = regraNcm.descricao;
      baseLegalRegra = `${regraNcm.baseLegal}, ${regraNcm.artigo}`;
    }
  }

  // 3. Alíquotas Nominais do Cenário para CBS e IBS
  const cbsNominalRef = scenario.aliquotaReferenciaCBS;
  const ibsEstadualNominalRef = scenario.aliquotaReferenciaIBSEstadual;
  const ibsMunicipalNominalRef = scenario.aliquotaReferenciaIBSMunicipal;

  // Aplicação da regra do ano
  let cbsEfetivaAno = 0;
  let ibsEstadualEfetivaAno = 0;
  let ibsMunicipalEfetivaAno = 0;

  if (yearDef.isTesteYear) {
    // 2026: CBS 0.9% e IBS 0.1% (fase de teste com neutralização)
    const cbsTeste = ruleset.aliquotasReferencia.cbsTeste2026;
    const ibsTeste = ruleset.aliquotasReferencia.ibsTeste2026;
    
    cbsEfetivaAno = roundCurrency(cbsTeste * (1 - fatorReducao) * 10000) / 10000;
    // O 0.1% do IBS divide-se entre Estado e Município proporcionalmente
    const proporcaoEst = ibsEstadualNominalRef / (ibsEstadualNominalRef + ibsMunicipalNominalRef);
    ibsEstadualEfetivaAno = roundCurrency(ibsTeste * proporcaoEst * (1 - fatorReducao) * 10000) / 10000;
    ibsMunicipalEfetivaAno = roundCurrency(ibsTeste * (1 - proporcaoEst) * (1 - fatorReducao) * 10000) / 10000;
  } else {
    // Anos 2027 a 2033
    // CBS entra com taxa do ano (com dedução de 0,1% p.p. em 2027/2028 conforme Art. 126 da EC 132/2023)
    const cbsBase = yearDef.getCbsRate(cbsNominalRef, ruleset.aliquotasReferencia.cbsTeste2026);
    cbsEfetivaAno = roundCurrency(cbsBase * (1 - fatorReducao) * 10000) / 10000;
    
    // IBS entra conforme a fração do ano da transição (0.10, 0.20, 0.30, 0.40, 1.00)
    const ibsFrac = yearDef.getIbsFraction();
    ibsEstadualEfetivaAno = roundCurrency(ibsEstadualNominalRef * ibsFrac * (1 - fatorReducao) * 10000) / 10000;
    ibsMunicipalEfetivaAno = roundCurrency(ibsMunicipalNominalRef * ibsFrac * (1 - fatorReducao) * 10000) / 10000;
  }

  // 4. Valores de CBS e IBS sobre a baseCalculo
  const valorCBS = roundCurrency(baseCalculo * cbsEfetivaAno);
  const valorIBSEstadual = roundCurrency(baseCalculo * ibsEstadualEfetivaAno);
  const valorIBSMunicipal = roundCurrency(baseCalculo * ibsMunicipalEfetivaAno);
  const valorIBSTotal = roundCurrency(valorIBSEstadual + valorIBSMunicipal);

  memoria.push({
    step: 2,
    titulo: `Cálculo da CBS Federal para ${ano}`,
    formula: `Valor CBS = Base (${baseCalculo.toFixed(2)}) × (AlíquotaNominal × (1 - FatorRedução))`,
    valoresEntrada: {
      base: baseCalculo.toFixed(2),
      aliquotaEfetiva: (cbsEfetivaAno * 100).toFixed(3) + '%',
      fatorReducao: (fatorReducao * 100).toFixed(0) + '%'
    },
    resultadoParcial: valorCBS.toFixed(2),
    arredondamento: '2 casas decimais',
    baseLegal: baseLegalRegra,
    observacao: yearDef.descricaoFase
  });

  memoria.push({
    step: 3,
    titulo: `Cálculo do IBS Estadual e Municipal para ${ano}`,
    formula: `Valor IBS = Base (${baseCalculo.toFixed(2)}) × (AlíquotaRef × FraçãoTransição × (1 - FatorRedução))`,
    valoresEntrada: {
      base: baseCalculo.toFixed(2),
      ibsEstadualEfetivo: (ibsEstadualEfetivaAno * 100).toFixed(3) + '%',
      ibsMunicipalEfetivo: (ibsMunicipalEfetivaAno * 100).toFixed(3) + '%',
      fracaoAno: (yearDef.getIbsFraction() * 100).toFixed(1) + '%'
    },
    resultadoParcial: valorIBSTotal.toFixed(2),
    arredondamento: '2 casas decimais',
    baseLegal: 'EC 132/2023, Art. 128 / LC 227/2026',
    observacao: `Estadual: R$ ${valorIBSEstadual.toFixed(2)} | Municipal: R$ ${valorIBSMunicipal.toFixed(2)}`
  });

  // 5. Imposto Seletivo (IS) se aplicável
  let aplicaIS = false;
  let baseIS = 0;
  let aliquotaIS = 0;
  let valorIS = 0;

  if (scenario.considerarIs && regraNcm && regraNcm.tipoRegra === 'imposto_seletivo' && ano >= 2027) {
    aplicaIS = true;
    baseIS = baseCalculo;
    aliquotaIS = regraNcm.aliquotaSeletivo || 0.15;
    valorIS = roundCurrency(baseIS * aliquotaIS);

    memoria.push({
      step: 4,
      titulo: 'Incidência de Imposto Seletivo (IS)',
      formula: 'Valor IS = Base × Alíquota IS',
      valoresEntrada: {
        base: baseIS.toFixed(2),
        aliquotaIS: (aliquotaIS * 100).toFixed(1) + '%'
      },
      resultadoParcial: valorIS.toFixed(2),
      arredondamento: '2 casas decimais',
      baseLegal: 'LC 214/2025, Art. 18',
      observacao: 'Incidência monofásica sobre produtos prejudiciais à saúde ou ao meio ambiente.'
    });
  }

  // 6. Tributos Legados Residuais no ano da simulação & Teses de ICMS (Gross-up)
  let valorResidualIcmsIss = 0;
  let contingenciaIcms = 0;

  const nominalIcmsRate = baseOperacao > 0 ? (legado.vICMS / baseOperacao) : 0.18;
  const effectiveIcmsRate = nominalIcmsRate * yearDef.fatorResidualIcmsIss;

  if (yearDef.fatorResidualPisCofins === 0 && effectiveIcmsRate > 0) {
    // Post 2027: PIS e COFINS extintos. Recálculo da base por dentro sobre a receita líquida alvo
    const cbsIbsSum = valorCBS + valorIBSTotal;

    // Tese do Fisco (SEFAZ/SP RC 32.303/2025): IBS e CBS integram a base do ICMS
    const vProdFisco = (baseCalculo + effectiveIcmsRate * cbsIbsSum) / (1 - effectiveIcmsRate);
    const taxIcmsFisco = roundCurrency((vProdFisco + cbsIbsSum) * effectiveIcmsRate);

    // Tese do Contribuinte (PLP 16/2025): IBS e CBS NÃO integram a base do ICMS
    const vProdContrib = baseCalculo / (1 - effectiveIcmsRate);
    const taxIcmsContrib = roundCurrency(vProdContrib * effectiveIcmsRate);

    contingenciaIcms = roundCurrency(Math.max(0, taxIcmsFisco - taxIcmsContrib));

    if (teseIcms === 'FISCO') {
      valorResidualIcmsIss = taxIcmsFisco;
    } else if (teseIcms === 'CONTRIBUINTE') {
      valorResidualIcmsIss = taxIcmsContrib;
    } else {
      valorResidualIcmsIss = roundCurrency((legado.vICMS + (legado.vISS || 0)) * yearDef.fatorResidualIcmsIss);
    }
  } else {
    // 2026 ou anos em que ICMS está extinto (2033)
    valorResidualIcmsIss = roundCurrency((legado.vICMS + (legado.vISS || 0)) * yearDef.fatorResidualIcmsIss);
  }

  // PIS / COFINS (com compensação em 2026 se neutralizado)
  let valorResidualPisCofins = roundCurrency((legado.vPIS + legado.vCOFINS) * yearDef.fatorResidualPisCofins);
  if (yearDef.isTesteYear && neutralizar2026) {
    // Compensável contra PIS/COFINS (EC 132/2023, Art. 125, § 1º)
    valorResidualPisCofins = Math.max(0, roundCurrency(valorResidualPisCofins - (valorCBS + valorIBSTotal)));
  }

  const valorResidualIpi = roundCurrency(legado.vIPI * yearDef.fatorResidualIpi);

  // Total da carga tributária estimada neste ano
  const totalCargaEstimada = roundCurrency(
    valorCBS + valorIBSTotal + valorIS + valorResidualIcmsIss + valorResidualPisCofins + valorResidualIpi
  );

  // 7. Estimativa de Crédito Tributário (se operação for Entrada / Compra)
  let creditoElegivel = false;
  let creditoEstimadoValor = 0;
  let creditoStatus: CreditEligibilityStatus = 'NAO_ELEGIVEL';
  let creditoExplicacao = 'Operação de saída (venda) não gera apropriação direta de crédito fiscal de compra.';

  if (isEntrada) {
    if (companyProfile?.regimeTributario === 'SIMPLES_NACIONAL') {
      creditoStatus = 'CONFIRMACAO_PENDENTE';
      creditoExplicacao = 'Empresa no Simples Nacional: transferência de crédito depende da faixa do Simples e de opção expressa pelo regime geral (Art. 41 da LC 214).';
    } else {
      if (tipoRegra === 'CESTA_BASICA_ZERO') {
        creditoStatus = 'DOCUMENTO';
        creditoElegivel = false;
        creditoExplicacao = 'Cesta básica com alíquota zero: conforme a lei, não há valor cobrado na etapa anterior a creditar.';
      } else {
        creditoElegivel = true;
        const valorCreditoBruto = valorCBS + valorIBSTotal;
        creditoEstimadoValor = roundCurrency(valorCreditoBruto * scenario.aproveitamentoCreditoFator);
        creditoStatus = 'POTENCIAL';
        creditoExplicacao = `Crédito potencial pleno de não-cumulatividade (CBS R$ ${valorCBS.toFixed(2)} + IBS R$ ${valorIBSTotal.toFixed(2)}). Sujeito à comprovação de pagamento no novo sistema split payment.`;
      }
    }
  }

  return {
    ano,
    cenarioId: scenario.id,
    baseCBS: baseCalculo,
    aliquotaCBSNominal: cbsNominalRef,
    fatorReducaoCBS: fatorReducao,
    aliquotaCBSEfetiva: cbsEfetivaAno,
    valorCBS,
    baseIBSEstadual: baseCalculo,
    aliquotaIBSEstadualNominal: ibsEstadualNominalRef,
    fatorReducaoIBSEstadual: fatorReducao,
    aliquotaIBSEstadualEfetiva: ibsEstadualEfetivaAno,
    valorIBSEstadual,
    baseIBSMunicipal: baseCalculo,
    aliquotaIBSMunicipalNominal: ibsMunicipalNominalRef,
    fatorReducaoIBSMunicipal: fatorReducao,
    aliquotaIBSMunicipalEfetiva: ibsMunicipalEfetivaAno,
    valorIBSMunicipal,
    valorIBSTotal,
    aplicaIS,
    baseIS,
    aliquotaIS,
    valorIS,
    fatorResidualIcmsIss: yearDef.fatorResidualIcmsIss,
    valorResidualIcmsIss,
    fatorResidualPisCofins: yearDef.fatorResidualPisCofins,
    valorResidualPisCofins,
    fatorResidualIpi: yearDef.fatorResidualIpi,
    valorResidualIpi,
    totalCargaEstimada,
    creditoElegivel,
    creditoEstimadoValor,
    creditoStatus,
    creditoExplicacao,
    baseCalculoUtilizada: baseCalculo,
    estrategiaPrecoAplicada: estrategiaPreco,
    teseIcmsAplicada: teseIcms,
    contingenciaIcms,
    tipoRegraAplicada: tipoRegra,
    descricaoRegra,
    baseLegal: baseLegalRegra,
    grauCerteza: yearDef.grauCerteza,
    memoriaCalculo: memoria
  };
}

/**
 * Recalcula todas as simulações da reforma (2026-2033) para um item
 */
export function populateItemSimulations(
  item: Omit<FiscalItem, 'simulacoesPorAno'>,
  ruleset: TaxRuleSet,
  scenario: ScenarioPremises,
  companyProfile?: CompanyProfile,
  isEntrada: boolean = false
): Record<number, TaxReformaSimulationItem> {
  const result: Record<number, TaxReformaSimulationItem> = {};
  for (const year of TRANSITION_YEARS) {
    result[year] = calculateItemReformaSimulation(
      item,
      year,
      ruleset,
      scenario,
      companyProfile,
      isEntrada
    );
  }
  return result;
}
