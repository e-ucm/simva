-- SQLite schema for Simva application
/**
 * This file contains the SQL schema definitions for the Simva application.
 * It defines the structure of the database, including tables, columns, data types,
 * primary keys, foreign keys, and indexes.
 *
 * The schema is designed to support the core functionalities of Simva, such as managing
 * SIMLETs, sessions, activities, users, participant groups, and permissions.
 *
 * Each table is created with appropriate constraints to ensure data integrity and consistency.
 * Indexes are also defined to optimize query performance on frequently accessed columns.
 *
 * Note: This schema is intended for use with SQLite. Some features may not be compatible with other database systems.
 */

-- Table: Users
CREATE TABLE IF NOT EXISTS "Users" (
	"user_id" INTEGER NOT NULL UNIQUE,
	"mongo_id" VARCHAR,
	"username" VARCHAR NOT NULL UNIQUE,
	"isToken" BOOLEAN NOT NULL,
	"token" VARCHAR,
	"email" VARCHAR NOT NULL,
	"role" VARCHAR NOT NULL,
	"createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	"updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	PRIMARY KEY("user_id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Users_index_0"
ON "Users" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "Users_index_1"
ON "Users" ("username");

 -- Table: SIMLETs
CREATE TABLE IF NOT EXISTS "SIMLETs" (
	"simlet_id" INTEGER NOT NULL UNIQUE,
	"mongo_id" VARCHAR,
	"simlet_name" VARCHAR NOT NULL,
	"simlet_archived" BOOLEAN NOT NULL,
	"simlet_description" VARCHAR NOT NULL,
	"simlet_supervisor_id" INTEGER NOT NULL,
	"createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	"updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	PRIMARY KEY("simlet_id"),
	FOREIGN KEY ("simlet_supervisor_id") REFERENCES "Users"("user_id")
	ON UPDATE CASCADE ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "SIMLETs_index_0"
ON "SIMLETs" ("simlet_id");

CREATE TABLE IF NOT EXISTS "SIMLETs_shlinks" (
	"simlet_id" INTEGER NOT NULL UNIQUE,
	"short_url" VARCHAR NOT NULL,
	"short_code" VARCHAR NOT NULL,
	"short_valid_date" DATETIME,
	"short_expiration_date" DATETIME,
	"short_title" VARCHAR NOT NULL,
	"short_domain" VARCHAR NOT NULL,
	"createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	"updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	PRIMARY KEY("simlet_id"),
	FOREIGN KEY ("simlet_id") REFERENCES "SIMLETs"("simlet_id")
	ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "SIMLETs_shlinks_index_0"
ON "SIMLETs_shlinks" ("simlet_id");

CREATE TABLE IF NOT EXISTS "SIMLETs_permissions" (
	"simlet_id" INTEGER NOT NULL,
	"user_id" INTEGER NOT NULL,
	"permission" VARCHAR NOT NULL CHECK(permission IN ("READ","WRITE")),
	"createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	"updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),	
	PRIMARY KEY("simlet_id", "user_id"),
	FOREIGN KEY ("user_id") REFERENCES "Users"("user_id")
	ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY ("simlet_id") REFERENCES "SIMLETs"("simlet_id")
	ON UPDATE CASCADE ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS "SIMLETs_permissions_index_0"
ON "SIMLETs_permissions" ("simlet_id", "user_id");

-- Table: ParticipantGroups
CREATE TABLE IF NOT EXISTS "ParticipantGroups" (
	"simlet_id" INTEGER NOT NULL,
	"group_id" INTEGER NOT NULL UNIQUE,
	"mongo_id" VARCHAR,
	"group_name" VARCHAR NOT NULL,
	"group_use_new_generation" BOOLEAN NOT NULL,
	"group_owner_id" INTEGER NOT NULL,
	"group_sandbox" BOOLEAN NOT NULL,
	"group_allocator_mongo_id" VARCHAR,
	"group_allocator_type" VARCHAR NOT NULL CHECK(group_allocator_type IN ("default", "group", "random", "session")),
	"createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	"updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	PRIMARY KEY("group_id"),
	FOREIGN KEY ("simlet_id") REFERENCES "SIMLETs"("simlet_id")
	ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY ("group_owner_id") REFERENCES "Users"("user_id")
	ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ParticipantGroups_index_0"
ON "ParticipantGroups" ("group_id");

CREATE TABLE IF NOT EXISTS "ParticipantGroups_participants" (
	"group_id" INTEGER NOT NULL,
	"participant_id" INTEGER NOT NULL,
	"createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	"updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	PRIMARY KEY("group_id", "participant_id"),
	FOREIGN KEY ("group_id") REFERENCES "ParticipantGroups"("group_id")
	ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY ("participant_id") REFERENCES "Users"("user_id")
	ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "ParticipantGroups_participants_index_0"
ON "ParticipantGroups_participants" ("group_id", "participant_id");

-- Table: Sessions
CREATE TABLE IF NOT EXISTS "Sessions" (
	"simlet_id" INTEGER NOT NULL,
	"session_id" INTEGER NOT NULL UNIQUE,
	"mongo_id" VARCHAR,
	"session_order" INTEGER NOT NULL,
	"session_name" VARCHAR NOT NULL,
	"session_description" VARCHAR NOT NULL,
	"session_status" VARCHAR NOT NULL CHECK(session_status IN ("active", "inactive", "terminated")),
	"session_can_be_manually_activated" BOOLEAN NOT NULL,
	"session_coordinator_id" INTEGER NOT NULL,
	"session_sandbox_user_id" INTEGER,
	"createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	"updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	PRIMARY KEY("session_id"),
	FOREIGN KEY ("simlet_id") REFERENCES "SIMLETs"("simlet_id")
	ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY ("session_coordinator_id") REFERENCES "Users"("user_id")
	ON UPDATE CASCADE ON DELETE SET NULL,
	FOREIGN KEY ("session_sandbox_user_id") REFERENCES "Users"("user_id")
	ON UPDATE CASCADE ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "Sessions_index_0"
ON "Sessions" ("session_id");

CREATE TABLE IF NOT EXISTS "Sessions_dates" (
	"session_id" INTEGER NOT NULL UNIQUE,
	"session_start_date" DATETIME,
	"session_end_date" DATETIME,
	"createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	"updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	PRIMARY KEY("session_id"),
	FOREIGN KEY ("session_id") REFERENCES "Sessions"("session_id")
	ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Sessions_dates_index_0"
ON "Sessions_dates" ("session_id");

CREATE TABLE IF NOT EXISTS "Sessions_tags_list" (
	"tag_id" INTEGER NOT NULL UNIQUE,
	"tag_name" VARCHAR NOT NULL,
	"tag_color" VARCHAR NOT NULL,
	"user_id" INTEGER NOT NULL,
	"createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	"updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	PRIMARY KEY("tag_id"),
	FOREIGN KEY ("user_id") REFERENCES "Users"("user_id")
	ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Sessions_tags_list_index_0"
ON "Sessions_tags_list" ("tag_id");

CREATE TABLE IF NOT EXISTS "Sessions_tags" (
	"session_id" INTEGER NOT NULL,
	"tag_id" INTEGER NOT NULL,
	"createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	"updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	PRIMARY KEY("session_id", "tag_id"),
	FOREIGN KEY ("tag_id") REFERENCES "Sessions_tags_list"("tag_id")
	ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY ("session_id") REFERENCES "Sessions"("session_id")
	ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Sessions_tags_index_0"
ON "Sessions_tags" ("session_id", "tag_id");

CREATE TABLE IF NOT EXISTS "Sessions_permissions" (
	"session_id" INTEGER NOT NULL,
	"user_id" INTEGER NOT NULL,
	"permission" VARCHAR NOT NULL CHECK(permission IN ("READ","WRITE")),
	"createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	"updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	PRIMARY KEY("session_id", "user_id"),
	FOREIGN KEY ("user_id") REFERENCES "Users"("user_id")
	ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY ("session_id") REFERENCES "Sessions"("session_id")
	ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Sessions_permissions_index_0"
ON "Sessions_permissions" ("session_id", "user_id");

-- Table: Activities
CREATE TABLE IF NOT EXISTS "Activities" (
	"session_id" INTEGER NOT NULL,
	"activity_id" INTEGER NOT NULL UNIQUE,
	"mongo_id" VARCHAR,
	"activity_order" INTEGER NOT NULL,
	"activity_name" VARCHAR NOT NULL,
	"activity_type" VARCHAR NOT NULL CHECK(activity_type IN ("default", "manual", "limesurvey", "gameplay", "lti_tool")),
	"activity_presignedUrl" VARCHAR,
	"activity_presignedUrl_generated_at" DATETIME,
	"activity_presignedUrl_expire_at" DATETIME,
	"activity_trace_storage" BOOLEAN NOT NULL,
	"activity_description" VARCHAR NOT NULL,
	"activity_comply_with_GDPR" BOOLEAN NOT NULL,
	"activity_can_be_restarted" BOOLEAN NOT NULL,
	"createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	"updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	PRIMARY KEY("activity_id"),
	FOREIGN KEY ("session_id") REFERENCES "Sessions"("session_id")
	ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Activities_index_0"
ON "Activities" ("activity_id");

CREATE TABLE IF NOT EXISTS "Limesurvey_Activities" (
	"activity_id" INTEGER NOT NULL UNIQUE,
	"survey_id" INTEGER NOT NULL,
	"survey_language" VARCHAR NOT NULL,
	"survey_lrsset" INTEGER,
	"createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	"updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	PRIMARY KEY("activity_id"),
	FOREIGN KEY ("activity_id") REFERENCES "Activities"("activity_id")
	ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Limesurvey_Activities_index_0"
ON "Limesurvey_Activities" ("activity_id");

CREATE TABLE IF NOT EXISTS "GamePlay_Activities" (
	"activity_id" INTEGER NOT NULL UNIQUE,
	"game_backup" BOOLEAN NOT NULL,
	"game_scorm_xapi" BOOLEAN NOT NULL,
	"game_type" VARCHAR NOT NULL CHECK(game_type IN ("WEB", "DESKTOP")),
	"game_url" VARCHAR NOT NULL,
	"createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	"updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	PRIMARY KEY("activity_id"),
	FOREIGN KEY ("activity_id") REFERENCES "Activities"("activity_id")
	ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "GamePlay_Activities_index_0"
ON "GamePlay_Activities" ("activity_id");

CREATE TABLE IF NOT EXISTS "Manual_Activities" (
	"activity_id" INTEGER NOT NULL UNIQUE,
	"manual_user_managed" BOOLEAN NOT NULL,
	"manual_ressource_type" VARCHAR NOT NULL CHECK(manual_ressource_type IN ("WEB", "EXTERNAL")),
	"manual_ressource_url" VARCHAR NOT NULL,
	"createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	"updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	PRIMARY KEY("activity_id"),
	FOREIGN KEY ("activity_id") REFERENCES "Activities"("activity_id")
	ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Manual_Activities_index_0"
ON "Manual_Activities" ("activity_id");

CREATE TABLE IF NOT EXISTS "Activities_completion" (
	"activity_id" INTEGER NOT NULL,
	"participant_id" INTEGER NOT NULL,
	"activity_initialized" BOOLEAN NOT NULL,
	"activity_initialization_date" DATETIME,
	"activity_progress" NUMERIC,
	"activity_completed" BOOLEAN NOT NULL,
	"activity_completion_date" DATETIME,
	"activity_suspended" BOOLEAN NOT NULL,
	"activity_suspension_date" DATETIME,
	"activity_registration_id" VARCHAR(50),
	"activity_result_presigned_url" VARCHAR(255),
	"activity_result_presigned_url_generated_at" DATETIME,
	"activity_result_presigned_url_expire_at" DATETIME,
	"createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	"updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	PRIMARY KEY("activity_id", "participant_id"),
	FOREIGN KEY ("activity_id") REFERENCES "Activities"("activity_id")
	ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY ("participant_id") REFERENCES "Users"("user_id")
	ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Activities_completion_index_0"
ON "Activities_completion" ("activity_id", "participant_id");


-- Table: Experimental_Groups
CREATE TABLE IF NOT EXISTS "Experimental_Groups" (
	"simlet_id" INTEGER NOT NULL,
	"group_id" INTEGER NOT NULL,
	"session_id" INTEGER NOT NULL,
	"createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	"updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	PRIMARY KEY("simlet_id", "group_id", "session_id"),
	FOREIGN KEY ("session_id") REFERENCES "Sessions"("session_id")
	ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY ("simlet_id") REFERENCES "SIMLETs"("simlet_id")
	ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY ("group_id") REFERENCES "ParticipantGroups"("group_id")
	ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Experimental_Groups_index_0"
ON "Experimental_Groups" ("simlet_id", "group_id", "session_id");

-- Table: Experimental_Participants
CREATE TABLE IF NOT EXISTS "Experimental_Participants" (
	"simlet_id" INTEGER NOT NULL,
	"group_id" INTEGER NOT NULL,
	"participant_id" INTEGER NOT NULL,
	"session_id" INTEGER NOT NULL,
	"createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	"updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	PRIMARY KEY("simlet_id", "group_id", "participant_id"),
	FOREIGN KEY ("session_id") REFERENCES "Sessions"("session_id")
	ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY ("participant_id") REFERENCES "Users"("user_id")
	ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY ("simlet_id") REFERENCES "SIMLETs"("simlet_id")
	ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY ("group_id") REFERENCES "ParticipantGroups"("group_id")
	ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Experimental_Participants_index_0"
ON "Experimental_Participants" ("simlet_id", "group_id", "participant_id", "session_id");

CREATE TABLE IF NOT EXISTS "Random_Allocators" (
	"group_id" INTEGER NOT NULL,
	"session_id" INTEGER NOT NULL,
	"allocator_percentage" NUMERIC NOT NULL,
	"createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	"updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	PRIMARY KEY("group_id", "session_id"),
	FOREIGN KEY ("session_id") REFERENCES "Sessions"("session_id")
	ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY ("group_id") REFERENCES "ParticipantGroups"("group_id")
	ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Random_Allocators_index_0"
ON "Random_Allocators" ("group_id", "session_id");


-- Table: Activities_template
CREATE TABLE IF NOT EXISTS "Activities_template" (
	"activity_template_id" INTEGER NOT NULL UNIQUE,
	"activity_template_name" VARCHAR NOT NULL,
	"activity_template_type" VARCHAR NOT NULL CHECK(activity_template_type IN ("default", "manual", "limesurvey", "gameplay", "lti_tool")),
	"activity_template_description" VARCHAR NOT NULL,
	"activity_template_public" BOOLEAN NOT NULL,
	"activity_template_owner_id" INTEGER NOT NULL,
	"createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	"updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	PRIMARY KEY("activity_template_id"),
	FOREIGN KEY ("activity_template_owner_id") REFERENCES "Users"("user_id")
	ON UPDATE CASCADE ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS "Activities_template_index_0"
ON "Activities_template" ("activity_template_id");

CREATE TABLE IF NOT EXISTS "Manual_Template_Activities" (
	"activity_template_id" INTEGER NOT NULL UNIQUE,
	"manual_ressource_type" VARCHAR NOT NULL CHECK(manual_ressource_type IN ("EXTERNAL","WEB")),
	"manual_ressource_url" VARCHAR NOT NULL,
	"createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	"updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	PRIMARY KEY("activity_template_id"),
	FOREIGN KEY ("activity_template_id") REFERENCES "Activities_template"("activity_template_id")
	ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Manual_Template_Activities_index_0"
ON "Manual_Template_Activities" ("activity_template_id");

CREATE TABLE IF NOT EXISTS "GamePlay_Activities_Template" (
	"activity_template_id" INTEGER NOT NULL UNIQUE,
	"game_type" VARCHAR NOT NULL CHECK(game_type IN ("WEB", "DESKTOP")),
	"game_url" VARCHAR NOT NULL,
	"createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	"updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	PRIMARY KEY("activity_template_id"),
	FOREIGN KEY ("activity_template_id") REFERENCES "Activities_template"("activity_template_id")
	ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "GamePlay_Activities_Template_index_0"
ON "GamePlay_Activities_Template" ("activity_template_id");

CREATE TABLE IF NOT EXISTS "Limesurvey_Activities_Template" (
	"activity_template_id" INTEGER NOT NULL UNIQUE,
	"survey_id" INTEGER NOT NULL,
	"survey_owner" INTEGER,
	"createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	"updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	PRIMARY KEY("activity_template_id"),
	FOREIGN KEY ("activity_template_id") REFERENCES "Activities_template"("activity_template_id")
	ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY ("survey_owner") REFERENCES "Users"("user_id")
	ON UPDATE CASCADE ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS "Limesurvey_Activities_Template_index_0"
ON "Limesurvey_Activities_Template" ("activity_template_id");

CREATE TABLE IF NOT EXISTS "Activities_template_permissions" (
	"activity_template_id" INTEGER NOT NULL,
	"user_id" INTEGER NOT NULL,
	"permission" VARCHAR NOT NULL CHECK(permission IN ("READ","WRITE")),
	"createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	"updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	PRIMARY KEY("activity_template_id", "user_id"),
	FOREIGN KEY ("activity_template_id") REFERENCES "Activities_template"("activity_template_id")
	ON UPDATE CASCADE ON DELETE RESTRICT,
	FOREIGN KEY ("user_id") REFERENCES "Users"("user_id")
	ON UPDATE CASCADE ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS "Activities_template_permissions_index_0"
ON "Activities_template_permissions" ("activity_template_id", "user_id");

CREATE TABLE IF NOT EXISTS "Activities_template_tags" (
	"activity_template_id" INTEGER NOT NULL,
	"tag_id" INTEGER NOT NULL,
	"createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	"updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	PRIMARY KEY("activity_template_id", "tag_id"),
	FOREIGN KEY ("tag_id") REFERENCES "Activities_template_tags_list"("tag_id")
	ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY ("activity_template_id") REFERENCES "Activities_template"("activity_template_id")
	ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Activities_template_tags_index_0"
ON "Activities_template_tags" ("activity_template_id", "tag_id");

CREATE TABLE IF NOT EXISTS "Activities_template_tags_list" (
	"tag_id" INTEGER NOT NULL UNIQUE,
	"tag_name" VARCHAR NOT NULL,
	"tag_color" VARCHAR NOT NULL,
	"user_id" INTEGER NOT NULL,
	"public" BOOLEAN NOT NULL,
	"createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	"updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	PRIMARY KEY("tag_id"),
	FOREIGN KEY ("user_id") REFERENCES "Users"("user_id")
	ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "Activities_template_tags_list_index_0"
ON "Activities_template_tags_list" ("tag_id");