-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ENGINEERING', 'APPROVER', 'OPERATIONS', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED', 'PENDING');

-- CreateEnum
CREATE TYPE "RoleRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BOMStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ECOType" AS ENUM ('PRODUCT', 'BOM');

-- CreateEnum
CREATE TYPE "ECOStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'APPLIED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'ARCHIVE', 'STAGE_TRANSITION', 'VERSION_CREATE', 'ROLE_REQUEST_APPROVED', 'ROLE_REQUEST_REJECTED');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('USER', 'PRODUCT', 'PRODUCT_VERSION', 'BOM', 'BOM_COMPONENT', 'BOM_OPERATION', 'ECO', 'ECO_APPROVAL');

-- CreateEnum
CREATE TYPE "DraftChangeType" AS ENUM ('ADDED', 'MODIFIED', 'REMOVED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ECO_CREATED', 'ECO_SUBMITTED', 'ECO_APPROVED', 'ECO_REJECTED', 'ECO_APPLIED', 'STAGE_CHANGED', 'APPROVAL_REQUIRED', 'VERSION_CREATED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "avatarPublicId" TEXT,
    "roles" "UserRole"[],
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestedRoles" "UserRole"[],
    "reason" TEXT,
    "status" "RoleRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_versions" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "salePrice" DOUBLE PRECISION NOT NULL,
    "costPrice" DOUBLE PRECISION NOT NULL,
    "attachments" JSONB DEFAULT '[]',
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_attachments" (
    "id" TEXT NOT NULL,
    "productVersionId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boms" (
    "id" TEXT NOT NULL,
    "productVersionId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" "BOMStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bom_components" (
    "id" TEXT NOT NULL,
    "bomId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bom_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bom_operations" (
    "id" TEXT NOT NULL,
    "bomId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "time" DOUBLE PRECISION NOT NULL,
    "workCenter" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bom_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecos" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ECOType" NOT NULL,
    "productId" TEXT NOT NULL,
    "bomId" TEXT,
    "createdBy" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3),
    "versionUpdate" BOOLEAN NOT NULL DEFAULT true,
    "currentStage" TEXT NOT NULL DEFAULT 'New',
    "status" "ECOStatus" NOT NULL DEFAULT 'DRAFT',
    "draftData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ecos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eco_attachments" (
    "id" TEXT NOT NULL,
    "ecoId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eco_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_stages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "approval_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eco_approvals" (
    "id" TEXT NOT NULL,
    "ecoId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "comments" TEXT,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eco_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "userId" TEXT,
    "ecoId" TEXT,
    "stage" TEXT,
    "comments" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eco_bom_component_drafts" (
    "id" TEXT NOT NULL,
    "ecoId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "changeType" "DraftChangeType" NOT NULL DEFAULT 'ADDED',
    "originalComponentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eco_bom_component_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eco_bom_operation_drafts" (
    "id" TEXT NOT NULL,
    "ecoId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "time" DOUBLE PRECISION NOT NULL,
    "workCenter" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "changeType" "DraftChangeType" NOT NULL DEFAULT 'ADDED',
    "originalOperationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eco_bom_operation_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "userId" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "role_requests_userId_idx" ON "role_requests"("userId");

-- CreateIndex
CREATE INDEX "role_requests_status_idx" ON "role_requests"("status");

-- CreateIndex
CREATE INDEX "role_requests_createdAt_idx" ON "role_requests"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "products_currentVersionId_key" ON "products"("currentVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "product_versions_productId_version_key" ON "product_versions"("productId", "version");

-- CreateIndex
CREATE INDEX "product_attachments_productVersionId_idx" ON "product_attachments"("productVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "boms_productVersionId_version_key" ON "boms"("productVersionId", "version");

-- CreateIndex
CREATE INDEX "eco_attachments_ecoId_idx" ON "eco_attachments"("ecoId");

-- CreateIndex
CREATE UNIQUE INDEX "approval_stages_name_key" ON "approval_stages"("name");

-- CreateIndex
CREATE UNIQUE INDEX "approval_stages_order_key" ON "approval_stages"("order");

-- CreateIndex
CREATE UNIQUE INDEX "eco_approvals_ecoId_stageId_key" ON "eco_approvals"("ecoId", "stageId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_ecoId_idx" ON "audit_logs"("ecoId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "eco_bom_component_drafts_ecoId_idx" ON "eco_bom_component_drafts"("ecoId");

-- CreateIndex
CREATE INDEX "eco_bom_operation_drafts_ecoId_idx" ON "eco_bom_operation_drafts"("ecoId");

-- CreateIndex
CREATE INDEX "notifications_userId_read_idx" ON "notifications"("userId", "read");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- AddForeignKey
ALTER TABLE "role_requests" ADD CONSTRAINT "role_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_requests" ADD CONSTRAINT "role_requests_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "product_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_versions" ADD CONSTRAINT "product_versions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attachments" ADD CONSTRAINT "product_attachments_productVersionId_fkey" FOREIGN KEY ("productVersionId") REFERENCES "product_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attachments" ADD CONSTRAINT "product_attachments_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boms" ADD CONSTRAINT "boms_productVersionId_fkey" FOREIGN KEY ("productVersionId") REFERENCES "product_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_components" ADD CONSTRAINT "bom_components_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "boms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_components" ADD CONSTRAINT "bom_components_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bom_operations" ADD CONSTRAINT "bom_operations_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "boms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecos" ADD CONSTRAINT "ecos_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecos" ADD CONSTRAINT "ecos_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "boms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecos" ADD CONSTRAINT "ecos_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eco_attachments" ADD CONSTRAINT "eco_attachments_ecoId_fkey" FOREIGN KEY ("ecoId") REFERENCES "ecos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eco_attachments" ADD CONSTRAINT "eco_attachments_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eco_approvals" ADD CONSTRAINT "eco_approvals_ecoId_fkey" FOREIGN KEY ("ecoId") REFERENCES "ecos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eco_approvals" ADD CONSTRAINT "eco_approvals_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "approval_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eco_approvals" ADD CONSTRAINT "eco_approvals_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_ecoId_fkey" FOREIGN KEY ("ecoId") REFERENCES "ecos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eco_bom_component_drafts" ADD CONSTRAINT "eco_bom_component_drafts_ecoId_fkey" FOREIGN KEY ("ecoId") REFERENCES "ecos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eco_bom_component_drafts" ADD CONSTRAINT "eco_bom_component_drafts_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eco_bom_operation_drafts" ADD CONSTRAINT "eco_bom_operation_drafts_ecoId_fkey" FOREIGN KEY ("ecoId") REFERENCES "ecos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
