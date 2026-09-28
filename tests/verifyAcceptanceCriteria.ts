import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

// Initialize DOMParser in Node environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.DOMParser = dom.window.DOMParser;
global.TextEncoder = TextEncoder;

import { OFFICIAL_FIXTURE_XML } from '../src/services/fixtureOfficialXml.ts';
import { 
  SYNTHETIC_PURCHASE_INVOICE_XML,
  SYNTHETIC_RETURN_INVOICE_XML,
  SYNTHETIC_CANCELED_NOTE_XML,
  SYNTHETIC_SPECIAL_BENEFITS_XML,
  DEFAULT_DEMO_COMPANY
} from '../src/services/fixtures.ts';
import { OFFICIAL_TAX_RULESET_DEFAULT, DEFAULT_SCENARIOS } from '../src/services/defaultRules.ts';
import { parseNfeXml, processBatchXmlFiles } from '../src/services/nfeParser.ts';
import { TRANSITION_YEARS, YEAR_DEFINITIONS, calculateItemReformaSimulation } from '../src/services/taxReformEngine.ts';

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('TribCalc Reforma • Teste de Critérios de Aceite (Guia)');
  console.log('======================================================\n');

  const scenarioBase = DEFAULT_SCENARIOS[0];

  // 1. Teste da Fixture Oficial descrita no item 6 do Guia
  console.log('1. Testando Fixture Oficial (R$ 22.349,73 com 14 itens):');
  const resOficial = await parseNfeXml(
    OFFICIAL_FIXTURE_XML,
    'nfe_oficial_22k.xml',
    DEFAULT_DEMO_COMPANY,
    OFFICIAL_TAX_RULESET_DEFAULT,
    scenarioBase
  );

  assert(resOficial.success === true, 'Parse do XML oficial concluído com sucesso');
  assert(resOficial.doc !== undefined, 'Objeto FiscalDocument gerado');
  assert(resOficial.doc.itens.length === 14, `Exatamente 14 itens encontrados no XML (encontrados: ${resOficial.doc?.itens.length})`);
  assert(Math.abs(resOficial.doc.totais.vNF - 22349.73) < 0.01, `Total da NF é exatamente R$ 22.349,73 (calculado: ${resOficial.doc?.totais.vNF})`);
  assert(Math.abs(resOficial.doc.totais.vProd - 21709.35) < 0.01, `Total de Produtos é R$ 21.709,35 (calculado: ${resOficial.doc?.totais.vProd})`);
  assert(Math.abs(resOficial.doc.totais.vST - 640.38) < 0.01, `ICMS-ST é R$ 640,38 (calculado: ${resOficial.doc?.totais.vST})`);
  assert(resOficial.doc.tipoOperacao === 'SAIDA', 'Identificada corretamente como SAÍDA (emitente coincide com CNPJ ativo)');

  // 2. Teste de Deduplicação (item 10 do Guia)
  console.log('\n2. Testando Deduplicação e Reimportação:');
  const batch1 = await processBatchXmlFiles(
    [{ name: 'nfe_oficial_22k.xml', content: OFFICIAL_FIXTURE_XML }],
    [],
    DEFAULT_DEMO_COMPANY,
    OFFICIAL_TAX_RULESET_DEFAULT,
    scenarioBase
  );
  assert(batch1.summary.totalAceitos === 1, 'Primeira importação aceita 1 documento');

  // Re-importa o mesmo arquivo
  const batch2 = await processBatchXmlFiles(
    [{ name: 'nfe_oficial_22k_copia.xml', content: OFFICIAL_FIXTURE_XML }],
    batch1.newDocs,
    DEFAULT_DEMO_COMPANY,
    OFFICIAL_TAX_RULESET_DEFAULT,
    scenarioBase
  );
  assert(batch2.summary.totalDuplicados === 1, 'Reimportação do mesmo XML detectada como DUPLICADA por chave/hash');
  assert(batch2.newDocs.length === 0, 'Novos documentos retornados é zero (não duplica totais)');

  // 3. Teste de XML Inválido (resiliência sem travar)
  console.log('\n3. Testando XML Malformado / Inválido:');
  const batchInvalido = await processBatchXmlFiles(
    [{ name: 'arquivo_corrompido.xml', content: '<xml><quebrado></xml' }],
    [],
    DEFAULT_DEMO_COMPANY,
    OFFICIAL_TAX_RULESET_DEFAULT,
    scenarioBase
  );
  assert(batchInvalido.summary.totalInvalidos === 1, 'XML malformado marcado como INVALIDO com motivo');
  assert(batchInvalido.summary.detalhesPorArquivo[0].motivo.length > 0, 'Motivo de rejeição explicitado');

  // 4. Teste de Nota de Devolução e Cancelada
  console.log('\n4. Testando Devoluções e Cancelamentos:');
  const resDev = await parseNfeXml(
    SYNTHETIC_RETURN_INVOICE_XML,
    'nfe_devolucao.xml',
    DEFAULT_DEMO_COMPANY,
    OFFICIAL_TAX_RULESET_DEFAULT,
    scenarioBase
  );
  assert(resDev.doc.isDevolucao === true, 'Documento classificado com status DEVOLUCAO por CFOP e NFref');
  assert(resDev.doc.notasReferenciadas.length > 0, 'Tag NFref extraída para conciliação');

  const resCanc = await parseNfeXml(
    SYNTHETIC_CANCELED_NOTE_XML,
    'nfe_cancelada.xml',
    DEFAULT_DEMO_COMPANY,
    OFFICIAL_TAX_RULESET_DEFAULT,
    scenarioBase
  );
  assert(resCanc.doc.isCancelada === true, 'Documento com tpEvento 110111 classificado como CANCELADA');

  // 5. Teste do Motor de Transição da Reforma (2026 a 2033)
  console.log('\n5. Testando Motor de Transição da Reforma Tributária (LC 214/2025):');
  const sampleItem = resOficial.doc.itens[0]; // Item 1 (vProd = 3672.00)

  // 2026: Ano Teste (CBS 0,9% e IBS 0,1%)
  const sim2026 = sampleItem.simulacoesPorAno[2026];
  assert(sim2026 !== undefined, 'Simulação 2026 calculada');
  assert(sim2026.aliquotaCBSEfetiva === 0.009, 'CBS 2026 efetiva é 0,90%');
  assert(Math.abs(sim2026.aliquotaCBSEfetiva + sim2026.aliquotaIBSEstadualEfetiva + sim2026.aliquotaIBSMunicipalEfetiva - 0.01) < 0.001, 'Soma CBS + IBS 2026 é 1,00% (ano-teste)');

  // 2027: Extinção de PIS e COFINS
  const sim2027 = sampleItem.simulacoesPorAno[2027];
  assert(sim2027.fatorResidualPisCofins === 0.0, 'PIS e COFINS extintos em 2027 (fator residual 0.0)');
  assert(sim2027.aliquotaCBSEfetiva === 0.088, 'CBS em cobrança plena (8,80%) em 2027');

  // 2029: Início da redução de 10% do ICMS/ISS e 10% do IBS
  const sim2029 = sampleItem.simulacoesPorAno[2029];
  assert(sim2029.fatorResidualIcmsIss === 0.90, 'ICMS/ISS reduzido em 10% em 2029 (fator residual 0.90)');

  // 2033: Modelo Definitivo
  const sim2033 = sampleItem.simulacoesPorAno[2033];
  assert(sim2033.fatorResidualIcmsIss === 0.0, 'ICMS/ISS extinto em 2033');
  assert(Math.abs(sim2033.aliquotaCBSEfetiva + sim2033.aliquotaIBSEstadualEfetiva + sim2033.aliquotaIBSMunicipalEfetiva - 0.265) < 0.001, 'Alíquota total de referência 2033 é 26,50% (8,8% CBS + 17,7% IBS)');

  // 6. Teste de Benefícios Especiais (Cesta Básica Zero e Redução 60% Medicamentos)
  console.log('\n6. Testando Regras Especiais de NCM da LC 214/2025:');
  const resBeneficios = await parseNfeXml(
    SYNTHETIC_SPECIAL_BENEFITS_XML,
    'nfe_beneficios.xml',
    DEFAULT_DEMO_COMPANY,
    OFFICIAL_TAX_RULESET_DEFAULT,
    scenarioBase
  );
  const itemArroz = resBeneficios.doc.itens.find(i => i.ncm === '10063021');
  assert(itemArroz !== undefined, 'Item de Arroz (Cesta Básica) identificado');
  const simArroz2033 = itemArroz.simulacoesPorAno[2033];
  assert(simArroz2033.tipoRegraAplicada === 'CESTA_BASICA_ZERO', 'Arroz classificado como CESTA_BASICA_ZERO');
  assert(simArroz2033.valorCBS === 0 && simArroz2033.valorIBSTotal === 0, 'Alíquota zero: valor CBS e IBS é R$ 0,00');

  const itemMed = resBeneficios.doc.itens.find(i => i.ncm === '30049025');
  assert(itemMed !== undefined, 'Item Medicamento identificado');
  const simMed2033 = itemMed.simulacoesPorAno[2033];
  assert(simMed2033.tipoRegraAplicada === 'REDUCAO_60', 'Medicamento classificado com REDUCAO_60');
  assert(simMed2033.fatorReducaoCBS === 0.60, 'Fator de redução de 60% aplicado');
  assert(Math.abs(simMed2033.aliquotaCBSEfetiva - (0.088 * 0.40)) < 0.001, 'Alíquota CBS efetiva é 40% da nominal (~3,52%)');

  // 7. Teste de Memória de Cálculo Auditável
  console.log('\n7. Testando Memória de Cálculo Passo a Passo:');
  assert(sim2033.memoriaCalculo.length >= 3, 'Memória de cálculo auditável possui 3 ou mais etapas detalhadas');
  assert(sim2033.memoriaCalculo[0].baseLegal.includes('LC 214/2025'), 'Base legal citada na memória de cálculo');

  console.log('\n------------------------------------------------------');
  console.log(`Resultado dos Testes: ${passedTests}/${totalTests} passaram com sucesso!`);
  console.log('------------------------------------------------------\n');
}

runTests().catch(err => {
  console.error('Erro fatal nos testes:', err);
  process.exit(1);
});
