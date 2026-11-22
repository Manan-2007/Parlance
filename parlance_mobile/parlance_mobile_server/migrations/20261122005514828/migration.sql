BEGIN;

--
-- ACTION CREATE TABLE
--
CREATE TABLE "community_live_message" (
    "id" bigserial PRIMARY KEY,
    "threadId" bigint NOT NULL,
    "authorId" bigint NOT NULL,
    "text" text NOT NULL,
    "input" text NOT NULL,
    "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX "community_live_thread_idx" ON "community_live_message" USING btree ("threadId");

--
-- ACTION CREATE TABLE
--
CREATE TABLE "community_mark" (
    "id" bigserial PRIMARY KEY,
    "memberId" bigint NOT NULL,
    "kind" text NOT NULL,
    "target" text NOT NULL,
    "targetId" bigint NOT NULL,
    "reason" text,
    "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE UNIQUE INDEX "community_mark_unique_idx" ON "community_mark" USING btree ("memberId", "kind", "target", "targetId");
CREATE INDEX "community_mark_target_idx" ON "community_mark" USING btree ("kind", "target", "targetId");

--
-- ACTION CREATE TABLE
--
CREATE TABLE "community_member" (
    "id" bigserial PRIMARY KEY,
    "userId" text,
    "handle" text NOT NULL,
    "handleKey" text,
    "city" text NOT NULL,
    "ways" json NOT NULL,
    "sample" boolean NOT NULL DEFAULT false,
    "joinedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE UNIQUE INDEX "community_member_user_idx" ON "community_member" USING btree ("userId");
CREATE UNIQUE INDEX "community_member_handle_idx" ON "community_member" USING btree ("handleKey");

--
-- ACTION CREATE TABLE
--
CREATE TABLE "community_reply" (
    "id" bigserial PRIMARY KEY,
    "threadId" bigint NOT NULL,
    "authorId" bigint NOT NULL,
    "body" text NOT NULL,
    "input" text NOT NULL,
    "quoteId" bigint,
    "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedAt" timestamp without time zone,
    "hidden" boolean NOT NULL DEFAULT false,
    "deleted" boolean NOT NULL DEFAULT false
);

-- Indexes
CREATE INDEX "community_reply_thread_idx" ON "community_reply" USING btree ("threadId", "createdAt");

--
-- ACTION CREATE TABLE
--
CREATE TABLE "community_thread" (
    "id" bigserial PRIMARY KEY,
    "space" text NOT NULL,
    "kind" text NOT NULL,
    "title" text NOT NULL,
    "body" text NOT NULL,
    "input" text NOT NULL,
    "authorId" bigint NOT NULL,
    "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedAt" timestamp without time zone,
    "lastActivityAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answerId" bigint,
    "hidden" boolean NOT NULL DEFAULT false,
    "deleted" boolean NOT NULL DEFAULT false,
    "place" text,
    "city" text,
    "startsAt" timestamp without time zone,
    "endsAt" timestamp without time zone,
    "liveCode" text
);

-- Indexes
CREATE INDEX "community_thread_space_idx" ON "community_thread" USING btree ("space", "lastActivityAt");
CREATE INDEX "community_thread_live_idx" ON "community_thread" USING btree ("liveCode");


--
-- MIGRATION VERSION FOR parlance_mobile
--
INSERT INTO "serverpod_migrations" ("module", "version", "timestamp")
    VALUES ('parlance_mobile', '20261122005514828', now())
    ON CONFLICT ("module")
    DO UPDATE SET "version" = '20261122005514828', "timestamp" = now();

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
