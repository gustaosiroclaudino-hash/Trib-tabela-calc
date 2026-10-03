import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Receipt, 
  Coins, 
  Scale, 
  AlertTriangle, 
  FileCheck, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Info,
  Calendar,
  Layers,
  ChevronRight,
  PieChart as PieChartIcon
} from 'lucide-react';
import { FiscalDocument, ScenarioPremises, TaxRuleSet, FiscalItem } from '../types';
import { roundCurrency } from '../services/taxReformEngine';
import { DrillDownModal } from './DrillDownModal';

interface DashboardTabProps {
  documents: FiscalDocument[];
  allDocuments: FiscalDocument[];
  activeScenario: ScenarioPremises;
  ruleset: TaxRuleSet;
  onNavigateToTab: (tabId: string) => void;
  onSelectDoc: (doc: FiscalDocument) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  documents,
  allDocuments,
  activeScenario,
  ruleset,
  onNavigateToTab,
  onSelectDoc
}) => {
  // Estado para Drill-down Modal
  const [drillDownInfo, setDrillDownInfo] = useState<{
    isOpen: boolean;
    title: string;
    metricOrigin: 'LIDO' | 'CALCULADO' | 'ESTIMADO' | 'PENDENTE';
    legalSource?: string;
    docs: FiscalDocument[];
  }>({
    isOpen: false,
    title: '',
    metricOrigin: 'LIDO',
    docs: []
  });

  // Cálculos de Indicadores dos Documentos Atuais Filtrados
  // Separação de não somar notas canceladas nos totais financeiros
  const activeDocs = documents.filter(d => !d.isCancelada);
  const entradasDocs = activeDocs.filter(d => d.tipoOperacao === 'ENTRADA' && !d.isDevolucao);
  const saidasDocs = activeDocs.filter(d => d.tipoOperacao === 'SAIDA' && !d.isDevolucao);
  const devolucoesDocs = activeDocs.filter(d => d.isDevolucao);
  const canceladasDocs = documents.filter(d => d.isCancelada);

  const totalEntradas = entradasDocs.reduce((acc, d) => acc + d.totais.vNF, 0);
  const totalSaidas = saidasDocs.reduce((acc, d) => acc + d.totais.vNF, 0);
  
  // Tributos destacados lidos do XML nas saídas
  const totalIcmsDestacado = saidasDocs.reduce((acc, d) => acc + d.totais.vICMS, 0);
  const totalStDestacado = saidasDocs.reduce((acc, d) => acc + d.totais.vST, 0);
  const totalIpiDestacado = saidasDocs.reduce((acc, d) => acc + d.totais.vIPI, 0);
  const totalPisDestacado = saidasDocs.reduce((acc, d) => acc + d.totais.vPIS, 0);
  const totalCofinsDestacado = saidasDocs.reduce((acc, d) => acc + d.totais.vCOFINS, 0);
  const totalTributosDestacados = totalIcmsDestacado + totalStDestacado + totalIpiDestacado + totalPisDestacado + totalCofinsDestacado;

  // Créditos potenciais estimados nas entradas (Reforma Tributária ano 2027 e 2033)
  let totalCreditosPotenciais2027 = 0;
  let totalCreditosPotenciais2033 = 0;
  entradasDocs.forEach(d => {
    d.itens.forEach(item => {
      const sim27 = item.simulacoesPorAno[2027];
      if (sim27 && sim27.creditoElegivel) totalCreditosPotenciais2027 += sim27.creditoEstimadoValor;

      const sim33 = item.simulacoesPorAno[2033];
      if (sim33 && sim33.creditoElegivel) totalCreditosPotenciais2033 += sim33.creditoEstimadoValor;
    });
  });

  // Tributos estimados Reforma (Saídas em 2026 Teste e 2033 Pleno)
  let totalReforma2026 = 0;
  let totalReforma2033 = 0;
  let totalCBS2033 = 0;
  let totalIBS2033 = 0;
  let totalIS2033 = 0;

  saidasDocs.forEach(d => {
    d.itens.forEach(item => {
      const sim26 = item.simulacoesPorAno[2026];
      if (sim26) totalReforma2026 += (sim26.valorCBS + sim26.valorIBSTotal);

      const sim33 = item.simulacoesPorAno[2033];
      if (sim33) {
        totalReforma2033 += sim33.totalCargaEstimada;
        totalCBS2033 += sim33.valorCBS;
        totalIBS2033 += sim33.valorIBSTotal;
        totalIS2033 += sim33.valorIS;
      }
    });
  });

  // Alertas de qualidade e classificação
  const docsComPendencia = documents.filter(d => 
    d.itens.some(item => !item.ncm || item.alertasQualidade.length > 0 || item.classificacaoStatus === 'NAO_DETERMINADA') ||
    (d.metadadosImportacao.divergenciasTotais && d.metadadosImportacao.divergenciasTotais.length > 0)
  );

  // Top Produtos por Valor
  const productMap = new Map<string, { nome: string; ncm: string; valor: number; qtd: number }>();
  activeDocs.forEach(d => {
    d.itens.forEach(item => {
      const key = item.cProd || item.xProd;
      const current = productMap.get(key) || { nome: item.xProd, ncm: item.ncm, valor: 0, qtd: 0 };
      current.valor += item.vProd;
      current.qtd += item.qCom;
      productMap.set(key, current);
    });
  });
  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);

  // Top Parceiros
  const partnerMap = new Map<string, { nome: string; uf: string; valor: number; count: number }>();
  activeDocs.forEach(d => {
    const parceiro = d.tipoOperacao === 'SAIDA' ? d.destinatario : d.emitente;
    const nome = parceiro.razaoSocial || parceiro.cnpjCpf || 'Desconhecido';
    const current = partnerMap.get(nome) || { nome, uf: parceiro.uf, valor: 0, count: 0 };
    current.valor += d.totais.vNF;
    current.count += 1;
    partnerMap.set(nome, current);
  });
  const topPartners = Array.from(partnerMap.values())
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);

  // Função para abrir o modal de Drill-down
  const handleOpenDrillDown = (
    title: string,
    origin: 'LIDO' | 'CALCULADO' | 'ESTIMADO' | 'PENDENTE',
    docs: FiscalDocument[],
    legalSource?: string
  ) => {
    setDrillDownInfo({
      isOpen: true,
      title,
      metricOrigin: origin,
      docs,
      legalSource
    });
  };

  if (allDocuments.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
        <div style={{ width: '64px', height: '64px', margin: '0 auto 1.5rem', background: 'var(--accent-blue-glow)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)' }}>
          <Receipt size={32} />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-highlight)' }}>
          Nenhum Documento Fiscal Importado
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '550px', margin: '0 auto 1.75rem', fontSize: '0.9rem' }}>
          Para começar a análise da reforma tributária (CBS, IBS e IS), importe seus arquivos XML de NF-e (modelo 55) ou NFC-e (modelo 65). O processamento é realizado 100% no seu navegador.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => onNavigateToTab('importar')}>
            <ArrowUpRight size={16} />
            <span>Importar Arquivos XML</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Banner Didático de Segurança Fiscal (Conforme Seção 1 do Guia) */}
      <div className="fiscal-notice-banner">
        <Info size={18} color="var(--accent-blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--text-highlight)' }}>Princípio de Segurança Fiscal & Auditoria:</strong>{' '}
          Os valores abaixo separam estritamente o que foi <em>lido do XML original</em> (tributos legados como ICMS, IPI, PIS, COFINS) das 
          <em> estimativas simuladas da Reforma Tributária (CBS, IBS e IS conforme LC 214/2025)</em>. Uma projeção nunca substitui validação de profissional habilitado.
        </div>
      </div>

      {/* Grid de KPIs Interativos com Drill-Down */}
      <div className="kpi-grid">
        {/* Entradas */}
        <div 
          className="kpi-card emerald"
          onClick={() => handleOpenDrillDown('Documentos de Entrada (Compras)', 'LIDO', entradasDocs, 'XML NF-e Campo <vNF> com tpNF=0')}
          title="Clique para ver a lista de notas que compõem este valor"
        >
          <div className="kpi-header">
            <span className="kpi-title">Total Entradas (Compras)</span>
            <span className="badge badge-lido">Lido</span>
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-emerald)' }}>
            R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="kpi-footer">
            <span>{entradasDocs.length} documentos</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--accent-emerald)' }}>
              Ver notas <ChevronRight size={14} />
            </span>
          </div>
        </div>

        {/* Saídas */}
        <div 
          className="kpi-card rose"
          onClick={() => handleOpenDrillDown('Documentos de Saída (Vendas/Faturamento)', 'LIDO', saidasDocs, 'XML NF-e Campo <vNF> com tpNF=1')}
          title="Clique para ver a lista de notas que compõem este valor"
        >
          <div className="kpi-header">
            <span className="kpi-title">Total Saídas (Vendas)</span>
            <span className="badge badge-lido">Lido</span>
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-rose)' }}>
            R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="kpi-footer">
            <span>{saidasDocs.length} documentos</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--accent-rose)' }}>
              Ver notas <ChevronRight size={14} />
            </span>
          </div>
        </div>

        {/* Tributos Destacados Legados */}
        <div 
          className="kpi-card amber"
          onClick={() => handleOpenDrillDown('Tributos Destacados nos XMLs (ICMS, IPI, PIS, COFINS, ST)', 'LIDO', saidasDocs, 'Grupos <ICMSTot>, <IPI>, <PIS>, <COFINS>')}
          title="Clique para auditar composição dos tributos legados"
        >
          <div className="kpi-header">
            <span className="kpi-title">Tributos Destacados XML</span>
            <span className="badge badge-lido">Lido</span>
          </div>
          <div className="kpi-value">
            R$ {totalTributosDestacados.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="kpi-footer">
            <span>Carga Atual ~{totalSaidas > 0 ? ((totalTributosDestacados / totalSaidas) * 100).toFixed(1) : 0}%</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              Detalhes <ChevronRight size={14} />
            </span>
          </div>
        </div>

        {/* Créditos Potenciais Estimados */}
        <div 
          className="kpi-card emerald"
          onClick={() => handleOpenDrillDown('Créditos Potenciais da Reforma (Compras)', 'ESTIMADO', entradasDocs, 'LC 214/2025, Art. 28 a 34')}
          title="Clique para ver regras de apropriação de crédito"
        >
          <div className="kpi-header">
            <span className="kpi-title">Créditos Estimados (2027)</span>
            <span className="badge badge-estimado">Simulado</span>
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-emerald)' }}>
            R$ {totalCreditosPotenciais2027.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="kpi-footer">
            <span>Base não-cumulativa</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--accent-emerald)' }}>
              Ver cálculo <ChevronRight size={14} />
            </span>
          </div>
        </div>

        {/* Simulação Reforma 2033 */}
        <div 
          className="kpi-card indigo"
          onClick={() => onNavigateToTab('simulador')}
          title="Clique para abrir o simulador de transição anual completa"
        >
          <div className="kpi-header">
            <span className="kpi-title">CBS + IBS Pleno (2033)</span>
            <span className="badge badge-estimado">Cenário {activeScenario.nome.split(' ')[0]}</span>
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-indigo)' }}>
            R$ {totalReforma2033.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="kpi-footer">
            <span>Ref. {((activeScenario.aliquotaReferenciaCBS + activeScenario.aliquotaReferenciaIBSEstadual + activeScenario.aliquotaReferenciaIBSMunicipal) * 100).toFixed(1)}%</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--accent-indigo)' }}>
              Simulador <ChevronRight size={14} />
            </span>
          </div>
        </div>

        {/* Alertas de Qualidade / Pendências */}
        <div 
          className="kpi-card amber"
          onClick={() => handleOpenDrillDown('Documentos com Pendências ou Ressalvas Fiscais', 'PENDENTE', docsComPendencia)}
          title="Clique para ver notas que exigem revisão humana"
        >
          <div className="kpi-header">
            <span className="kpi-title">Pendências de Revisão</span>
            <span className="badge badge-pendente">Atenção</span>
          </div>
          <div className="kpi-value" style={{ color: docsComPendencia.length > 0 ? 'var(--accent-amber)' : 'var(--text-muted)' }}>
            {docsComPendencia.length}
          </div>
          <div className="kpi-footer">
            <span>{docsComPendencia.length > 0 ? 'NCM ou divergência detectada' : 'Tudo regular'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              Revisar <ChevronRight size={14} />
            </span>
          </div>
        </div>
      </div>

      {/* Visualizações e Gráficos Interativos (SVG Pura / Sem dependências externas pesadas) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        
        {/* Gráfico 1: Composição Tributária (Legado vs Reforma Integral 2033) */}
        <div className="chart-card">
          <div className="chart-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PieChartIcon size={18} color="var(--accent-blue)" />
              <span>Composição da Carga: Atual (Legado) vs Reforma (2033)</span>
            </div>
            <span className="badge badge-calculado">Comparativo</span>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', justifyContent: 'space-around', padding: '1rem 0' }}>
            {/* Donut Legado */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ position: 'relative', width: '130px', height: '130px', margin: '0 auto 0.75rem' }}>
                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                  {/* ICMS (azul) */}
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#3b82f6" strokeWidth="3.5"
                    strokeDasharray={`${totalTributosDestacados > 0 ? (totalIcmsDestacado / totalTributosDestacados) * 100 : 0} 100`} />
                  {/* PIS/COFINS (amber) */}
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="3.5"
                    strokeDasharray={`${totalTributosDestacados > 0 ? ((totalPisDestacado + totalCofinsDestacado) / totalTributosDestacados) * 100 : 0} 100`}
                    strokeDashoffset={`-${totalTributosDestacados > 0 ? (totalIcmsDestacado / totalTributosDestacados) * 100 : 0}`} />
                  {/* ST (rose) */}
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f43f5e" strokeWidth="3.5"
                    strokeDasharray={`${totalTributosDestacados > 0 ? (totalStDestacado / totalTributosDestacados) * 100 : 0} 100`}
                    strokeDashoffset={`-${totalTributosDestacados > 0 ? ((totalIcmsDestacado + totalPisDestacado + totalCofinsDestacado) / totalTributosDestacados) * 100 : 0}`} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Atual</span>
                  <strong style={{ fontSize: '0.85rem' }}>R$ {(totalTributosDestacados / 1000).toFixed(1)}k</strong>
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <div><span style={{ color: '#3b82f6' }}>●</span> ICMS Próprio: R$ {totalIcmsDestacado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                <div><span style={{ color: '#f59e0b' }}>●</span> PIS/COFINS: R$ {(totalPisDestacado + totalCofinsDestacado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                {totalStDestacado > 0 && <div><span style={{ color: '#f43f5e' }}>●</span> ICMS-ST: R$ {totalStDestacado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>}
              </div>
            </div>

            {/* Donut Reforma 2033 */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ position: 'relative', width: '130px', height: '130px', margin: '0 auto 0.75rem' }}>
                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                  {/* IBS (indigo) */}
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#6366f1" strokeWidth="3.5"
                    strokeDasharray={`${totalReforma2033 > 0 ? (totalIBS2033 / totalReforma2033) * 100 : 0} 100`} />
                  {/* CBS (cyan) */}
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#06b6d4" strokeWidth="3.5"
                    strokeDasharray={`${totalReforma2033 > 0 ? (totalCBS2033 / totalReforma2033) * 100 : 0} 100`}
                    strokeDashoffset={`-${totalReforma2033 > 0 ? (totalIBS2033 / totalReforma2033) * 100 : 0}`} />
                  {/* IS (purple) */}
                  {totalIS2033 > 0 && (
                    <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#a855f7" strokeWidth="3.5"
                      strokeDasharray={`${(totalIS2033 / totalReforma2033) * 100} 100`}
                      strokeDashoffset={`-${((totalIBS2033 + totalCBS2033) / totalReforma2033) * 100}`} />
                  )}
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Reforma 2033</span>
                  <strong style={{ fontSize: '0.85rem' }}>R$ {(totalReforma2033 / 1000).toFixed(1)}k</strong>
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <div><span style={{ color: '#6366f1' }}>●</span> IBS Compartilhado: R$ {totalIBS2033.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                <div><span style={{ color: '#06b6d4' }}>●</span> CBS Federal: R$ {totalCBS2033.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                {totalIS2033 > 0 && <div><span style={{ color: '#a855f7' }}>●</span> Imposto Seletivo: R$ {totalIS2033.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico 2: Evolução da Carga ao Longo da Transição (2026 a 2033) */}
        <div className="chart-card">
          <div className="chart-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <TrendingUp size={18} color="var(--accent-emerald)" />
              <span>Transição da Carga Tributária Anual Estimada (R$)</span>
              <span className="badge badge-calculado" style={{ fontSize: '0.7rem' }}>
                {activeScenario.estrategiaPreco === 'PRECO_DESONERADO' ? 'Base Desonerada (MGK)' : 'Base Bruta (LC 214)'}
              </span>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigateToTab('simulador')}>
              Ver Matriz Completa
            </button>
          </div>

          <div style={{ padding: '0.5rem 0' }}>
            {(() => {
              const anosTransicao = [2026, 2027, 2029, 2031, 2033];
              const dadosTransicao = anosTransicao.map(ano => {
                let cargaAno = 0;
                saidasDocs.forEach(d => {
                  d.itens.forEach(item => {
                    const sim = item.simulacoesPorAno[ano];
                    if (sim) cargaAno += sim.totalCargaEstimada;
                  });
                });
                return { ano, cargaAno };
              });

              const maxRef = Math.max(totalTributosDestacados, ...dadosTransicao.map(d => d.cargaAno), 1);

              return dadosTransicao.map(({ ano, cargaAno }) => {
                const pctWidth = Math.min(100, Math.max(10, Math.round((cargaAno / maxRef) * 100)));

                return (
                  <div key={ano} style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 600 }}>
                        {ano} {ano === 2026 ? (activeScenario.neutralizarAnoTeste2026 !== false ? '(Ano-Teste Compensável)' : '(Ano-Teste CBS 0,9%/IBS 0,1%)') : ano === 2033 ? '(Modelo Novo Pleno)' : `(Transição)`}
                      </span>
                      <strong style={{ color: 'var(--text-highlight)' }}>
                        R$ {cargaAno.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                        height: '100%', 
                        width: `${pctWidth}%`, 
                        background: ano === 2033 ? 'linear-gradient(90deg, #3b82f6, #6366f1)' : 'var(--accent-blue)',
                        borderRadius: '4px',
                        transition: 'width 0.4s ease'
                      }} 
                    />
                  </div>
                </div>
              );
            });
          })()}
          </div>
        </div>

      </div>

      {/* Tabelas de Top Produtos e Top Parceiros */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.25rem' }}>
        
        {/* Top Produtos */}
        <div className="chart-card">
          <div className="chart-title">
            <span>Top 5 Produtos por Faturamento</span>
            <span className="badge badge-lido">Itens XML</span>
          </div>
          <div className="table-responsive">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>NCM</th>
                  <th>Qtd</th>
                  <th style={{ textAlign: 'right' }}>Valor Total</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={i}>
                    <td style={{ maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={p.nome}>
                      {p.nome}
                    </td>
                    <td className="font-mono" style={{ fontSize: '0.75rem' }}>{p.ncm || '(sem ncm)'}</td>
                    <td>{p.qtd}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      R$ {p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Parceiros */}
        <div className="chart-card">
          <div className="chart-title">
            <span>Top 5 Parceiros Comerciais</span>
            <span className="badge badge-lido">Emit / Dest</span>
          </div>
          <div className="table-responsive">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Razão Social / Nome</th>
                  <th>UF</th>
                  <th>Notas</th>
                  <th style={{ textAlign: 'right' }}>Volume Total</th>
                </tr>
              </thead>
              <tbody>
                {topPartners.map((p, i) => (
                  <tr key={i}>
                    <td style={{ maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={p.nome}>
                      {p.nome}
                    </td>
                    <td><span className="badge badge-calculado">{p.uf || 'BR'}</span></td>
                    <td>{p.count}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      R$ {p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Modal de Drill Down Rastreável */}
      <DrillDownModal
        isOpen={drillDownInfo.isOpen}
        onClose={() => setDrillDownInfo({ ...drillDownInfo, isOpen: false })}
        title={drillDownInfo.title}
        metricOrigin={drillDownInfo.metricOrigin}
        legalSource={drillDownInfo.legalSource}
        documents={drillDownInfo.docs}
        onSelectDoc={onSelectDoc}
      />
    </div>
  );
};
