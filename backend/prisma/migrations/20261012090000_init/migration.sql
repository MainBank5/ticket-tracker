-- CreateTable
CREATE TABLE "tickets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tickets_created_at_id_idx" ON "tickets"("created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "tickets_status_created_at_id_idx" ON "tickets"("status", "created_at" DESC, "id" DESC);

-- Hand-written: Prisma doesn't model CHECK constraints, but it preserves them in
-- migration SQL and ignores them when diffing. They are the database-level safety net
-- behind the zod validation in the API (status/priority are TEXT, not native enums).
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_title_not_blank" CHECK (length(btrim("title")) > 0);
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_status_check" CHECK ("status" IN ('open', 'in_progress', 'closed'));
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_priority_check" CHECK ("priority" IN ('low', 'medium', 'high'));
