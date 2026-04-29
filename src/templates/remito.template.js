import { getTermopharmaLogoDataUri } from './termopharmaLogo.js';

function formatDate(dateValue) {
  return new Date(dateValue).toLocaleDateString('es-AR');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildRemitoHtml(remito) {
  const logoDataUri = getTermopharmaLogoDataUri();
  const rows = remito.items.map((item) => `
    <tr>
      <td>${escapeHtml(item.cantidad)}</td>
      <td>${escapeHtml(item.product?.nombre || item.descripcion)}</td>
      <td>${escapeHtml(item.product?.laboratorio || '-')}</td>
      <td>${escapeHtml(item.lote)}</td>
      <td>${escapeHtml(formatDate(item.vencimiento))}</td>
    </tr>
  `).join('');

  return `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Remito ${escapeHtml(remito.numero)}</title>
        <style>
          @page {
            size: A4;
            margin: 24px 28px 22px;
          }
          body {
            font-family: Arial, Helvetica, sans-serif;
            color: #1a1a1a;
            margin: 0;
            font-size: 13px;
          }
          .header {
            display: grid;
            grid-template-columns: 1fr 1fr;
            align-items: start;
            gap: 16px;
            margin-bottom: 18px;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .logo-wrap {
            text-align: center;
          }
          .logo-image {
            width: 320px;
            height: auto;
            max-width: 100%;
            margin-bottom: 10px;
            display: inline-block;
          }
          .institution {
            line-height: 1.25;
            white-space: pre-line;
            font-size: 11px;
          }
          .meta {
            text-align: right;
            line-height: 1.55;
            font-size: 14px;
          }
          .meta h1 {
            margin: 0 0 8px;
            font-size: 28px;
            letter-spacing: 0;
          }
          .client-title {
            margin: 14px 0 10px;
            font-size: 15px;
            font-weight: 700;
            text-decoration: underline;
            break-after: avoid;
            page-break-after: avoid;
          }
          ul.client-data {
            margin: 0 0 18px 18px;
            padding-left: 16px;
            line-height: 1.5;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
            font-size: 12px;
          }
          thead {
            display: table-header-group;
          }
          tbody {
            display: table-row-group;
          }
          th, td {
            border: 1px solid #444;
            padding: 5px 6px;
            vertical-align: top;
          }
          th {
            text-align: center;
            font-weight: 700;
          }
          td:nth-child(1),
          td:nth-child(4) {
            text-align: center;
            white-space: nowrap;
          }
          td:nth-child(5) {
            text-align: center;
            white-space: nowrap;
          }
          tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .footer {
            margin-top: 28px;
            padding-top: 26px;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .received {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 54px;
            gap: 16px;
          }
          .received-title {
            font-size: 14px;
            font-weight: 700;
            text-decoration: underline;
          }
          .signature-line {
            width: 220px;
            border-bottom: 1px solid #444;
            height: 24px;
          }
          .footer-note {
            text-align: center;
            font-size: 11px;
            line-height: 1.4;
          }
          @media print {
            html, body {
              width: 210mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <section class="header">
            <div>
              <div class="logo-wrap">
                <img class="logo-image" src="${logoDataUri}" alt="Logo oficial de Termopharma" />
              </div>
              <div class="institution">TERMOPHARMA
DGROUP SAS
Código: 991 NO VÁLIDO COMO FACTURA
TERMOPHARMA DGROUP SAS
CUIT: 30-71708030-7
I.B.: 285975760
Inicio Activ.: 22.02.2021
GLN: 7798459280007
IVA: RESPONSABLE INSCRIPTO</div>
            </div>
            <div class="meta">
              <h1>REMITO</h1>
              <div><strong>Nro.:</strong> ${escapeHtml(remito.numero)}</div>
              <div><strong>Tipo:</strong> ORIGINAL</div>
              <div><strong>Fecha:</strong> ${escapeHtml(formatDate(remito.fecha))}</div>
              <div><strong>Hora:</strong> ${escapeHtml(remito.hora)}</div>
            </div>
          </section>

          <div class="client-title">DATOS DEL CLIENTE</div>
          <ul class="client-data">
            <li><strong>Cliente / Razón Social:</strong> ${escapeHtml(remito.cliente.nombre)}</li>
            <li><strong>Contacto:</strong> ${escapeHtml(remito.cliente.contacto || '-')}</li>
            <li><strong>Cta:</strong> ${escapeHtml(remito.cliente.establecimiento)}</li>
            <li><strong>Dirección:</strong> ${escapeHtml(remito.cliente.direccion || '-')} - <strong>Localidad:</strong> ${escapeHtml(remito.cliente.localidad || '-')}</li>
            <li><strong>IVA:</strong> Exento <strong>CUIT:</strong> ${escapeHtml(remito.cliente.cuit || '-')}</li>
          </ul>

          <table>
            <thead>
              <tr>
                <th style="width: 12%;">CANTIDAD</th>
                <th>PRODUCTO</th>
                <th style="width: 20%;">LABORATORIO</th>
                <th style="width: 14%;">LOTE</th>
                <th style="width: 14%;">VTO.</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>

          <footer class="footer">
            <div class="received">
              <div class="received-title">RECIBIDO CONFORME:</div>
              <div class="signature-line"></div>
            </div>
            <div class="footer-note">
              HUALFIN 166 - CORDOBA ARGENTINA | CUIT: 30-71708030-7 | TEL: 3512750994 | administracion.termopharma@dgroup.com.ar
            </div>
          </footer>
        </div>
      </body>
    </html>
  `;
}
