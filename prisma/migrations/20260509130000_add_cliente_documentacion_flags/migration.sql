ALTER TABLE "Cliente"
ADD COLUMN "documentacion_habilitacion_djf" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "documentacion_habilitacion_ru_ge_pre_sa" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "documentacion_cuit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "documentacion_ingresos_brutos" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "documentacion_gln" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "documentacion_habilitacion_municipal" BOOLEAN NOT NULL DEFAULT false;
