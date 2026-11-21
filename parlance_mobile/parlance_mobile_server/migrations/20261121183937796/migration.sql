BEGIN;

--
-- ACTION CREATE TABLE
--
CREATE TABLE "room" (
    "id" bigserial PRIMARY KEY,
    "code" text NOT NULL,
    "hostId" text,
    "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" timestamp without time zone NOT NULL,
    "closed" boolean NOT NULL DEFAULT false
);

-- Indexes
CREATE UNIQUE INDEX "room__code__unique_idx" ON "room" USING btree ("code");

--
-- ACTION CREATE TABLE
--
CREATE TABLE "room_member" (
    "id" bigserial PRIMARY KEY,
    "roomId" bigint NOT NULL,
    "userId" text,
    "role" text NOT NULL,
    "name" text NOT NULL,
    "joinedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE UNIQUE INDEX "room_member_unique" ON "room_member" USING btree ("roomId", "userId");

--
-- ACTION CREATE TABLE
--
CREATE TABLE "utterance" (
    "id" bigserial PRIMARY KEY,
    "roomId" bigint NOT NULL,
    "memberId" bigint NOT NULL,
    "role" text NOT NULL,
    "kind" text NOT NULL,
    "text" text NOT NULL,
    "hindi" text,
    "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX "utterance_room_idx" ON "utterance" USING btree ("roomId");


--
-- MIGRATION VERSION FOR parlance_mobile
--
INSERT INTO "serverpod_migrations" ("module", "version", "timestamp")
    VALUES ('parlance_mobile', '20261121183937796', now())
    ON CONFLICT ("module")
    DO UPDATE SET "version" = '20261121183937796', "timestamp" = now();

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
