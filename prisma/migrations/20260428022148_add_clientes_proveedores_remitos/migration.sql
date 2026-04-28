-- AlterTable
ALTER TABLE "Egreso" ADD COLUMN     "remito_item_id" TEXT;

-- AlterTable
ALTER TABLE "Ingreso" ADD COLUMN     "proveedor_id" TEXT,
ALTER COLUMN "proveedor" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Proveedor" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "nombre_contacto" TEXT,
    "telefono_contacto" TEXT,
    "tipo" TEXT NOT NULL,
    "producto_o_servicio" TEXT,
    "habilitacion_jurisdiccion_provincial" BOOLEAN NOT NULL DEFAULT false,
    "ultima_resolucion_djf" BOOLEAN NOT NULL DEFAULT false,
    "disposicion_habilitacion_anmat" BOOLEAN NOT NULL DEFAULT false,
    "cert_buenas_practicas_transito" BOOLEAN NOT NULL DEFAULT false,
    "resolucion_cambio_direccion_tecnica" BOOLEAN NOT NULL DEFAULT false,
    "registro_productos_anmat" BOOLEAN NOT NULL DEFAULT false,
    "habilitacion_municipal" BOOLEAN NOT NULL DEFAULT false,
    "constancia_afip" BOOLEAN NOT NULL DEFAULT false,
    "documentacion_completa" BOOLEAN NOT NULL DEFAULT false,
    "observaciones" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "establecimiento" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "localidad" TEXT,
    "direccion_tecnica" TEXT,
    "vigencia_habilitacion" TIMESTAMP(3),
    "gln" TEXT,
    "contacto" TEXT,
    "cuit" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluacionCliente" (
    "id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "numero_evaluacion" TEXT NOT NULL,
    "habilitacion_direccion_jurisdiccion" TEXT NOT NULL,
    "habilitacion_sanitaria_rugepresa" TEXT NOT NULL,
    "constancia_cuit" TEXT NOT NULL,
    "constancia_ingresos_brutos" TEXT NOT NULL,
    "certificado_gln" TEXT NOT NULL,
    "habilitacion_municipal" TEXT NOT NULL,
    "puntualidad_pagos" TEXT NOT NULL,
    "frecuencia_compras" TEXT NOT NULL,
    "volumen_compras" TEXT NOT NULL,
    "condicion_financiera_general" TEXT NOT NULL,
    "experiencia_personal_compra" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "EvaluacionCliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluacionProveedor" (
    "id" TEXT NOT NULL,
    "proveedor_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "numero_evaluacion" TEXT NOT NULL,
    "habilitacion_jurisdiccion_provincial" TEXT NOT NULL,
    "ultima_resolucion_djf" TEXT NOT NULL,
    "disposicion_habilitacion_anmat" TEXT NOT NULL,
    "cert_buenas_practicas_transito" TEXT NOT NULL,
    "resolucion_cambio_direccion_tecnica" TEXT NOT NULL,
    "registro_productos_anmat" TEXT NOT NULL,
    "habilitacion_municipal" TEXT NOT NULL,
    "constancia_afip" TEXT NOT NULL,
    "documentacion_completa" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "EvaluacionProveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rechazo" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "product_id" TEXT NOT NULL,
    "lote" TEXT NOT NULL,
    "motivo_rechazo" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "remito" TEXT,
    "proveedor_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Rechazo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Remito" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "hora" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Pendiente',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Remito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RemitoItem" (
    "id" TEXT NOT NULL,
    "remito_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "lote" TEXT NOT NULL,
    "vencimiento" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RemitoItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Proveedor_numero_key" ON "Proveedor"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Remito_numero_key" ON "Remito"("numero");

-- AddForeignKey
ALTER TABLE "Ingreso" ADD CONSTRAINT "Ingreso_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "Proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Egreso" ADD CONSTRAINT "Egreso_remito_item_id_fkey" FOREIGN KEY ("remito_item_id") REFERENCES "RemitoItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proveedor" ADD CONSTRAINT "Proveedor_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionCliente" ADD CONSTRAINT "EvaluacionCliente_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionCliente" ADD CONSTRAINT "EvaluacionCliente_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionProveedor" ADD CONSTRAINT "EvaluacionProveedor_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "Proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionProveedor" ADD CONSTRAINT "EvaluacionProveedor_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rechazo" ADD CONSTRAINT "Rechazo_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rechazo" ADD CONSTRAINT "Rechazo_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "Proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rechazo" ADD CONSTRAINT "Rechazo_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remito" ADD CONSTRAINT "Remito_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remito" ADD CONSTRAINT "Remito_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemitoItem" ADD CONSTRAINT "RemitoItem_remito_id_fkey" FOREIGN KEY ("remito_id") REFERENCES "Remito"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemitoItem" ADD CONSTRAINT "RemitoItem_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
