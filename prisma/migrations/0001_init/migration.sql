-- NerdHub M0 initial migration.
-- Creates the core identity foundation table (`users`).
--
-- Extensions:
--   pgcrypto   -> gen_random_uuid() for the UUID primary key default
--   citext     -> case-insensitive unique email
--
-- Forward-only migration (Prisma Migrate does not use down.sql).
-- Rollback, when required, is a forward-fix / new migration, never a rewrite
-- of applied history (docs/engineering/DEVELOPMENT_WORKFLOW.md).

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" citext NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
