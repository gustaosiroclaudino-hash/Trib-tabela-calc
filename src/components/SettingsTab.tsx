import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  RotateCcw, 
  Download, 
  Upload, 
  Trash2, 
  Plus, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle,
  BookOpen,
  Info
} from 'lucide-react';
import { CompanyProfile, TaxRuleSet, SpecialRuleNCM } from '../types';
import { OFFICIAL_SOURCES_LINKS } from '../services/defaultRules';

interface SettingsTabProps {
  company: CompanyProfile;
  onSaveCompany: (updated: CompanyProfile) => void;
  ruleset: TaxRuleSet;
  onSaveRuleset: (updated: TaxRuleSet) => void;
  onResetRulesetToOfficial: () => void;
  onExportBackup: () => void;
  onImportBackup: (jsonContent: string) => void;
  onClearAllLocalData: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  company,
  onSaveCompany,
  ruleset,
  onSaveRuleset,
  onResetRulesetToOfficial,
  onExportBackup,
  onImportBackup,
  onClearAllLocalData
}) => {
  const [companyForm, setCompanyForm] = useState<CompanyProfile>({ ...company });
  const [isAddingNcmRule, setIsAddingNcmRule] = useState<boolean>(false);
  const [newNcmRule, setNewNcmRule] = useState<SpecialRuleNCM>({
    ncmCodigo: '',
    produtoNome: '',
    tipoRegra: 'isento',
    fatorReducao: 1.0,
    descricao: '',
    baseLegal: 'LC 214/2025',
    artigo: 'Art. 8º'
  });

  const [confirmClearModalOpen, setConfirmClearModalOpen] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  const handleSaveCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCompany(companyForm);
    setSaveSuccessMsg('Dados da empresa atualizados com sucesso!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const handleAddNcmRuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNcmRule.ncmCodigo || !newNcmRule.produtoNome) {
      alert('Preencha o código NCM e a descrição do produto.');
      return;
    }
    const cleanNcm = newNcmRule.ncmCodigo.replace(/\D/g, '');
    const updatedRules: TaxRuleSet = {
      ...ruleset,
      regrasEspeciaisNcm: [
        ...ruleset.regrasEspeciaisNcm.filter(r => r.ncmCodigo !== cleanNcm),
        { ...newNcmRule, ncmCodigo: cleanNcm }
      ],
      historicoModificacoes: [
        ...ruleset.historicoModificacoes,
        {
          data: new Date().toISOString(),
          usuario: 'Usuário Local',
          descricao: `Adicionada regra especial para NCM ${cleanNcm} (${newNcmRule.produtoNome}).`
        }
      ]
    };
    onSaveRuleset(updatedRules);
    setIsAddingNcmRule(false);
    setNewNcmRule({
      ncmCodigo: '',
      produtoNome: '',
      tipoRegra: 'isento',
      fatorReducao: 1.0,
      descricao: '',
      baseLegal: 'LC 214/2025',
      artigo: 'Art. 8º'
    });
  };

  const handleBackupFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onImportBackup(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
          Configuração, Governança & LGPD
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Gerenciamento de perfil empresarial, tabelas de alíquotas oficiais versionadas, trilha de auditoria e segurança de dados.
        </p>
      </div>

      {saveSuccessMsg && (
        <div style={{ background: 'var(--accent-emerald-bg)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--accent-emerald)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={16} />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Grid com Cadastro da Empresa e Backup/LGPD */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Bloco 1: Cadastro da Empresa Local */}
        <div className="chart-card">
          <div className="chart-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 size={18} color="var(--accent-blue)" />
              <span>Cadastro da Empresa Local</span>
            </div>
            <span className="badge badge-lido">Perfil Ativo</span>
          </div>

          <form onSubmit={handleSaveCompanySubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>
                  CNPJ da Empresa:
                </label>
                <input
                  type="text"
                  className="form-control"
                  style={{ width: '100%' }}
                  value={companyForm.cnpj}
                  onChange={(e) => setCompanyForm({ ...companyForm, cnpj: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>
                  Regime Tributário Atual:
                </label>
                <select
                  className="form-control"
                  style={{ width: '100%' }}
                  value={companyForm.regimeTributario}
                  onChange={(e) => setCompanyForm({ ...companyForm, regimeTributario: e.target.value as any })}
                >
                  <option value="LUCRO_REAL">Lucro Real (Não-cumulativo amplo)</option>
                  <option value="LUCRO_PRESUMIDO">Lucro Presumido</option>
                  <option value="SIMPLES_NACIONAL">Simples Nacional (Regime Especial)</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>
                Razão Social:
              </label>
              <input
                type="text"
                className="form-control"
                style={{ width: '100%' }}
                value={companyForm.razaoSocial}
                onChange={(e) => setCompanyForm({ ...companyForm, razaoSocial: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>
                  UF Domicílio:
                </label>
                <input
                  type="text"
                  maxLength={2}
                  className="form-control"
                  style={{ width: '100%', textTransform: 'uppercase' }}
                  value={companyForm.uf}
                  onChange={(e) => setCompanyForm({ ...companyForm, uf: e.target.value.toUpperCase() })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>
                  Município:
                </label>
                <input
                  type="text"
                  className="form-control"
                  style={{ width: '100%' }}
                  value={companyForm.municipio}
                  onChange={(e) => setCompanyForm({ ...companyForm, municipio: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary btn-sm">
                Salvar Cadastro Local
              </button>
            </div>
          </form>
        </div>

        {/* Bloco 2: Governança, LGPD e Segurança Local */}
        <div className="chart-card">
          <div className="chart-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} color="var(--accent-emerald)" />
              <span>Privacidade (LGPD) & Backup Local</span>
            </div>
            <span className="badge badge-lido">Segurança Local</span>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Em estrita conformidade com a <strong>LGPD e com os critérios deste Guia</strong>:
            <ul style={{ paddingLeft: '1.2rem', marginTop: '0.4rem', lineHeight: 1.6 }}>
              <li>Nenhum dado fiscal, chave ou CNPJ é transmitido a servidores ou modelos de IA.</li>
              <li>Todos os XMLs e cálculos residem exclusivamente no armazenamento do seu navegador.</li>
              <li>Você pode exportar cópia de segurança integral ou executar a exclusão total a qualquer momento.</li>
            </ul>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={onExportBackup}>
              <Download size={14} />
              <span>Exportar Backup Integral (JSON)</span>
            </button>

            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
              <Upload size={14} />
              <span>Restaurar Backup JSON</span>
              <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleBackupFileSelect} />
            </label>
          </div>

          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Direito ao Esquecimento: apaga todos os dados e reseta o app
            </span>
            <button className="btn btn-danger btn-sm" onClick={() => setConfirmClearModalOpen(true)}>
              <Trash2 size={13} />
              <span>Excluir Todos os Dados</span>
            </button>
          </div>
        </div>

      </div>

      {/* Bloco 3: Gerenciamento de Regras Fiscais Versionadas da LC 214/2025 */}
      <div className="chart-card" style={{ marginBottom: '2rem' }}>
        <div className="chart-title">
          <div>
            <span style={{ marginRight: '0.75rem' }}>Tabelas Normativas da Reforma Tributária (Versão: {ruleset.versao})</span>
            <span className="badge badge-calculado">Vigência: {ruleset.dataVigencia}</span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={onResetRulesetToOfficial} title="Restaura todos os parâmetros aos valores oficiais da LC 214/2025">
              <RotateCcw size={13} />
              <span>Restaurar Padrão Oficial</span>
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setIsAddingNcmRule(true)}>
              <Plus size={13} />
              <span>Adicionar Regra NCM</span>
            </button>
          </div>
        </div>

        {/* Formulário de Adicionar Regra NCM */}
        {isAddingNcmRule && (
          <form onSubmit={handleAddNcmRuleSubmit} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', animation: 'fadeIn 0.2s ease' }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.75rem', color: 'var(--text-highlight)' }}>
              Cadastrar Nova Regra Especial por NCM
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Código NCM (8 dígitos):</label>
                <input
                  type="text"
                  className="form-control font-mono"
                  placeholder="Ex: 10063021"
                  value={newNcmRule.ncmCodigo}
                  onChange={(e) => setNewNcmRule({ ...newNcmRule, ncmCodigo: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Nome do Produto / Categoria:</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ex: Arroz ou Medicamento"
                  value={newNcmRule.produtoNome}
                  onChange={(e) => setNewNcmRule({ ...newNcmRule, produtoNome: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Tipo de Benefício Legal:</label>
                <select
                  className="form-control"
                  value={newNcmRule.tipoRegra}
                  onChange={(e) => {
                    const tipo = e.target.value as any;
                    const red = tipo === 'isento' ? 1.0 : tipo === 'reducao_60' ? 0.6 : tipo === 'reducao_30' ? 0.3 : 0;
                    setNewNcmRule({ ...newNcmRule, tipoRegra: tipo, fatorReducao: red });
                  }}
                >
                  <option value="isento">Cesta Básica Nacional (Alíquota Zero - 100% redução)</option>
                  <option value="reducao_60">Redução de 60% (Medicamentos, Saúde, Educação)</option>
                  <option value="reducao_30">Redução de 30% (Profissões Regulamentadas)</option>
                  <option value="monofasico">Regime Monofásico (Combustíveis)</option>
                  <option value="imposto_seletivo">Imposto Seletivo (Bens Nocivos)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Artigo / Base Legal:</label>
                <input
                  type="text"
                  className="form-control"
                  value={newNcmRule.artigo}
                  onChange={(e) => setNewNcmRule({ ...newNcmRule, artigo: e.target.value })}
                />
              </div>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Descrição Explicativa da Regra:</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex: Alíquota zero de CBS e IBS conforme Art. 8º da LC 214/2025"
                value={newNcmRule.descricao}
                onChange={(e) => setNewNcmRule({ ...newNcmRule, descricao: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsAddingNcmRule(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Salvar Regra de NCM
              </button>
            </div>
          </form>
        )}

        {/* Tabela de Regras Especiais de NCM Cadastradas */}
        <div className="table-responsive" style={{ maxHeight: '350px', overflowY: 'auto' }}>
          <table className="audit-table">
            <thead>
              <tr>
                <th>NCM</th>
                <th>Produto / Setor</th>
                <th>Regra Legal</th>
                <th>Redução</th>
                <th>Base Normativa</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {ruleset.regrasEspeciaisNcm.map((regra, idx) => (
                <tr key={idx}>
                  <td className="font-mono"><strong>{regra.ncmCodigo}</strong></td>
                  <td style={{ fontWeight: 500 }}>{regra.produtoNome}</td>
                  <td>
                    {regra.tipoRegra === 'isento' && <span className="badge badge-lido">Alíquota Zero (100%)</span>}
                    {regra.tipoRegra === 'reducao_60' && <span className="badge badge-calculado">-60% Redução</span>}
                    {regra.tipoRegra === 'reducao_30' && <span className="badge badge-calculado">-30% Redução</span>}
                    {regra.tipoRegra === 'imposto_seletivo' && <span className="badge badge-saida">Imposto Seletivo</span>}
                    {regra.tipoRegra === 'monofasico' && <span className="badge badge-pendente">Monofásico</span>}
                  </td>
                  <td>{(regra.fatorReducao * 100).toFixed(0)}%</td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {regra.baseLegal}, {regra.artigo}
                  </td>
                  <td>
                    <button 
                      className="btn btn-danger btn-sm"
                      style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}
                      onClick={() => {
                        const updated = {
                          ...ruleset,
                          regrasEspeciaisNcm: ruleset.regrasEspeciaisNcm.filter((_, i) => i !== idx)
                        };
                        onSaveRuleset(updated);
                      }}
                      title="Excluir regra de NCM"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bloco 4: Fontes Oficiais para Atualização (Conforme Seção 12 do Guia) */}
      <div className="chart-card">
        <div className="chart-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={18} color="var(--accent-blue)" />
            <span>Fontes Oficiais Primárias para Atualização Regulatória (Seção 12 do Guia)</span>
          </div>
          <span className="badge badge-lido">Fontes Verificadas</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0.85rem' }}>
          {OFFICIAL_SOURCES_LINKS.map((fonte, idx) => (
            <div key={idx} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--text-highlight)' }}>{fonte.titulo}</strong>
                <a href={fonte.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.75rem' }}>
                  Acessar <ExternalLink size={12} />
                </a>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', marginBottom: '0.3rem' }}>
                {fonte.orgao}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {fonte.descricao}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Confirmação para Excluir Dados (LGPD) */}
      {confirmClearModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} />
                <span>Confirmar Exclusão Total de Dados Locais</span>
              </h3>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Tem certeza de que deseja apagar todos os documentos fiscais importados, cadastros de empresa e regras personalizadas? 
                Esta ação é irreversível e removerá completamente os dados do seu navegador.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmClearModalOpen(false)}>
                Cancelar
              </button>
              <button 
                className="btn btn-danger"
                onClick={() => {
                  onClearAllLocalData();
                  setConfirmClearModalOpen(false);
                }}
              >
                Sim, Excluir Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
