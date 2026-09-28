import React, { useState, useMemo } from 'react';
import { 
  Download, 
  Printer, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Filter, 
  Layers, 
  FileSpreadsheet, 
  FileText,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { FiscalDocument, FiscalItem, ScenarioPremises, TaxRuleSet, CompanyProfile } from '../types';

interface DataAnalysisAndAuditTabProps {
  documents: FiscalDocument[];
  activeCompany: CompanyProfile;
  activeScenario: ScenarioPremises;
  ruleset: TaxRuleSet;
  onSelectDoc: (doc: FiscalDocument) => void;
}

type GroupByOption = 'NONE' | 'MES' | 'CFOP' | 'NCM' | 'PARCEIRO';

export const DataAnalysisAndAuditTab: React.FC<DataAnalysisAndAuditTabProps> = ({
  documents,
  activeCompany,
  activeScenario,
  ruleset,
  onSelectDoc
}) => {
  const [groupBy, setGroupBy] = useState<GroupByOption>('NONE');
  const [qualityFilter, setQualityFilter] = useState<string>('ALL'); // 'ALL' | 'SEM_NCM' | 'DIVERGENCIA_TOTAIS' | 'PENDENTE'
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Itens achatados de todos os documentos
  const allItens = useMemo(() => {
    const list: { doc: FiscalDocument; item: FiscalItem }[] = [];
    documents.forEach(doc => {
      doc.itens.forEach(item => {
        list.push({ doc, item });
      });
    });
    return list;
  }, [documents]);

  // Filtro de Qualidade Fiscal
  const filteredItens = useMemo(() => {
    return allItens.filter(({ doc, item }) => {
      // Busca
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matches = item.xProd.toLowerCase().includes(term) ||
          item.ncm.includes(term) ||
          doc.emitente.razaoSocial.toLowerCase().includes(term) ||
          doc.destinatario.razaoSocial.toLowerCase().includes(term) ||
          doc.numero.includes(term);
        if (!matches) return false;
      }

      // Qualidade
      if (qualityFilter === 'SEM_NCM') {
        return !item.ncm || item.ncm === '00000000';
      }
      if (qualityFilter === 'DIVERGENCIA_TOTAIS') {
        return doc.metadadosImportacao.divergenciasTotais && doc.metadadosImportacao.divergenciasTotais.length > 0;
      }
      if (qualityFilter === 'PENDENTE') {
        return item.classificacaoStatus !== 'CONFIRMADA';
      }

      return true;
    });
  }, [allItens, qualityFilter, searchTerm]);

  // Agrupamentos
  const groupedData = useMemo(() => {
    if (groupBy === 'NONE') return null;

    const map = new Map<string, { label: string; count: number; totalValor: number; totalIcms: number; totalReforma2033: number }>();

    filteredItens.forEach(({ doc, item }) => {
      let key = '';
      let label = '';

      if (groupBy === 'MES') {
        const d = doc.dataEmissao ? new Date(doc.dataEmissao) : new Date();
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        label = `Mês ${key}`;
      } else if (groupBy === 'CFOP') {
        key = item.cfop || 'SEM_CFOP';
        label = `CFOP ${key}`;
      } else if (groupBy === 'NCM') {
        key = item.ncm || 'SEM_NCM';
        label = `NCM ${key}`;
      } else if (groupBy === 'PARCEIRO') {
        key = doc.tipoOperacao === 'SAIDA' ? doc.destinatario.cnpjCpf : doc.emitente.cnpjCpf;
        label = doc.tipoOperacao === 'SAIDA' ? doc.destinatario.razaoSocial : doc.emitente.razaoSocial;
      }

      const cur = map.get(key) || { label, count: 0, totalValor: 0, totalIcms: 0, totalReforma2033: 0 };
      cur.count += 1;
      cur.totalValor += item.vProd;
      cur.totalIcms += item.tributosLegados.vICMS;
      const sim33 = item.simulacoesPorAno[2033];
      if (sim33) cur.totalReforma2033 += (sim33.valorCBS + sim33.valorIBSTotal + sim33.valorIS);
      map.set(key, cur);
    });

    return Array.from(map.values()).sort((a, b) => b.totalValor - a.totalValor);
  }, [filteredItens, groupBy]);

  // Exportar CSV formatado com separação de lido e simulado
  const handleExportCsv = () => {
    const headers = [
      'Documento',
      'Data Emissao',
      'Direcao',
      'Parceiro',
      'Item Num',
      'Descricao Produto',
      'NCM (Lido)',
      'CFOP (Lido)',
      'Quantidade',
      'Valor Produto (Lido)',
      'ICMS Valor (Lido)',
      'PIS Valor (Lido)',
      'COFINS Valor (Lido)',
      'CBS Valor (Simulado 2033)',
      'IBS Valor (Simulado 2033)',
      'Total Reforma 2033 (Simulado)',
      'Regra Aplicada',
      'Status Auditoria'
    ];

    const rows = filteredItens.map(({ doc, item }) => {
      const sim = item.simulacoesPorAno[2033];
      const parceiro = doc.tipoOperacao === 'SAIDA' ? doc.destinatario.razaoSocial : doc.emitente.razaoSocial;
      return [
        `NF ${doc.numero}`,
        doc.dataEmissao ? doc.dataEmissao.split('T')[0] : '',
        doc.tipoOperacao,
        `"${parceiro.replace(/"/g, '""')}"`,
        item.nItem,
        `"${item.xProd.replace(/"/g, '""')}"`,
        item.ncm,
        item.cfop,
        item.qCom,
        item.vProd.toFixed(2),
        item.tributosLegados.vICMS.toFixed(2),
        item.tributosLegados.vPIS.toFixed(2),
        item.tributosLegados.vCOFINS.toFixed(2),
        sim ? sim.valorCBS.toFixed(2) : '0.00',
        sim ? sim.valorIBSTotal.toFixed(2) : '0.00',
        sim ? (sim.valorCBS + sim.valorIBSTotal + sim.valorIS).toFixed(2) : '0.00',
        `"${(sim?.descricaoRegra || '').replace(/"/g, '""')}"`,
        item.classificacaoStatus
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tribcalc_analise_tributaria_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Imprimir Relatório Executivo
  const handlePrint = () => {
    window.print();
  };

  // Contadores de Qualidade Fiscal
  const countSemNcm = allItens.filter(({ item }) => !item.ncm || item.ncm === '00000000').length;
  const countDivergencias = documents.filter(d => d.metadadosImportacao.divergenciasTotais && d.metadadosImportacao.divergenciasTotais.length > 0).length;
  const countPendentes = allItens.filter(({ item }) => item.classificacaoStatus !== 'CONFIRMADA').length;

  return (
    <div>
      {/* Cabeçalho da Seção de Auditoria */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
            Área de Análise de Dados & Auditoria de Qualidade Fiscal
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Exploração dimensional, filtros avançados, validação de integridade cadastral e exportação de relatórios.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleExportCsv} title="Exporta dados tabulares filtrados em formato CSV compatível com Excel">
            <Download size={14} />
            <span>Exportar CSV</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={handlePrint} title="Abre tela de impressão ou salvamento em PDF com layout executivo oficial">
            <Printer size={14} />
            <span>Imprimir Relatório (PDF)</span>
          </button>
        </div>
      </div>

      {/* Relatório Executivo Formal para Impressão (Aparece no Print) */}
      <div className="print-only" style={{ display: 'none', marginBottom: '2rem' }}>
        <div style={{ borderBottom: '2px solid #000', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>TribCalc Reforma • Relatório Executivo de Diagnóstico Fiscal</h1>
          <div style={{ fontSize: '0.9rem', color: '#555' }}>
            Empresa: {activeCompany.razaoSocial} | CNPJ: {activeCompany.cnpj} | Regime: {activeCompany.regimeTributario}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#777', marginTop: '0.25rem' }}>
            Gerado em: {new Date().toLocaleString('pt-BR')} | Base Legal: LC 214/2025 compilada | Cenário: {activeScenario.nome}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.5rem', fontStyle: 'italic' }}>
            Nota: Este relatório didático separa valores fiscais lidos do XML de estimativas projetadas. Não substitui parecer de profissional contábil ou jurídico.
          </div>
        </div>
      </div>

      {/* Ferramentas de Qualidade Fiscal (Seção 4.6 do Guia) */}
      <div className="no-print" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
          Auditoria de Qualidade dos Dados XML
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button 
            className={`btn ${qualityFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setQualityFilter('ALL')}
          >
            <span>Todos os Itens ({allItens.length})</span>
          </button>

          <button 
            className={`btn ${qualityFilter === 'SEM_NCM' ? 'btn-danger' : 'btn-secondary'} btn-sm`}
            onClick={() => setQualityFilter('SEM_NCM')}
            title="Itens com NCM em branco ou com formato inválido"
          >
            <AlertTriangle size={14} />
            <span>Itens sem NCM ({countSemNcm})</span>
          </button>

          <button 
            className={`btn ${qualityFilter === 'DIVERGENCIA_TOTAIS' ? 'btn-danger' : 'btn-secondary'} btn-sm`}
            onClick={() => setQualityFilter('DIVERGENCIA_TOTAIS')}
            title="Documentos onde a soma dos itens diverge do total do documento"
          >
            <AlertTriangle size={14} />
            <span>Divergência de Totais ({countDivergencias})</span>
          </button>

          <button 
            className={`btn ${qualityFilter === 'PENDENTE' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setQualityFilter('PENDENTE')}
            title="Classificações automáticas sugeridas que aguardam confirmação do auditor"
          >
            <Sparkles size={14} />
            <span>Classificação Pendente ({countPendentes})</span>
          </button>
        </div>
      </div>

      {/* Barra de Controles de Busca e Agrupamentos */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Buscar em itens, descrições, NCM..."
              style={{ paddingLeft: '28px', width: '260px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Layers size={14} color="var(--text-muted)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Agrupar por:</span>
            <select
              className="form-control"
              style={{ fontSize: '0.8rem' }}
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupByOption)}
            >
              <option value="NONE">Sem Agrupamento (Item a Item)</option>
              <option value="NCM">Agrupar por NCM</option>
              <option value="CFOP">Agrupar por CFOP</option>
              <option value="PARCEIRO">Agrupar por Parceiro</option>
              <option value="MES">Agrupar por Mês</option>
            </select>
          </div>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Mostrando {filteredItens.length} itens analisados
        </div>
      </div>

      {/* Tabela de Dados Auditáveis */}
      <div className="table-responsive">
        {groupBy !== 'NONE' && groupedData ? (
          <table className="audit-table">
            <thead>
              <tr>
                <th>Dimensão / Grupo</th>
                <th>Quantidade de Itens</th>
                <th style={{ textAlign: 'right' }}>Total Volume (R$)</th>
                <th style={{ textAlign: 'right' }}>ICMS XML (R$)</th>
                <th style={{ textAlign: 'right' }}>Reforma Estimada 2033 (R$)</th>
              </tr>
            </thead>
            <tbody>
              {groupedData.map((grp, i) => (
                <tr key={i}>
                  <td><strong>{grp.label}</strong></td>
                  <td><span className="badge badge-calculado">{grp.count} itens</span></td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    R$ {grp.totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    R$ {grp.totalIcms.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--accent-indigo)', fontWeight: 600 }}>
                    R$ {grp.totalReforma2033.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="audit-table">
            <thead>
              <tr>
                <th>Nota</th>
                <th>Operação</th>
                <th>Item / Descrição</th>
                <th>NCM</th>
                <th>CFOP</th>
                <th style={{ textAlign: 'right' }}>Valor Item</th>
                <th>ICMS Destacado</th>
                <th>PIS/COFINS</th>
                <th>Reforma (2033)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredItens.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Nenhum item corresponde aos critérios de qualidade selecionados.
                  </td>
                </tr>
              ) : (
                filteredItens.map(({ doc, item }) => {
                  const sim = item.simulacoesPorAno[2033];
                  return (
                    <tr key={item.id} onClick={() => onSelectDoc(doc)} style={{ cursor: 'pointer' }}>
                      <td>
                        <strong>NF {doc.numero}</strong>
                      </td>
                      <td>
                        <span className={`badge ${doc.tipoOperacao === 'SAIDA' ? 'badge-saida' : 'badge-entrada'}`}>
                          {doc.tipoOperacao}
                        </span>
                      </td>
                      <td style={{ maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.xProd}>
                        {item.xProd}
                      </td>
                      <td className="font-mono" style={{ fontSize: '0.75rem' }}>
                        {item.ncm || <span style={{ color: 'var(--accent-rose)' }}>Sem NCM</span>}
                      </td>
                      <td>{item.cfop}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        R$ {item.vProd.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ fontSize: '0.78rem' }}>
                        R$ {item.tributosLegados.vICMS.toFixed(2)}
                      </td>
                      <td style={{ fontSize: '0.78rem' }}>
                        R$ {(item.tributosLegados.vPIS + item.tributosLegados.vCOFINS).toFixed(2)}
                      </td>
                      <td>
                        {sim ? (
                          <strong style={{ color: 'var(--accent-indigo)', fontSize: '0.8rem' }}>
                            R$ {(sim.valorCBS + sim.valorIBSTotal + sim.valorIS).toFixed(2)}
                          </strong>
                        ) : '-'}
                      </td>
                      <td>
                        <span className={`badge ${item.classificacaoStatus === 'CONFIRMADA' ? 'badge-lido' : 'badge-pendente'}`}>
                          {item.classificacaoStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
