-- These fields were added to schema.prisma without a deployment migration.
-- Preserve existing settings and tolerate databases previously updated manually.
ALTER TABLE "Settings"
    ADD COLUMN IF NOT EXISTS "heroImage" TEXT,
    ADD COLUMN IF NOT EXISTS "businessHours" JSONB,
    ADD COLUMN IF NOT EXISTS "googleMapsEmbed" TEXT;
