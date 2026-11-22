BEGIN;

--
-- ACTION CREATE TABLE
--
CREATE TABLE "contribution_consent" (
    "id" bigserial PRIMARY KEY,
    "userId" text,
    "version" text NOT NULL,
    "givenAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewer" boolean NOT NULL DEFAULT false
);

-- Indexes
CREATE UNIQUE INDEX "contribution_consent_user_idx" ON "contribution_consent" USING btree ("userId");

--
-- ACTION CREATE TABLE
--
CREATE TABLE "contribution_review" (
    "id" bigserial PRIMARY KEY,
    "contributionId" bigint NOT NULL,
    "reviewerId" text,
    "verdict" text NOT NULL,
    "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE UNIQUE INDEX "contribution_review_unique_idx" ON "contribution_review" USING btree ("contributionId", "reviewerId");

--
-- ACTION CREATE TABLE
--
CREATE TABLE "sign_contribution" (
    "id" bigserial PRIMARY KEY,
    "userId" text,
    "gloss" text NOT NULL,
    "frames" json NOT NULL,
    "frameCount" bigint NOT NULL,
    "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" text NOT NULL,
    "correctVotes" bigint NOT NULL DEFAULT 0,
    "wrongVotes" bigint NOT NULL DEFAULT 0
);

-- Indexes
CREATE INDEX "sign_contribution_user_idx" ON "sign_contribution" USING btree ("userId");
CREATE INDEX "sign_contribution_status_idx" ON "sign_contribution" USING btree ("status");


--
-- MIGRATION VERSION FOR parlance_mobile
--
INSERT INTO "serverpod_migrations" ("module", "version", "timestamp")
    VALUES ('parlance_mobile', '20261122014624428', now())
    ON CONFLICT ("module")
    DO UPDATE SET "version" = '20261122014624428', "timestamp" = now();

--
-- MIGRATION VERSION FOR serverpod
--
INSERT INTO "serverpod_migrations" ("module", "version", "timestamp")
    VALUES ('serverpod', '20260824182259319', now())
    ON CONFLICT ("module")
    DO UPDATE SET "version" = '20260824182259319', "timestamp" = now();

--
-- MIGRATION VERSION FOR serverpod_auth_idp
--
INSERT INTO "serverpod_migrations" ("module", "version", "timestamp")
    VALUES ('serverpod_auth_idp', '20261015164015382', now())
    ON CONFLICT ("module")
    DO UPDATE SET "version" = '20261015164015382', "timestamp" = now();

--
-- MIGRATION VERSION FOR serverpod_auth_core
--
INSERT INTO "serverpod_migrations" ("module", "version", "timestamp")
    VALUES ('serverpod_auth_core', '20260924105232991', now())
    ON CONFLICT ("module")
    DO UPDATE SET "version" = '20260924105232991', "timestamp" = now();


COMMIT;
