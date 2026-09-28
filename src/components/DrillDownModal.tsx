import React from 'react';
import { X, FileText, ExternalLink, Tag } from 'lucide-react';
import { FiscalDocument, FiscalItem } from '../types';

interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  metricOrigin: 'LIDO' | 'CALCULADO' | 'ESTIMADO' | 'PENDENTE';
  legalSource?: string;
  documents: FiscalDocument[];
  onSelectDoc: (doc: FiscalDocument) => void;
  onSelectItem?: (doc: FiscalDocument, item: FiscalItem) => void;
}

export const DrillDownModal: React.FC<DrillDownModalProps> = ({
  isOpen,
  onClose,
  title,
  metricOrigin,
  legalSource,
  documents,
  onSelectDoc,
  onSelectItem
}) => {
  if (!isOpen) return null;

  const totalValue = documents.reduce((acc, d) => acc + d.totais.vNF, 0);

  const getOriginBadge = () => {
    switch (metricOrigin) {
      case 'LIDO':
        return <span className="badge badge-lido">Lido do XML</span>;
      case 'CALCULADO':
        return <span className="badge badge-calculado">Calculado</span>;
      case 'ESTIMADO':
        return <span className="badge badge-estimado">Estimado (Simulação)</span>;
      case 'PENDENTE':
        return <span className="badge badge-pendente">Pendente de Revisão</span>;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '1000px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
                {title}
              </h2>
              {getOriginBadge()}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Trilha de Auditoria • Composição de Total • {documents.length} documentos encontrados • Soma: R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            {legalSource && (
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', marginTop: '0.2rem' }}>
                Base Normativa: {legalSource}
              </div>
            )}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: '0.35rem' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          <div className="table-responsive">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Número / Série</th>
                  <th>Chave de Acesso</th>
                  <th>Data Emissão</th>
                  <th>Parceiro (Emit/Dest)</th>
                  <th>Itens</th>
                  <th>Tributos XML</th>
                  <th style={{ textAlign: 'right' }}>Valor Total (NF)</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {documents.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      Nenhum documento compõe este indicador no filtro atual.
                    </td>
                  </tr>
                ) : (
                  documents.map((doc) => {
                    const isSaida = doc.tipoOperacao === 'SAIDA';
                    const parceiro = isSaida ? doc.destinatario.razaoSocial : doc.emitente.razaoSocial;
                    return (
                      <tr key={doc.id}>
                        <td>
                          <span className={`badge ${isSaida ? 'badge-saida' : 'badge-entrada'}`}>
                            {doc.tipoOperacao}
                          </span>
                          {doc.isDevolucao && <span className="badge badge-devolucao" style={{ marginLeft: '4px' }}>Devolução</span>}
                          {doc.isCancelada && <span className="badge badge-cancelada" style={{ marginLeft: '4px' }}>Cancelada</span>}
                        </td>
                        <td>
                          <strong>{doc.numero || 'S/N'}</strong> <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Série {doc.serie}</span>
                        </td>
                        <td className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }} title={doc.chaveAcesso}>
                          {doc.chaveAcesso.slice(0, 6)}...{doc.chaveAcesso.slice(-6)}
                        </td>
                        <td style={{ fontSize: '0.8rem' }}>
                          {doc.dataEmissao ? new Date(doc.dataEmissao).toLocaleDateString('pt-BR') : '-'}
                        </td>
                        <td style={{ fontSize: '0.82rem', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={parceiro}>
                          {parceiro || 'Não identificado'}
                        </td>
                        <td>
                          <span className="badge badge-calculado">{doc.itens.length}</span>
                        </td>
                        <td style={{ fontSize: '0.8rem' }}>
                          R$ {doc.totais.totalTributosLegados.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-highlight)' }}>
                          R$ {doc.totais.vNF.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td>
                          <button 
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                            onClick={() => {
                              onSelectDoc(doc);
                              onClose();
                            }}
                          >
                            <ExternalLink size={13} />
                            <span>Abrir Nota</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
