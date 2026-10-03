import { 
  FiscalDocument, 
  FiscalItem, 
  FiscalTotals, 
  TaxLegacyItem, 
  CompanyProfile, 
  TaxRuleSet, 
  ScenarioPremises,
  OperationDirection,
  DocumentStatus,
  ImportFileResult,
  ImportSummary
} from '../types';
import { roundCurrency, populateItemSimulations } from './taxReformEngine';

export const PARSER_VERSION = '2026.09.28-v1';

/**
 * Computa um hash simples e rápido para identificar alterações de conteúdo do arquivo
 */
export async function computeFileHash(content: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(content);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback
    }
  }
  // Fallback djb2
  let hash = 5381;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) + hash) + content.charCodeAt(i);
  }
  return Math.abs(hash).toString(16);
}

/**
 * Helper para localizar elemento filho ignorando prefixo de namespace (ex: nfe:infNFe ou infNFe)
 */
export function findFirstElement(parent: Element | Document, tagName: string): Element | null {
  const direct = parent.getElementsByTagName(tagName);
  if (direct.length > 0) return direct[0];
  const target = tagName.toLowerCase();
  const all = parent.getElementsByTagName('*');
  for (let i = 0; i < all.length; i++) {
    const el = all[i];
    const local = (el.localName || el.nodeName.split(':').pop() || '').toLowerCase();
    if (local === target) return el;
  }
  return null;
}

/**
 * Helper para localizar todos os elementos filhos ignorando namespace
 */
export function findAllElements(parent: Element | Document, tagName: string): Element[] {
  const direct = parent.getElementsByTagName(tagName);
  if (direct.length > 0) return Array.from(direct);
  const target = tagName.toLowerCase();
  const res: Element[] = [];
  const all = parent.getElementsByTagName('*');
  for (let i = 0; i < all.length; i++) {
    const el = all[i];
    const local = (el.localName || el.nodeName.split(':').pop() || '').toLowerCase();
    if (local === target) res.push(el);
  }
  return res;
}

/**
 * Helper para extrair texto de uma tag com segurança e tolerância a namespace
 */
export function getTagText(parent: Element | Document, tagName: string): string {
  const found = findFirstElement(parent, tagName);
  return found?.textContent ? found.textContent.trim() : '';
}

/**
 * Helper para extrair número float de uma tag
 */
export function getTagFloat(parent: Element | Document, tagName: string): number {
  const text = getTagText(parent, tagName);
  if (!text) return 0;
  const val = parseFloat(text);
  return isNaN(val) ? 0 : val;
}

/**
 * Verifica se um CFOP é tipicamente de devolução
 */
export function isCfopDevolucao(cfop: string): boolean {
  const c = cfop.replace(/\D/g, '');
  const prefix2 = c.slice(0, 2);
  const prefix4 = c.slice(0, 4);
  // CFOPs comuns de devolução: 1201, 1202, 1203, 1204, 1410, 1411, 1553, 1660, 2201, 2202, 2203, 2410, 2411, 5201, 5202, etc.
  const devolucaoCfops = ['1201', '1202', '1203', '1204', '1410', '1411', '1553', '1660', '1661', '1662',
                          '2201', '2202', '2203', '2204', '2410', '2411', '2553', '2660', '2661', '2662',
                          '5201', '5202', '5410', '5411', '5553', '5660', '5661', '5662',
                          '6201', '6202', '6410', '6411', '6553', '6660', '6661', '6662',
                          '7201', '7202'];
  return devolucaoCfops.includes(prefix4) || prefix2 === '12' || prefix2 === '22' || (c.endsWith('201') || c.endsWith('202'));
}

/**
 * Parser de NF-e / NFC-e seguro e tolerante a múltiplos formatos
 */
export async function parseNfeXml(
  xmlContent: string,
  fileName: string,
  activeCompany?: CompanyProfile,
  ruleset?: TaxRuleSet,
  scenario?: ScenarioPremises
): Promise<{ success: boolean; doc?: FiscalDocument; error?: string; warnings?: string[] }> {
  const warnings: string[] = [];

  if (!xmlContent || xmlContent.trim().length === 0) {
    return { success: false, error: 'Arquivo XML vazio.' };
  }
  if (xmlContent.length > 25 * 1024 * 1024) {
    return { success: false, error: 'Arquivo XML excede o tamanho máximo de 25 MB.' };
  }

  // 1. Sanitização profunda de XML
  let cleanXml = xmlContent.replace(/^\uFEFF/, '').trim();
  const firstTagIndex = cleanXml.indexOf('<');
  if (firstTagIndex > 0) {
    cleanXml = cleanXml.substring(firstTagIndex);
  }
  // Normaliza declaração de encoding para evitar falha no DOMParser do browser com ISO-8859-1
  cleanXml = cleanXml.replace(/<\?xml[^>]*\?>/i, (match) => {
    return match.replace(/encoding=["'][^"']+["']/i, 'encoding="UTF-8"');
  });

  // 2. DOMParser seguro
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(cleanXml, 'text/xml');

  // Verifica erro de sintaxe do XML
  const parseError = xmlDoc.getElementsByTagName('parsererror');
  if (parseError.length > 0) {
    return { 
      success: false, 
      error: `Estrutura de XML inválida ou malformada: ${parseError[0].textContent?.slice(0, 150) || 'Erro de sintaxe'}` 
    };
  }

  // 3. Localizar tag infNFe
  const infNFe = findFirstElement(xmlDoc, 'infNFe');
  if (!infNFe) {
    const retEvento = findFirstElement(xmlDoc, 'retEvento') || findFirstElement(xmlDoc, 'infEvento');
    if (retEvento) {
      return { 
        success: false, 
        error: 'Arquivo identificado como evento avulso (ex: cancelamento/CC-e) sem o corpo principal da NF-e.' 
      };
    }
    return { success: false, error: 'Tag <infNFe> não encontrada no documento. Certifique-se de que é um XML de NF-e ou NFC-e válido.' };
  }

  const fileHash = await computeFileHash(cleanXml);

  // Chave de acesso: do atributo Id="NFe35..." ou da tag chNFe ou regex
  let chaveAcesso = (infNFe.getAttribute('Id') || infNFe.getAttribute('id') || '')
    .replace(/^NFe/i, '')
    .replace(/\D/g, '');

  if (chaveAcesso.length !== 44) {
    const chNFeTag = getTagText(xmlDoc, 'chNFe').replace(/\D/g, '');
    if (chNFeTag.length === 44) {
      chaveAcesso = chNFeTag;
    } else {
      const match = cleanXml.match(/Id=["']NFe(\d{44})["']/i) || cleanXml.match(/<chNFe>(\d{44})<\/chNFe>/i);
      if (match && match[1]) {
        chaveAcesso = match[1];
      } else {
        chaveAcesso = `GEN_${fileHash.slice(0, 20)}_${Date.now()}`;
        warnings.push('Chave de acesso de 44 dígitos não identificada; gerado ID seguro.');
      }
    }
  }

  // Identificação da Nota (<ide>)
  const ide = findFirstElement(infNFe, 'ide');
  const modelo = ide ? (getTagText(ide, 'mod') || '55') : '55';
  const serie = ide ? getTagText(ide, 'serie') : '1';
  const nNF = ide ? getTagText(ide, 'nNF') : '';
  const dhEmi = ide ? (getTagText(ide, 'dhEmi') || getTagText(ide, 'dEmi')) : new Date().toISOString();
  const natOp = ide ? getTagText(ide, 'natOp') : 'OPERAÇÃO COMERCIAL';
  const tpNF = ide ? getTagText(ide, 'tpNF') : '1'; // 0 = entrada, 1 = saída

  // Documentos referenciados (<NFref>)
  const refNFeElements = findAllElements(xmlDoc, 'refNFe');
  const notasReferenciadas: string[] = [];
  for (let i = 0; i < refNFeElements.length; i++) {
    if (refNFeElements[i].textContent) {
      notasReferenciadas.push(refNFeElements[i].textContent!.trim());
    }
  }

  // Emitente (<emit>)
  const emit = findFirstElement(infNFe, 'emit');
  const emitCnpj = emit ? (getTagText(emit, 'CNPJ') || getTagText(emit, 'CPF')) : '';
  const emitNome = emit ? (getTagText(emit, 'xNome') || getTagText(emit, 'xFant') || 'Emitente Desconhecido') : '';
  const enderEmit = emit ? findFirstElement(emit, 'enderEmit') : null;
  const emitUf = enderEmit ? getTagText(enderEmit, 'UF') : (emit ? getTagText(emit, 'UF') : '');
  const emitMun = enderEmit ? getTagText(enderEmit, 'xMun') : '';
  const emitCodMun = enderEmit ? getTagText(enderEmit, 'cMun') : '';

  // Destinatário (<dest>)
  const dest = findFirstElement(infNFe, 'dest');
  const destCnpj = dest ? (getTagText(dest, 'CNPJ') || getTagText(dest, 'CPF')) : '';
  const destNome = dest ? (getTagText(dest, 'xNome') || 'Consumidor / Destinatário') : '';
  const enderDest = dest ? findFirstElement(dest, 'enderDest') : null;
  const destUf = enderDest ? getTagText(enderDest, 'UF') : (dest ? getTagText(dest, 'UF') : '');
  const destMun = enderDest ? getTagText(enderDest, 'xMun') : '';
  const destCodMun = enderDest ? getTagText(enderDest, 'cMun') : '';

  // Determinar Tipo de Operação (ENTRADA ou SAIDA)
  // Regra explícita: Se o CNPJ da empresa ativa for igual ao emitente -> SAÍDA.
  // Se for igual ao destinatário -> ENTRADA.
  // Caso contrário, usa tpNF (0 = entrada, 1 = saída).
  let tipoOperacao: OperationDirection = tpNF === '0' ? 'ENTRADA' : 'SAIDA';
  let tipoOrigem: FiscalDocument['tipoOperacaoOrigem'] = 'TAG_TPNF';

  if (activeCompany && activeCompany.cnpj) {
    const cleanCompanyCnpj = activeCompany.cnpj.replace(/\D/g, '');
    const cleanEmitCnpj = emitCnpj.replace(/\D/g, '');
    const cleanDestCnpj = destCnpj.replace(/\D/g, '');

    if (cleanCompanyCnpj && cleanEmitCnpj === cleanCompanyCnpj) {
      tipoOperacao = 'SAIDA';
      tipoOrigem = 'AUTOMATICO_CNPJ';
    } else if (cleanCompanyCnpj && cleanDestCnpj === cleanCompanyCnpj) {
      tipoOperacao = 'ENTRADA';
      tipoOrigem = 'AUTOMATICO_CNPJ';
    }
  }

  // Totais do XML (<total><ICMSTot>)
  const total = findFirstElement(infNFe, 'total');
  const icmsTot = total ? findFirstElement(total, 'ICMSTot') : null;

  const totais: FiscalTotals = {
    vProd: icmsTot ? getTagFloat(icmsTot, 'vProd') : 0,
    vFrete: icmsTot ? getTagFloat(icmsTot, 'vFrete') : 0,
    vSeg: icmsTot ? getTagFloat(icmsTot, 'vSeg') : 0,
    vDesc: icmsTot ? getTagFloat(icmsTot, 'vDesc') : 0,
    vOutro: icmsTot ? getTagFloat(icmsTot, 'vOutro') : 0,
    vBC: icmsTot ? getTagFloat(icmsTot, 'vBC') : 0,
    vICMS: icmsTot ? getTagFloat(icmsTot, 'vICMS') : 0,
    vBCST: icmsTot ? getTagFloat(icmsTot, 'vBCST') : 0,
    vST: icmsTot ? getTagFloat(icmsTot, 'vST') : 0,
    vIPI: icmsTot ? getTagFloat(icmsTot, 'vIPI') : 0,
    vPIS: icmsTot ? getTagFloat(icmsTot, 'vPIS') : 0,
    vCOFINS: icmsTot ? getTagFloat(icmsTot, 'vCOFINS') : 0,
    vNF: icmsTot ? getTagFloat(icmsTot, 'vNF') : 0,
    totalTributosLegados: 0
  };
  totais.totalTributosLegados = roundCurrency(
    totais.vICMS + totais.vST + totais.vIPI + totais.vPIS + totais.vCOFINS
  );

  // Itens (<det>)
  const detList = findAllElements(infNFe, 'det');
  const itens: FiscalItem[] = [];
  let somaVProdItens = 0;
  let hasDevolucaoItem = false;

  for (let i = 0; i < detList.length; i++) {
    const det = detList[i];
    const nItem = parseInt(det.getAttribute('nItem') || `${i + 1}`, 10);
    const prod = findFirstElement(det, 'prod');
    const imposto = findFirstElement(det, 'imposto');

    const cProd = prod ? getTagText(prod, 'cProd') : `ITEM_${nItem}`;
    const xProd = prod ? getTagText(prod, 'xProd') : `Produto ${nItem}`;
    const ncm = prod ? getTagText(prod, 'NCM') : '';
    const cest = prod ? getTagText(prod, 'CEST') : undefined;
    const cfop = prod ? getTagText(prod, 'CFOP') : '';
    const uCom = prod ? getTagText(prod, 'uCom') : 'UN';
    const qCom = prod ? getTagFloat(prod, 'qCom') : 1;
    const vUnCom = prod ? getTagFloat(prod, 'vUnCom') : 0;
    const vProd = prod ? getTagFloat(prod, 'vProd') : 0;
    const vDesc = prod ? getTagFloat(prod, 'vDesc') : 0;
    const vFrete = prod ? getTagFloat(prod, 'vFrete') : 0;
    const vSeg = prod ? getTagFloat(prod, 'vSeg') : 0;
    const vOutro = prod ? getTagFloat(prod, 'vOutro') : 0;

    somaVProdItens += vProd;

    if (isCfopDevolucao(cfop)) {
      hasDevolucaoItem = true;
    }

    // Extração de Tributos Legados do Item
    // ICMS
    const icmsElem = imposto ? findFirstElement(imposto, 'ICMS') : null;
    let cstIcms = '';
    let orig = '0';
    let vBCIcms = 0;
    let pICMS = 0;
    let vICMS = 0;
    let vBCST = 0;
    let pICMSST = 0;
    let vICMSST = 0;

    if (icmsElem) {
      const icmsChild = icmsElem.firstElementChild || (icmsElem.children.length > 0 ? icmsElem.children[0] : null);
      if (icmsChild) {
        cstIcms = getTagText(icmsChild, 'CST') || getTagText(icmsChild, 'CSOSN') || '';
        orig = getTagText(icmsChild, 'orig') || '0';
        vBCIcms = getTagFloat(icmsChild, 'vBC');
        pICMS = getTagFloat(icmsChild, 'pICMS');
        vICMS = getTagFloat(icmsChild, 'vICMS');
        vBCST = getTagFloat(icmsChild, 'vBCST');
        pICMSST = getTagFloat(icmsChild, 'pICMSST');
        vICMSST = getTagFloat(icmsChild, 'vICMSST');
      }
    }

    // IPI
    const ipiElem = imposto ? findFirstElement(imposto, 'IPI') : null;
    let cstIpi: string | undefined = undefined;
    let vBCIpi = 0;
    let pIPI = 0;
    let vIPI = 0;
    if (ipiElem) {
      cstIpi = getTagText(ipiElem, 'CST');
      vBCIpi = getTagFloat(ipiElem, 'vBC');
      pIPI = getTagFloat(ipiElem, 'pIPI');
      vIPI = getTagFloat(ipiElem, 'vIPI');
    }

    // PIS
    const pisElem = imposto ? findFirstElement(imposto, 'PIS') : null;
    let cstPis: string | undefined = undefined;
    let vBCPis = 0;
    let pPIS = 0;
    let vPIS = 0;
    if (pisElem) {
      cstPis = getTagText(pisElem, 'CST');
      vBCPis = getTagFloat(pisElem, 'vBC');
      pPIS = getTagFloat(pisElem, 'pPIS');
      vPIS = getTagFloat(pisElem, 'vPIS');
    }

    // COFINS
    const cofinsElem = imposto ? findFirstElement(imposto, 'COFINS') : null;
    let cstCofins: string | undefined = undefined;
    let vBCCofins = 0;
    let pCOFINS = 0;
    let vCOFINS = 0;
    if (cofinsElem) {
      cstCofins = getTagText(cofinsElem, 'CST');
      vBCCofins = getTagFloat(cofinsElem, 'vBC');
      pCOFINS = getTagFloat(cofinsElem, 'pCOFINS');
      vCOFINS = getTagFloat(cofinsElem, 'vCOFINS');
    }

    const tributosLegados: TaxLegacyItem = {
      cstIcms,
      origem: orig,
      vBCIcms,
      pICMS,
      vICMS,
      vBCST,
      pICMSST,
      vICMSST,
      cstIpi,
      vBCIpi,
      pIPI,
      vIPI,
      cstPis,
      vBCPis,
      pPIS,
      vPIS,
      cstCofins,
      vBCCofins,
      pCOFINS,
      vCOFINS,
      totalLegadoDestacado: roundCurrency(vICMS + vICMSST + vIPI + vPIS + vCOFINS)
    };

    // Alertas de Qualidade no Item
    const alertasQualidade: string[] = [];
    if (!ncm || ncm === '00000000') {
      alertasQualidade.push('NCM ausente ou zerado.');
    }
    if (!cfop) {
      alertasQualidade.push('CFOP não informado.');
    }

    const itemId = `${chaveAcesso}_${nItem}`;
    const valorLiquido = roundCurrency(vProd - vDesc + vFrete + vSeg + vOutro);

    // Criação do item com simulações
    const rawFiscalItem: Omit<FiscalItem, 'simulacoesPorAno'> = {
      id: itemId,
      documentoId: chaveAcesso,
      nItem,
      cProd,
      xProd,
      ncm,
      cest,
      cfop,
      uCom,
      qCom,
      vUnCom,
      vProd,
      vDesc,
      vFrete,
      vSeg,
      vOutro,
      valorTotalLiquido: valorLiquido,
      tributosLegados,
      classificacaoStatus: ncm ? 'CONFIRMADA' : 'NAO_DETERMINADA',
      alertasQualidade
    };

    const simulacoesPorAno = (ruleset && scenario)
      ? populateItemSimulations(rawFiscalItem, ruleset, scenario, activeCompany, tipoOperacao === 'ENTRADA')
      : {};

    itens.push({
      ...rawFiscalItem,
      simulacoesPorAno
    });
  }

  // Validação de Totais: conferência item-a-item
  somaVProdItens = roundCurrency(somaVProdItens);
  if (totais.vProd > 0 && Math.abs(somaVProdItens - totais.vProd) > 0.05) {
    warnings.push(
      `Divergência de total de produtos: soma dos itens (R$ ${somaVProdItens.toFixed(2)}) difere do total informado no XML (R$ ${totais.vProd.toFixed(2)}).`
    );
  }

  // Situação e Devolução
  let situacao: DocumentStatus = 'AUTORIZADA';
  let isDevolucao = hasDevolucaoItem || notasReferenciadas.length > 0 || natOp.toLowerCase().includes('devolucao') || natOp.toLowerCase().includes('devolução');
  let isCancelada = false;

  // Verificação de evento de cancelamento no próprio XML (ex: nfeProc cancelada)
  const xEvento = getTagText(xmlDoc, 'xEvento');
  const tpEvento = getTagText(xmlDoc, 'tpEvento');
  if (tpEvento === '110111' || xEvento.toLowerCase().includes('cancel')) {
    situacao = 'CANCELADA';
    isCancelada = true;
  }

  if (isDevolucao) {
    situacao = 'DEVOLUCAO';
  }

  const doc: FiscalDocument = {
    id: chaveAcesso,
    chaveAcesso,
    fileHash,
    fileName,
    modelo,
    serie,
    numero: nNF,
    dataEmissao: dhEmi,
    tipoOperacao,
    tipoOperacaoOrigem: tipoOrigem,
    naturezaOperacao: natOp,
    situacao,
    isDevolucao,
    isCancelada,
    notasReferenciadas,
    emitente: {
      cnpjCpf: emitCnpj,
      razaoSocial: emitNome,
      uf: emitUf,
      municipio: emitMun,
      codigoMunicipio: emitCodMun
    },
    destinatario: {
      cnpjCpf: destCnpj,
      razaoSocial: destNome,
      uf: destUf,
      municipio: destMun,
      codigoMunicipio: destCodMun
    },
    totais,
    itens,
    rawXml: xmlContent,
    metadadosImportacao: {
      dataHora: new Date().toISOString(),
      usuarioLocal: 'Usuário Local',
      versaoParser: PARSER_VERSION,
      versaoTabelasAplicadas: ruleset?.versao || '2026.09.28-v1',
      divergenciasTotais: warnings.length > 0 ? warnings : undefined
    }
  };

  return { success: true, doc, warnings: warnings.length > 0 ? warnings : undefined };
}

/**
 * Processador em lote de arquivos para importação
 */
export async function processBatchXmlFiles(
  files: { name: string; content: string }[],
  existingDocs: FiscalDocument[],
  company?: CompanyProfile,
  ruleset?: TaxRuleSet,
  scenario?: ScenarioPremises,
  onProgress?: (current: number, total: number, fileName: string) => void
): Promise<{ summary: ImportSummary; newDocs: FiscalDocument[] }> {
  const existingKeys = new Set(existingDocs.map(d => d.chaveAcesso));
  const existingHashes = new Set(existingDocs.map(d => d.fileHash));

  const results: ImportFileResult[] = [];
  const newDocs: FiscalDocument[] = [];

  let aceitos = 0;
  let duplicados = 0;
  let invalidos = 0;
  let parciais = 0;

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    if (onProgress) {
      onProgress(i + 1, files.length, f.name);
    }
    try {
      const parseResult = await parseNfeXml(f.content, f.name, company, ruleset, scenario);

      if (!parseResult.success || !parseResult.doc) {
        invalidos++;
        results.push({
          fileName: f.name,
          status: 'INVALIDO',
          motivo: parseResult.error || 'Erro ao processar XML'
        });
        continue;
      }

      const doc = parseResult.doc;

      // Verificação de duplicidade
      if (existingKeys.has(doc.chaveAcesso) || existingHashes.has(doc.fileHash)) {
        duplicados++;
        results.push({
          fileName: f.name,
          status: 'DUPLICADO',
          chaveAcesso: doc.chaveAcesso,
          motivo: 'Documento já cadastrado no banco de dados (chave ou hash idêntico).'
        });
        continue;
      }

      // Adiciona à lista de chaves conhecidas para prevenir duplicatas no mesmo lote
      existingKeys.add(doc.chaveAcesso);
      existingHashes.add(doc.fileHash);

      if (parseResult.warnings && parseResult.warnings.length > 0) {
        parciais++;
        results.push({
          fileName: f.name,
          status: 'PARCIAL',
          chaveAcesso: doc.chaveAcesso,
          documento: doc,
          avisos: parseResult.warnings,
          motivo: 'Lido com ressalvas de conferência.'
        });
      } else {
        aceitos++;
        results.push({
          fileName: f.name,
          status: 'ACEITO',
          chaveAcesso: doc.chaveAcesso,
          documento: doc
        });
      }

      newDocs.push(doc);
    } catch (err: any) {
      invalidos++;
      results.push({
        fileName: f.name,
        status: 'INVALIDO',
        motivo: err?.message || 'Exceção não tratada na leitura do arquivo.'
      });
    }
  }

  return {
    summary: {
      totalArquivos: files.length,
      totalAceitos: aceitos,
      totalDuplicados: duplicados,
      totalInvalidos: invalidos,
      totalParciais: parciais,
      detalhesPorArquivo: results
    },
    newDocs
  };
}
