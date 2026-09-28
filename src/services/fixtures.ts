import { OFFICIAL_FIXTURE_XML } from './fixtureOfficialXml';
import { CompanyProfile } from '../types';

export const DEFAULT_DEMO_COMPANY: CompanyProfile = {
  id: 'empresa-demo-01',
  cnpj: '07.790.200/0001-34', // Emitente do XML oficial para testes de saída/entrada
  razaoSocial: 'INDÚSTRIA E DISTRIBUIÇÃO MODELO S/A',
  nomeFantasia: 'MODELO DISTRIBUIDORA',
  uf: 'SP',
  municipio: 'São Paulo',
  codigoMunicipioIBGE: '3550308',
  regimeTributario: 'LUCRO_REAL',
  cnaePrincipal: '46.49-4-99',
  dataCadastro: '2026-01-15T08:00:00Z',
  permiteCreditoAmplo: true
};

export const SYNTHETIC_PURCHASE_INVOICE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe35260599988877000199550010000045211987654321" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <cNF>98765432</cNF>
        <natOp>COMPRA DE INSUMOS PARA INDUSTRIALIZACAO</natOp>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>4521</nNF>
        <dhEmi>2026-05-10T14:30:00-03:00</dhEmi>
        <tpNF>1</tpNF>
        <idDest>1</idDest>
        <cMunFG>3550308</cMunFG>
        <tpImp>1</tpImp>
        <tpEmis>1</tpEmis>
      </ide>
      <emit>
        <CNPJ>99988877000199</CNPJ>
        <xNome>FORNECEDOR PAULISTA DE MATERIA PRIMA LTDA</xNome>
        <enderEmit>
          <xLgr>Avenida Industrial</xLgr>
          <nro>500</nro>
          <xBairro>Distrito Industrial</xBairro>
          <cMun>3550308</cMun>
          <xMun>Sao Paulo</xMun>
          <UF>SP</UF>
          <CEP>04000000</CEP>
        </enderEmit>
        <IE>111222333444</IE>
        <CRT>3</CRT>
      </emit>
      <dest>
        <CNPJ>07790200000134</CNPJ>
        <xNome>INDÚSTRIA E DISTRIBUIÇÃO MODELO S/A</xNome>
        <enderDest>
          <xLgr>Rua Comercial</xLgr>
          <nro>120</nro>
          <cMun>3550308</cMun>
          <xMun>Sao Paulo</xMun>
          <UF>SP</UF>
        </enderDest>
        <IE>999888777666</IE>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>MAT-001</cProd>
          <cEAN>SEM GTIN</cEAN>
          <xProd>BOBINA DE POLIPROPILENO PARA EMBALAGEM</xProd>
          <NCM>39202019</NCM>
          <CFOP>1101</CFOP>
          <uCom>KG</uCom>
          <qCom>500.0000</qCom>
          <vUnCom>18.5000</vUnCom>
          <vProd>9250.00</vProd>
          <cEANTrib>SEM GTIN</cEANTrib>
          <uTrib>KG</uTrib>
          <qTrib>500.0000</qTrib>
          <vUnTrib>18.5000</vUnTrib>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <ICMS>
            <ICMS00>
              <orig>0</orig>
              <CST>00</CST>
              <modBC>3</modBC>
              <vBC>9250.00</vBC>
              <pICMS>18.00</pICMS>
              <vICMS>1665.00</vICMS>
            </ICMS00>
          </ICMS>
          <IPI>
            <cEnq>999</cEnq>
            <IPITrib>
              <CST>50</CST>
              <vBC>9250.00</vBC>
              <pIPI>5.00</pIPI>
              <vIPI>462.50</vIPI>
            </IPITrib>
          </IPI>
          <PIS>
            <PISAliq>
              <CST>01</CST>
              <vBC>9250.00</vBC>
              <pPIS>1.65</pPIS>
              <vPIS>152.63</vPIS>
            </PISAliq>
          </PIS>
          <COFINS>
            <COFINSAliq>
              <CST>01</CST>
              <vBC>9250.00</vBC>
              <pCOFINS>7.60</pCOFINS>
              <vCOFINS>703.00</vCOFINS>
            </COFINSAliq>
          </COFINS>
        </imposto>
      </det>
      <total>
        <ICMSTot>
          <vBC>9250.00</vBC>
          <vICMS>1665.00</vICMS>
          <vICMSDeson>0.00</vICMSDeson>
          <vFCP>0.00</vFCP>
          <vBCST>0.00</vBCST>
          <vST>0.00</vST>
          <vFCPST>0.00</vFCPST>
          <vFCPSTRet>0.00</vFCPSTRet>
          <vProd>9250.00</vProd>
          <vFrete>0.00</vFrete>
          <vSeg>0.00</vSeg>
          <vDesc>0.00</vDesc>
          <vII>0.00</vII>
          <vIPI>462.50</vIPI>
          <vIPIDevol>0.00</vIPIDevol>
          <vPIS>152.63</vPIS>
          <vCOFINS>703.00</vCOFINS>
          <vOutro>0.00</vOutro>
          <vNF>9712.50</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
</nfeProc>`;

export const SYNTHETIC_RETURN_INVOICE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe35260511122233000144550010000012901999988887" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <natOp>DEVOLUCAO DE MERCADORIA RECEBIDA COM DEFEITO</natOp>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>1290</nNF>
        <dhEmi>2026-05-18T10:00:00-03:00</dhEmi>
        <tpNF>1</tpNF>
        <NFref>
          <refNFe>35260507790200000134550050001361011607304194</refNFe>
        </NFref>
      </ide>
      <emit>
        <CNPJ>11122233000144</CNPJ>
        <xNome>CLIENTE VAREJISTA COMPRADOR LTDA</xNome>
        <enderEmit>
          <xMun>Campinas</xMun>
          <UF>SP</UF>
        </enderEmit>
      </emit>
      <dest>
        <CNPJ>07790200000134</CNPJ>
        <xNome>INDÚSTRIA E DISTRIBUIÇÃO MODELO S/A</xNome>
        <enderDest>
          <xMun>Sao Paulo</xMun>
          <UF>SP</UF>
        </enderDest>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>DEV-001</cProd>
          <xProd>PRODUTO DEVOLVIDO EM GARANTIA REF ITEM 1</xProd>
          <NCM>84818099</NCM>
          <CFOP>1202</CFOP>
          <uCom>UN</uCom>
          <qCom>10.0000</qCom>
          <vUnCom>230.4000</vUnCom>
          <vProd>2304.00</vProd>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <ICMS>
            <ICMS00>
              <orig>0</orig>
              <CST>00</CST>
              <vBC>2304.00</vBC>
              <pICMS>18.00</pICMS>
              <vICMS>414.72</vICMS>
            </ICMS00>
          </ICMS>
          <PIS>
            <PISAliq>
              <CST>01</CST>
              <vBC>2304.00</vBC>
              <pPIS>1.65</pPIS>
              <vPIS>38.02</vPIS>
            </PISAliq>
          </PIS>
          <COFINS>
            <COFINSAliq>
              <CST>01</CST>
              <vBC>2304.00</vBC>
              <pCOFINS>7.60</pCOFINS>
              <vCOFINS>175.10</vCOFINS>
            </COFINSAliq>
          </COFINS>
        </imposto>
      </det>
      <total>
        <ICMSTot>
          <vBC>2304.00</vBC>
          <vICMS>414.72</vICMS>
          <vProd>2304.00</vProd>
          <vPIS>38.02</vPIS>
          <vCOFINS>175.10</vCOFINS>
          <vNF>2304.00</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
</nfeProc>`;

export const SYNTHETIC_SPECIAL_BENEFITS_XML = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe35260507790200000134550050009990011607309999" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <natOp>VENDA DE ALIMENTOS E MEDICAMENTOS COM REGIMES DIFERENCIADOS</natOp>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>999001</nNF>
        <dhEmi>2026-05-22T16:00:00-03:00</dhEmi>
        <tpNF>1</tpNF>
      </ide>
      <emit>
        <CNPJ>07790200000134</CNPJ>
        <xNome>INDÚSTRIA E DISTRIBUIÇÃO MODELO S/A</xNome>
        <enderEmit>
          <xMun>Sao Paulo</xMun>
          <UF>SP</UF>
        </enderEmit>
      </emit>
      <dest>
        <CNPJ>55444333000122</CNPJ>
        <xNome>SUPERMERCADOS E FARMACIAS DO BRASIL LTDA</xNome>
        <enderDest>
          <xMun>Ribeirao Preto</xMun>
          <UF>SP</UF>
        </enderDest>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>ALIM-001</cProd>
          <xProd>ARROZ TIPO 1 BENEFICIADO PACOTE 5KG (CESTA BASICA NACIONAL)</xProd>
          <NCM>10063021</NCM>
          <CFOP>5102</CFOP>
          <uCom>PC</uCom>
          <qCom>200.0000</qCom>
          <vUnCom>28.5000</vUnCom>
          <vProd>5700.00</vProd>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <ICMS>
            <ICMS00>
              <orig>0</orig>
              <CST>00</CST>
              <vBC>5700.00</vBC>
              <pICMS>7.00</pICMS>
              <vICMS>399.00</vICMS>
            </ICMS00>
          </ICMS>
          <PIS><PISAliq><CST>01</CST><vBC>5700.00</vBC><pPIS>1.65</pPIS><vPIS>94.05</vPIS></PISAliq></PIS>
          <COFINS><COFINSAliq><CST>01</CST><vBC>5700.00</vBC><pCOFINS>7.60</pCOFINS><vCOFINS>433.20</vCOFINS></COFINSAliq></COFINS>
        </imposto>
      </det>
      <det nItem="2">
        <prod>
          <cProd>MED-001</cProd>
          <xProd>MEDICAMENTO ESSENCIAL ANTIBIOTICO HOSPITALAR (REDUCAO 60%)</xProd>
          <NCM>30049025</NCM>
          <CFOP>5102</CFOP>
          <uCom>CX</uCom>
          <qCom>150.0000</qCom>
          <vUnCom>42.0000</vUnCom>
          <vProd>6300.00</vProd>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <ICMS>
            <ICMS00>
              <orig>0</orig>
              <CST>00</CST>
              <vBC>6300.00</vBC>
              <pICMS>18.00</pICMS>
              <vICMS>1134.00</vICMS>
            </ICMS00>
          </ICMS>
          <PIS><PISAliq><CST>01</CST><vBC>6300.00</vBC><pPIS>1.65</pPIS><vPIS>103.95</vPIS></PISAliq></PIS>
          <COFINS><COFINSAliq><CST>01</CST><vBC>6300.00</vBC><pCOFINS>7.60</pCOFINS><vCOFINS>478.80</vCOFINS></COFINSAliq></COFINS>
        </imposto>
      </det>
      <total>
        <ICMSTot>
          <vBC>12000.00</vBC>
          <vICMS>1533.00</vICMS>
          <vProd>12000.00</vProd>
          <vPIS>198.00</vPIS>
          <vCOFINS>912.00</vCOFINS>
          <vNF>12000.00</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
</nfeProc>`;

export const SYNTHETIC_CANCELED_NOTE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe35260507790200000134550050000077771607308888" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <natOp>VENDA DE MERCADORIAS (CANCELADA PELO EMITENTE)</natOp>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>7777</nNF>
        <dhEmi>2026-05-02T11:00:00-03:00</dhEmi>
        <tpNF>1</tpNF>
      </ide>
      <emit>
        <CNPJ>07790200000134</CNPJ>
        <xNome>INDÚSTRIA E DISTRIBUIÇÃO MODELO S/A</xNome>
      </emit>
      <dest>
        <CNPJ>99887766000155</CNPJ>
        <xNome>COMPRADOR DESISTENTE LTDA</xNome>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>CAN-001</cProd>
          <xProd>PRODUTO COM PEDIDO CANCELADO</xProd>
          <NCM>84818099</NCM>
          <CFOP>5102</CFOP>
          <uCom>UN</uCom>
          <qCom>1.0000</qCom>
          <vUnCom>1500.0000</vUnCom>
          <vProd>1500.00</vProd>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <ICMS><ICMS00><orig>0</orig><CST>00</CST><vBC>1500.00</vBC><pICMS>18.00</pICMS><vICMS>270.00</vICMS></ICMS00></ICMS>
        </imposto>
      </det>
      <total>
        <ICMSTot>
          <vBC>1500.00</vBC>
          <vICMS>270.00</vICMS>
          <vProd>1500.00</vProd>
          <vNF>1500.00</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
  <retEvento versao="1.00">
    <infEvento>
      <tpEvento>110111</tpEvento>
      <xEvento>Cancelamento homologado</xEvento>
      <dhRegEvento>2026-05-02T12:00:00-03:00</dhRegEvento>
    </infEvento>
  </retEvento>
</nfeProc>`;

export const ALL_INITIAL_FIXTURES = [
  { name: 'nfe_oficial_22k_14itens.xml', content: OFFICIAL_FIXTURE_XML },
  { name: 'nfe_entrada_insumos_compra.xml', content: SYNTHETIC_PURCHASE_INVOICE_XML },
  { name: 'nfe_devolucao_referenciada.xml', content: SYNTHETIC_RETURN_INVOICE_XML },
  { name: 'nfe_beneficios_cesta_medicamentos.xml', content: SYNTHETIC_SPECIAL_BENEFITS_XML },
  { name: 'nfe_cancelada_homologada.xml', content: SYNTHETIC_CANCELED_NOTE_XML }
];
