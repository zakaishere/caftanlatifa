-- CreateEnum
CREATE TYPE "ProductSize" AS ENUM ('XS', 'S', 'M', 'L', 'XL', 'XXL', 'ONE_SIZE');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "availableSizes" "ProductSize"[] NOT NULL DEFAULT ARRAY[]::"ProductSize"[];

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "size" "ProductSize";
