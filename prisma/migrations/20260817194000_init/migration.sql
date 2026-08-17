-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AssetLifecycleStatus" AS ENUM ('ACTIVE', 'PROPOSED_FOR_DISPOSAL', 'DISPOSED');

-- CreateEnum
CREATE TYPE "AssetCustodyStatus" AS ENUM ('AVAILABLE', 'BORROWED', 'IN_REPAIR', 'MISSING');

-- CreateEnum
CREATE TYPE "AssetCondition" AS ENUM ('NORMAL', 'DAMAGED_USABLE', 'UNUSABLE');

-- CreateEnum
CREATE TYPE "PersonType" AS ENUM ('STUDENT', 'STAFF', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('ACTIVE', 'RETURNED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RepairStatus" AS ENUM ('REPORTED', 'SENT', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RepairOutcome" AS ENUM ('REPAIRED', 'UNREPAIRABLE', 'OTHER');

-- CreateEnum
CREATE TYPE "InspectionRoundStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "InspectionResult" AS ENUM ('FOUND_OK', 'FOUND_DAMAGED', 'REPAIR_REQUESTED', 'MISSING', 'DISPOSAL_REQUESTED', 'OTHER');

-- CreateEnum
CREATE TYPE "DisposalStatus" AS ENUM ('PROPOSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ImportBatchStatus" AS ENUM ('REVIEWING', 'IMPORTED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "ImportRowStatus" AS ENUM ('READY', 'INVALID', 'DUPLICATE_FILE', 'DUPLICATE_DATABASE', 'IMPORTED', 'SKIPPED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funding_sources" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "funding_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "people" (
    "id" UUID NOT NULL,
    "code" VARCHAR(100),
    "name" VARCHAR(200) NOT NULL,
    "type" "PersonType" NOT NULL,
    "department" VARCHAR(200),
    "phone" VARCHAR(50),
    "email" VARCHAR(320),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" UUID NOT NULL,
    "public_id" VARCHAR(30) NOT NULL,
    "asset_number" VARCHAR(100) NOT NULL,
    "internal_code" VARCHAR(100),
    "name" VARCHAR(300) NOT NULL,
    "category_id" UUID NOT NULL,
    "unit_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "brand" VARCHAR(150),
    "model" VARCHAR(150),
    "serial_number" VARCHAR(150),
    "acquisition_date" DATE,
    "price" DECIMAL(14,2),
    "funding_source_id" UUID,
    "location_id" UUID,
    "responsible_person_id" UUID,
    "lifecycle_status" "AssetLifecycleStatus" NOT NULL DEFAULT 'ACTIVE',
    "custody_status" "AssetCustodyStatus" NOT NULL DEFAULT 'AVAILABLE',
    "condition_status" "AssetCondition" NOT NULL DEFAULT 'NORMAL',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_events" (
    "id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "type" VARCHAR(80) NOT NULL,
    "summary" VARCHAR(500) NOT NULL,
    "details" JSONB,
    "entity_type" VARCHAR(80),
    "entity_id" UUID,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor_id" UUID,

    CONSTRAINT "asset_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "borrower_id" UUID NOT NULL,
    "purpose" VARCHAR(500) NOT NULL,
    "loaned_at" TIMESTAMPTZ(3) NOT NULL,
    "due_at" TIMESTAMPTZ(3) NOT NULL,
    "returned_at" TIMESTAMPTZ(3),
    "condition_before" "AssetCondition" NOT NULL,
    "condition_after" "AssetCondition",
    "status" "LoanStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "cancel_reason" TEXT,
    "cancelled_at" TIMESTAMPTZ(3),
    "created_by_id" UUID NOT NULL,
    "returned_by_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repair_jobs" (
    "id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "reported_at" TIMESTAMPTZ(3) NOT NULL,
    "reported_by" VARCHAR(200) NOT NULL,
    "issue" TEXT NOT NULL,
    "status" "RepairStatus" NOT NULL DEFAULT 'REPORTED',
    "vendor" VARCHAR(250),
    "sent_at" TIMESTAMPTZ(3),
    "document_number" VARCHAR(100),
    "expected_back_at" DATE,
    "completed_at" TIMESTAMPTZ(3),
    "outcome" "RepairOutcome",
    "result_notes" TEXT,
    "cost" DECIMAL(14,2),
    "cancel_reason" TEXT,
    "cancelled_at" TIMESTAMPTZ(3),
    "created_by_id" UUID NOT NULL,
    "closed_by_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "repair_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfers" (
    "id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "from_location_id" UUID,
    "to_location_id" UUID,
    "from_responsible_id" UUID,
    "to_responsible_id" UUID,
    "transferred_at" TIMESTAMPTZ(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_rounds" (
    "id" UUID NOT NULL,
    "public_id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(250) NOT NULL,
    "fiscal_year" INTEGER NOT NULL,
    "location_id" UUID,
    "status" "InspectionRoundStatus" NOT NULL DEFAULT 'OPEN',
    "opened_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMPTZ(3),
    "reopened_reason" TEXT,
    "created_by_id" UUID NOT NULL,
    "closed_by_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "inspection_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_items" (
    "id" UUID NOT NULL,
    "round_id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "snapshot_asset_number" VARCHAR(100) NOT NULL,
    "snapshot_name" VARCHAR(300) NOT NULL,
    "snapshot_location_id" UUID,
    "snapshot_responsible_id" UUID,
    "snapshot_condition" "AssetCondition" NOT NULL,
    "result" "InspectionResult",
    "actual_location_id" UUID,
    "actual_condition" "AssetCondition",
    "notes" TEXT,
    "inspected_at" TIMESTAMPTZ(3),
    "inspected_by_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "inspection_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disposals" (
    "id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "status" "DisposalStatus" NOT NULL DEFAULT 'PROPOSED',
    "proposed_at" TIMESTAMPTZ(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "completed_at" TIMESTAMPTZ(3),
    "method" VARCHAR(200),
    "document_number" VARCHAR(100),
    "cancel_reason" TEXT,
    "cancelled_at" TIMESTAMPTZ(3),
    "created_by_id" UUID NOT NULL,
    "completed_by_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "disposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" UUID NOT NULL,
    "asset_id" UUID,
    "loan_id" UUID,
    "repair_job_id" UUID,
    "transfer_id" UUID,
    "inspection_round_id" UUID,
    "disposal_id" UUID,
    "original_name" VARCHAR(255) NOT NULL,
    "stored_name" VARCHAR(255) NOT NULL,
    "storage_path" TEXT NOT NULL,
    "mime_type" VARCHAR(150) NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "checksum_sha256" CHAR(64),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_batches" (
    "id" UUID NOT NULL,
    "public_id" VARCHAR(30) NOT NULL,
    "original_filename" VARCHAR(255) NOT NULL,
    "stored_path" TEXT NOT NULL,
    "mime_type" VARCHAR(150) NOT NULL,
    "sheet_name" VARCHAR(200),
    "delimiter" VARCHAR(10),
    "column_mapping" JSONB NOT NULL,
    "status" "ImportBatchStatus" NOT NULL DEFAULT 'REVIEWING',
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "ready_rows" INTEGER NOT NULL DEFAULT 0,
    "imported_rows" INTEGER NOT NULL DEFAULT 0,
    "error_rows" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" UUID NOT NULL,
    "confirmed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_rows" (
    "id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,
    "row_number" INTEGER NOT NULL,
    "raw_data" JSONB NOT NULL,
    "normalized_data" JSONB,
    "status" "ImportRowStatus" NOT NULL,
    "errors" JSONB,
    "asset_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "import_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(80) NOT NULL,
    "entity_id" UUID,
    "before" JSONB,
    "after" JSONB,
    "reason" TEXT,
    "ip_address" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categories_code_key" ON "categories"("code");

-- CreateIndex
CREATE INDEX "categories_is_active_sort_order_idx" ON "categories"("is_active", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "units_code_key" ON "units"("code");

-- CreateIndex
CREATE INDEX "units_is_active_sort_order_idx" ON "units"("is_active", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "locations_code_key" ON "locations"("code");

-- CreateIndex
CREATE INDEX "locations_is_active_sort_order_idx" ON "locations"("is_active", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "funding_sources_code_key" ON "funding_sources"("code");

-- CreateIndex
CREATE INDEX "funding_sources_is_active_sort_order_idx" ON "funding_sources"("is_active", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "people_code_key" ON "people"("code");

-- CreateIndex
CREATE INDEX "people_name_idx" ON "people"("name");

-- CreateIndex
CREATE INDEX "people_is_active_type_idx" ON "people"("is_active", "type");

-- CreateIndex
CREATE UNIQUE INDEX "assets_public_id_key" ON "assets"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "assets_asset_number_key" ON "assets"("asset_number");

-- CreateIndex
CREATE UNIQUE INDEX "assets_internal_code_key" ON "assets"("internal_code");

-- CreateIndex
CREATE INDEX "assets_name_idx" ON "assets"("name");

-- CreateIndex
CREATE INDEX "assets_serial_number_idx" ON "assets"("serial_number");

-- CreateIndex
CREATE INDEX "assets_category_id_idx" ON "assets"("category_id");

-- CreateIndex
CREATE INDEX "assets_location_id_idx" ON "assets"("location_id");

-- CreateIndex
CREATE INDEX "assets_responsible_person_id_idx" ON "assets"("responsible_person_id");

-- CreateIndex
CREATE INDEX "assets_lifecycle_status_custody_status_condition_status_idx" ON "assets"("lifecycle_status", "custody_status", "condition_status");

-- CreateIndex
CREATE INDEX "asset_events_asset_id_occurred_at_idx" ON "asset_events"("asset_id", "occurred_at");

-- CreateIndex
CREATE INDEX "asset_events_entity_type_entity_id_idx" ON "asset_events"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "loans_borrower_id_idx" ON "loans"("borrower_id");

-- CreateIndex
CREATE INDEX "loans_due_at_status_idx" ON "loans"("due_at", "status");

-- CreateIndex
CREATE INDEX "repair_jobs_status_expected_back_at_idx" ON "repair_jobs"("status", "expected_back_at");

-- CreateIndex
CREATE INDEX "transfers_asset_id_transferred_at_idx" ON "transfers"("asset_id", "transferred_at");

-- CreateIndex
CREATE UNIQUE INDEX "inspection_rounds_public_id_key" ON "inspection_rounds"("public_id");

-- CreateIndex
CREATE INDEX "inspection_rounds_fiscal_year_status_idx" ON "inspection_rounds"("fiscal_year", "status");

-- CreateIndex
CREATE INDEX "inspection_items_round_id_result_idx" ON "inspection_items"("round_id", "result");

-- CreateIndex
CREATE UNIQUE INDEX "inspection_items_round_id_asset_id_key" ON "inspection_items"("round_id", "asset_id");

-- CreateIndex
CREATE INDEX "disposals_status_proposed_at_idx" ON "disposals"("status", "proposed_at");

-- CreateIndex
CREATE UNIQUE INDEX "attachments_stored_name_key" ON "attachments"("stored_name");

-- CreateIndex
CREATE INDEX "attachments_asset_id_idx" ON "attachments"("asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "import_batches_public_id_key" ON "import_batches"("public_id");

-- CreateIndex
CREATE INDEX "import_batches_status_created_at_idx" ON "import_batches"("status", "created_at");

-- CreateIndex
CREATE INDEX "import_rows_batch_id_status_idx" ON "import_rows"("batch_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "import_rows_batch_id_row_number_key" ON "import_rows"("batch_id", "row_number");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_created_at_idx" ON "audit_logs"("entity_type", "entity_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_funding_source_id_fkey" FOREIGN KEY ("funding_source_id") REFERENCES "funding_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_responsible_person_id_fkey" FOREIGN KEY ("responsible_person_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_events" ADD CONSTRAINT "asset_events_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_events" ADD CONSTRAINT "asset_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_borrower_id_fkey" FOREIGN KEY ("borrower_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_returned_by_id_fkey" FOREIGN KEY ("returned_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_jobs" ADD CONSTRAINT "repair_jobs_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_jobs" ADD CONSTRAINT "repair_jobs_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_jobs" ADD CONSTRAINT "repair_jobs_closed_by_id_fkey" FOREIGN KEY ("closed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_from_location_id_fkey" FOREIGN KEY ("from_location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_to_location_id_fkey" FOREIGN KEY ("to_location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_from_responsible_id_fkey" FOREIGN KEY ("from_responsible_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_to_responsible_id_fkey" FOREIGN KEY ("to_responsible_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_rounds" ADD CONSTRAINT "inspection_rounds_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_rounds" ADD CONSTRAINT "inspection_rounds_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_rounds" ADD CONSTRAINT "inspection_rounds_closed_by_id_fkey" FOREIGN KEY ("closed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_items" ADD CONSTRAINT "inspection_items_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "inspection_rounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_items" ADD CONSTRAINT "inspection_items_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_items" ADD CONSTRAINT "inspection_items_snapshot_location_id_fkey" FOREIGN KEY ("snapshot_location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_items" ADD CONSTRAINT "inspection_items_snapshot_responsible_id_fkey" FOREIGN KEY ("snapshot_responsible_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_items" ADD CONSTRAINT "inspection_items_actual_location_id_fkey" FOREIGN KEY ("actual_location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_items" ADD CONSTRAINT "inspection_items_inspected_by_id_fkey" FOREIGN KEY ("inspected_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disposals" ADD CONSTRAINT "disposals_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disposals" ADD CONSTRAINT "disposals_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disposals" ADD CONSTRAINT "disposals_completed_by_id_fkey" FOREIGN KEY ("completed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_repair_job_id_fkey" FOREIGN KEY ("repair_job_id") REFERENCES "repair_jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "transfers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_inspection_round_id_fkey" FOREIGN KEY ("inspection_round_id") REFERENCES "inspection_rounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_disposal_id_fkey" FOREIGN KEY ("disposal_id") REFERENCES "disposals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "import_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Business invariants that Prisma schema syntax cannot express.
CREATE UNIQUE INDEX "loans_one_active_per_asset_idx"
ON "loans"("asset_id") WHERE "status" = 'ACTIVE';

CREATE UNIQUE INDEX "repair_jobs_one_open_per_asset_idx"
ON "repair_jobs"("asset_id") WHERE "status" IN ('REPORTED', 'SENT');

CREATE UNIQUE INDEX "disposals_one_proposal_per_asset_idx"
ON "disposals"("asset_id") WHERE "status" = 'PROPOSED';

ALTER TABLE "assets"
ADD CONSTRAINT "assets_quantity_positive_check" CHECK ("quantity" > 0),
ADD CONSTRAINT "assets_price_nonnegative_check" CHECK ("price" IS NULL OR "price" >= 0);

ALTER TABLE "loans"
ADD CONSTRAINT "loans_due_after_loaned_check" CHECK ("due_at" >= "loaned_at"),
ADD CONSTRAINT "loans_terminal_fields_check" CHECK (
  ("status" = 'ACTIVE' AND "returned_at" IS NULL AND "cancelled_at" IS NULL)
  OR ("status" = 'RETURNED' AND "returned_at" IS NOT NULL AND "cancelled_at" IS NULL)
  OR ("status" = 'CANCELLED' AND "cancelled_at" IS NOT NULL AND "cancel_reason" IS NOT NULL)
);

ALTER TABLE "repair_jobs"
ADD CONSTRAINT "repair_jobs_cost_nonnegative_check" CHECK ("cost" IS NULL OR "cost" >= 0),
ADD CONSTRAINT "repair_jobs_terminal_fields_check" CHECK (
  ("status" IN ('REPORTED', 'SENT') AND "completed_at" IS NULL AND "cancelled_at" IS NULL)
  OR ("status" = 'COMPLETED' AND "completed_at" IS NOT NULL AND "outcome" IS NOT NULL AND "cancelled_at" IS NULL)
  OR ("status" = 'CANCELLED' AND "cancelled_at" IS NOT NULL AND "cancel_reason" IS NOT NULL)
);

ALTER TABLE "inspection_rounds"
ADD CONSTRAINT "inspection_rounds_closed_fields_check" CHECK (
  ("status" = 'OPEN' AND "closed_at" IS NULL)
  OR ("status" = 'CLOSED' AND "closed_at" IS NOT NULL AND "closed_by_id" IS NOT NULL)
);

ALTER TABLE "inspection_items"
ADD CONSTRAINT "inspection_items_result_fields_check" CHECK (
  ("result" IS NULL AND "inspected_at" IS NULL AND "inspected_by_id" IS NULL)
  OR ("result" IS NOT NULL AND "inspected_at" IS NOT NULL AND "inspected_by_id" IS NOT NULL)
);

ALTER TABLE "disposals"
ADD CONSTRAINT "disposals_terminal_fields_check" CHECK (
  ("status" = 'PROPOSED' AND "completed_at" IS NULL AND "cancelled_at" IS NULL)
  OR ("status" = 'COMPLETED' AND "completed_at" IS NOT NULL AND "method" IS NOT NULL AND "cancelled_at" IS NULL)
  OR ("status" = 'CANCELLED' AND "cancelled_at" IS NOT NULL AND "cancel_reason" IS NOT NULL)
);

ALTER TABLE "attachments"
ADD CONSTRAINT "attachments_exactly_one_owner_check" CHECK (
  num_nonnulls("asset_id", "loan_id", "repair_job_id", "transfer_id", "inspection_round_id", "disposal_id") = 1
),
ADD CONSTRAINT "attachments_size_positive_check" CHECK ("size_bytes" > 0);

ALTER TABLE "import_batches"
ADD CONSTRAINT "import_batches_row_counts_nonnegative_check" CHECK (
  "total_rows" >= 0 AND "ready_rows" >= 0 AND "imported_rows" >= 0 AND "error_rows" >= 0
);
