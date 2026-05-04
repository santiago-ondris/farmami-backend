import { getTermopharmaLogoDataUri } from './termopharmaLogo.js';
import { formatDateDisplay } from '../utils/formatDate.js';

function formatDate(dateValue) {
  return formatDateDisplay(dateValue);
}

function formatMoney(value) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(Number(value || 0));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildOrdenCompraHtml(ordenCompra) {
  const logoDataUri = getTermopharmaLogoDataUri();
  const bodyRows = ordenCompra.items.map((item, index) => {
    return `
      <tr>
        <td>${escapeHtml(item.numero_item || index + 1)}</td>
        <td class="producto">${escapeHtml(item.producto)}</td>
        <td>${escapeHtml(item.cantidad_pedida)}</td>
        <td>${escapeHtml(formatMoney(item.precio_unitario))}</td>
        <td>${escapeHtml(formatMoney(item.importe))}</td>
      </tr>
    `;
  }).join('');

  return `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Orden de compra ${escapeHtml(ordenCompra.numero)}</title>
        <style>
          @page {
            size: A4;
            margin: 18mm 14mm 18mm;
          }
          html, body {
            margin: 0;
            padding: 0;
          }
          body {
            font-family: Arial, Helvetica, sans-serif;
            color: #111;
            font-size: 12px;
          }
          .page {
            width: 100%;
          }
          .header {
            text-align: center;
            margin-bottom: 12px;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .logo-image {
            width: 240px;
            max-width: 100%;
            height: auto;
            display: block;
            margin: 0 auto 8px;
          }
          .header-title {
            font-size: 18px;
            font-weight: 700;
            letter-spacing: 0.4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          thead {
            display: table-header-group;
          }
          tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          th, td {
            border: 1px solid #222;
            padding: 6px 7px;
            vertical-align: middle;
          }
          th {
            background: #ececec;
            font-size: 11px;
            font-weight: 700;
            text-align: center;
          }
          td {
            font-size: 11px;
          }
          .meta-row th,
          .meta-row td {
            font-size: 11px;
          }
          .meta-row td {
            background: #fff;
          }
          .meta-row .value {
            font-weight: 700;
          }
          .left {
            text-align: left;
          }
          .center {
            text-align: center;
          }
          .right {
            text-align: right;
          }
          .producto {
            text-align: left;
            word-break: break-word;
          }
          .items-table th:nth-child(1),
          .items-table td:nth-child(1) {
            width: 10%;
            text-align: center;
          }
          .items-table th:nth-child(2),
          .items-table td:nth-child(2) {
            width: 46%;
          }
          .items-table th:nth-child(3),
          .items-table td:nth-child(3) {
            width: 14%;
            text-align: center;
          }
          .items-table th:nth-child(4),
          .items-table td:nth-child(4) {
            width: 15%;
            text-align: center;
          }
          .items-table th:nth-child(5),
          .items-table td:nth-child(5) {
            width: 15%;
            text-align: center;
          }
          .items-table tbody td {
            min-height: 24px;
            height: 24px;
          }
          .total-row td {
            font-weight: 700;
            background: #f5f5f5;
          }
          .total-label {
            text-align: right;
          }
          .footer {
            margin-top: 28px;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .footer-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 32px;
          }
          .signature-block {
            font-size: 12px;
          }
          .signature-line {
            display: inline-block;
            min-width: 210px;
            border-bottom: 1px solid #222;
            height: 20px;
            vertical-align: bottom;
          }
          .signature-note {
            margin-top: 6px;
            font-size: 10px;
            color: #555;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <section class="header">
            <img class="logo-image" src="${logoDataUri}" alt="Logo de Termopharma" />
            <div class="header-title">ORDEN DE COMPRA DROGUERIA TERMOPHARMA</div>
          </section>

          <table class="meta-table">
            <tbody>
              <tr class="meta-row">
                <th class="left" style="width: 10%;">Fecha</th>
                <td class="value center" style="width: 14%;">${escapeHtml(formatDate(ordenCompra.fecha))}</td>
                <th class="center" colspan="2" style="width: 52%;">ORDEN DE COMPRA Nro:</th>
                <td class="value center" colspan="2" style="width: 24%;">${escapeHtml(ordenCompra.numero)}</td>
              </tr>
              <tr class="meta-row">
                <th class="left" style="width: 10%;">Proveedor</th>
                <td class="value left" style="width: 30%;">${escapeHtml(ordenCompra.proveedor?.nombre || '-')}</td>
                <th class="left" style="width: 16%;">Condicion de pago</th>
                <td class="value left" style="width: 20%;">${escapeHtml(ordenCompra.condicion_pago)}</td>
                <th class="left" style="width: 12%;">Fecha de Entrega</th>
                <td class="value center" style="width: 12%;">${escapeHtml(ordenCompra.fecha_entrega ? formatDate(ordenCompra.fecha_entrega) : '-')}</td>
              </tr>
            </tbody>
          </table>

          <table class="items-table">
            <thead>
              <tr>
                <th>N° Item</th>
                <th>Producto</th>
                <th>Cantidad pedida</th>
                <th>Precio Unitario</th>
                <th>Importe</th>
              </tr>
            </thead>
            <tbody>
              ${bodyRows}
              <tr class="total-row">
                <td colspan="4" class="total-label">TOTAL</td>
                <td>${escapeHtml(formatMoney(ordenCompra.importe_total))}</td>
              </tr>
            </tbody>
          </table>

          <footer class="footer">
            <div class="footer-grid">
              <div class="signature-block">
                <div>Elaborado por: <span class="signature-line"></span></div>
                <div class="signature-note">Firma y aclaracion</div>
              </div>
              <div class="signature-block">
                <div>Aprobado por: <span class="signature-line"></span></div>
                <div class="signature-note">Firma y aclaracion</div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  `;
}
