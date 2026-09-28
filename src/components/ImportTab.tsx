import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  FileWarning, 
  Sparkles, 
  ArrowRight, 
  Trash2,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { FiscalDocument, CompanyProfile, TaxRuleSet, ScenarioPremises, ImportSummary } from '../types';
import { processBatchXmlFiles } from '../services/nfeParser';
import { ALL_INITIAL_FIXTURES } from '../services/fixtures';
import { OFFICIAL_FIXTURE_XML } from '../services/fixtureOfficialXml';

interface ImportTabProps {
  documents: FiscalDocument[];
  onAddDocuments: (newDocs: FiscalDocument[]) => void;
  activeCompany: CompanyProfile;
  ruleset: TaxRuleSet;
  activeScenario: ScenarioPremises;
  onClearAllDocs: () => void;
}

export const ImportTab: React.FC<ImportTabProps> = ({
  documents,
  onAddDocuments,
  activeCompany,
  ruleset,
  activeScenario,
  onClearAllDocs
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingBatch, setPendingBatch] = useState<{
    summary: ImportSummary;
    newDocs: FiscalDocument[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Processa arquivos de entrada (Upload ou Drag & Drop)
  const handleFilesSelected = async (fileList: FileList | File[]) => {
    setIsProcessing(true);
    const filesToRead: { name: string; content: string }[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.name.toLowerCase().endsWith('.xml') || file.type.includes('xml')) {
        try {
          const content = await file.text();
          filesToRead.push({ name: file.name, content });
        } catch (err) {
          console.error(`Erro ao ler arquivo ${file.name}`, err);
        }
      }
    }

    if (filesToRead.length === 0) {
      alert('Nenhum arquivo XML válido foi selecionado.');
      setIsProcessing(false);
      return;
    }

    const { summary, newDocs } = await processBatchXmlFiles(
      filesToRead,
      documents,
      activeCompany,
      ruleset,
      activeScenario
    );

    setPendingBatch({ summary, newDocs });
    setIsProcessing(false);
  };

  // Carrega apenas a Fixture Oficial descrita no item 6 do Guia (14 itens, R$ 22.349,73)
  const handleLoadOfficialOnly = async () => {
    setIsProcessing(true);
    const filesToRead = [{ name: '35260507790200000134550050001361011607304194-nfe.xml', content: OFFICIAL_FIXTURE_XML }];
    const { summary, newDocs } = await processBatchXmlFiles(
      filesToRead,
      documents,
      activeCompany,
      ruleset,
      activeScenario
    );
    setPendingBatch({ summary, newDocs });
    setIsProcessing(false);
  };

  // Carrega todas as Fixtures de Demonstração (Oficial + Entradas + Devolução + Cancelamento + Benefícios)
  const handleLoadAllDemoFixtures = async () => {
    setIsProcessing(true);
    const { summary, newDocs } = await processBatchXmlFiles(
      ALL_INITIAL_FIXTURES,
      documents,
      activeCompany,
      ruleset,
      activeScenario
    );
    setPendingBatch({ summary, newDocs });
    setIsProcessing(false);
  };

  // Confirmação da importação da prévia
  const handleConfirmBatch = () => {
    if (!pendingBatch) return;
    onAddDocuments(pendingBatch.newDocs);
    setPendingBatch(null);
  };

  return (
    <div>
      {/* Cabeçalho do Importador */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
            Importação & Organização de Documentos Fiscais
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Suporte nativo a NF-e (modelo 55) e NFC-e (modelo 65). Validação estrutural de schema, deduplicação segura por hash e chave de acesso.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleLoadOfficialOnly} title="Carrega a NF-e exata de R$ 22.349,73 descrita no Guia">
            <Sparkles size={14} color="var(--accent-blue)" />
            <span>Carregar Caso Oficial (14 itens • R$ 22k)</span>
          </button>

          <button className="btn btn-secondary btn-sm" onClick={handleLoadAllDemoFixtures} title="Carrega casos de Entrada, Devolução e Cancelamento para teste amplo">
            <FolderOpen size={14} color="var(--accent-indigo)" />
            <span>Carregar Suite Completa de Testes</span>
          </button>

          {documents.length > 0 && (
            <button className="btn btn-danger btn-sm" onClick={onClearAllDocs} title="Limpa todas as notas fiscais do banco local">
              <Trash2 size={14} />
              <span>Limpar Documentos</span>
            </button>
          )}
        </div>
      </div>

      {/* Área de Drag & Drop */}
      <div
        style={{
          border: `2px dashed ${isDragging ? 'var(--accent-blue)' : 'var(--border-color)'}`,
          background: isDragging ? 'var(--accent-blue-glow)' : 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '3rem 1.5rem',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all var(--transition-fast)',
          marginBottom: '2rem'
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files) {
            handleFilesSelected(e.dataTransfer.files);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept=".xml,text/xml"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files) {
              handleFilesSelected(e.target.files);
            }
          }}
        />

        <div style={{ width: '56px', height: '56px', margin: '0 auto 1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)' }}>
          <UploadCloud size={28} />
        </div>

        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-highlight)', marginBottom: '0.4rem' }}>
          Arraste seus arquivos XML de NF-e ou clique para selecionar
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '480px', margin: '0 auto' }}>
          Aceita seleção múltipla de arquivos. Os dados são processados e armazenados <strong>100% no seu dispositivo</strong>, sem envio para servidores de terceiros ou nuvem.
        </p>

        {isProcessing && (
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--accent-blue)' }}>
            <RefreshCw size={16} className="animate-spin" />
            <span>Processando e validando XMLs...</span>
          </div>
        )}
      </div>

      {/* Modal / Card de Pré-visualização e Resumo de Importação (Seção 4.2 do Guia) */}
      {pendingBatch && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '850px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
                  Prévia e Resumo da Importação de Lote
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Revise o resultado da validação antes de confirmar a gravação no banco de dados local.
                </p>
              </div>
            </div>

            <div className="modal-body">
              {/* Cards de Resumo */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.75rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>ACEITOS</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                    {pendingBatch.summary.totalAceitos}
                  </div>
                </div>

                <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '0.75rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', fontWeight: 600 }}>COM RESSALVAS</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-blue)' }}>
                    {pendingBatch.summary.totalParciais}
                  </div>
                </div>

                <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.75rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', fontWeight: 600 }}>DUPLICADOS</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-amber)' }}>
                    {pendingBatch.summary.totalDuplicados}
                  </div>
                </div>

                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.75rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 600 }}>INVÁLIDOS</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f87171' }}>
                    {pendingBatch.summary.totalInvalidos}
                  </div>
                </div>
              </div>

              {/* Tabela Arquivo por Arquivo (Nunca descarta silenciosamente) */}
              <div className="table-responsive" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <table className="audit-table">
                  <thead>
                    <tr>
                      <th>Arquivo</th>
                      <th>Status</th>
                      <th>Chave / Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingBatch.summary.detalhesPorArquivo.map((detalhe, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 500, fontSize: '0.8rem', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {detalhe.fileName}
                        </td>
                        <td>
                          {detalhe.status === 'ACEITO' && <span className="badge badge-lido">Aceito</span>}
                          {detalhe.status === 'PARCIAL' && <span className="badge badge-calculado">Ressalvas</span>}
                          {detalhe.status === 'DUPLICADO' && <span className="badge badge-pendente">Duplicado</span>}
                          {detalhe.status === 'INVALIDO' && <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>Inválido</span>}
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {detalhe.motivo || detalhe.chaveAcesso}
                          {detalhe.avisos && detalhe.avisos.map((av, avIdx) => (
                            <div key={avIdx} style={{ color: 'var(--accent-amber)', fontSize: '0.72rem' }}>• {av}</div>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setPendingBatch(null)}>
                Cancelar
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleConfirmBatch}
                disabled={pendingBatch.newDocs.length === 0}
              >
                <span>Confirmar Importação ({pendingBatch.newDocs.length} novas notas)</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Histórico dos Documentos Armazenados Localmente */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-highlight)' }}>
            Documentos Atualmente no Repositório Local ({documents.length})
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Armazenamento Seguro em IndexedDB / LocalStorage • Trilha de Auditoria Preservada
          </span>
        </div>

        <div className="table-responsive">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Direção</th>
                <th>Número / Modelo</th>
                <th>Chave de Acesso</th>
                <th>Emissão</th>
                <th>Emitente</th>
                <th>Destinatário</th>
                <th>Itens</th>
                <th style={{ textAlign: 'right' }}>Total (R$)</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Nenhum documento cadastrado. Arraste arquivos XML acima ou use os botões de fixtures.
                  </td>
                </tr>
              ) : (
                documents.map(doc => {
                  const isSaida = doc.tipoOperacao === 'SAIDA';
                  return (
                    <tr key={doc.id}>
                      <td>
                        <span className={`badge ${isSaida ? 'badge-saida' : 'badge-entrada'}`}>
                          {doc.tipoOperacao}
                        </span>
                      </td>
                      <td>
                        <strong>{doc.numero || 'S/N'}</strong> <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Mod {doc.modelo}</span>
                      </td>
                      <td className="font-mono" style={{ fontSize: '0.72rem' }} title={doc.chaveAcesso}>
                        {doc.chaveAcesso.slice(0, 8)}...{doc.chaveAcesso.slice(-8)}
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>
                        {doc.dataEmissao ? new Date(doc.dataEmissao).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td style={{ fontSize: '0.8rem', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={doc.emitente.razaoSocial}>
                        {doc.emitente.razaoSocial}
                      </td>
                      <td style={{ fontSize: '0.8rem', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={doc.destinatario.razaoSocial}>
                        {doc.destinatario.razaoSocial}
                      </td>
                      <td>
                        <span className="badge badge-calculado">{doc.itens.length}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        R$ {doc.totais.vNF.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        {doc.isCancelada ? (
                          <span className="badge badge-cancelada">Cancelada</span>
                        ) : doc.isDevolucao ? (
                          <span className="badge badge-devolucao">Devolução</span>
                        ) : (
                          <span className="badge badge-lido">Autorizada</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
