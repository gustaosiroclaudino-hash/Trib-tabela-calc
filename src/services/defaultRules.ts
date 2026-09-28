import { TaxRuleSet, ScenarioPremises } from '../types';

export const OFFICIAL_TAX_RULESET_DEFAULT: TaxRuleSet = {
  versao: '2026.09.28-v1',
  dataVigencia: '2026-09-28',
  dataConsulta: '2026-09-28T16:00:00Z',
  orgaoResponsavel: 'Receita Federal do Brasil / Comitê Gestor do IBS (CGIBS)',
  fonteOficialUrl: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214compilado.htm',
  aliquotasReferencia: {
    cbsPadrao: 0.088,        // 8,80% Federal
    ibsPadraoEstadual: 0.120, // 12,00% Estadual
    ibsPadraoMunicipal: 0.057, // 5,70% Municipal
    totalPadrao: 0.265,      // 26,50% Referência Global
    cbsTeste2026: 0.009,     // 0,90% Ano-teste 2026 (compensável)
    ibsTeste2026: 0.001      // 0,10% Ano-teste 2026 (compensável)
  },
  regrasEspeciaisNcm: [
    // Cesta Básica Nacional de Alimentos (Alíquota Zero de CBS e IBS - Art. 8º da LC 214/2025)
    {
      ncmCodigo: '10063021',
      produtoNome: 'Arroz polido ou brunido',
      tipoRegra: 'isento',
      fatorReducao: 1.0,
      descricao: 'Cesta Básica Nacional de Alimentos - Alíquota Zero (100% de redução de CBS e IBS).',
      baseLegal: 'LC 214/2025',
      artigo: 'Art. 8º, Anexo I'
    },
    {
      ncmCodigo: '10063011',
      produtoNome: 'Arroz parboilizado',
      tipoRegra: 'isento',
      fatorReducao: 1.0,
      descricao: 'Cesta Básica Nacional de Alimentos - Alíquota Zero.',
      baseLegal: 'LC 214/2025',
      artigo: 'Art. 8º, Anexo I'
    },
    {
      ncmCodigo: '07133399',
      produtoNome: 'Feijão preto e outros',
      tipoRegra: 'isento',
      fatorReducao: 1.0,
      descricao: 'Cesta Básica Nacional de Alimentos - Alíquota Zero.',
      baseLegal: 'LC 214/2025',
      artigo: 'Art. 8º, Anexo I'
    },
    {
      ncmCodigo: '04012010',
      produtoNome: 'Leite UHT integral',
      tipoRegra: 'isento',
      fatorReducao: 1.0,
      descricao: 'Cesta Básica Nacional de Alimentos - Alíquota Zero.',
      baseLegal: 'LC 214/2025',
      artigo: 'Art. 8º, Anexo I'
    },
    {
      ncmCodigo: '19059090',
      produtoNome: 'Pão do tipo comum / francês',
      tipoRegra: 'isento',
      fatorReducao: 1.0,
      descricao: 'Cesta Básica Nacional de Alimentos - Alíquota Zero.',
      baseLegal: 'LC 214/2025',
      artigo: 'Art. 8º, Anexo I'
    },
    {
      ncmCodigo: '11010010',
      produtoNome: 'Farinha de trigo',
      tipoRegra: 'isento',
      fatorReducao: 1.0,
      descricao: 'Cesta Básica Nacional de Alimentos - Alíquota Zero.',
      baseLegal: 'LC 214/2025',
      artigo: 'Art. 8º, Anexo I'
    },
    {
      ncmCodigo: '15079011',
      produtoNome: 'Óleo de soja refinado',
      tipoRegra: 'isento',
      fatorReducao: 1.0,
      descricao: 'Cesta Básica Nacional de Alimentos - Alíquota Zero.',
      baseLegal: 'LC 214/2025',
      artigo: 'Art. 8º, Anexo I'
    },
    {
      ncmCodigo: '02013000',
      produtoNome: 'Carnes bovinas desossadas',
      tipoRegra: 'isento',
      fatorReducao: 1.0,
      descricao: 'Cesta Básica Nacional de Alimentos - Alíquota Zero de CBS e IBS.',
      baseLegal: 'LC 214/2025',
      artigo: 'Art. 8º, Anexo I'
    },
    {
      ncmCodigo: '02071400',
      produtoNome: 'Carnes e miudezas de aves',
      tipoRegra: 'isento',
      fatorReducao: 1.0,
      descricao: 'Cesta Básica Nacional de Alimentos - Alíquota Zero.',
      baseLegal: 'LC 214/2025',
      artigo: 'Art. 8º, Anexo I'
    },

    // Redução de 60% (Medicamentos, Dispositivos Médicos, Educação e Saúde - Art. 9º da LC 214/2025)
    {
      ncmCodigo: '30049025',
      produtoNome: 'Medicamentos contendo dipirona ou antibióticos',
      tipoRegra: 'reducao_60',
      fatorReducao: 0.60,
      descricao: 'Medicamentos e produtos farmacêuticos essenciais - Redução de 60% nas alíquotas de CBS e IBS.',
      baseLegal: 'LC 214/2025',
      artigo: 'Art. 9º, § 1º, inciso I'
    },
    {
      ncmCodigo: '30049099',
      produtoNome: 'Outros medicamentos preparados para fins terapêuticos',
      tipoRegra: 'reducao_60',
      fatorReducao: 0.60,
      descricao: 'Medicamentos e formulações terapêuticas - Redução de 60% de CBS e IBS.',
      baseLegal: 'LC 214/2025',
      artigo: 'Art. 9º, § 1º, inciso I'
    },
    {
      ncmCodigo: '90189099',
      produtoNome: 'Instrumentos e aparelhos para medicina ou cirurgia',
      tipoRegra: 'reducao_60',
      fatorReducao: 0.60,
      descricao: 'Dispositivos médicos e hospitalares - Redução de 60% de CBS e IBS.',
      baseLegal: 'LC 214/2025',
      artigo: 'Art. 9º, § 1º, inciso II'
    },
    {
      ncmCodigo: '99010000',
      produtoNome: 'Serviços de Educação e Ensino',
      tipoRegra: 'reducao_60',
      fatorReducao: 0.60,
      descricao: 'Serviços de educação infantil, básica, superior e técnico-profissional - Redução de 60%.',
      baseLegal: 'LC 214/2025',
      artigo: 'Art. 9º, § 1º, inciso IV'
    },
    {
      ncmCodigo: '99020000',
      produtoNome: 'Serviços de Saúde e Assistência Médica',
      tipoRegra: 'reducao_60',
      fatorReducao: 0.60,
      descricao: 'Serviços de saúde humana, clínicas e laboratórios - Redução de 60%.',
      baseLegal: 'LC 214/2025',
      artigo: 'Art. 9º, § 1º, inciso III'
    },

    // Redução de 30% (Profissões Regulamentadas - Art. 10º da LC 214/2025)
    {
      ncmCodigo: '99030000',
      produtoNome: 'Serviços de Profissionais Regulamentados',
      tipoRegra: 'reducao_30',
      fatorReducao: 0.30,
      descricao: 'Serviços de contabilidade, advocacia, arquitetura e engenharia - Redução de 30% nas alíquotas.',
      baseLegal: 'LC 214/2025',
      artigo: 'Art. 10'
    },

    // Imposto Seletivo (Art. 18 da LC 214/2025)
    {
      ncmCodigo: '22030000',
      produtoNome: 'Cervejas de malte',
      tipoRegra: 'imposto_seletivo',
      fatorReducao: 0,
      aliquotaSeletivo: 0.15, // 15% estimativa
      descricao: 'Bebidas alcoólicas - Sujeição ao Imposto Seletivo (IS) além de CBS e IBS.',
      baseLegal: 'LC 214/2025',
      artigo: 'Art. 18, inciso I'
    },
    {
      ncmCodigo: '22083020',
      produtoNome: 'Uísques e destilados',
      tipoRegra: 'imposto_seletivo',
      fatorReducao: 0,
      aliquotaSeletivo: 0.25, // 25% estimativa
      descricao: 'Bebidas alcoólicas destiladas - Incidência de Imposto Seletivo (IS).',
      baseLegal: 'LC 214/2025',
      artigo: 'Art. 18, inciso I'
    },
    {
      ncmCodigo: '24022000',
      produtoNome: 'Cigarros contendo tabaco',
      tipoRegra: 'imposto_seletivo',
      fatorReducao: 0,
      aliquotaSeletivo: 0.50, // 50% estimativa
      descricao: 'Fumo e produtos derivados - Incidência agravada de Imposto Seletivo (IS).',
      baseLegal: 'LC 214/2025',
      artigo: 'Art. 18, inciso II'
    },

    // Combustíveis - Regime Monofásico (Art. 68 da LC 214/2025)
    {
      ncmCodigo: '27101259',
      produtoNome: 'Gasolina e misturas',
      tipoRegra: 'monofasico',
      fatorReducao: 0,
      descricao: 'Combustíveis - Regime Monofásico com alíquotas ad rem (por volume). Não gera cumulatividade no varejo.',
      baseLegal: 'LC 214/2025',
      artigo: 'Art. 68'
    },
    {
      ncmCodigo: '27101921',
      produtoNome: 'Óleo Diesel e misturas',
      tipoRegra: 'monofasico',
      fatorReducao: 0,
      descricao: 'Combustíveis - Tributação monofásica ad rem por unidade de medida.',
      baseLegal: 'LC 214/2025',
      artigo: 'Art. 68'
    }
  ],
  historicoModificacoes: [
    {
      data: '2026-09-28T16:00:00Z',
      usuario: 'Sistema Padrão (Receita Federal / CGIBS)',
      descricao: 'Carga inicial do pacote de regras tributárias da reforma conforme LC 214/2025, LC 227/2026 e Decreto 12.955/2026.'
    }
  ]
};

export const DEFAULT_SCENARIOS: ScenarioPremises[] = [
  {
    id: 'base',
    nome: 'Cenário Base (Estimativa Fazenda / LC 214)',
    descricao: 'Alíquotas médias estimadas pelo Ministério da Fazenda: CBS 8,80% + IBS 17,70% (Total 26,50%). Aproveitamento pleno de créditos.',
    aliquotaReferenciaCBS: 0.088,
    aliquotaReferenciaIBSEstadual: 0.120,
    aliquotaReferenciaIBSMunicipal: 0.057,
    aproveitamentoCreditoFator: 1.0,
    considerarIs: true,
    dataAtualizacao: '2026-09-28'
  },
  {
    id: 'conservador',
    nome: 'Cenário Conservador (Carga Elevada / Crédito Restrito)',
    descricao: 'Premissa de calibragem superior: CBS 9,20% + IBS 18,80% (Total 28,00%) e restrição de 15% nos créditos tomados por formalidades acessórias.',
    aliquotaReferenciaCBS: 0.092,
    aliquotaReferenciaIBSEstadual: 0.128,
    aliquotaReferenciaIBSMunicipal: 0.060,
    aproveitamentoCreditoFator: 0.85,
    considerarIs: true,
    dataAtualizacao: '2026-09-28'
  },
  {
    id: 'otimista',
    nome: 'Cenário Otimista (Eficiência Máxima / Alíquota Reduzida)',
    descricao: 'Premissa de corte de alíquota pelo combate à sonegação: CBS 8,20% + IBS 16,80% (Total 25,00%) e 100% de apropriação dos créditos.',
    aliquotaReferenciaCBS: 0.082,
    aliquotaReferenciaIBSEstadual: 0.114,
    aliquotaReferenciaIBSMunicipal: 0.054,
    aproveitamentoCreditoFator: 1.0,
    considerarIs: true,
    dataAtualizacao: '2026-09-28'
  }
];

export const OFFICIAL_SOURCES_LINKS = [
  {
    titulo: 'Lei Complementar 214/2025 compilada — IBS, CBS e IS',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214compilado.htm',
    orgao: 'Presidência da República / Casa Civil',
    descricao: 'Institui a CBS, o IBS e o Imposto Seletivo; define regras matriz, regimes especiais e transição.'
  },
  {
    titulo: 'Lei Complementar 227/2026 — CGIBS e regras complementares',
    url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp227.htm',
    orgao: 'Presidência da República / Comitê Gestor IBS',
    descricao: 'Estruturação do Comitê Gestor do IBS, repartição federativa e cobrança compartilhada.'
  },
  {
    titulo: 'Receita Federal — Principais Marcos Regulatórios',
    url: 'https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/programas-e-atividades/reforma-tributaria-do-consumo/legislacao/principais-marcos-regulatorios/',
    orgao: 'Receita Federal do Brasil',
    descricao: 'Atos normativos, instruções e decretos regulamentadores (Decreto 12.955/2026).'
  },
  {
    titulo: 'Receita Federal — Entenda a Reforma e Transição',
    url: 'https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/programas-e-atividades/reforma-tributaria-do-consumo/entenda',
    orgao: 'Ministério da Fazenda',
    descricao: 'Guias didáticos sobre neutralidade, não-cumulatividade plena e cronograma de transição.'
  },
  {
    titulo: 'Portal Nacional da NF-e — Notas Técnicas e Schemas',
    url: 'https://www.nfe.fazenda.gov.br/portal/principal.aspx',
    orgao: 'Portal da Nota Fiscal Eletrônica (SEFAZ)',
    descricao: 'Notas Técnicas de leiaute de XML, campos da reforma tributária e manuais de orientação.'
  }
];
