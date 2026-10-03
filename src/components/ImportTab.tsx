import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  FileWarning, 
  ArrowRight, 
  Trash2,
  RefreshCw
} from 'lucide-react';
import { FiscalDocument, CompanyProfile, TaxRuleSet, ScenarioPremises, ImportSummary } from '../types';
import { processBatchXmlFiles } from '../services/nfeParser';

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
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [batchResult, setBatchResult] = useState<{
    summary: ImportSummary;
    importedCount: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Função auxiliar recursiva para extrair arquivos de pastas arrastadas
  const extractFilesFromItems = async (items: DataTransferItemList): Promise<File[]> => {
    const files: File[] = [];
    
    const readEntry = async (entry: any): Promise<void> => {
      if (!entry) return;
      if (entry.isFile) {
        return new Promise<void>((resolve) => {
          entry.file((f: File) => {
            if (f.name.toLowerCase().endsWith('.xml')) {
              files.push(f);
            }
            resolve();
          }, () => resolve());
        });
      } else if (entry.isDirectory) {
        const dirReader = entry.createReader();
        const readEntries = async (): Promise<any[]> => {
          return new Promise((resolve) => {
            dirReader.readEntries((entries: any[]) => resolve(entries), () => resolve([]));
          });
        };
        let entries = await readEntries();
        while (entries.length > 0) {
          for (const e of entries) {
            await readEntry(e);
          }
          entries = await readEntries();
        }
      }
    };

    const promises: Promise<void>[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
        if (entry) {
          promises.push(readEntry(entry));
        } else {
          const f = item.getAsFile();
          if (f && f.name.toLowerCase().endsWith('.xml')) files.push(f);
        }
      }
    }
    await Promise.all(promises);
    return files;
  };

  // Processa arquivos de entrada (Upload ou Drag & Drop)
  const handleFilesSelected = async (fileList: FileList | File[]) => {
    setIsProcessing(true);
    setProgressMsg('Lendo arquivos do lote...');
    const filesToRead: { name: string; content: string }[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const isXml = file.name.toLowerCase().endsWith('.xml') || 
                    file.type.includes('xml') || 
                    file.type === '' || 
                    file.name.toLowerCase().includes('.xml');
      if (isXml) {
        try {
          const content = await file.text();
          // Validação preliminar: confere se parece com XML
          if (content.includes('<') && (content.includes('NFe') || content.includes('infNFe') || content.includes('nfeProc') || content.includes('xml'))) {
            filesToRead.push({ name: file.name, content });
          } else {
            filesToRead.push({ name: file.name, content });
          }
        } catch (err) {
          console.error(`Erro ao ler arquivo ${file.name}`, err);
        }
      }
    }

    if (filesToRead.length === 0) {
      alert('Nenhum arquivo XML válido foi selecionado. Certifique-se de selecionar arquivos com extensão .xml.');
      setIsProcessing(false);
      setProgressMsg('');
      return;
    }

    setProgressMsg(`Validando ${filesToRead.length} notas fiscais em bloco...`);

    const { summary, newDocs } = await processBatchXmlFiles(
      filesToRead,
      documents,
      activeCompany,
      ruleset,
      activeScenario,
      (current, total, fileName) => {
        setProgressMsg(`Validando nota fiscal ${current} de ${total}: ${fileName}`);
      }
    );

    // Importa automaticamente as notas aprovadas no lote
    if (newDocs.length > 0) {
      onAddDocuments(newDocs);
    }

    setBatchResult({
      summary,
      importedCount: newDocs.length
    });

    setIsProcessing(false);
    setProgressMsg('');
  };

  // Limpa o seletor de arquivos para permitir nova seleção idêntica
  const handleTriggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
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
            Suporte nativo a lotes múltiplos de NF-e (modelo 55) e NFC-e (modelo 65). Processamento simultâneo, validação estrutural e deduplicação segura.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-primary btn-sm" 
            onClick={handleTriggerFileInput}
            title="Selecionar um ou vários arquivos XML simultaneamente"
          >
            <UploadCloud size={14} />
            <span>Selecionar Lote de XMLs</span>
          </button>

          {documents.length > 0 && (
            <button className="btn btn-danger btn-sm" onClick={onClearAllDocs} title="Limpa todas as notas fiscais do banco local">
              <Trash2 size={14} />
              <span>Limpar Documentos</span>
            </button>
          )}
        </div>
      </div>

      {/* Área de Drag & Drop para Múltiplos Arquivos */}
      <div
        style={{
          border: `2px dashed ${isDragging ? 'var(--accent-blue)' : 'var(--border-color)'}`,
          background: isDragging ? 'var(--accent-blue-glow)' : 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '2.5rem 1.5rem',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all var(--transition-fast)',
          marginBottom: '1.5rem'
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={async (e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            const folderFiles = await extractFilesFromItems(e.dataTransfer.items);
            if (folderFiles.length > 0) {
              handleFilesSelected(folderFiles);
              return;
            }
          }
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFilesSelected(e.dataTransfer.files);
          }
        }}
        onClick={handleTriggerFileInput}
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept=".xml,.XML,text/xml,application/xml"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFilesSelected(e.target.files);
            }
          }}
        />

        <div style={{ width: '56px', height: '56px', margin: '0 auto 1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)' }}>
          <UploadCloud size={28} />
        </div>

        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-highlight)', marginBottom: '0.4rem' }}>
          Arraste múltiplos arquivos XML de NF-e juntos ou clique para selecionar
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '520px', margin: '0 auto' }}>
          Selecione <strong>5, 10 ou mais notas de uma vez</strong> (ou uma pasta de XMLs). O sistema valida cada arquivo, detecta operações de entrada/saída e adiciona tudo automaticamente.
        </p>

        {isProcessing && (
          <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-blue)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <RefreshCw size={18} className="animate-spin" />
              <span>Processando lote em paralelo...</span>
            </div>
            {progressMsg && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {progressMsg}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card de Resumo Pós-Importação do Lote (Instantâneo e Claro) */}
      {batchResult && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <CheckCircle2 size={22} color="var(--accent-emerald)" />
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-highlight)', margin: 0 }}>
                  Resultado da Validação do Lote ({batchResult.summary.totalArquivos} arquivos processados)
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                  {batchResult.importedCount > 0 
                    ? `Sucesso: ${batchResult.importedCount} notas fiscais validadas e adicionadas ao repositório local.` 
                    : 'Nenhuma nova nota fiscal foi adicionada (verifique duplicidades ou erros abaixo).'}
                </p>
              </div>
            </div>

            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setBatchResult(null)}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
            >
              Fechar Resumo
            </button>
          </div>

          {/* Cards de Métricas do Lote */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.65rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>ACEITOS</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                {batchResult.summary.totalAceitos}
              </div>
            </div>

            <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '0.65rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--accent-blue)', fontWeight: 600 }}>COM RESSALVAS</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-blue)' }}>
                {batchResult.summary.totalParciais}
              </div>
            </div>

            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.65rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--accent-amber)', fontWeight: 600 }}>DUPLICADOS</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-amber)' }}>
                {batchResult.summary.totalDuplicados}
              </div>
            </div>

            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.65rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: 600 }}>INVÁLIDOS</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f87171' }}>
                {batchResult.summary.totalInvalidos}
              </div>
            </div>
          </div>

          {/* Lista Detalhada do Lote */}
          <div className="table-responsive" style={{ maxHeight: '220px', overflowY: 'auto' }}>
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Arquivo</th>
                  <th>Status</th>
                  <th>Chave de Acesso / Motivo</th>
                </tr>
              </thead>
              <tbody>
                {batchResult.summary.detalhesPorArquivo.map((detalhe, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 500, fontSize: '0.8rem', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {detalhe.fileName}
                    </td>
                    <td>
                      {detalhe.status === 'ACEITO' && <span className="badge badge-lido">Aceito</span>}
                      {detalhe.status === 'PARCIAL' && <span className="badge badge-calculado">Ressalvas</span>}
                      {detalhe.status === 'DUPLICADO' && <span className="badge badge-pendente">Já Existia</span>}
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
                    Nenhum documento cadastrado. Arraste e solte seus arquivos XML de NF-e/NFC-e acima para iniciar a análise.
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
