import React, { useState } from 'react';
import { 
  Calendar, 
  HelpCircle, 
  Info, 
  Sliders, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Calculator
} from 'lucide-react';
import { FiscalDocument, ScenarioPremises, TaxRuleSet } from '../types';
import { TRANSITION_YEARS, YEAR_DEFINITIONS, roundCurrency } from '../services/taxReformEngine';

interface SimulatorTabProps {
  documents: FiscalDocument[];
  activeScenario: ScenarioPremises;
  scenarios: ScenarioPremises[];
  onSelectScenario: (id: string) => void;
  onUpdateScenarioPremises: (scenario: ScenarioPremises) => void;
  ruleset: TaxRuleSet;
}

export const SimulatorTab: React.FC<SimulatorTabProps> = ({
  documents,
  activeScenario,
  scenarios,
  onSelectScenario,
  onUpdateScenarioPremises,
  ruleset
}) => {
  const [selectedCellInfo, setSelectedCellInfo] = useState<{
    ano: number;
    tributoNome: string;
    valor: number;
    aliquotaRegra: string;
    fonteLegal: string;
    vigencia: string;
    grauCerteza: string;
    explicacao: string;
  } | null>(null);

  const [baseYear, setBaseYear] = useState<number>(2026);
  const [isEditingScenario, setIsEditingScenario] = useState<boolean>(false);
  const [editedScenario, setEditedScenario] = useState<ScenarioPremises>({ ...activeScenario });

  // Apenas saídas ativas para cálculo da carga sobre vendas
  const saidasDocs = documents.filter(d => !d.isCancelada && d.tipoOperacao === 'SAIDA' && !d.isDevolucao);
  const entradasDocs = documents.filter(d => !d.isCancelada && d.tipoOperacao === 'ENTRADA' && !d.isDevolucao);

  const totalFaturamento = saidasDocs.reduce((acc, d) => acc + d.totais.vNF, 0);

  // Tributos Legados Atuais (Ano Base)
  const legacyIcms = saidasDocs.reduce((acc, d) => acc + d.totais.vICMS, 0);
  const legacyIss = saidasDocs.reduce((acc, d) => acc + (d.totais.vISS || 0), 0);
  const legacyIpi = saidasDocs.reduce((acc, d) => acc + d.totais.vIPI, 0);
  const legacyPis = saidasDocs.reduce((acc, d) => acc + d.totais.vPIS, 0);
  const legacyCofins = saidasDocs.reduce((acc, d) => acc + d.totais.vCOFINS, 0);
  const totalLegadoAtual = legacyIcms + legacyIss + legacyIpi + legacyPis + legacyCofins;

  // Matriz de Cálculos por Ano de Transição (2026 a 2033)
  const matrixData = React.useMemo(() => {
    return TRANSITION_YEARS.map(ano => {
      const yearDef = YEAR_DEFINITIONS[ano];
      
      let sumCBS = 0;
      let sumIBSEstadual = 0;
      let sumIBSMunicipal = 0;
      let sumIS = 0;
      let sumCreditos = 0;

      saidasDocs.forEach(d => {
        d.itens.forEach(item => {
          const sim = item.simulacoesPorAno[ano];
          if (sim) {
            sumCBS += sim.valorCBS;
            sumIBSEstadual += sim.valorIBSEstadual;
            sumIBSMunicipal += sim.valorIBSMunicipal;
            sumIS += sim.valorIS;
          }
        });
      });

      entradasDocs.forEach(d => {
        d.itens.forEach(item => {
          const sim = item.simulacoesPorAno[ano];
          if (sim && sim.creditoElegivel) {
            sumCreditos += sim.creditoEstimadoValor;
          }
        });
      });

      // Tributos Residuais do Legado
      const residualIcmsIss = roundCurrency((legacyIcms + legacyIss) * yearDef.fatorResidualIcmsIss);
      const residualPisCofins = roundCurrency((legacyPis + legacyCofins) * yearDef.fatorResidualPisCofins);
      const residualIpi = roundCurrency(legacyIpi * yearDef.fatorResidualIpi);

      const totalIBSTotal = roundCurrency(sumIBSEstadual + sumIBSMunicipal);
      const totalCargaBruta = roundCurrency(
        sumCBS + totalIBSTotal + sumIS + residualIcmsIss + residualPisCofins + residualIpi
      );
      const totalCargaLiquida = roundCurrency(Math.max(0, totalCargaBruta - sumCreditos));

      return {
        ano,
        descricaoFase: yearDef.descricaoFase,
        baseLegal: yearDef.baseLegal,
        grauCerteza: yearDef.grauCerteza,
        residualIcmsIss,
        residualPisCofins,
        residualIpi,
        cbs: sumCBS,
        ibsEstadual: sumIBSEstadual,
        ibsMunicipal: sumIBSMunicipal,
        ibsTotal: totalIBSTotal,
        is: sumIS,
        creditos: sumCreditos,
        cargaBruta: totalCargaBruta,
        cargaLiquida: totalCargaLiquida,
        aliquotaEfetivaPct: totalFaturamento > 0 ? (totalCargaLiquida / totalFaturamento) * 100 : 0
      };
    });
  }, [saidasDocs, entradasDocs, legacyIcms, legacyIss, legacyIpi, legacyPis, legacyCofins, totalFaturamento]);

  // Comparação contra Ano-Base Escolhido
  const baseYearData = matrixData.find(m => m.ano === baseYear) || matrixData[0];
  const finalYearData = matrixData[matrixData.length - 1]; // 2033
  const diferencaReaisVsBase = finalYearData.cargaLiquida - baseYearData.cargaLiquida;
  const diferencaPctVsBase = baseYearData.cargaLiquida > 0 
    ? ((diferencaReaisVsBase / baseYearData.cargaLiquida) * 100) 
    : 0;

  const handleSaveEditedPremises = () => {
    onUpdateScenarioPremises(editedScenario);
    setIsEditingScenario(false);
  };

  return (
    <div>
      {/* Alerta de Simulação Versionada do Guia (Seção 4.5 e 1) */}
      <div className="fiscal-notice-banner">
        <Info size={18} color="var(--accent-blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--text-highlight)' }}>Simulação de Transição 2026–2033 (EC 132/2023 & LC 214/2025):</strong>{' '}
          Projeções rotuladas como <strong>simulação com premissas versionadas</strong>. Alíquotas e créditos são calculados item a item com as regras de cada exercício fiscal. 
          Parâmetros sem base legal confirmada ficam como <em>"não calculável"</em> sem presunção arbitrária.
        </div>
      </div>

      {/* Barra de Controles de Cenário e Premissas */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cenário Ativo:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <select
                className="form-control"
                style={{ fontWeight: 600, fontSize: '0.88rem' }}
                value={activeScenario.id}
                onChange={(e) => onSelectScenario(e.target.value)}
              >
                {scenarios.map(s => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </select>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setEditedScenario({ ...activeScenario });
                  setIsEditingScenario(!isEditingScenario);
                }}
              >
                <Sliders size={14} />
                <span>{isEditingScenario ? 'Fechar Editor' : 'Editar Premissas'}</span>
              </button>
            </div>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Premissas: CBS Federal <strong>{(activeScenario.aliquotaReferenciaCBS * 100).toFixed(2)}%</strong> • IBS Estadual <strong>{(activeScenario.aliquotaReferenciaIBSEstadual * 100).toFixed(2)}%</strong> • IBS Municipal <strong>{(activeScenario.aliquotaReferenciaIBSMunicipal * 100).toFixed(2)}%</strong> (Total {((activeScenario.aliquotaReferenciaCBS + activeScenario.aliquotaReferenciaIBSEstadual + activeScenario.aliquotaReferenciaIBSMunicipal) * 100).toFixed(2)}%)
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Ano-Base para Comparativo:</span>
          <select
            className="form-control"
            style={{ width: '90px', fontSize: '0.8rem' }}
            value={baseYear}
            onChange={(e) => setBaseYear(Number(e.target.value))}
          >
            {[2026, 2027, 2028, 2029].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Editor de Premissas do Cenário (Se aberto) */}
      {isEditingScenario && (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--accent-blue)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem', animation: 'fadeIn 0.2s ease' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-highlight)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sliders size={16} color="var(--accent-blue)" />
            <span>Editar Premissas do Cenário: {editedScenario.nome}</span>
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                Alíquota Referência CBS (%):
              </label>
              <input
                type="number"
                step="0.1"
                className="form-control"
                value={(editedScenario.aliquotaReferenciaCBS * 100).toFixed(2)}
                onChange={(e) => setEditedScenario({ ...editedScenario, aliquotaReferenciaCBS: parseFloat(e.target.value) / 100 })}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                Alíquota Referência IBS Estadual (%):
              </label>
              <input
                type="number"
                step="0.1"
                className="form-control"
                value={(editedScenario.aliquotaReferenciaIBSEstadual * 100).toFixed(2)}
                onChange={(e) => setEditedScenario({ ...editedScenario, aliquotaReferenciaIBSEstadual: parseFloat(e.target.value) / 100 })}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                Alíquota Referência IBS Municipal (%):
              </label>
              <input
                type="number"
                step="0.1"
                className="form-control"
                value={(editedScenario.aliquotaReferenciaIBSMunicipal * 100).toFixed(2)}
                onChange={(e) => setEditedScenario({ ...editedScenario, aliquotaReferenciaIBSMunicipal: parseFloat(e.target.value) / 100 })}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                Fator Aproveitamento Crédito (1.0 = 100%):
              </label>
              <input
                type="number"
                step="0.05"
                max="1.0"
                min="0.5"
                className="form-control"
                value={editedScenario.aproveitamentoCreditoFator}
                onChange={(e) => setEditedScenario({ ...editedScenario, aproveitamentoCreditoFator: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setIsEditingScenario(false)}>
              Cancelar
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleSaveEditedPremises}>
              Aplicar e Recalcular Matriz
            </button>
          </div>
        </div>
      )}

      {/* Quadro de Fatores de Variação contra Ano-Base */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Variação Projetada (2033 vs Ano-Base {baseYear}):</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.2rem' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: diferencaReaisVsBase <= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
              {diferencaReaisVsBase > 0 ? '+' : ''} R$ {diferencaReaisVsBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className={`badge ${diferencaReaisVsBase <= 0 ? 'badge-lido' : 'badge-saida'}`}>
              {diferencaPctVsBase > 0 ? '+' : ''}{diferencaPctVsBase.toFixed(1)}%
            </span>
          </div>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '650px' }}>
          <strong>Principais Fatores de Impacto:</strong> Extinção completa de PIS/COFINS e IPI; substituição por CBS e IBS não-cumulativos com crédito pleno em insumos; regime de transição do ICMS/ISS progressivo até 2032.
        </div>
      </div>

      {/* Matriz Anos em Colunas e Tributos em Linhas (Seção 4.5 do Guia) */}
      <div className="table-responsive" style={{ marginBottom: '1.5rem' }}>
        <table className="audit-table">
          <thead>
            <tr>
              <th style={{ minWidth: '220px' }}>Tributos & Indicadores</th>
              <th style={{ minWidth: '100px', background: 'rgba(59, 130, 246, 0.1)' }}>Atual (Legado)</th>
              {matrixData.map(m => (
                <th key={m.ano} style={{ minWidth: '105px', textAlign: 'right' }}>
                  {m.ano}
                  <div style={{ fontSize: '0.65rem', fontWeight: 400, textTransform: 'none', color: 'var(--text-muted)' }}>
                    {m.ano === 2026 ? 'Teste 0,9%' : m.ano === 2033 ? 'Definitivo' : 'Transição'}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Linha 1: CBS Federal */}
            <tr>
              <td>
                <strong>CBS Federal</strong>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Receita Federal • LC 214/2025</div>
              </td>
              <td style={{ color: 'var(--text-muted)' }}>-</td>
              {matrixData.map(m => (
                <td 
                  key={m.ano} 
                  style={{ textAlign: 'right', cursor: 'pointer' }}
                  onClick={() => setSelectedCellInfo({
                    ano: m.ano,
                    tributoNome: 'CBS Federal',
                    valor: m.cbs,
                    aliquotaRegra: m.ano === 2026 ? '0,90% (Fase Teste)' : `${(activeScenario.aliquotaReferenciaCBS * 100).toFixed(2)}% (Referência)`,
                    fonteLegal: 'LC 214/2025, Arts. 4º e 56 / Decreto 12.955/2026',
                    vigencia: `Exercício ${m.ano}`,
                    grauCerteza: m.grauCerteza,
                    explicacao: m.ano === 2026 ? 'Alíquota de teste compensável contra PIS/Cofins ou recolhimento residual.' : 'CBS em regime definitivo com cobrança plena.'
                  })}
                  title="Clique para auditar premissa legal desta célula"
                >
                  <strong style={{ color: 'var(--accent-blue)' }}>
                    R$ {m.cbs.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </strong>
                </td>
              ))}
            </tr>

            {/* Linha 2: IBS Estadual */}
            <tr>
              <td>
                <strong>IBS Estadual</strong>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CGIBS • Estados</div>
              </td>
              <td style={{ color: 'var(--text-muted)' }}>-</td>
              {matrixData.map(m => (
                <td 
                  key={m.ano} 
                  style={{ textAlign: 'right', cursor: 'pointer' }}
                  onClick={() => setSelectedCellInfo({
                    ano: m.ano,
                    tributoNome: 'IBS Estadual',
                    valor: m.ibsEstadual,
                    aliquotaRegra: `Fração Transição: ${(YEAR_DEFINITIONS[m.ano].getIbsFraction() * 100).toFixed(1)}% da ref.`,
                    fonteLegal: 'EC 132/2023, Art. 128 e LC 227/2026',
                    vigencia: `Exercício ${m.ano}`,
                    grauCerteza: m.grauCerteza,
                    explicacao: 'Parcela estadual do Imposto sobre Bens e Serviços gerido pelo Comitê Gestor.'
                  })}
                  title="Clique para auditar premissa legal desta célula"
                >
                  R$ {m.ibsEstadual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
              ))}
            </tr>

            {/* Linha 3: IBS Municipal */}
            <tr>
              <td>
                <strong>IBS Municipal</strong>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CGIBS • Municípios</div>
              </td>
              <td style={{ color: 'var(--text-muted)' }}>-</td>
              {matrixData.map(m => (
                <td 
                  key={m.ano} 
                  style={{ textAlign: 'right', cursor: 'pointer' }}
                  onClick={() => setSelectedCellInfo({
                    ano: m.ano,
                    tributoNome: 'IBS Municipal',
                    valor: m.ibsMunicipal,
                    aliquotaRegra: `Fração Transição: ${(YEAR_DEFINITIONS[m.ano].getIbsFraction() * 100).toFixed(1)}%`,
                    fonteLegal: 'EC 132/2023, Art. 128 e LC 227/2026',
                    vigencia: `Exercício ${m.ano}`,
                    grauCerteza: m.grauCerteza,
                    explicacao: 'Parcela municipal do IBS com destinação ao município de consumo (destino).'
                  })}
                  title="Clique para auditar premissa legal desta célula"
                >
                  R$ {m.ibsMunicipal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
              ))}
            </tr>

            {/* Linha 4: Imposto Seletivo (IS) */}
            <tr>
              <td>
                <strong>Imposto Seletivo (IS)</strong>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Art. 18 LC 214/2025</div>
              </td>
              <td style={{ color: 'var(--text-muted)' }}>-</td>
              {matrixData.map(m => (
                <td key={m.ano} style={{ textAlign: 'right' }}>
                  {m.is > 0 ? (
                    <strong style={{ color: 'var(--accent-rose)' }}>
                      R$ {m.is.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>R$ 0,00</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Linha 5: Tributos Legados Residuais */}
            <tr style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
              <td>
                <strong>ICMS / ISS Residual</strong>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Redução gradual 2029-2032</div>
              </td>
              <td style={{ textAlign: 'right' }}>
                R$ {(legacyIcms + legacyIss).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              {matrixData.map(m => (
                <td key={m.ano} style={{ textAlign: 'right' }}>
                  R$ {m.residualIcmsIss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
              ))}
            </tr>

            <tr style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
              <td>
                <strong>PIS / COFINS / IPI Residual</strong>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Extinção prevista em 2027</div>
              </td>
              <td style={{ textAlign: 'right' }}>
                R$ {(legacyPis + legacyCofins + legacyIpi).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              {matrixData.map(m => (
                <td key={m.ano} style={{ textAlign: 'right' }}>
                  R$ {(m.residualPisCofins + m.residualIpi).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
              ))}
            </tr>

            {/* Linha 6: Créditos Estimados Tomados nas Compras */}
            <tr style={{ background: 'rgba(16, 185, 129, 0.04)' }}>
              <td>
                <strong style={{ color: 'var(--accent-emerald)' }}>(-) Créditos Estimados (Compras)</strong>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Não-cumulatividade ampla</div>
              </td>
              <td style={{ color: 'var(--text-muted)' }}>-</td>
              {matrixData.map(m => (
                <td key={m.ano} style={{ textAlign: 'right', color: 'var(--accent-emerald)' }}>
                  - R$ {m.creditos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
              ))}
            </tr>

            {/* Linha 7: Carga Líquida Estimada */}
            <tr style={{ borderTop: '2px solid var(--border-color)', background: 'rgba(59, 130, 246, 0.05)' }}>
              <td>
                <strong style={{ fontSize: '0.95rem', color: 'var(--text-highlight)' }}>
                  Carga Tributária Líquida Estimada
                </strong>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Débitos - Créditos Estimados</div>
              </td>
              <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.95rem' }}>
                R$ {totalLegadoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              {matrixData.map(m => (
                <td key={m.ano} style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-highlight)' }}>
                  R$ {m.cargaLiquida.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
              ))}
            </tr>

            {/* Linha 8: Alíquota Efetiva sobre Faturamento */}
            <tr>
              <td>
                <strong>Alíquota Efetiva sobre Faturamento</strong>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Carga Líquida ÷ Faturamento</div>
              </td>
              <td style={{ textAlign: 'right', fontWeight: 600 }}>
                {totalFaturamento > 0 ? ((totalLegadoAtual / totalFaturamento) * 100).toFixed(2) : 0}%
              </td>
              {matrixData.map(m => (
                <td key={m.ano} style={{ textAlign: 'right', fontWeight: 600 }}>
                  {m.aliquotaEfetivaPct.toFixed(2)}%
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Modal / Card de Detalhe da Célula Selecionada (Auditoria da Célula) */}
      {selectedCellInfo && (
        <div className="modal-overlay" onClick={() => setSelectedCellInfo(null)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
                  Auditoria da Célula: {selectedCellInfo.tributoNome} ({selectedCellInfo.ano})
                </h3>
                <span className="badge badge-estimado">{selectedCellInfo.grauCerteza}</span>
              </div>
            </div>

            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <div>Valor Projetado: <strong style={{ color: 'var(--accent-blue)', fontSize: '1.1rem' }}>R$ {selectedCellInfo.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></div>
                <div>Alíquota / Regra: <strong>{selectedCellInfo.aliquotaRegra}</strong></div>
                <div>Vigência Prevista: <strong>{selectedCellInfo.vigencia}</strong></div>
                <div>Grau de Certeza: <strong>{selectedCellInfo.grauCerteza}</strong></div>
              </div>

              <div style={{ background: 'var(--bg-card)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '1rem', fontSize: '0.8rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-highlight)', marginBottom: '0.25rem' }}>
                  Fundamentação Normativa Oficial:
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  {selectedCellInfo.fonteLegal}
                </div>
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <strong>Explicação Didática:</strong> {selectedCellInfo.explicacao}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedCellInfo(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
