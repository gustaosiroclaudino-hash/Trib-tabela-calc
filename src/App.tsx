import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  UploadCloud, 
  FileSpreadsheet, 
  ArrowLeftRight, 
  Calculator, 
  CheckCircle, 
  Settings,
  HelpCircle,
  Sparkles,
  Building2,
  BookOpen,
  X
} from 'lucide-react';
import { 
  FiscalDocument, 
  CompanyProfile, 
  TaxRuleSet, 
  ScenarioPremises, 
  FilterState 
} from './types';
import { LocalStorageManager } from './services/storage';
import { Navbar } from './components/Navbar';
import { FilterBar } from './components/FilterBar';
import { DashboardTab } from './components/DashboardTab';
import { ImportTab } from './components/ImportTab';
import { DocumentAnalysisTab } from './components/DocumentAnalysisTab';
import { EntryExitTab } from './components/EntryExitTab';
import { SimulatorTab } from './components/SimulatorTab';
import { DataAnalysisAndAuditTab } from './components/DataAnalysisAndAuditTab';
import { SettingsTab } from './components/SettingsTab';
import { MetodologiaTab } from './components/MetodologiaTab';

export type TabId = 'dashboard' | 'importar' | 'analise' | 'confronto' | 'simulador' | 'qualidade' | 'metodologia' | 'configuracao';

export const App: React.FC = () => {
  // Estados Globais
  const [theme, setTheme] = useState<'dark' | 'light'>(() => LocalStorageManager.getTheme());
  const [company, setCompany] = useState<CompanyProfile>(() => LocalStorageManager.getCompany());
  const [ruleset, setRuleset] = useState<TaxRuleSet>(() => LocalStorageManager.getRuleSet());
  const [scenarios, setScenarios] = useState<ScenarioPremises[]>(() => LocalStorageManager.getScenarios());
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(() => LocalStorageManager.getSelectedScenarioId());
  const [documents, setDocuments] = useState<FiscalDocument[]>(() => LocalStorageManager.getDocuments());

  // Aba ativa e documento selecionado
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  // Modal de edição rápida de empresa
  const [companyModalOpen, setCompanyModalOpen] = useState<boolean>(false);

  // Filtros Globais
  const [filter, setFilter] = useState<FilterState>({
    direcao: 'TODAS',
    statusSituacao: 'TODAS',
    statusRevisao: 'TODOS',
    termoBusca: '',
    uf: '',
    periodoInicio: '',
    periodoFim: ''
  });

  // Atualiza atributo no elemento <html> para aplicar o tema correto
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    LocalStorageManager.saveTheme(theme);
  }, [theme]);

  // Cenário selecionado ativo
  const activeScenario = useMemo(() => {
    return scenarios.find(s => s.id === selectedScenarioId) || scenarios[0];
  }, [scenarios, selectedScenarioId]);

  // Salvar Empresa
  const handleSaveCompany = async (newCompany: CompanyProfile) => {
    LocalStorageManager.saveCompany(newCompany);
    setCompany(newCompany);
    // Recalcula documentos com o novo CNPJ/regime
    const updated = await LocalStorageManager.recalculateAllDocuments(ruleset, activeScenario, newCompany);
    setDocuments(updated);
  };

  // Salvar Regras
  const handleSaveRuleset = async (newRuleset: TaxRuleSet) => {
    LocalStorageManager.saveRuleSet(newRuleset);
    setRuleset(newRuleset);
    const updated = await LocalStorageManager.recalculateAllDocuments(newRuleset, activeScenario, company);
    setDocuments(updated);
  };

  // Restaurar Regras Oficiais
  const handleResetRulesetToOfficial = async () => {
    const official = LocalStorageManager.resetRuleSetToOfficial();
    setRuleset(official);
    const updated = await LocalStorageManager.recalculateAllDocuments(official, activeScenario, company);
    setDocuments(updated);
    alert('Regras fiscais restauradas com sucesso para os parâmetros oficiais da LC 214/2025!');
  };

  // Salvar Cenário Editado
  const handleUpdateScenarioPremises = async (updatedScenario: ScenarioPremises) => {
    const newScenarios = scenarios.map(s => s.id === updatedScenario.id ? updatedScenario : s);
    LocalStorageManager.saveScenarios(newScenarios);
    setScenarios(newScenarios);
    const updated = await LocalStorageManager.recalculateAllDocuments(ruleset, updatedScenario, company);
    setDocuments(updated);
  };

  // Mudar Cenário Ativo
  const handleSelectScenario = async (id: string) => {
    LocalStorageManager.saveSelectedScenarioId(id);
    setSelectedScenarioId(id);
    const targetScen = scenarios.find(s => s.id === id) || activeScenario;
    const updated = await LocalStorageManager.recalculateAllDocuments(ruleset, targetScen, company);
    setDocuments(updated);
  };

  // Adicionar novos documentos (da tela de importação)
  const handleAddDocuments = (newDocs: FiscalDocument[]) => {
    const updated = [...documents, ...newDocs];
    LocalStorageManager.saveDocuments(updated);
    setDocuments(updated);
    if (newDocs.length > 0) {
      setSelectedDocId(newDocs[0].id);
      setActiveTab('analise');
    }
  };

  // Limpar todos os documentos
  const handleClearAllDocs = () => {
    if (confirm('Deseja realmente remover todas as notas fiscais importadas?')) {
      LocalStorageManager.saveDocuments([]);
      setDocuments([]);
      setSelectedDocId(null);
    }
  };

  // Excluir todos os dados locais (LGPD)
  const handleClearAllData = () => {
    LocalStorageManager.clearAllData();
    window.location.reload();
  };

  // Inverter direção da operação de uma nota (Manual)
  const handleToggleOperationDirection = async (docId: string) => {
    const updated = documents.map(d => {
      if (d.id === docId) {
        const novaDirecao = d.tipoOperacao === 'SAIDA' ? 'ENTRADA' : 'SAIDA';
        return {
          ...d,
          tipoOperacao: novaDirecao as any,
          tipoOperacaoOrigem: 'CORRECAO_MANUAL' as any
        };
      }
      return d;
    });
    LocalStorageManager.saveDocuments(updated);
    // Recalcula para atualizar elegibilidade de crédito
    const recomputed = await LocalStorageManager.recalculateAllDocuments(ruleset, activeScenario, company);
    setDocuments(recomputed);
  };

  // Confirmação de classificação de item por auditor
  const handleConfirmItemClassification = (docId: string, itemId: string, userName: string) => {
    const updated = documents.map(d => {
      if (d.id === docId) {
        return {
          ...d,
          itens: d.itens.map(it => {
            if (it.id === itemId) {
              return {
                ...it,
                classificacaoStatus: 'CONFIRMADA' as const,
                usuarioConfirmouClassificacao: `${userName} em ${new Date().toLocaleDateString('pt-BR')}`
              };
            }
            return it;
          })
        };
      }
      return d;
    });
    LocalStorageManager.saveDocuments(updated);
    setDocuments(updated);
  };

  // Exportar Backup JSON
  const handleExportBackup = () => {
    const jsonStr = LocalStorageManager.exportFullBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tribcalc_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  };

  // Restaurar Backup JSON
  const handleImportBackup = (jsonContent: string) => {
    const res = LocalStorageManager.importFullBackupJson(jsonContent);
    if (res.success) {
      alert(`Backup restaurado com sucesso! ${res.count} notas fiscais carregadas.`);
      window.location.reload();
    } else {
      alert(`Falha ao restaurar backup: ${res.error}`);
    }
  };

  // UFs disponíveis nos documentos
  const availableUfs = useMemo(() => {
    const set = new Set<string>();
    documents.forEach(d => {
      if (d.emitente.uf) set.add(d.emitente.uf);
      if (d.destinatario.uf) set.add(d.destinatario.uf);
    });
    return Array.from(set).sort();
  }, [documents]);

  // Filtragem Global de Documentos
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      if (filter.direcao && filter.direcao !== 'TODAS' && doc.tipoOperacao !== filter.direcao) {
        return false;
      }
      if (filter.statusSituacao && filter.statusSituacao !== 'TODAS') {
        if (filter.statusSituacao === 'CANCELADA' && !doc.isCancelada) return false;
        if (filter.statusSituacao === 'DEVOLUCAO' && !doc.isDevolucao) return false;
        if (filter.statusSituacao === 'AUTORIZADA' && (doc.isCancelada || doc.isDevolucao)) return false;
      }
      if (filter.uf) {
        if (doc.emitente.uf !== filter.uf && doc.destinatario.uf !== filter.uf) return false;
      }
      if (filter.periodoInicio) {
        const emi = doc.dataEmissao.split('T')[0];
        if (emi < filter.periodoInicio) return false;
      }
      if (filter.periodoFim) {
        const emi = doc.dataEmissao.split('T')[0];
        if (emi > filter.periodoFim) return false;
      }
      if (filter.termoBusca) {
        const term = filter.termoBusca.toLowerCase();
        const matches = doc.numero.includes(term) ||
          doc.chaveAcesso.includes(term) ||
          doc.emitente.razaoSocial.toLowerCase().includes(term) ||
          doc.destinatario.razaoSocial.toLowerCase().includes(term) ||
          doc.naturezaOperacao.toLowerCase().includes(term) ||
          doc.itens.some(it => it.xProd.toLowerCase().includes(term) || it.ncm.includes(term));
        if (!matches) return false;
      }
      return true;
    });
  }, [documents, filter]);

  const selectedDoc = useMemo(() => {
    return documents.find(d => d.id === selectedDocId) || (documents.length > 0 ? documents[0] : null);
  }, [documents, selectedDocId]);

  return (
    <div className="app-container">
      {/* Navbar Superior */}
      <Navbar
        company={company}
        onOpenCompanyModal={() => setCompanyModalOpen(true)}
        scenarios={scenarios}
        selectedScenarioId={selectedScenarioId}
        onSelectScenario={handleSelectScenario}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        totalDocsCount={documents.length}
      />

      {/* Barra de Navegação por Abas (Módulos Funcionais do Guia) */}
      <nav className="nav-tabs-bar">
        <button
          className={`nav-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <LayoutDashboard size={16} />
          <span>Dashboard Interativo</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'importar' ? 'active' : ''}`}
          onClick={() => setActiveTab('importar')}
        >
          <UploadCloud size={16} />
          <span>Importador XML</span>
          <span className="nav-tab-badge">{documents.length}</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'analise' ? 'active' : ''}`}
          onClick={() => setActiveTab('analise')}
        >
          <FileSpreadsheet size={16} />
          <span>Análise de Nota & Produto</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'confronto' ? 'active' : ''}`}
          onClick={() => setActiveTab('confronto')}
        >
          <ArrowLeftRight size={16} />
          <span>Confronto Entrada / Saída</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'simulador' ? 'active' : ''}`}
          onClick={() => setActiveTab('simulador')}
        >
          <Calculator size={16} />
          <span>Simulador Anual (2026–2033)</span>
          <span className="badge badge-calculado" style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem' }}>
            Transição
          </span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'qualidade' ? 'active' : ''}`}
          onClick={() => setActiveTab('qualidade')}
        >
          <CheckCircle size={16} />
          <span>Auditoria & Relatórios</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'metodologia' ? 'active' : ''}`}
          onClick={() => setActiveTab('metodologia')}
        >
          <BookOpen size={16} />
          <span>Guia & Metodologia</span>
          <span className="badge badge-lido" style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem' }}>
            Didático
          </span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'configuracao' ? 'active' : ''}`}
          onClick={() => setActiveTab('configuracao')}
        >
          <Settings size={16} />
          <span>Governança & LGPD</span>
        </button>
      </nav>

      {/* Conteúdo Principal */}
      <main className="main-content">
        {/* Barra de Filtros Globais (visível no Dashboard e na Análise de Dados) */}
        {(activeTab === 'dashboard' || activeTab === 'qualidade' || activeTab === 'confronto') && documents.length > 0 && (
          <FilterBar
            filter={filter}
            onChangeFilter={setFilter}
            availableUfs={availableUfs}
            totalFilteredDocs={filteredDocuments.length}
            totalAllDocs={documents.length}
          />
        )}

        {/* Renderização da Aba Ativa */}
        {activeTab === 'dashboard' && (
          <DashboardTab
            documents={filteredDocuments}
            allDocuments={documents}
            activeScenario={activeScenario}
            ruleset={ruleset}
            onNavigateToTab={(tab) => setActiveTab(tab as TabId)}
            onSelectDoc={(doc) => {
              setSelectedDocId(doc.id);
              setActiveTab('analise');
            }}
          />
        )}

        {activeTab === 'importar' && (
          <ImportTab
            documents={documents}
            onAddDocuments={handleAddDocuments}
            activeCompany={company}
            ruleset={ruleset}
            activeScenario={activeScenario}
            onClearAllDocs={handleClearAllDocs}
          />
        )}

        {activeTab === 'analise' && (
          <DocumentAnalysisTab
            documents={documents}
            selectedDoc={selectedDoc}
            onSelectDoc={(doc) => setSelectedDocId(doc.id)}
            activeScenario={activeScenario}
            ruleset={ruleset}
            onConfirmItemClassification={handleConfirmItemClassification}
            onToggleOperationDirection={handleToggleOperationDirection}
          />
        )}

        {activeTab === 'confronto' && (
          <EntryExitTab
            documents={filteredDocuments}
            activeScenario={activeScenario}
            onSelectDoc={(doc) => {
              setSelectedDocId(doc.id);
              setActiveTab('analise');
            }}
          />
        )}

        {activeTab === 'simulador' && (
          <SimulatorTab
            documents={documents}
            activeScenario={activeScenario}
            scenarios={scenarios}
            onSelectScenario={handleSelectScenario}
            onUpdateScenarioPremises={handleUpdateScenarioPremises}
            ruleset={ruleset}
          />
        )}

        {activeTab === 'qualidade' && (
          <DataAnalysisAndAuditTab
            documents={filteredDocuments}
            activeCompany={company}
            activeScenario={activeScenario}
            ruleset={ruleset}
            onSelectDoc={(doc) => {
              setSelectedDocId(doc.id);
              setActiveTab('analise');
            }}
          />
        )}

        {activeTab === 'metodologia' && (
          <MetodologiaTab
            onNavigateToTab={(tab) => setActiveTab(tab as TabId)}
          />
        )}

        {activeTab === 'configuracao' && (
          <SettingsTab
            company={company}
            onSaveCompany={handleSaveCompany}
            ruleset={ruleset}
            onSaveRuleset={handleSaveRuleset}
            onResetRulesetToOfficial={handleResetRulesetToOfficial}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
            onClearAllLocalData={handleClearAllData}
          />
        )}
      </main>

      {/* Modal Rápido de Alteração da Empresa */}
      {companyModalOpen && (
        <div className="modal-overlay" onClick={() => setCompanyModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-highlight)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building2 size={18} color="var(--accent-blue)" />
                <span>Perfil da Empresa Ativa</span>
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setCompanyModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                O CNPJ e o regime tributário da empresa ativa determinam automaticamente se uma nota é de <strong>Entrada</strong> ou de <strong>Saída</strong>, além da elegibilidade a créditos.
              </p>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Razão Social:</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ width: '100%' }}
                  value={company.razaoSocial}
                  onChange={(e) => setCompany({ ...company, razaoSocial: e.target.value })}
                />
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>CNPJ:</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ width: '100%' }}
                  value={company.cnpj}
                  onChange={(e) => setCompany({ ...company, cnpj: e.target.value })}
                />
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Regime Tributário:</label>
                <select
                  className="form-control"
                  style={{ width: '100%' }}
                  value={company.regimeTributario}
                  onChange={(e) => setCompany({ ...company, regimeTributario: e.target.value as any })}
                >
                  <option value="LUCRO_REAL">Lucro Real (Não-cumulatividade plena)</option>
                  <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
                  <option value="SIMPLES_NACIONAL">Simples Nacional</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setCompanyModalOpen(false)}>
                Fechar
              </button>
              <button className="btn btn-primary" onClick={() => {
                handleSaveCompany(company);
                setCompanyModalOpen(false);
              }}>
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
