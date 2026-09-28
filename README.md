# TribCalc Reforma • Simulador & Auditoria da Reforma Tributária

> **Aplicativo didático, auditável e offline-first para importação de documentos fiscais (NF-e/NFC-e), análise tributária item a item, confronto de entradas e saídas e simulação da transição tributária brasileira (CBS, IBS e Imposto Seletivo).**  
> *Base Legal: Emenda Constitucional nº 132/2023, Lei Complementar nº 214/2025 compilada, Lei Complementar nº 227/2026 e Decreto nº 12.955/2026.*

---

## 🎯 Objetivo & Visão do Produto

O **TribCalc Reforma** foi desenvolvido para atender pequenas e médias empresas, equipes fiscais, contadores e analistas tributários na preparação e compreensão dos impactos financeiros da transição do consumo.

### Princípio de Segurança Fiscal
O sistema mantém estrita separação entre:
1. **Lido do XML**: Valores fiscais originais dos tributos vigentes (ICMS próprio, ICMS-ST, IPI, PIS, COFINS e ISS).
2. **Regra Legal Aplicada**: Fundamentação normativa oficial, artigo da lei, vigência e versão do pacote de regras.
3. **Estimativa Calculada**: Simulações didáticas com premissas versionadas e transparentes.
4. **Pendente / Não Determinado**: Sinalização explícita quando parâmetros essenciais (como NCM ou destinação) estiverem ausentes, sem nunca fazer substituições arbitrárias.

---

## 🚀 Como Executar Localmente (Custo Zero & Sem Dependências Externas)

O aplicativo funciona em ambiente local ou auto-hospedado, sem necessidade de cartões de crédito, contas em nuvem, bancos pagos ou chaves de API.

### Pré-requisitos
- Node.js instalado (v18+)

### Passo a Passo

1. **Instalar dependências**:
   ```bash
   npm install
   ```

2. **Executar em modo de desenvolvimento**:
   ```bash
   npm run dev
   ```
   Acesse a aplicação no navegador em: `http://localhost:5173/`

3. **Gerar pacote de produção estático (opcional)**:
   ```bash
   npm run build
   ```
   Os arquivos compilados são gerados na pasta `dist/` e podem ser servidos por qualquer servidor HTTP estático (ex: `python -m http.server 3000` ou Nginx).

4. **Executar a Suíte Automatizada de Testes de Critérios de Aceite**:
   ```bash
   npx tsx tests/verifyAcceptanceCriteria.ts
   ```

---

## 📦 Módulos Funcionais Implementados

### 1. Dashboard Interativo
- **KPIs com Drill-down**: Total de Entradas, Saídas, Tributos Destacados nos XMLs, Créditos Potenciais Estimados, Simulação Reforma 2026 (Ano-Teste) e 2033 (Pleno).
- **Gráficos em SVG**: Composição tributária (Legado vs Reforma), evolução da carga ao longo da transição (2026 a 2033), Top 5 Produtos e Top 5 Parceiros Comerciais.
- **Rastreabilidade**: Clique em qualquer indicador para abrir a lista de documentos e itens que compõem o montante.

### 2. Importação e Organização de Documentos
- **Upload Seguro**: Arrastar e soltar múltiplos arquivos XML de NF-e (modelo 55) e NFC-e (modelo 65).
- **Parser Seguro contra XXE**: Executado diretamente via DOMParser do navegador, sem envio de arquivos para a internet.
- **Deduplicação Inteligente**: Verificação por chave de acesso de 44 dígitos e hash SHA-256 do arquivo. Reimportar o mesmo XML não duplica dados nem totais.
- **Prévia e Resumo**: Modal com status de cada arquivo (Aceito, Ressalvas, Duplicado, Inválido) sem descarte silencioso.
- **Detecção de Operação**: Identificação automática de Entrada/Saída cruzando o CNPJ da empresa ativa com emitente/destinatário, com botão de correção manual.
- **Tratamento de Exceções**: Devoluções e notas canceladas identificadas e isoladas dos totais de faturamento normal.

### 3. Análise de Nota & de Produto
- **Visão em Camadas**:
  - *Camada 1*: Preço do item, frete, seguro, outras despesas, descontos e base de cálculo líquida da operação.
  - *Camada 2*: Tributos destacados lidos do documento fiscal original.
  - *Camada 3*: Simulação da Reforma Tributária (CBS, IBS Estadual, IBS Municipal e Imposto Seletivo).
- **Dicas Didáticas**: Explicações de *"o que é"*, *"de onde veio"* e *"por que entrou na conta"*.
- **Memória de Cálculo Auditável**: Passo a passo reproduzível com valores de entrada, fórmulas, arredondamentos e artigos da lei.
- **Agrupamento por NCM**: Visualização condensada mantendo rastreabilidade até o item original do XML.

### 4. Confronto Entradas versus Saídas
- Comparação do período entre documentos emitidos (vendas) e recebidos (compras).
- **Aviso Analítico Regulatório**: A diferença analítica é apresentada como indicador de fluxo financeiro, *nunca como saldo oficial a pagar*.
- **Visão de Fluxo**: Entradas (Insumos) ➔ Custo/Estoque ➔ Saídas (Vendas).
- **Conciliação de Devoluções**: Vínculo visual entre a nota de devolução e a nota fiscal original referenciada (`<NFref>`).

### 5. Simulador de Impacto por Ano (2026–2033+)
- **Matriz de Transição**: Anos em colunas (Atual, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033) e tributos em linhas.
- **Cenários Comparativos**:
  - *Cenário Base*: Alíquotas médias estimadas (CBS 8,80% + IBS 17,70% = 26,50%).
  - *Cenário Conservador*: Carga superior (Total 28,00%) com margem de glosa de créditos.
  - *Cenário Otimista*: Alíquota reduzida (Total 25,00%) com eficiência plena.
- **Auditoria por Célula**: Clique em qualquer célula para exibir a norma vigente, vigência, versão e grau de certeza.
- **Análise de Fatores**: Comparativo em R$ e % contra ano-base escolhido, apontando os maiores responsáveis pela variação.

### 6. Auditoria de Qualidade Fiscal & Relatórios
- **Ferramentas de Qualidade**: Filtros de detecção para itens sem NCM, divergências de soma de itens vs total da nota, cadastros repetidos e pendências de classificação.
- **Agrupamentos Dinâmicos**: Por NCM, CFOP, Parceiro Comercial ou Mês.
- **Exportação CSV**: Arquivo estruturado compatível com Microsoft Excel e Google Planilhas.
- **Relatório Executivo Imprimível**: Layout formatado para `Imprimir / Salvar como PDF` com ressalvas normativas e cabeçalho institucional.

### 7. Governança, LGPD e Privacidade
- **Armazenamento 100% Local**: Nenhum dado fiscal é enviado para telemetria, nuvem ou modelos de linguagem (IA).
- **Backup e Restauração**: Cópia de segurança completa em arquivo JSON com 1 clique.
- **Direito ao Esquecimento**: Botão de exclusão total e segura de todos os dados locais.
- **Tabelas Normativas Editáveis**: Possibilidade de cadastrar novas regras de NCM, ajustar alíquotas de cenários e restaurar as regras oficiais com 1 clique.

---

## 🏛️ Cronograma da Reforma Tributária Representado

| Exercício | CBS Federal | IBS Compartilhado | Tributos Legados | Regra Legal |
|---|---|---|---|---|
| **2026** | 0,90% (Ano-Teste) | 0,10% (Ano-Teste) | 100% (ICMS, ISS, IPI, PIS, COFINS) | EC 132/2023, Art. 125 (Compensáveis/Dispensadas) |
| **2027–2028** | ~8,80% (Cobrança Plena) | 0,10% (Transição) | PIS/COFINS **Extintos**; IPI zerado (exceto ZFM); ICMS/ISS 100% | LC 214/2025, Arts. 56 e 58 |
| **2029** | ~8,80% | 10% da alíquota plena (~1,77%) | ICMS/ISS a 90% (redução de 10%) | EC 132/2023, Art. 128 |
| **2030** | ~8,80% | 20% da alíquota plena (~3,54%) | ICMS/ISS a 80% (redução de 20%) | EC 132/2023, Art. 128 |
| **2031** | ~8,80% | 30% da alíquota plena (~5,31%) | ICMS/ISS a 70% (redução de 30%) | EC 132/2023, Art. 128 |
| **2032** | ~8,80% | 40% da alíquota plena (~7,08%) | ICMS/ISS a 60% (redução de 40%) | EC 132/2023, Art. 128 |
| **2033+** | ~8,80% | 100% (~17,70%: 12% Est + 5,7% Mun) | ICMS, ISS e IPI **Extintos** | Modelo Definitivo Integral |

---

## 📑 Fixture Oficial & Casos de Teste Inclusos

O sistema possui carregamento integrado das seguintes fixtures para conferência imediata:
1. **Caso Oficial (Item 6 do Guia)**: NF-e processada com 14 linhas de produtos, valor total de **R$ 22.349,73** (Produtos R$ 21.709,35 + ICMS-ST R$ 640,38).
2. **NF-e de Compra (Insumos)**: Demonstração de apropriação de créditos de não-cumulatividade plena na entrada.
3. **NF-e de Devolução**: Vinculada por tag `<NFref>` para teste do módulo de conciliação.
4. **NF-e com Regimes Especiais**:
   - Alíquota Zero (Cesta Básica Nacional de Alimentos - Art. 8º da LC 214/2025).
   - Redução de 60% (Medicamentos essenciais - Art. 9º da LC 214/2025).
5. **NF-e com Evento de Cancelamento**: Teste de isolamento de notas canceladas para não impactar o faturamento.

---

## 🔒 Conformidade Legal e Fontes Oficiais

- **Lei Complementar nº 214/2025** compilada (IBS, CBS e Imposto Seletivo): [Planalto](https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214compilado.htm)
- **Lei Complementar nº 227/2026** (CGIBS e regras de repartição federativa): [Planalto](https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp227.htm)
- **Receita Federal do Brasil** (Marcos Regulatórios e Cronograma): [Receita Federal](https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/programas-e-atividades/reforma-tributaria-do-consumo)
- **Portal Nacional da NF-e** (Notas Técnicas e Manuais de Integração): [Portal NF-e](https://www.nfe.fazenda.gov.br/portal/principal.aspx)

*Este software é fornecido como ferramenta de simulação didática e preparação analítica. Toda tomada de decisão fiscal deve ser validada por contador ou advogado tributarista.*
