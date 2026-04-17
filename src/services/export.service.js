import ExcelJS from 'exceljs';

const PRIMARY_COLOR = 'FF2D3748';
const HEADER_FONT_COLOR = 'FFFFFFFF';
const BORDER_STYLE = {
  top: { style: 'thin', color: { argb: 'FFCBD5E0' } },
  left: { style: 'thin', color: { argb: 'FFCBD5E0' } },
  bottom: { style: 'thin', color: { argb: 'FFCBD5E0' } },
  right: { style: 'thin', color: { argb: 'FFCBD5E0' } }
};

const applyEstilosExcel = (sheet, totalRows, esStock = false) => {
  const headerRow = sheet.getRow(1);
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: PRIMARY_COLOR }
    };
    cell.font = {
      color: { argb: HEADER_FONT_COLOR },
      bold: true,
      size: 11
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = BORDER_STYLE;
  });

  for (let i = 2; i <= totalRows + 1; i++) {
    const row = sheet.getRow(i);
    let stockNegativo = false;
    let vencePronto = false;

    if (esStock) {
      if (row.getCell(5).value === 'Sí') stockNegativo = true;
      if (row.getCell(6).value === 'Sí') vencePronto = true;
    }

    // Iterate up to the last mapped column
    for (let col = 1; col <= sheet.columns.length; col++) {
      const cell = row.getCell(col);
      cell.border = BORDER_STYLE;
      cell.alignment = { vertical: 'middle' };

      let fgColor = 'FFFFFFFF';
      if (i % 2 === 0) fgColor = 'FFF7F8FA';

      if (stockNegativo) fgColor = 'FFFEE2E2';
      else if (vencePronto) fgColor = 'FFFEF9C3';

      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: fgColor }
      };
    }
  }
};

export const generarExcelStock = async (productos) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Stock');

  sheet.columns = [
    { header: 'ID Producto', key: 'id', width: 36 },
    { header: 'Producto', key: 'producto', width: 30 },
    { header: 'Laboratorio', key: 'laboratorio', width: 25 },
    { header: 'Stock Actual', key: 'stock', width: 15 },
    { header: 'Stock Negativo', key: 'stock_negativo', width: 15 },
    { header: 'Vence Pronto', key: 'vence_pronto', width: 15 }
  ];

  productos.forEach(p => {
    sheet.addRow({
      id: p.id,
      producto: p.nombre || '',
      laboratorio: p.laboratorio || '',
      stock: p.stock || 0,
      stock_negativo: p.stock_negativo ? 'Sí' : 'No',
      vence_pronto: p.vence_pronto ? 'Sí' : 'No'
    });
  });

  applyEstilosExcel(sheet, productos.length, true);

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

export const generarExcelIngresos = async (ingresos) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Ingresos');

  sheet.columns = [
    { header: 'ID Ingreso', key: 'id', width: 36 },
    { header: 'Fecha Ingreso', key: 'fecha_ingreso', width: 15 },
    { header: 'Producto', key: 'producto', width: 30 },
    { header: 'Laboratorio', key: 'laboratorio', width: 25 },
    { header: 'Lote', key: 'lote', width: 20 },
    { header: 'Vencimiento', key: 'vencimiento', width: 15 },
    { header: 'Proveedor', key: 'proveedor', width: 30 },
    { header: 'Cadena Frío', key: 'cadena_frio', width: 15 },
    { header: 'Cantidad', key: 'cantidad', width: 10 },
    { header: 'Observaciones', key: 'observaciones', width: 40 },
  ];

  ingresos.forEach(i => {
    sheet.addRow({
      id: i.id,
      fecha_ingreso: i.fecha_ingreso ? new Date(i.fecha_ingreso).toLocaleDateString('es-AR') : '',
      producto: i.product?.nombre || '',
      laboratorio: i.product?.laboratorio || '',
      lote: i.lote,
      vencimiento: i.vencimiento ? new Date(i.vencimiento).toLocaleDateString('es-AR') : '',
      proveedor: i.proveedor,
      cadena_frio: i.cadena_frio ? 'Sí' : 'No',
      cantidad: i.cantidad,
      observaciones: i.observaciones || ''
    });
  });

  applyEstilosExcel(sheet, ingresos.length, false);

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

export const generarExcelEgresos = async (egresos) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Egresos');

  sheet.columns = [
    { header: 'ID Egreso', key: 'id', width: 36 },
    { header: 'Fecha Entrega', key: 'fecha_entrega', width: 15 },
    { header: 'Producto', key: 'producto', width: 30 },
    { header: 'Laboratorio', key: 'laboratorio', width: 25 },
    { header: 'Cantidad', key: 'cantidad', width: 10 },
    { header: 'Empresa Solicitante', key: 'empresa_solicitante', width: 30 },
    { header: 'Lote', key: 'lote', width: 20 },
    { header: 'Vencimiento', key: 'vencimiento', width: 15 },
    { header: 'Serial', key: 'serial', width: 20 },
    { header: 'Orden Compra', key: 'orden_compra', width: 20 },
    { header: 'Estado Remito', key: 'estado_remito', width: 15 }
  ];

  egresos.forEach(e => {
    sheet.addRow({
      id: e.id,
      fecha_entrega: e.fecha_entrega ? new Date(e.fecha_entrega).toLocaleDateString('es-AR') : '',
      producto: e.product?.nombre || '',
      laboratorio: e.product?.laboratorio || '',
      cantidad: e.cantidad,
      empresa_solicitante: e.empresa_solicitante,
      lote: e.lote,
      vencimiento: e.vencimiento ? new Date(e.vencimiento).toLocaleDateString('es-AR') : '',
      serial: e.serial || '',
      orden_compra: e.orden_compra || '',
      estado_remito: e.estado_remito
    });
  });

  applyEstilosExcel(sheet, egresos.length, false);

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};
