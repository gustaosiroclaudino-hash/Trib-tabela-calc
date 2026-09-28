import React from 'react';
import { Filter, Search, RotateCcw, Calendar, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { FilterState } from '../types';

interface FilterBarProps {
  filter: FilterState;
  onChangeFilter: (newFilter: FilterState) => void;
  availableUfs: string[];
  totalFilteredDocs: number;
  totalAllDocs: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  onChangeFilter,
  availableUfs,
  totalFilteredDocs,
  totalAllDocs
}) => {
  const handleReset = () => {
    onChangeFilter({
      direcao: 'TODAS',
      statusSituacao: 'TODAS',
      statusRevisao: 'TODOS',
      termoBusca: '',
      uf: '',
      periodoInicio: '',
      periodoFim: ''
    });
  };

  const isFiltered = filter.direcao !== 'TODAS' || 
    Boolean(filter.termoBusca) || 
    Boolean(filter.uf) || 
    Boolean(filter.periodoInicio) || 
    Boolean(filter.periodoFim) ||
    filter.statusSituacao !== 'TODAS';

  return (
    <div className="filter-bar-card">
      <div className="filter-inputs-group">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.8rem' }}>
          <Filter size={15} />
          <span>Filtros:</span>
        </div>

        {/* Busca por Texto */}
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Buscar nota, parceiro, chave, produto..."
            style={{ paddingLeft: '28px', width: '240px' }}
            value={filter.termoBusca || ''}
            onChange={(e) => onChangeFilter({ ...filter, termoBusca: e.target.value })}
          />
        </div>

        {/* Direção Operação */}
        <select
          className="form-control"
          value={filter.direcao || 'TODAS'}
          onChange={(e) => onChangeFilter({ ...filter, direcao: e.target.value as any })}
        >
          <option value="TODAS">Direção: Todas (Entrada & Saída)</option>
          <option value="ENTRADA">Apenas Entradas (Compras/Insumos)</option>
          <option value="SAIDA">Apenas Saídas (Vendas/Faturamento)</option>
        </select>

        {/* Situação */}
        <select
          className="form-control"
          value={filter.statusSituacao || 'TODAS'}
          onChange={(e) => onChangeFilter({ ...filter, statusSituacao: e.target.value as any })}
        >
          <option value="TODAS">Situação: Todas</option>
          <option value="AUTORIZADA">Apenas Autorizadas</option>
          <option value="DEVOLUCAO">Devoluções de Mercadoria</option>
          <option value="CANCELADA">Canceladas</option>
        </select>

        {/* UF */}
        {availableUfs.length > 0 && (
          <select
            className="form-control"
            value={filter.uf || ''}
            onChange={(e) => onChangeFilter({ ...filter, uf: e.target.value })}
          >
            <option value="">UF: Todas</option>
            {availableUfs.map(uf => (
              <option key={uf} value={uf}>{uf}</option>
            ))}
          </select>
        )}

        {/* Período */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Calendar size={14} color="var(--text-muted)" />
          <input
            type="date"
            className="form-control"
            style={{ width: '130px', fontSize: '0.78rem' }}
            value={filter.periodoInicio || ''}
            onChange={(e) => onChangeFilter({ ...filter, periodoInicio: e.target.value })}
            title="Data Inicial"
          />
          <span style={{ color: 'var(--text-muted)' }}>até</span>
          <input
            type="date"
            className="form-control"
            style={{ width: '130px', fontSize: '0.78rem' }}
            value={filter.periodoFim || ''}
            onChange={(e) => onChangeFilter({ ...filter, periodoFim: e.target.value })}
            title="Data Final"
          />
        </div>

        {isFiltered && (
          <button 
            className="btn btn-secondary btn-sm"
            onClick={handleReset}
            title="Limpar todos os filtros"
            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
          >
            <RotateCcw size={13} />
            <span>Limpar</span>
          </button>
        )}
      </div>

      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        Mostrando <strong style={{ color: 'var(--text-primary)' }}>{totalFilteredDocs}</strong> de {totalAllDocs} notas fiscais
      </div>
    </div>
  );
};
