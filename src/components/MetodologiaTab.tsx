import React, { useState } from 'react';
import { 
  BookOpen, 
  Scale, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Sliders, 
  Calculator, 
  FileText, 
  ExternalLink, 
  ShieldCheck, 
  Layers, 
  Percent, 
  ArrowRight, 
  Sparkles,
  ChevronRight,
  HelpCircle,
  Clock,
  Coins
} from 'lucide-react';
import { OFFICIAL_SOURCES_LINKS } from '../services/defaultRules';
import { roundCurrency } from '../services/taxReformEngine';

interface MetodologiaTabProps {
  onNavigateToTab: (tabId: string) => void;
}

export const MetodologiaTab: React.FC<MetodologiaTabProps> = ({ onNavigateToTab }) => {
  // Estado para o Sandbox Didático Interativo
  const [sandboxValor, setSandboxValor] = useState<number>(1000);
  const [sandboxIcmsPct, setSandboxIcmsPct] = useState<number>(18);
  const [sandboxPisCofinsPct, setSandboxPisCofinsPct] = useState<number>(9.25);
  const [sandboxAno, setSandboxAno] = useState<number>(2033);
  const [sandboxCbsRef, setSandboxCbsRef] = useState<number>(8.8);
  const [sandboxIbsRef, setSandboxIbsRef] = useState<number>(17.7);
  const [sandboxEstrategia, setSandboxEstrategia] = useState<'PRECO_BRUTO' | 'PRECO_DESONERADO'>('PRECO_DESONERADO');
  const [sandboxTeseIcms, setSandboxTeseIcms] = useState<'FISCO' | 'CONTRIBUINTE'>('FISCO');

  // Cálculos do Sandbox
  const impostoIcmsAtual = roundCurrency(sandboxValor * (sandboxIcmsPct / 100));
  const impostoPisCofinsAtual = roundCurrency(sandboxValor * (sandboxPisCofinsPct / 100));
  const impostoLegadoAtual = roundCurrency(impostoIcmsAtual + impostoPisCofinsAtual);
  const receitaLiquidaAtual = roundCurrency(Math.max(0, sandboxValor - impostoLegadoAtual));

  // Base do Sandbox conforme estratégia
  const baseSandbox = sandboxEstrategia === 'PRECO_DESONERADO' ? receitaLiquidaAtual : sandboxValor;

  // Alíquotas conforme o ano
  let cbsEfetivaSandbox = 0;
  let ibsEfetivaSandbox = 0;
  let fatorResidualIcms = 0;
  let fatorResidualPisCofins = 0;

  if (sandboxAno === 2026) {
    cbsEfetivaSandbox = 0.009; // 0,9%
    ibsEfetivaSandbox = 0.001; // 0,1%
    fatorResidualIcms = 1.0;
    fatorResidualPisCofins = 1.0;
  } else if (sandboxAno === 2027 || sandboxAno === 2028) {
    cbsEfetivaSandbox = Math.max(0, (sandboxCbsRef - 0.1) / 100); // 8,7% com redutor de 0,1% p.p.
    ibsEfetivaSandbox = 0.001; // 0,1%
    fatorResidualIcms = 1.0;
    fatorResidualPisCofins = 0.0;
  } else if (sandboxAno === 2029) {
    cbsEfetivaSandbox = sandboxCbsRef / 100;
    ibsEfetivaSandbox = (sandboxIbsRef / 100) * 0.10;
    fatorResidualIcms = 0.90;
    fatorResidualPisCofins = 0.0;
  } else if (sandboxAno === 2030) {
    cbsEfetivaSandbox = sandboxCbsRef / 100;
    ibsEfetivaSandbox = (sandboxIbsRef / 100) * 0.20;
    fatorResidualIcms = 0.80;
    fatorResidualPisCofins = 0.0;
  } else if (sandboxAno === 2031) {
    cbsEfetivaSandbox = sandboxCbsRef / 100;
    ibsEfetivaSandbox = (sandboxIbsRef / 100) * 0.30;
    fatorResidualIcms = 0.70;
    fatorResidualPisCofins = 0.0;
  } else if (sandboxAno === 2032) {
    cbsEfetivaSandbox = sandboxCbsRef / 100;
    ibsEfetivaSandbox = (sandboxIbsRef / 100) * 0.40;
    fatorResidualIcms = 0.60;
    fatorResidualPisCofins = 0.0;
  } else {
    // 2033
    cbsEfetivaSandbox = sandboxCbsRef / 100;
    ibsEfetivaSandbox = sandboxIbsRef / 100;
    fatorResidualIcms = 0.0;
    fatorResidualPisCofins = 0.0;
  }

  const valorCbsSandbox = roundCurrency(baseSandbox * cbsEfetivaSandbox);
  const valorIbsSandbox = roundCurrency(baseSandbox * ibsEfetivaSandbox);
  const somaCbsIbsSandbox = valorCbsSandbox + valorIbsSandbox;

  // ICMS Residual com Teses
  const effectiveIcmsRateSandbox = (sandboxIcmsPct / 100) * fatorResidualIcms;
  let valorIcmsResidualSandbox = 0;
  let contingenciaSandbox = 0;

  if (fatorResidualPisCofins === 0 && effectiveIcmsRateSandbox > 0) {
    const vProdFisco = (baseSandbox + effectiveIcmsRateSandbox * somaCbsIbsSandbox) / (1 - effectiveIcmsRateSandbox);
    const taxIcmsFisco = roundCurrency((vProdFisco + somaCbsIbsSandbox) * effectiveIcmsRateSandbox);

    const vProdContrib = baseSandbox / (1 - effectiveIcmsRateSandbox);
    const taxIcmsContrib = roundCurrency(vProdContrib * effectiveIcmsRateSandbox);

    contingenciaSandbox = roundCurrency(Math.max(0, taxIcmsFisco - taxIcmsContrib));
    valorIcmsResidualSandbox = sandboxTeseIcms === 'FISCO' ? taxIcmsFisco : taxIcmsContrib;
  } else {
    valorIcmsResidualSandbox = roundCurrency(impostoIcmsAtual * fatorResidualIcms);
  }

  // PIS/COFINS Residual com compensação de 2026
  let valorPisCofinsResidualSandbox = roundCurrency(impostoPisCofinsAtual * fatorResidualPisCofins);
  if (sandboxAno === 2026) {
    valorPisCofinsResidualSandbox = Math.max(0, roundCurrency(valorPisCofinsResidualSandbox - somaCbsIbsSandbox));
  }

  const cargaTotalSandbox = roundCurrency(valorCbsSandbox + valorIbsSandbox + valorIcmsResidualSandbox + valorPisCofinsResidualSandbox);
  const diferencaVsAtualSandbox = roundCurrency(cargaTotalSandbox - impostoLegadoAtual);

  return (
    <div className="metodologia-tab-container" style={{ animation: 'fadeIn 0.3s ease' }}>
      
      {/* Header Principal do Guia */}
      <div className="page-header-banner" style={{ borderLeft: '4px solid var(--accent-indigo)' }}>
        <div className="page-header-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <BookOpen size={24} color="var(--accent-indigo)" />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-highlight)' }}>
              Guia Metodológico Completo & Base Legal da Reforma Tributária
            </h2>
          </div>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '850px' }}>
            Documentação técnica auditável com a fundamentação de 100% dos cálculos do sistema conforme a 
            <strong> Emenda Constitucional nº 132/2023</strong>, a <strong>Lei Complementar nº 214/2025</strong> e a 
            <strong> Lei Complementar nº 227/2026</strong>.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-sm" onClick={() => onNavigateToTab('simulador')}>
            <Calculator size={14} />
            <span>Ir para Simulador</span>
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigateToTab('dashboard')}>
            <TrendingUp size={14} />
            <span>Ver Dashboard</span>
          </button>
        </div>
      </div>

      {/* Grid de Pilares Estruturais da Reforma */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <div className="card" style={{ padding: '1rem', borderLeft: '3px solid var(--accent-blue)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', color: 'var(--accent-blue)', fontWeight: 700 }}>
            <Percent size={18} />
            <span>Cálculo "Por Fora"</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
            Fim do imposto por dentro (Art. 12, §2º da LC 214/25). A CBS e o IBS não integram suas próprias bases de cálculo nem a base recíproca.
          </p>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '3px solid var(--accent-emerald)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
            <ShieldCheck size={18} />
            <span>Não-Cumulatividade Plena</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
            Crédito financeiro amplo (Art. 28 da LC 214/25). Todo bem ou serviço tributado adquirido na atividade gera apropriação direta de crédito.
          </p>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '3px solid var(--accent-indigo)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', color: 'var(--accent-indigo)', fontWeight: 700 }}>
            <Coins size={18} />
            <span>Tributação no Destino</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
            O IBS pertence integralmente ao Estado e Município onde ocorre o consumo final da mercadoria ou serviço (EC 132/23, Art. 149-B).
          </p>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '3px solid var(--accent-amber)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', color: 'var(--accent-amber)', fontWeight: 700 }}>
            <Clock size={18} />
            <span>Transição 2026–2033</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
            Convivência progressiva de 7 anos entre tributos velhos e novos (Art. 125 a 129 da EC 132/23), garantindo segurança de arrecadação.
          </p>
        </div>
      </div>

      {/* SEÇÃO 1: A BASE DE CÁLCULO E AS DUAS ESTRATÉGIAS COMERCIAIS */}
      <div className="chart-card" style={{ marginBottom: '1.75rem' }}>
        <div className="chart-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Scale size={18} color="var(--accent-blue)" />
            <span>1. A Base de Cálculo: Preço Bruto vs Preço Desonerado (Metodologia MGK)</span>
          </div>
          <span className="badge badge-calculado">Art. 12 da LC 214/2025</span>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
          O <strong>Artigo 12 da Lei Complementar nº 214/2025</strong> determina taxativamente:
          <blockquote style={{ borderLeft: '3px solid var(--accent-blue)', margin: '0.75rem 0', padding: '0.5rem 1rem', background: 'var(--bg-secondary)', fontStyle: 'italic', color: 'var(--text-primary)' }}>
            "A base de cálculo do IBS e da CBS é o valor da operação sobre o qual incidem os tributos, compreendendo os acréscimos decorrentes de frete, seguro e demais despesas acessórias cobradas do adquirente."
          </blockquote>
          Entretanto, na transição tributária, surge a **maior divergência de mercado** entre ferramentas de projeção:
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
          {/* Modelo Preço Bruto */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-highlight)' }}>
                Estratégia A: Preço Bruto Contratual
              </h4>
              <span className="badge badge-saida">Status Quo</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Assume que a empresa **mantém seu preço de tabela nominal atual**. A CBS e o IBS incidem sobre o valor total faturado no documento.
            </p>
            <div style={{ background: 'var(--bg-card)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontFamily: 'monospace', fontSize: '0.78rem', marginBottom: '0.75rem' }}>
              Base = vProd - vDesc + vFrete + vSeg + vOutro
            </div>
            <ul style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', margin: 0, lineHeight: 1.5 }}>
              <li><strong>Cenário Comercial:</strong> Empresa mantém o preço final ao cliente para expandir sua margem líquida.</li>
              <li><strong>Efeito Fiscal:</strong> Carga aparente futura mais elevada, pois 26,5% incidem sobre o preço que antes embutia impostos.</li>
              <li><strong>Valor na NF-e de Teste (2033):</strong> R$ 5.752,99 (sobre R$ 21.709,35).</li>
            </ul>
          </div>

          {/* Modelo Preço Desonerado */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--accent-emerald)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                Estratégia B: Receita Líquida Alvo (MGK)
              </h4>
              <span className="badge badge-lido">Mercado Competitivo</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Assume que a empresa **desonera integralmente o preço**, expurgando os tributos antigos (PIS, COFINS, ICMS) para manter sua margem líquida intacta.
            </p>
            <div style={{ background: 'var(--bg-card)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontFamily: 'monospace', fontSize: '0.78rem', marginBottom: '0.75rem' }}>
              Base = Valor Operação - (ICMS + ISS + PIS + COFINS + IPI)
            </div>
            <ul style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', margin: 0, lineHeight: 1.5 }}>
              <li><strong>Cenário Comercial:</strong> Mercados altamente concorrenciais onde a redução de custo é repassada ao adquirente.</li>
              <li><strong>Efeito Fiscal:</strong> Carga nominal mais baixa, pois CBS e IBS incidem sobre a receita líquida desonerada.</li>
              <li><strong>Valor na NF-e de Teste (2033):</strong> R$ 4.314,11 (sobre R$ 16.279,66 - bate 100% com o TaxReform.AI).</li>
            </ul>
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: CRONOGRAMA DE TRANSIÇÃO (2026 A 2033) */}
      <div className="chart-card" style={{ marginBottom: '1.75rem' }}>
        <div className="chart-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} color="var(--accent-emerald)" />
            <span>2. O Cronograma Oficial da Transição Federativa (2026–2033)</span>
          </div>
          <span className="badge badge-calculado">EC 132/2023, Arts. 125 a 129</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', padding: '0.5rem 0' }}>
          
          {/* 2026 */}
          <div style={{ background: 'var(--bg-secondary)', borderLeft: '3px solid var(--accent-blue)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
              <strong style={{ color: 'var(--text-highlight)', fontSize: '0.95rem' }}>2026: Ano-Teste Operacional</strong>
              <span className="badge badge-lido">Art. 125 EC 132</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--accent-blue)', fontWeight: 600, marginBottom: '0.4rem' }}>
              CBS: 0,90% • IBS: 0,10% (Total 1,00% Compensável)
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Fase de teste para homologação dos sistemas da Receita Federal e do Comitê Gestor. O 1,0% pago é <strong>integralmente compensável no PIS e na COFINS</strong> devidos pelo contribuinte, com efeito de caixa neutro.
            </p>
          </div>

          {/* 2027-2028 */}
          <div style={{ background: 'var(--bg-secondary)', borderLeft: '3px solid var(--accent-indigo)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
              <strong style={{ color: 'var(--text-highlight)', fontSize: '0.95rem' }}>2027–2028: Entrada Federal</strong>
              <span className="badge badge-calculado">Art. 126/127 EC 132</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--accent-indigo)', fontWeight: 600, marginBottom: '0.4rem' }}>
              CBS: 8,70% (-0,1% p.p.) • IBS: 0,10% • PIS/COFINS Extintos
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Cobrança efetiva da CBS federal. PIS e COFINS são extintos definitivamente. IPI é reduzido a zero para mercadorias em geral (exceto com industrialização na ZFM). A alíquota da CBS é deduzida em 0,1% p.p.
            </p>
          </div>

          {/* 2029-2032 */}
          <div style={{ background: 'var(--bg-secondary)', borderLeft: '3px solid var(--accent-amber)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
              <strong style={{ color: 'var(--text-highlight)', fontSize: '0.95rem' }}>2029–2032: Transição Subnacional</strong>
              <span className="badge badge-warning">Art. 128 EC 132</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--accent-amber)', fontWeight: 600, marginBottom: '0.4rem' }}>
              ICMS/ISS caindo de 90% a 60% • IBS subindo de 10% a 40%
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Substituição gradual dos tributos estaduais e municipais:
              <br />• <strong>2029:</strong> 90% ICMS/ISS + 10% IBS
              <br />• <strong>2030:</strong> 80% ICMS/ISS + 20% IBS
              <br />• <strong>2031:</strong> 70% ICMS/ISS + 30% IBS
              <br />• <strong>2032:</strong> 60% ICMS/ISS + 40% IBS
            </p>
          </div>

          {/* 2033 */}
          <div style={{ background: 'var(--bg-secondary)', borderLeft: '3px solid var(--accent-rose)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
              <strong style={{ color: 'var(--text-highlight)', fontSize: '0.95rem' }}>2033: Modelo Pleno Definitivo</strong>
              <span className="badge badge-saida">Art. 129 EC 132</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--accent-rose)', fontWeight: 600, marginBottom: '0.4rem' }}>
              CBS Plena (8,8%) • IBS Pleno (17,7%) • Extinção Total do Legado
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Conclusão da reforma tributária de consumo no Brasil. Extinção total de ICMS, ISS e IPI (exceto ZFM). Não-cumulatividade plena com apuração via split payment e alíquota de referência global (~26,50%).
            </p>
          </div>

        </div>
      </div>

      {/* SEÇÃO 3: CONTROVÉRSIA JURÍDICA DO ICMS RESIDUAL */}
      <div className="chart-card" style={{ marginBottom: '1.75rem' }}>
        <div className="chart-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} color="var(--accent-amber)" />
            <span>3. A Controvérsia Jurídica do ICMS Residual (2027 a 2032)</span>
          </div>
          <span className="badge badge-warning">Gross-up SEFAZ/SP vs PLP 16/25</span>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
          A partir de 2027, com o fim do PIS e da COFINS, o ICMS continua em vigor até 2032. Por ser um tributo que incide <em>"por dentro"</em>, surgiu um impasse bilionário entre as Fazendas Estaduais e os Contribuintes:
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-rose)', marginBottom: '0.4rem' }}>
              🏛️ Tese do Fisco (SEFAZ/SP - Resposta à Consulta 32.303/2025)
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Os estados defendem que a CBS e o IBS compõem o valor da operação e, portanto, <strong>devem integrar a base de cálculo por dentro do ICMS</strong>.
            </p>
            <div style={{ background: 'var(--bg-card)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', fontFamily: 'monospace', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
              vProd = (Base + tICMS × (CBS + IBS)) ÷ (1 - tICMS)
              <br />
              ICMS = (vProd + CBS + IBS) × tICMS
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-rose)' }}>Resultado: ICMS residual mais alto e maior arrecadação estadual.</span>
          </div>

          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: '0.4rem' }}>
              ⚖️ Tese do Contribuinte (PLP 16/2025)
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              O setor produtivo sustenta que a Constituição veda bitributação e que CBS e IBS <strong>NÃO podem integrar a base de cálculo do ICMS residual</strong>.
            </p>
            <div style={{ background: 'var(--bg-card)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', fontFamily: 'monospace', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
              vProd = Base ÷ (1 - tICMS)
              <br />
              ICMS = vProd × tICMS
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>Resultado: Redução na carga e eliminação de imposto sobre imposto.</span>
          </div>
        </div>

        <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(245, 158, 11, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245, 158, 11, 0.25)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--accent-amber)' }}>Como nosso app trata essa questão:</strong> O sistema calcula a diferença exata entre as duas teses e exibe o indicador de <strong>Contingência Fiscal</strong> no Simulador. Assim, o departamento jurídico e contábil da sua empresa sabe exatamente qual é o risco em reais de adotar uma ou outra posição.
        </div>
      </div>

      {/* SEÇÃO 4: SANDBOX DIDÁTICO INTERATIVO */}
      <div className="chart-card" style={{ marginBottom: '1.75rem', border: '1px solid var(--accent-indigo)' }}>
        <div className="chart-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calculator size={18} color="var(--accent-indigo)" />
            <span>4. Sandbox Didático Interativo (Simule Qualquer Valor em Tempo Real)</span>
          </div>
          <span className="badge badge-calculado">Simulador Passo a Passo</span>
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Altere os parâmetros abaixo para ver as fórmulas e o desdobramento matemático em tempo real:
        </div>

        {/* Controles do Sandbox */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
          <div>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Valor da Operação (R$):</label>
            <input 
              type="number" 
              className="form-control" 
              value={sandboxValor} 
              onChange={(e) => setSandboxValor(Math.max(1, parseFloat(e.target.value) || 0))}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>ICMS Atual (%):</label>
            <input 
              type="number" 
              step="0.5" 
              className="form-control" 
              value={sandboxIcmsPct} 
              onChange={(e) => setSandboxIcmsPct(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>PIS + COFINS (%):</label>
            <input 
              type="number" 
              step="0.25" 
              className="form-control" 
              value={sandboxPisCofinsPct} 
              onChange={(e) => setSandboxPisCofinsPct(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Ano da Transição:</label>
            <select 
              className="form-control" 
              value={sandboxAno} 
              onChange={(e) => setSandboxAno(Number(e.target.value))}
            >
              {[2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Estratégia de Preço:</label>
            <select 
              className="form-control" 
              value={sandboxEstrategia} 
              onChange={(e) => setSandboxEstrategia(e.target.value as any)}
            >
              <option value="PRECO_DESONERADO">Desonerado (Líquido)</option>
              <option value="PRECO_BRUTO">Preço Bruto (Art. 12)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Tese ICMS (2027+):</label>
            <select 
              className="form-control" 
              value={sandboxTeseIcms} 
              onChange={(e) => setSandboxTeseIcms(e.target.value as any)}
            >
              <option value="FISCO">Tese do Fisco (SP)</option>
              <option value="CONTRIBUINTE">Contribuinte (PLP 16)</option>
            </select>
          </div>
        </div>

        {/* Resultados Passo a Passo do Sandbox */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          
          {/* Caixa 1: Composição da Base */}
          <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Passo 1: Base de Cálculo</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-blue)', margin: '0.25rem 0' }}>
              R$ {baseSandbox.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {sandboxEstrategia === 'PRECO_DESONERADO' ? (
                <>Preço bruto (R$ {sandboxValor.toFixed(2)}) menos tributos legados (R$ {impostoLegadoAtual.toFixed(2)}).</>
              ) : (
                <>Valor integral negociado da operação (sem exclusão de tributos legados).</>
              )}
            </div>
          </div>

          {/* Caixa 2: Tributos Novos (CBS + IBS) */}
          <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Passo 2: CBS + IBS ({sandboxAno})</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-indigo)', margin: '0.25rem 0' }}>
              R$ {somaCbsIbsSandbox.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              CBS ({(cbsEfetivaSandbox * 100).toFixed(2)}%): R$ {valorCbsSandbox.toFixed(2)} | IBS ({(ibsEfetivaSandbox * 100).toFixed(2)}%): R$ {valorIbsSandbox.toFixed(2)}
            </div>
          </div>

          {/* Caixa 3: Residual Legado */}
          <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Passo 3: Tributos Legados Residuais</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-amber)', margin: '0.25rem 0' }}>
              R$ {(valorIcmsResidualSandbox + valorPisCofinsResidualSandbox).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              ICMS Residual: R$ {valorIcmsResidualSandbox.toFixed(2)} | PIS/COFINS: R$ {valorPisCofinsResidualSandbox.toFixed(2)}
              {contingenciaSandbox > 0 && (
                <div style={{ color: 'var(--accent-rose)', fontWeight: 600, marginTop: '2px' }}>
                  Contingência Fisco vs Contribuinte: ± R$ {contingenciaSandbox.toFixed(2)}
                </div>
              )}
            </div>
          </div>

          {/* Caixa 4: Carga Total e Variação */}
          <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Resultado: Carga Total Projetada</span>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: diferencaVsAtualSandbox <= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)', margin: '0.25rem 0' }}>
              R$ {cargaTotalSandbox.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Variação vs Tributo Atual (R$ {impostoLegadoAtual.toFixed(2)}):{' '}
              <strong style={{ color: diferencaVsAtualSandbox <= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                {diferencaVsAtualSandbox > 0 ? '+' : ''} R$ {diferencaVsAtualSandbox.toFixed(2)} ({impostoLegadoAtual > 0 ? ((diferencaVsAtualSandbox / impostoLegadoAtual) * 100).toFixed(1) : 0}%)
              </strong>
            </div>
          </div>

        </div>
      </div>

      {/* SEÇÃO 5: REGIMES DIFERENCIADOS POR NCM */}
      <div className="chart-card" style={{ marginBottom: '1.75rem' }}>
        <div className="chart-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={18} color="var(--accent-blue)" />
            <span>5. Regimes Diferenciados, Isenções e Alíquotas Reduzidas por NCM</span>
          </div>
          <span className="badge badge-lido">LC 214/2025, Arts. 8º a 18</span>
        </div>

        <div className="table-responsive">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Regime Especial</th>
                <th>Alíquota Efetiva / Redução</th>
                <th>Base Legal</th>
                <th>Exemplos de Produtos / Setores</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Cesta Básica Nacional de Alimentos</strong></td>
                <td><span className="badge badge-lido">Alíquota Zero (100% redução)</span></td>
                <td>Art. 8º da LC 214/2025, Anexo I</td>
                <td>Arroz, feijão, leite UHT, café, farinha de mandioca, pão comum, carnes bovinas e aves.</td>
              </tr>
              <tr>
                <td><strong>Saúde, Medicamentos e Educação</strong></td>
                <td><span className="badge badge-calculado">Redução de 60% (~10,60%)</span></td>
                <td>Art. 9º da LC 214/2025, Anexo II</td>
                <td>Medicamentos essenciais, dispositivos médicos, serviços hospitalares, ensino fundamental e superior.</td>
              </tr>
              <tr>
                <td><strong>Profissões Regulamentadas</strong></td>
                <td><span className="badge badge-calculado">Redução de 30% (~18,55%)</span></td>
                <td>Art. 10 da LC 214/2025</td>
                <td>Advogados, médicos, contadores, engenheiros, arquitetos (prestação pessoal de serviços).</td>
              </tr>
              <tr>
                <td><strong>Combustíveis e Lubrificantes</strong></td>
                <td><span className="badge badge-pendente">Regime Monofásico Ad Rem</span></td>
                <td>Art. 15 da LC 214/2025</td>
                <td>Gasolina, diesel, etanol e gás liquefeito de petróleo (GLP), tributados por unidade de medida.</td>
              </tr>
              <tr>
                <td><strong>Imposto Seletivo (IS - "Imposto do Pecado")</strong></td>
                <td><span className="badge badge-saida">Alíquota Variável Adicional</span></td>
                <td>Art. 18 da LC 214/2025</td>
                <td>Cigarros, bebidas alcoólicas, bebidas açucaradas, veículos poluentes e extração mineral.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SEÇÃO 6: LINKS OFICIAIS E LEGISLAÇÃO COMPILADA */}
      <div className="chart-card">
        <div className="chart-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} color="var(--accent-emerald)" />
            <span>6. Repositório de Legislação Oficial & Normas Compiladas</span>
          </div>
          <span className="badge badge-lido">Fontes Oficiais</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {OFFICIAL_SOURCES_LINKS.map((link, idx) => (
            <a 
              key={idx} 
              href={link.url} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                textDecoration: 'none', 
                background: 'var(--bg-secondary)', 
                border: '1px solid var(--border-color)', 
                borderRadius: 'var(--radius-md)', 
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                color: 'inherit'
              }}
              className="official-link-card"
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--accent-blue)' }}>{link.titulo}</strong>
                  <ExternalLink size={14} color="var(--accent-blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>{link.orgao}</div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  {link.descricao}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-emerald)', fontSize: '0.72rem', marginTop: '0.75rem', fontWeight: 600 }}>
                <span>Acessar texto compilado no Planalto / Receita</span>
                <ChevronRight size={13} />
              </div>
            </a>
          ))}
        </div>
      </div>

    </div>
  );
};
