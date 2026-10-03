import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('');
(global as any).DOMParser = dom.window.DOMParser;

import { OFFICIAL_FIXTURE_XML } from '../src/services/fixtureOfficialXml';
import { DEFAULT_DEMO_COMPANY } from '../src/services/fixtures';
import { OFFICIAL_TAX_RULESET_DEFAULT, DEFAULT_SCENARIOS } from '../src/services/defaultRules';
import { parseNfeXml } from '../src/services/nfeParser';

const YEAR_TRANSITION_RULES: any = {
    2026: {
        cbsRateFunc: (cbsStd: number) => 0.009,
        ibsRateFunc: (ibsStd: number) => 0.001,
        residualIcmsIssPct: 1.0,
        residualPisCofinsPct: 1.0,
        residualIpiPct: 1.0,
        neutralized: true
    },
    2027: {
        cbsRateFunc: (cbsStd: number) => Math.max(0, cbsStd - 0.001),
        ibsRateFunc: (ibsStd: number) => 0.001,
        residualIcmsIssPct: 1.0,
        residualPisCofinsPct: 0.0,
        residualIpiPct: 0.0,
        neutralized: false
    },
    2028: {
        cbsRateFunc: (cbsStd: number) => Math.max(0, cbsStd - 0.001),
        ibsRateFunc: (ibsStd: number) => 0.001,
        residualIcmsIssPct: 1.0,
        residualPisCofinsPct: 0.0,
        residualIpiPct: 0.0,
        neutralized: false
    },
    2029: {
        cbsRateFunc: (cbsStd: number) => cbsStd,
        ibsRateFunc: (ibsStd: number) => ibsStd * 0.10,
        residualIcmsIssPct: 0.90,
        residualPisCofinsPct: 0.0,
        residualIpiPct: 0.0,
        neutralized: false
    },
    2030: {
        cbsRateFunc: (cbsStd: number) => cbsStd,
        ibsRateFunc: (ibsStd: number) => ibsStd * 0.20,
        residualIcmsIssPct: 0.80,
        residualPisCofinsPct: 0.0,
        residualIpiPct: 0.0,
        neutralized: false
    },
    2031: {
        cbsRateFunc: (cbsStd: number) => cbsStd,
        ibsRateFunc: (ibsStd: number) => ibsStd * 0.30,
        residualIcmsIssPct: 0.70,
        residualPisCofinsPct: 0.0,
        residualIpiPct: 0.0,
        neutralized: false
    },
    2032: {
        cbsRateFunc: (cbsStd: number) => cbsStd,
        ibsRateFunc: (ibsStd: number) => ibsStd * 0.40,
        residualIcmsIssPct: 0.60,
        residualPisCofinsPct: 0.0,
        residualIpiPct: 0.0,
        neutralized: false
    },
    2033: {
        cbsRateFunc: (cbsStd: number) => cbsStd,
        ibsRateFunc: (ibsStd: number) => ibsStd * 1.00,
        residualIcmsIssPct: 0.0,
        residualPisCofinsPct: 0.0,
        residualIpiPct: 0.0,
        neutralized: false
    }
};

async function compare() {
  const res = await parseNfeXml(OFFICIAL_FIXTURE_XML, 'test.xml', DEFAULT_DEMO_COMPANY, OFFICIAL_TAX_RULESET_DEFAULT, DEFAULT_SCENARIOS[0]);
  const doc = res.doc!;

  console.log('Doc total vNF:', doc.totais.vNF);
  console.log('Doc vProd:', doc.totais.vProd);
  console.log('Doc ICMS:', doc.totais.vICMS);
  console.log('Doc PIS:', doc.totais.vPIS);
  console.log('Doc COFINS:', doc.totais.vCOFINS);
  console.log('Doc IPI:', doc.totais.vIPI);

  console.log('\n======================================================');
  console.log('1. NOSSO APP ATUAL (Trib-tabela-calc - LC 214/2025)');
  console.log('======================================================');
  [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033].forEach(ano => {
    let sumCBS = 0, sumIBS = 0, sumRes = 0;
    doc.itens.forEach(item => {
      const sim = item.simulacoesPorAno[ano];
      sumCBS += sim.valorCBS;
      sumIBS += sim.valorIBSTotal;
      sumRes += (sim.valorResidualIcmsIss + sim.valorResidualPisCofins + sim.valorResidualIpi);
    });
    console.log(`Ano ${ano}: Total = R$ ${(sumCBS + sumIBS + sumRes).toFixed(2)} | CBS: R$ ${sumCBS.toFixed(2)} | IBS: R$ ${sumIBS.toFixed(2)} | Residual: R$ ${sumRes.toFixed(2)}`);
  });

  const cbsStd = 0.088;
  const ibsStd = 0.177;

  for (const legalThesis of ['fisco', 'contribuinte']) {
    console.log('\n======================================================');
    console.log(`2. OUTRO APP (App-analise-reforma-trib) - Tese: ${legalThesis.toUpperCase()}`);
    console.log('======================================================');

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

      console.log(`Ano ${ano}: Total = R$ ${totalTaxNew.toFixed(2)} | CBS: R$ ${totalCbs.toFixed(2)} | IBS: R$ ${totalIbs.toFixed(2)} | ICMS: R$ ${totalIcms.toFixed(2)} | PIS/COF: R$ ${totalPisCofins.toFixed(2)}`);
    });
  }
}

compare();
