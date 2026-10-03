const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('');
global.DOMParser = dom.window.DOMParser;

const dir = 'C:/Users/gu_os/.gemini/antigravity-ide/brain/2ee4b2e4-9e4d-4acb-81e8-3ec1cdb7f254/scratch';
const jsOther = fs.readFileSync(path.join(dir, 'other_app.js'), 'utf8');

// Also import our app's engine
const { OFFICIAL_FIXTURE_XML } = require('../src/services/fixtureOfficialXml.ts');
const { DEFAULT_DEMO_COMPANY } = require('../src/services/fixtures.ts');
const { OFFICIAL_TAX_RULESET_DEFAULT, DEFAULT_SCENARIOS } = require('../src/services/defaultRules.ts');
const { parseNfeXml } = require('../src/services/nfeParser.ts');

async function compare() {
  const res = await parseNfeXml(OFFICIAL_FIXTURE_XML, 'test.xml', DEFAULT_DEMO_COMPANY, OFFICIAL_TAX_RULESET_DEFAULT, DEFAULT_SCENARIOS[0]);
  const doc = res.doc;

  console.log('Doc total:', doc.totais.vNF);
  console.log('Doc vProd:', doc.totais.vProd);
  console.log('Doc ICMS:', doc.totais.vICMS);
  console.log('Doc PIS:', doc.totais.vPIS);
  console.log('Doc COFINS:', doc.totais.vCOFINS);
  console.log('Doc IPI:', doc.totais.vIPI);

  // In our app:
  console.log('\n--- NOSSO APP (Trib-tabela-calc) ---');
  [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033].forEach(ano => {
    let sumCBS = 0, sumIBS = 0, sumRes = 0;
    doc.itens.forEach(item => {
      const sim = item.simulacoesPorAno[ano];
      sumCBS += sim.valorCBS;
      sumIBS += sim.valorIBSTotal;
      sumRes += (sim.valorResidualIcmsIss + sim.valorResidualPisCofins + sim.valorResidualIpi);
    });
    console.log(`Ano ${ano}: Total = R$ ${(sumCBS + sumIBS + sumRes).toFixed(2)} | CBS: ${sumCBS.toFixed(2)} | IBS: ${sumIBS.toFixed(2)} | Residual: ${sumRes.toFixed(2)}`);
  });

  // Now in other app:
  console.log('\n--- OUTRO APP (App-analise-reforma-trib) ---');
  // Extract YEAR_TRANSITION_RULES from jsOther
  const startRules = jsOther.indexOf('YEAR_TRANSITION_RULES = {');
  const endRules = jsOther.indexOf('};\n\nlet activeSimulatedSale', startRules);
  const rulesCode = jsOther.substring(startRules, endRules + 2);
  eval(rulesCode); // defines YEAR_TRANSITION_RULES

  const cbsStd = 0.088;
  const ibsStd = 0.177;
  const legalThesis = 'fisco';

  [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033].forEach(ano => {
    const yearRules = YEAR_TRANSITION_RULES[ano];
    let totalTaxNew = 0;
    let totalCbs = 0;
    let totalIbs = 0;
    let totalIcms = 0;
    let totalPisCofins = 0;

    doc.itens.forEach(item => {
      const valor_total = item.vProd - item.vDesc + item.vFrete + item.vSeg + item.vOutro;
      const pis_atual = item.tributosLegados.vPIS;
      const cofins_atual = item.tributosLegados.vCOFINS;
      const icms_atual = item.tributosLegados.vICMS;
      const iss_atual = 0;
      const ipi_atual = item.tributosLegados.vIPI;
      const taxCurrent = pis_atual + cofins_atual + icms_atual + iss_atual + ipi_atual;

      let cbsFactor = 1.0;
      let ibsFactor = 1.0;
      const cbsRate = yearRules.cbsRateFunc(cbsStd) * cbsFactor;
      const ibsRate = yearRules.ibsRateFunc(ibsStd) * ibsFactor;

      // In other app: baseValue = valor_total - taxCurrent
      const baseValue = Math.max(0, valor_total - taxCurrent);
      const cbsValCalculated = baseValue * cbsRate;
      const ibsValCalculated = baseValue * ibsRate;
      const cbsIbsSum = cbsValCalculated + ibsValCalculated;

      const tax_pis_res = (pis_atual) * yearRules.residualPisCofinsPct;
      const tax_cofins_res = (cofins_atual) * yearRules.residualPisCofinsPct;
      const tax_ipi_res = (ipi_atual) * yearRules.residualIpiPct;
      const tax_iss_res = 0;

      let nominalIcmsRate = valor_total > 0 ? (icms_atual / valor_total) : 0.18;
      const effectiveIcmsRate = nominalIcmsRate * yearRules.residualIcmsIssPct;
      let tax_icms_fisco = 0;
      let tax_icms_contrib = 0;

      if (effectiveIcmsRate > 0) {
        if (yearRules.residualPisCofinsPct === 0) {
          const vProdFisco = (baseValue + effectiveIcmsRate * cbsIbsSum) / (1 - effectiveIcmsRate);
          tax_icms_fisco = (vProdFisco + cbsIbsSum) * effectiveIcmsRate;
          const vProdContrib = baseValue / (1 - effectiveIcmsRate);
          tax_icms_contrib = vProdContrib * effectiveIcmsRate;
        } else {
          tax_icms_fisco = icms_atual * yearRules.residualIcmsIssPct;
          tax_icms_contrib = icms_atual * yearRules.residualIcmsIssPct;
        }
      }
      const tax_icms_res = (legalThesis === 'fisco') ? tax_icms_fisco : tax_icms_contrib;

      let taxNew;
      if (yearRules.neutralized) {
        taxNew = taxCurrent;
      } else {
        taxNew = cbsValCalculated + ibsValCalculated + tax_pis_res + tax_cofins_res + tax_ipi_res + tax_icms_res + tax_iss_res;
      }

      totalTaxNew += taxNew;
      totalCbs += cbsValCalculated;
      totalIbs += ibsValCalculated;
      totalIcms += tax_icms_res;
      totalPisCofins += (tax_pis_res + tax_cofins_res);
    });

    console.log(`Ano ${ano}: Total = R$ ${totalTaxNew.toFixed(2)} | CBS: ${totalCbs.toFixed(2)} | IBS: ${totalIbs.toFixed(2)} | ICMS: ${totalIcms.toFixed(2)} | PIS/COF: ${totalPisCofins.toFixed(2)}`);
  });
}

compare();
