/*
  Warnings:

  - You are about to drop the column `cantidad` on the `Rechazo` table. All the data in the column will be lost.
  - You are about to drop the column `lote` on the `Rechazo` table. All the data in the column will be lost.
  - You are about to drop the column `motivo_rechazo` on the `Rechazo` table. All the data in the column will be lost.
  - You are about to drop the column `product_id` on the `Rechazo` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Rechazo" DROP CONSTRAINT "Rechazo_product_id_fkey";

-- AlterTable
ALTER TABLE "Rechazo" DROP COLUMN "cantidad",
DROP COLUMN "lote",
DROP COLUMN "motivo_rechazo",
DROP COLUMN "product_id";

-- CreateTable
CREATE TABLE "RechazoItem" (
    "id" TEXT NOT NULL,
    "rechazo_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "lote" TEXT NOT NULL,
    "motivo_rechazo" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RechazoItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RechazoItem" ADD CONSTRAINT "RechazoItem_rechazo_id_fkey" FOREIGN KEY ("rechazo_id") REFERENCES "Rechazo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RechazoItem" ADD CONSTRAINT "RechazoItem_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
