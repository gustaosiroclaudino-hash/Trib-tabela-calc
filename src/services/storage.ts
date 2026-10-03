import { 
  FiscalDocument, 
  CompanyProfile, 
  TaxRuleSet, 
  ScenarioPremises 
} from '../types';
import { OFFICIAL_TAX_RULESET_DEFAULT, DEFAULT_SCENARIOS } from './defaultRules';
import { parseNfeXml } from './nfeParser';

export const DEFAULT_COMPANY: CompanyProfile = {
  id: 'empresa-principal',
  cnpj: '',
  razaoSocial: 'Minha Empresa',
  nomeFantasia: 'Empresa Principal',
  uf: 'SP',
  municipio: 'São Paulo',
  codigoMunicipioIBGE: '3550308',
  regimeTributario: 'LUCRO_REAL',
  dataCadastro: new Date().toISOString(),
  permiteCreditoAmplo: true
};

const STORAGE_KEYS = {
  COMPANY: 'tribcalc_active_company',
  DOCUMENTS: 'tribcalc_documents',
  RULESET: 'tribcalc_ruleset',
  SCENARIOS: 'tribcalc_scenarios',
  SELECTED_SCENARIO: 'tribcalc_selected_scenario',
  THEME: 'tribcalc_theme_mode'
};

export class LocalStorageManager {
  // --- Empresa ---
  static getCompany(): CompanyProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COMPANY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Erro ao ler empresa do storage', e);
    }
    return DEFAULT_COMPANY;
  }

  static saveCompany(company: CompanyProfile): void {
    localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(company));
  }

  // --- Documentos Fiscais ---
  static getDocuments(): FiscalDocument[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Erro ao ler documentos do storage', e);
    }
    return [];
  }

  static saveDocuments(docs: FiscalDocument[]): void {
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
  }

  // --- Regras e Tabelas Legais ---
  static getRuleSet(): TaxRuleSet {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RULESET);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Erro ao ler regras fiscais do storage', e);
    }
    return OFFICIAL_TAX_RULESET_DEFAULT;
  }

  static saveRuleSet(ruleset: TaxRuleSet): void {
    localStorage.setItem(STORAGE_KEYS.RULESET, JSON.stringify(ruleset));
  }

  static resetRuleSetToOfficial(): TaxRuleSet {
    const fresh = JSON.parse(JSON.stringify(OFFICIAL_TAX_RULESET_DEFAULT));
    fresh.historicoModificacoes.push({
      data: new Date().toISOString(),
      usuario: 'Usuário Local',
      descricao: 'Restauração manual aos valores de referência oficiais da LC 214/2025.'
    });
    this.saveRuleSet(fresh);
    return fresh;
  }

  // --- Cenários de Simulação ---
  static getScenarios(): ScenarioPremises[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SCENARIOS);
      if (data) {
        const parsed: ScenarioPremises[] = JSON.parse(data);
        // Garante que o cenário desonerado exista mesmo se o usuário tiver cache antigo
        if (!parsed.some(s => s.id === 'desonerado')) {
          const desonerado = DEFAULT_SCENARIOS.find(s => s.id === 'desonerado');
          if (desonerado) parsed.splice(1, 0, desonerado);
        }
        return parsed.map(s => ({
          ...s,
          estrategiaPreco: s.estrategiaPreco || (s.id === 'desonerado' || s.id === 'otimista' ? 'PRECO_DESONERADO' : 'PRECO_BRUTO'),
          teseIcms: s.teseIcms || (s.id === 'otimista' ? 'CONTRIBUINTE' : 'FISCO'),
          neutralizarAnoTeste2026: s.neutralizarAnoTeste2026 !== undefined ? s.neutralizarAnoTeste2026 : true
        }));
      }
    } catch (e) {
      console.error('Erro ao ler cenários do storage', e);
    }
    return DEFAULT_SCENARIOS;
  }

  static saveScenarios(scenarios: ScenarioPremises[]): void {
    localStorage.setItem(STORAGE_KEYS.SCENARIOS, JSON.stringify(scenarios));
  }

  static getSelectedScenarioId(): string {
    return localStorage.getItem(STORAGE_KEYS.SELECTED_SCENARIO) || 'base';
  }

  static saveSelectedScenarioId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.SELECTED_SCENARIO, id);
  }

  // --- Tema ---
  static getTheme(): 'dark' | 'light' {
    return (localStorage.getItem(STORAGE_KEYS.THEME) as 'dark' | 'light') || 'dark';
  }

  static saveTheme(theme: 'dark' | 'light'): void {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }

  // --- Recálculo de Todos os Documentos (Audit Trail) ---
  static async recalculateAllDocuments(
    ruleset: TaxRuleSet,
    scenario: ScenarioPremises,
    company: CompanyProfile
  ): Promise<FiscalDocument[]> {
    const docs = this.getDocuments();
    const updatedDocs: FiscalDocument[] = [];

    for (const doc of docs) {
      // Re-parse a partir do XML original armazenado para preservar integridade
      if (doc.rawXml) {
        const reParsed = await parseNfeXml(doc.rawXml, doc.fileName, company, ruleset, scenario);
        if (reParsed.success && reParsed.doc) {
          // Mantém eventuais ajustes manuais de operação que o usuário tenha feito
          if (doc.tipoOperacaoOrigem === 'CORRECAO_MANUAL') {
            reParsed.doc.tipoOperacao = doc.tipoOperacao;
            reParsed.doc.tipoOperacaoOrigem = 'CORRECAO_MANUAL';
          }
          updatedDocs.push(reParsed.doc);
          continue;
        }
      }
      updatedDocs.push(doc);
    }

    this.saveDocuments(updatedDocs);
    return updatedDocs;
  }

  // --- Backup e Restore (LGPD e Governança) ---
  static exportFullBackupJson(): string {
    const backup = {
      exportDate: new Date().toISOString(),
      appVersion: '2026.09.28',
      company: this.getCompany(),
      ruleset: this.getRuleSet(),
      scenarios: this.getScenarios(),
      documents: this.getDocuments()
    };
    return JSON.stringify(backup, null, 2);
  }

  static importFullBackupJson(jsonString: string): { success: boolean; error?: string; count?: number } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.company || !Array.isArray(parsed.documents)) {
        return { success: false, error: 'Formato de arquivo de backup inválido.' };
      }
      this.saveCompany(parsed.company);
      if (parsed.ruleset) this.saveRuleSet(parsed.ruleset);
      if (parsed.scenarios) this.saveScenarios(parsed.scenarios);
      this.saveDocuments(parsed.documents);
      return { success: true, count: parsed.documents.length };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Erro ao decodificar JSON de backup.' };
    }
  }

  // --- Limpeza Total de Dados (Direito ao Esquecimento / LGPD) ---
  static clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.COMPANY);
    localStorage.removeItem(STORAGE_KEYS.DOCUMENTS);
    localStorage.removeItem(STORAGE_KEYS.RULESET);
    localStorage.removeItem(STORAGE_KEYS.SCENARIOS);
    localStorage.removeItem(STORAGE_KEYS.SELECTED_SCENARIO);
  }
}
