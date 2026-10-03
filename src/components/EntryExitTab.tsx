import React, { useState } from 'react';
import { 
  ArrowLeftRight, 
  ArrowDownLeft, 
  ArrowUpRight, 
  AlertCircle, 
  Layers, 
  FileCheck2, 
  HelpCircle,
  Link as LinkIcon,
  RotateCcw
} from 'lucide-react';
import { FiscalDocument, ScenarioPremises } from '../types';

interface EntryExitTabProps {
  documents: FiscalDocument[];
  activeScenario: ScenarioPremises;
  onSelectDoc: (doc: FiscalDocument) => void;
  onToggleOperationDirection?: (docId: string) => void;
}

export const EntryExitTab: React.FC<EntryExitTabProps> = ({
  documents,
  activeScenario,
  onSelectDoc,
  onToggleOperationDirection
}) => {
  const [selectedPartnerFilter, setSelectedPartnerFilter] = useState<string>('');

  // Separação de entradas e saídas ativas (desconsiderando notas canceladas)
  const activeDocs = documents.filter(d => !d.isCancelada);
  const entradas = activeDocs.filter(d => d.tipoOperacao === 'ENTRADA' && !d.isDevolucao);
  const saidas = activeDocs.filter(d => d.tipoOperacao === 'SAIDA' && !d.isDevolucao);
  const devolucoes = activeDocs.filter(d => d.isDevolucao);

  const totalEntradas = entradas.reduce((acc, d) => acc + d.totais.vNF, 0);
  const totalSaidas = saidas.reduce((acc, d) => acc + d.totais.vNF, 0);

  // Tributos destacados lidos no XML
  const icmsEntradas = entradas.reduce((acc, d) => acc + d.totais.vICMS, 0);
  const icmsSaidas = saidas.reduce((acc, d) => acc + d.totais.vICMS, 0);

  const pisCofinsEntradas = entradas.reduce((acc, d) => acc + d.totais.vPIS + d.totais.vCOFINS, 0);
  const pisCofinsSaidas = saidas.reduce((acc, d) => acc + d.totais.vPIS + d.totais.vCOFINS, 0);

  const totalTributosEntradas = entradas.reduce((acc, d) => acc + d.totais.totalTributosLegados, 0);
  const totalTributosSaidas = saidas.reduce((acc, d) => acc + d.totais.totalTributosLegados, 0);

  // Indicador Analítico de Diferença (NÃO saldo oficial)
  const diferencaAnaliticaBruta = totalSaidas - totalEntradas;
  const diferencaTributosAnalitica = totalTributosSaidas - totalTributosEntradas;

  // Conciliação de Devoluções e Documentos Referenciados
  const conciliacoes = devolucoes.map(devDoc => {
    const refs = devDoc.notasReferenciadas;
    const notaOrigem = refs.length > 0 
      ? documents.find(d => refs.includes(d.chaveAcesso))
      : null;
    return {
      devolucao: devDoc,
      notaOrigem,
      refs
    };
  });

  return (
    <div>
      {/* Alerta Mandatório do Guia (Seção 4.4 e 5) */}
      <div className="fiscal-notice-banner" style={{ borderColor: 'rgba(245, 158, 11, 0.4)', background: 'var(--accent-amber-bg)' }}>
        <AlertCircle size={20} color="var(--accent-amber)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--text-highlight)' }}>Aviso Analítico Regulatório:</strong>{' '}
          A diferença entre tributos destacados em compras e vendas é apresentada exclusivamente como um 
          <strong> indicador analítico comparativo</strong>. <em>Nunca deve ser interpretada como saldo oficial a pagar ou apuração definitiva de recolhimento</em>, 
          pois a apropriação legal de créditos depende do tipo de adquirente, destinação física, estorno de créditos, comprovação financeira e regras do Comitê Gestor (LC 214/2025).
        </div>
      </div>

      {/* Cards de Comparativo de Volume e Tributação */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        
        {/* Card Entradas */}
        <div className="kpi-card emerald" style={{ cursor: 'default' }}>
          <div className="kpi-header">
            <span className="kpi-title" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowDownLeft size={16} color="var(--accent-emerald)" />
              <span>Compras / Entradas Recebidas</span>
            </span>
            <span className="badge badge-entrada">{entradas.length} notas</span>
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-emerald)' }}>
            R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.5rem' }}>
            <div>ICMS Destacado na Compra: <strong>R$ {icmsEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></div>
            <div>PIS/COFINS Destacado: <strong>R$ {pisCofinsEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></div>
            <div>Total Tributos Entrada: <strong>R$ {totalTributosEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></div>
          </div>
        </div>

        {/* Card Saídas */}
        <div className="kpi-card rose" style={{ cursor: 'default' }}>
          <div className="kpi-header">
            <span className="kpi-title" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowUpRight size={16} color="var(--accent-rose)" />
              <span>Vendas / Saídas Emitidas</span>
            </span>
            <span className="badge badge-saida">{saidas.length} notas</span>
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-rose)' }}>
            R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.5rem' }}>
            <div>ICMS Destacado na Venda: <strong>R$ {icmsSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></div>
            <div>PIS/COFINS Destacado: <strong>R$ {pisCofinsSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></div>
            <div>Total Tributos Saída: <strong>R$ {totalTributosSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></div>
          </div>
        </div>

        {/* Card Confronto Analítico */}
        <div className="kpi-card indigo" style={{ cursor: 'default' }}>
          <div className="kpi-header">
            <span className="kpi-title" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowLeftRight size={16} color="var(--accent-indigo)" />
              <span>Confronto Analítico Líquido</span>
            </span>
            <span className="badge badge-calculado">Indicador</span>
          </div>
          <div className="kpi-value" style={{ color: diferencaAnaliticaBruta >= 0 ? 'var(--text-highlight)' : 'var(--accent-rose)' }}>
            R$ {diferencaAnaliticaBruta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.5rem' }}>
            <div>Diferença Tributos (Saída - Entrada): <strong>R$ {diferencaTributosAnalitica.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></div>
            <div>Margem Bruta Agregada: <strong>{totalEntradas > 0 ? ((diferencaAnaliticaBruta / totalEntradas) * 100).toFixed(1) : 0}%</strong></div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>*Não representa DARF ou guia de recolhimento</div>
          </div>
        </div>

      </div>

      {/* Visão de Fluxo Didática: Compras -> Custo/Estoque -> Vendas */}
      <div className="chart-card" style={{ marginBottom: '1.5rem' }}>
        <div className="chart-title">
          <span>Visão de Fluxo Didático da Cadeia (Conforme Guia Seção 4.4)</span>
          <span className="badge badge-calculado">Fluxo Físico & Financeiro</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '1.5rem 0', flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* Etapa 1: Compras */}
          <div style={{ textAlign: 'center', minWidth: '160px' }}>
            <div style={{ width: '50px', height: '50px', margin: '0 auto 0.5rem', background: 'var(--accent-emerald-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-emerald)' }}>
              <ArrowDownLeft size={24} />
            </div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>1. Entradas (Insumos)</h4>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
              R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{entradas.length} notas recebidas</span>
          </div>

          <div style={{ color: 'var(--border-color)', fontSize: '1.5rem' }}>➔</div>

          {/* Etapa 2: Estoque / Custo Médio */}
          <div style={{ textAlign: 'center', minWidth: '180px' }}>
            <div style={{ width: '50px', height: '50px', margin: '0 auto 0.5rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)' }}>
              <Layers size={24} />
            </div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>2. Custo / Agregação</h4>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Método: Vínculo Direto por NCM
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sem inferência de baixa sem vínculo</span>
          </div>

          <div style={{ color: 'var(--border-color)', fontSize: '1.5rem' }}>➔</div>

          {/* Etapa 3: Vendas */}
          <div style={{ textAlign: 'center', minWidth: '160px' }}>
            <div style={{ width: '50px', height: '50px', margin: '0 auto 0.5rem', background: 'var(--accent-rose-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-rose)' }}>
              <ArrowUpRight size={24} />
            </div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>3. Saídas (Faturamento)</h4>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-rose)' }}>
              R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{saidas.length} notas emitidas</span>
          </div>

        </div>
      </div>

      {/* Tabela de Conferência e Ajuste do Fluxo (Entradas vs Saídas) */}
      <div className="chart-card" style={{ marginBottom: '1.5rem' }}>
        <div className="chart-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeftRight size={18} color="var(--accent-blue)" />
            <span>Classificação das Operações nos Livros Fiscais ({activeDocs.length} documentos)</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Regra SPED: Compras de terceiros com &lt;tpNF&gt;1 escrituram como Entrada
          </span>
        </div>

        <div className="table-responsive">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Direção Fiscal</th>
                <th>Nota / Modelo</th>
                <th>Origem da Regra</th>
                <th>Emitente (Origem)</th>
                <th>Destinatário (Destino)</th>
                <th style={{ textAlign: 'right' }}>Total (R$)</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {activeDocs.map(doc => {
                const isSaida = doc.tipoOperacao === 'SAIDA';
                return (
                  <tr key={doc.id}>
                    <td>
                      <span className={`badge ${isSaida ? 'badge-saida' : 'badge-entrada'}`}>
                        {doc.tipoOperacao}
                      </span>
                    </td>
                    <td>
                      <strong>NF {doc.numero || 'S/N'}</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {doc.dataEmissao ? new Date(doc.dataEmissao).toLocaleDateString('pt-BR') : '-'}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {doc.tipoOperacaoOrigem === 'AUTOMATICO_CNPJ' && 'Auto por CNPJ'}
                        {doc.tipoOperacaoOrigem === 'AUTO_DETECCAO_LOTE' && 'Detectado no Lote'}
                        {doc.tipoOperacaoOrigem === 'CORRECAO_MANUAL' && 'Correção Manual'}
                        {doc.tipoOperacaoOrigem === 'TAG_TPNF' && 'Padrão SEFAZ (tpNF)'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={doc.emitente.razaoSocial}>
                      {doc.emitente.razaoSocial}
                    </td>
                    <td style={{ fontSize: '0.8rem', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={doc.destinatario.razaoSocial}>
                      {doc.destinatario.razaoSocial}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      R$ {doc.totais.vNF.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        {onToggleOperationDirection && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => onToggleOperationDirection(doc.id)}
                            style={{ fontSize: '0.7rem', padding: '0.2rem 0.45rem' }}
                            title="Inverter direção contábil entre Entrada e Saída (recalcula créditos de IBS/CBS)"
                          >
                            Inverter Direção
                          </button>
                        )}
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onSelectDoc(doc)}
                          style={{ fontSize: '0.7rem', padding: '0.2rem 0.45rem' }}
                        >
                          Ver Detalhes
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Módulo de Conciliação de Devoluções e Notas Referenciadas */}
      <div className="chart-card">
        <div className="chart-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <RotateCcw size={18} color="var(--accent-amber)" />
            <span>Conciliação de Devoluções & Documentos Referenciados ({conciliacoes.length})</span>
          </div>
          <span className="badge badge-pendente">Rastreabilidade Fiscal</span>
        </div>

        {conciliacoes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
            Nenhuma nota fiscal de devolução detectada nos documentos importados.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Nota de Devolução</th>
                  <th>Data</th>
                  <th>Valor Devolvido</th>
                  <th>Chave Referenciada (Origem)</th>
                  <th>Status de Vínculo</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {conciliacoes.map((c, idx) => (
                  <tr key={idx}>
                    <td>
                      <strong>NF-e nº {c.devolucao.numero || 'S/N'}</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {c.devolucao.emitente.razaoSocial}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>
                      {c.devolucao.dataEmissao ? new Date(c.devolucao.dataEmissao).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--accent-amber)' }}>
                      R$ {c.devolucao.totais.vNF.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="font-mono" style={{ fontSize: '0.72rem' }}>
                      {c.refs.length > 0 ? (
                        c.refs.map((ref, rIdx) => (
                          <div key={rIdx} title={ref}>
                            <LinkIcon size={12} style={{ display: 'inline', marginRight: '4px' }} />
                            {ref.slice(0, 8)}...{ref.slice(-8)}
                          </div>
                        ))
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Sem tag &lt;NFref&gt;</span>
                      )}
                    </td>
                    <td>
                      {c.notaOrigem ? (
                        <span className="badge badge-lido">
                          Vinculada à NF nº {c.notaOrigem.numero}
                        </span>
                      ) : (
                        <span className="badge badge-pendente">
                          Origem não importada
                        </span>
                      )}
                    </td>
                    <td>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => onSelectDoc(c.devolucao)}
                      >
                        Abrir Devolução
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
