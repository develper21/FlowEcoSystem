-- Migration: Remove DRAFT from ProductStatus enum
-- This migration removes the DRAFT status from Product and ProductVersion
-- All DRAFT products/versions should be converted to ACTIVE or deleted before running

-- Update any existing DRAFT products to ACTIVE
UPDATE "products" SET "status" = 'ACTIVE' WHERE "status" = 'DRAFT';

-- Update any existing DRAFT product versions to ACTIVE
UPDATE "product_versions" SET "status" = 'ACTIVE' WHERE "status" = 'DRAFT';

-- AlterEnum: Remove DRAFT from ProductStatus
-- This requires recreating the enum type
ALTER TYPE "ProductStatus" RENAME TO "ProductStatus_old";
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
ALTER TABLE "products" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "products" ALTER COLUMN "status" TYPE "ProductStatus" USING ("status"::text::"ProductStatus");
ALTER TABLE "products" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
ALTER TABLE "product_versions" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "product_versions" ALTER COLUMN "status" TYPE "ProductStatus" USING ("status"::text::"ProductStatus");
ALTER TABLE "product_versions" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
DROP TYPE "ProductStatus_old";
