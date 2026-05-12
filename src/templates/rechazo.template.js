import { getTermopharmaLogoDataUri } from './termopharmaLogo.js';
import { formatDateDisplay } from '../utils/formatDate.js';

function formatDate(dateValue) {
  return formatDateDisplay(dateValue);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatProviderValue(value) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return value;
}

export function buildRechazoHtml(rechazo) {
  const logoDataUri = getTermopharmaLogoDataUri();
  const proveedor = rechazo.proveedor || {};
  const proveedorFields = [
    ['Numero', proveedor.numero],
    ['Nombre', proveedor.nombre],
    ['Tipo', proveedor.tipo],
    ['Producto o servicio', proveedor.producto_o_servicio],
    ['Direccion', proveedor.direccion],
    ['CUIT', proveedor.cuit],
    ['GLN', proveedor.gln],
    ['Nombre de contacto', proveedor.nombre_contacto],
    ['Telefono de contacto', proveedor.telefono_contacto],
    ['Documentacion completa', proveedor.documentacion_completa ? 'Si' : 'No'],
    ['Observaciones', proveedor.observaciones]
  ];

  return `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Rechazo ${escapeHtml(rechazo.id)}</title>
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
            display: grid;
            grid-template-columns: 1.3fr 1fr;
            gap: 18px;
            align-items: start;
            margin-bottom: 18px;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .logo-image {
            width: 240px;
            max-width: 100%;
            height: auto;
            display: block;
            margin-bottom: 10px;
          }
          .issuer {
            font-size: 11px;
            line-height: 1.45;
            white-space: pre-line;
          }
          .meta-card {
            border: 1px solid #222;
            padding: 14px 16px;
          }
          .meta-card h1 {
            margin: 0 0 10px;
            font-size: 24px;
            letter-spacing: 0.4px;
            text-align: right;
          }
          .meta-list {
            display: grid;
            gap: 6px;
            font-size: 12px;
            line-height: 1.4;
          }
          .section {
            margin-top: 18px;
          }
          .section.no-break {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .section-title {
            margin: 0 0 10px;
            padding-bottom: 6px;
            border-bottom: 2px solid #222;
            font-size: 14px;
            font-weight: 700;
            letter-spacing: 0.6px;
          }
          .detail-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px 14px;
          }
          .detail-card {
            border: 1px solid #d1d5db;
            padding: 10px 12px;
            min-height: 54px;
          }
          .detail-card.full {
            grid-column: 1 / -1;
          }
          .detail-label {
            display: block;
            margin-bottom: 5px;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #555;
          }
          .detail-value {
            font-size: 13px;
            line-height: 1.45;
            word-break: break-word;
          }
          .summary-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
          }
          .summary-table th,
          .summary-table td {
            border: 1px solid #222;
            padding: 8px 9px;
            vertical-align: top;
          }
          .summary-table th {
            background: #ececec;
            text-align: left;
            font-size: 11px;
            font-weight: 700;
          }
          .summary-table td {
            font-size: 12px;
          }
          .footer {
            margin-top: 30px;
            font-size: 10px;
            color: #555;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <section class="header">
            <div>
              <img class="logo-image" src="${logoDataUri}" alt="Logo de Termopharma" />
              <div class="issuer">TERMOPHARMA
DGROUP SAS
Registro interno de control de calidad
CUIT: 30-71708030-7
GLN: 7798459280007</div>
            </div>
            <div class="meta-card">
              <h1>RECHAZO</h1>
              <div class="meta-list">
                <div><strong>Fecha:</strong> ${escapeHtml(formatDate(rechazo.fecha))}</div>
                <div><strong>Proveedor:</strong> ${escapeHtml(proveedor.nombre || '-')}</div>
                <div><strong>Remito:</strong> ${escapeHtml(rechazo.remito || '-')}</div>
                <div><strong>Registro:</strong> ${escapeHtml(rechazo.id)}</div>
              </div>
            </div>
          </section>

          <section class="section no-break">
            <h2 class="section-title">DATOS GENERALES</h2>
            <div class="detail-grid">
              <div class="detail-card">
                <span class="detail-label">Proveedor</span>
                <div class="detail-value">${escapeHtml(proveedor.nombre || '-')}</div>
              </div>
              <div class="detail-card">
                <span class="detail-label">Remito</span>
                <div class="detail-value">${escapeHtml(rechazo.remito || '-')}</div>
              </div>
              <div class="detail-card">
                <span class="detail-label">Fecha</span>
                <div class="detail-value">${escapeHtml(formatDate(rechazo.fecha))}</div>
              </div>
            </div>
          </section>

          <section class="section">
            <h2 class="section-title">DATOS DEL PROVEEDOR</h2>
            <div class="detail-grid">
              ${proveedorFields.map(([label, value]) => `
                <div class="detail-card${label === 'Observaciones' ? ' full' : ''}">
                  <span class="detail-label">${escapeHtml(label)}</span>
                  <div class="detail-value">${escapeHtml(formatProviderValue(value))}</div>
                </div>
              `).join('')}
            </div>
          </section>

          <section class="section">
            <h2 class="section-title">PRODUCTOS RECHAZADOS</h2>
            <table class="summary-table">
              <thead>
                <tr>
                  <th style="width: 5%; text-align: center;">#</th>
                  <th style="width: 32%;">Producto</th>
                  <th style="width: 14%;">Lote</th>
                  <th style="width: 14%;">Cantidad</th>
                  <th style="width: 35%;">Motivo</th>
                </tr>
              </thead>
              <tbody>
                ${(rechazo.items || []).map((item, index) => `
                  <tr>
                    <td style="text-align: center;">${index + 1}</td>
                    <td>${escapeHtml(item.product?.nombre || '-')}</td>
                    <td>${escapeHtml(item.lote)}</td>
                    <td>${escapeHtml(item.cantidad)}</td>
                    <td>${escapeHtml(item.motivo_rechazo)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </section>
        </div>
      </body>
    </html>
  `;
}
