import React, { useState } from 'react';
import { 
  FileText, 
  HelpCircle, 
  Layers, 
  Check, 
  AlertTriangle, 
  Info, 
  X, 
  Calculator, 
  Search, 
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { FiscalDocument, FiscalItem, ScenarioPremises, TaxRuleSet } from '../types';

interface DocumentAnalysisTabProps {
  documents: FiscalDocument[];
  selectedDoc: FiscalDocument | null;
  onSelectDoc: (doc: FiscalDocument) => void;
  activeScenario: ScenarioPremises;
  ruleset: TaxRuleSet;
  onConfirmItemClassification: (docId: string, itemId: string, userName: string) => void;
  onToggleOperationDirection: (docId: string) => void;
}

export const DocumentAnalysisTab: React.FC<DocumentAnalysisTabProps> = ({
  documents,
  selectedDoc,
  onSelectDoc,
  activeScenario,
  ruleset,
  onConfirmItemClassification,
  onToggleOperationDirection
}) => {
  const [selectedItem, setSelectedItem] = useState<FiscalItem | null>(null);
  const [activeSimulationYear, setActiveSimulationYear] = useState<number>(2033);
  const [groupByNcm, setGroupByNcm] = useState<boolean>(false);
  const [itemSearchTerm, setItemSearchTerm] = useState<string>('');

  const doc = selectedDoc || (documents.length > 0 ? documents[0] : null);

  if (!doc) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Nenhum documento fiscal importado para análise.</p>
      </div>
    );
  }

  // Filtragem de Itens da Nota
  const filteredItens = doc.itens.filter(it => 
    it.xProd.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
    it.cProd.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
    it.ncm.includes(itemSearchTerm)
  );

  // Agrupamento por NCM mantendo rastreabilidade aos itens originais (Seção 4.3 do Guia)
  const groupedItens = React.useMemo(() => {
    if (!groupByNcm) return null;
    const map = new Map<string, { ncm: string; totalValor: number; totalQtd: number; count: number; originalItens: FiscalItem[] }>();
    filteredItens.forEach(it => {
      const key = it.ncm || 'SEM_NCM';
      const cur = map.get(key) || { ncm: key, totalValor: 0, totalQtd: 0, count: 0, originalItens: [] };
      cur.totalValor += it.vProd;
      cur.totalQtd += it.qCom;
      cur.count += 1;
      cur.originalItens.push(it);
      map.set(key, cur);
    });
    return Array.from(map.values());
  }, [filteredItens, groupByNcm]);

  const activeItemSim = selectedItem?.simulacoesPorAno?.[activeSimulationYear];

  return (
    <div>
      {/* Barra de Seleção Rápida de Documento e Informações Principais */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Documento Selecionado:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <select
                className="form-control"
                style={{ fontWeight: 600, fontSize: '0.9rem' }}
                value={doc.id}
                onChange={(e) => {
                  const found = documents.find(d => d.id === e.target.value);
                  if (found) {
                    onSelectDoc(found);
                    setSelectedItem(null);
                  }
                }}
              >
                {documents.map(d => (
                  <option key={d.id} value={d.id}>
                    NF-e nº {d.numero || 'S/N'} ({d.tipoOperacao}) - R$ {d.totais.vNF.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - {d.emitente.razaoSocial}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span className={`badge ${doc.tipoOperacao === 'SAIDA' ? 'badge-saida' : 'badge-entrada'}`}>
              {doc.tipoOperacao}
            </span>
            <button 
              className="btn btn-secondary btn-sm" 
              style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}
              onClick={() => onToggleOperationDirection(doc.id)}
              title="Corrigir manualmente entre Entrada e Saída conforme o Guia"
            >
              Inverter Direção
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Natureza da Operação:</span>{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{doc.naturezaOperacao}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Data Emissão:</span>{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{doc.dataEmissao ? new Date(doc.dataEmissao).toLocaleDateString('pt-BR') : '-'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Total Documento:</span>{' '}
            <strong style={{ color: 'var(--text-highlight)', fontSize: '0.95rem' }}>R$ {doc.totais.vNF.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
          </div>
        </div>
      </div>

      {/* Grid Resumo de Totais e Composição da Nota (Sem somar duas vezes o que já está no preço) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>VALOR DOS PRODUTOS (vProd)</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            R$ {doc.totais.vProd.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="badge badge-lido" style={{ fontSize: '0.65rem' }}>Lido XML</span>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>ICMS PRÓPRIO DESTACADO</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#3b82f6' }}>
            R$ {doc.totais.vICMS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Embutido no preço</span>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>ICMS-ST DESTACADO</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f43f5e' }}>
            R$ {doc.totais.vST.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Acrescido ao total da NF</span>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>PIS + COFINS DESTACADOS</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b' }}>
            R$ {(doc.totais.vPIS + doc.totais.vCOFINS).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Extintos na Reforma</span>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.75rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>VALOR TOTAL DA NOTA (vNF)</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
            R$ {doc.totais.vNF.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)' }}>vProd + ST + Frete - Desc</span>
        </div>
      </div>

      {/* Controles da Tabela de Itens (Busca, Agrupamento e Ano de Simulação) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Buscar item nesta nota..."
              style={{ paddingLeft: '28px', width: '220px' }}
              value={itemSearchTerm}
              onChange={(e) => setItemSearchTerm(e.target.value)}
            />
          </div>

          <button 
            className={`btn ${groupByNcm ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setGroupByNcm(!groupByNcm)}
            title="Agrupa itens por classificação NCM mantendo rastreabilidade ao XML original"
          >
            <Layers size={14} />
            <span>{groupByNcm ? 'Desagrupar Itens' : 'Agrupar por NCM'}</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Simulação de Reforma para o Ano:</span>
          <select
            className="form-control"
            style={{ fontWeight: 600, fontSize: '0.82rem', width: '100px' }}
            value={activeSimulationYear}
            onChange={(e) => setActiveSimulationYear(Number(e.target.value))}
          >
            {[2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela de Itens */}
      <div className="table-responsive" style={{ marginBottom: '2rem' }}>
        <table className="audit-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Código</th>
              <th>Descrição do Produto</th>
              <th>NCM / CEST</th>
              <th>CFOP</th>
              <th>Qtd</th>
              <th style={{ textAlign: 'right' }}>Preço Total</th>
              <th>ICMS XML</th>
              <th>PIS/COF XML</th>
              <th>Reforma ({activeSimulationYear})</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {groupByNcm && groupedItens ? (
              groupedItens.map((grp, idx) => (
                <tr key={idx}>
                  <td colSpan={2}><span className="badge badge-calculado">{grp.count} itens agrupados</span></td>
                  <td><strong>Grupo de Itens NCM {grp.ncm}</strong></td>
                  <td className="font-mono">{grp.ncm}</td>
                  <td>-</td>
                  <td>{grp.totalQtd}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    R$ {grp.totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td colSpan={3} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Clique no item individual para memória de cálculo detalhada
                  </td>
                  <td>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setGroupByNcm(false);
                        setSelectedItem(grp.originalItens[0]);
                      }}
                    >
                      Ver Itens
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              filteredItens.map((item) => {
                const sim = item.simulacoesPorAno?.[activeSimulationYear];
                const isSelected = selectedItem?.id === item.id;
                return (
                  <tr 
                    key={item.id} 
                    style={{ background: isSelected ? 'var(--bg-card-hover)' : undefined, cursor: 'pointer' }}
                    onClick={() => setSelectedItem(item)}
                  >
                    <td><strong>#{item.nItem}</strong></td>
                    <td className="font-mono" style={{ fontSize: '0.75rem' }}>{item.cProd}</td>
                    <td style={{ maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.xProd}>
                      {item.xProd}
                    </td>
                    <td className="font-mono" style={{ fontSize: '0.75rem' }}>
                      {item.ncm || <span style={{ color: 'var(--accent-amber)' }}>Ausente</span>}
                    </td>
                    <td>{item.cfop}</td>
                    <td>{item.qCom} {item.uCom}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      R$ {item.vProd.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ fontSize: '0.78rem' }}>
                      R$ {item.tributosLegados.vICMS.toFixed(2)} ({item.tributosLegados.pICMS}%)
                    </td>
                    <td style={{ fontSize: '0.78rem' }}>
                      R$ {(item.tributosLegados.vPIS + item.tributosLegados.vCOFINS).toFixed(2)}
                    </td>
                    <td>
                      {sim ? (
                        <div style={{ fontSize: '0.78rem' }}>
                          <strong style={{ color: 'var(--accent-indigo)' }}>
                            R$ {(sim.valorCBS + sim.valorIBSTotal + sim.valorIS).toFixed(2)}
                          </strong>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {sim.tipoRegraAplicada === 'CESTA_BASICA_ZERO' ? 'Alíquota Zero' : 
                             sim.tipoRegraAplicada === 'REDUCAO_60' ? '-60% Redução' : 'Regra Geral'}
                          </div>
                        </div>
                      ) : '-'}
                    </td>
                    <td>
                      <button 
                        className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(item);
                        }}
                      >
                        <Calculator size={13} />
                        <span>Auditar</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Drawer / Painel Lateral de Detalhamento Fiscal em Camadas (Seção 4.3 do Guia) */}
      {selectedItem && (
        <div className="drawer-container">
          <div className="modal-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-calculado">Item #{selectedItem.nItem}</span>
                <span className="badge badge-lido">NCM {selectedItem.ncm}</span>
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-highlight)', marginTop: '0.25rem', maxWidth: '420px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedItem.xProd}
              </h3>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedItem(null)}>
              <X size={16} />
            </button>
          </div>

          <div className="modal-body" style={{ overflowY: 'auto' }}>
            {/* Camada 1: Preço e Componentes da Base */}
            <div style={{ marginBottom: '1.25rem', background: 'var(--bg-card)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-highlight)' }}>
                <Layers size={15} color="var(--accent-blue)" />
                <span>Camada 1: Preço e Composição da Base</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.8rem' }}>
                <div>Preço Unitário: <strong>R$ {selectedItem.vUnCom.toFixed(2)}</strong></div>
                <div>Quantidade: <strong>{selectedItem.qCom} {selectedItem.uCom}</strong></div>
                <div>Valor Bruto: <strong>R$ {selectedItem.vProd.toFixed(2)}</strong></div>
                <div>Descontos: <strong>- R$ {selectedItem.vDesc.toFixed(2)}</strong></div>
                <div>Frete Rateado: <strong>+ R$ {selectedItem.vFrete.toFixed(2)}</strong></div>
                <div>Base de Operação: <strong style={{ color: 'var(--accent-emerald)' }}>R$ {selectedItem.valorTotalLiquido.toFixed(2)}</strong></div>
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                💡 <em>Didático:</em> Na Reforma Tributária, a base do IBS e CBS incide sobre o valor líquido da operação sem tributos por dentro (Art. 12 da LC 214/2025).
              </div>
            </div>

            {/* Camada 2: Tributos Legados Destacados no XML */}
            <div style={{ marginBottom: '1.25rem', background: 'var(--bg-card)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-highlight)' }}>
                Camada 2: Tributos Atuais Destacados no XML (Lido)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.8rem' }}>
                <div>ICMS ({selectedItem.tributosLegados.pICMS}%): <strong>R$ {selectedItem.tributosLegados.vICMS.toFixed(2)}</strong></div>
                <div>ICMS CST/CSOSN: <strong>{selectedItem.tributosLegados.cstIcms || '-'}</strong></div>
                <div>PIS ({selectedItem.tributosLegados.pPIS}%): <strong>R$ {selectedItem.tributosLegados.vPIS.toFixed(2)}</strong></div>
                <div>COFINS ({selectedItem.tributosLegados.pCOFINS}%): <strong>R$ {selectedItem.tributosLegados.vCOFINS.toFixed(2)}</strong></div>
                <div>IPI ({selectedItem.tributosLegados.pIPI}%): <strong>R$ {selectedItem.tributosLegados.vIPI.toFixed(2)}</strong></div>
                <div>ICMS-ST: <strong>R$ {selectedItem.tributosLegados.vICMSST.toFixed(2)}</strong></div>
              </div>
            </div>

            {/* Camada 3: Simulação e Memória de Cálculo Auditável da Reforma */}
            {activeItemSim && (
              <div style={{ marginBottom: '1.25rem', background: 'rgba(99, 102, 241, 0.06)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--accent-indigo)' }}>
                    Camada 3: Simulação Reforma Tributária ({activeSimulationYear})
                  </div>
                  <span className="badge badge-estimado">{activeItemSim.grauCerteza}</span>
                </div>

                <div style={{ fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                  <div>Regra Legal: <strong>{activeItemSim.descricaoRegra}</strong></div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Base Normativa: {activeItemSim.baseLegal}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                  <div>CBS Federal: <strong>R$ {activeItemSim.valorCBS.toFixed(2)}</strong> ({(activeItemSim.aliquotaCBSEfetiva * 100).toFixed(2)}%)</div>
                  <div>IBS Estadual: <strong>R$ {activeItemSim.valorIBSEstadual.toFixed(2)}</strong> ({(activeItemSim.aliquotaIBSEstadualEfetiva * 100).toFixed(2)}%)</div>
                  <div>IBS Municipal: <strong>R$ {activeItemSim.valorIBSMunicipal.toFixed(2)}</strong> ({(activeItemSim.aliquotaIBSMunicipalEfetiva * 100).toFixed(2)}%)</div>
                  {activeItemSim.aplicaIS && (
                    <div>Imposto Seletivo: <strong style={{ color: 'var(--accent-rose)' }}>R$ {activeItemSim.valorIS.toFixed(2)}</strong></div>
                  )}
                  <div>Total Reforma no Item: <strong style={{ color: 'var(--accent-indigo)', fontSize: '0.9rem' }}>R$ {(activeItemSim.valorCBS + activeItemSim.valorIBSTotal + activeItemSim.valorIS).toFixed(2)}</strong></div>
                </div>

                {/* Memória de Cálculo Auditável Passo a Passo (Seção 5 do Guia) */}
                <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    MEMÓRIA DE CÁLCULO REPRODUZÍVEL
                  </div>
                  {activeItemSim.memoriaCalculo.map((p, idx) => (
                    <div key={idx} style={{ background: 'var(--bg-card)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.4rem', fontSize: '0.72rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        Etapa {p.step}: {p.titulo}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)', margin: '0.2rem 0' }}>
                        {p.formula} = {p.resultadoParcial}
                      </div>
                      <div style={{ color: 'var(--text-muted)' }}>
                        {p.observacao} • {p.baseLegal}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confirmação e Auditoria de Classificação */}
            <div style={{ background: 'var(--bg-card)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                Status de Classificação Fiscal
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className={`badge ${selectedItem.classificacaoStatus === 'CONFIRMADA' ? 'badge-lido' : 'badge-pendente'}`}>
                  {selectedItem.classificacaoStatus}
                </span>
                {selectedItem.classificacaoStatus !== 'CONFIRMADA' && (
                  <button 
                    className="btn btn-success btn-sm"
                    onClick={() => onConfirmItemClassification(doc.id, selectedItem.id, 'Auditor Local')}
                  >
                    <Check size={13} />
                    <span>Confirmar Classificação</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
