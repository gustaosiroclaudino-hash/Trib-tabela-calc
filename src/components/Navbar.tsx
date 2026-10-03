import React from 'react';
import { 
  Building2, 
  Moon, 
  Sun, 
  ShieldCheck, 
  HelpCircle,
  FileCheck2,
  Sliders
} from 'lucide-react';
import { CompanyProfile, ScenarioPremises } from '../types';

interface NavbarProps {
  company: CompanyProfile;
  onOpenCompanyModal: () => void;
  scenarios: ScenarioPremises[];
  selectedScenarioId: string;
  onSelectScenario: (id: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  totalDocsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  company,
  onOpenCompanyModal,
  scenarios,
  selectedScenarioId,
  onSelectScenario,
  theme,
  onToggleTheme,
  totalDocsCount
}) => {
  return (
    <header className="app-header">
      <div className="brand-wrapper">
        <div className="brand-icon">
          <FileCheck2 size={24} />
        </div>
        <div>
          <h1 className="brand-title">
            TribCalc Reforma
            <span className="badge badge-calculado" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>
              LC 214/2025
            </span>
          </h1>
          <div className="brand-subtitle">
            Simulador Didático & Auditoria da Reforma Tributária (CBS • IBS • IS)
          </div>
        </div>
      </div>

      <div className="header-center-info">
        <button 
          onClick={onOpenCompanyModal}
          className="header-company-btn"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)', fontWeight: 600 }}
          title="Clique para alterar dados da empresa e regime tributário"
        >
          <Building2 size={16} color="var(--accent-blue)" />
          <span>{company.razaoSocial || company.cnpj}</span>
          <span className="badge badge-lido" style={{ fontSize: '0.65rem' }}>
            {company.regimeTributario === 'LUCRO_REAL' ? 'Lucro Real' : 
             company.regimeTributario === 'LUCRO_PRESUMIDO' ? 'Lucro Presumido' : 'Simples Nac.'}
          </span>
        </button>

        <span style={{ color: 'var(--border-color)' }}>|</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sliders size={15} color="var(--accent-indigo)" />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Cenário:</span>
          <select 
            className="form-control"
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.78rem', height: '26px' }}
            value={selectedScenarioId}
            onChange={(e) => onSelectScenario(e.target.value)}
          >
            {scenarios.map(s => (
              <option key={s.id} value={s.id}>{s.nome.split('(')[0].trim()}</option>
            ))}
          </select>
        </div>

        <span style={{ color: 'var(--border-color)' }}>|</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-emerald)', fontSize: '0.75rem' }}>
          <ShieldCheck size={16} />
          <span>100% Local / Seguro</span>
        </div>
      </div>

      <div className="header-actions">
        <button 
          className="btn btn-secondary btn-sm"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          style={{ width: '34px', height: '34px', padding: 0 }}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
};
