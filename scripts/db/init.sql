-- ============================================================
-- HRMS Platform — PostgreSQL Initialization Script
-- Runs once when the container is first created
-- ============================================================

-- Required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";    -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";     -- Cryptographic functions (password hashing)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- Trigram similarity for fuzzy employee search
CREATE EXTENSION IF NOT EXISTS "btree_gist";   -- GiST index for range overlap (shift scheduling)

-- ============================================================
-- Row-Level Security is enabled per-table in Prisma migrations
-- This file only handles extensions and initial setup
-- ============================================================
