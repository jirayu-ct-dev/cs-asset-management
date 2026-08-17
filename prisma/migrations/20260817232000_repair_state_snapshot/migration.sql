ALTER TABLE "repair_jobs"
ADD COLUMN "condition_before" "AssetCondition",
ADD COLUMN "custody_before" "AssetCustodyStatus";

UPDATE "repair_jobs" AS repair
SET
  "condition_before" = asset."condition_status",
  "custody_before" = CASE
    WHEN repair."status" = 'SENT' THEN 'AVAILABLE'::"AssetCustodyStatus"
    ELSE asset."custody_status"
  END
FROM "assets" AS asset
WHERE asset."id" = repair."asset_id";

ALTER TABLE "repair_jobs"
ALTER COLUMN "condition_before" SET NOT NULL,
ALTER COLUMN "custody_before" SET NOT NULL;
