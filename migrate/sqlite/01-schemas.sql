CREATE TABLE IF NOT EXISTS "SIMLETs" (
	"simlet_id" INTEGER NOT NULL UNIQUE,
	"mongo_id" VARCHAR,
	"name" VARCHAR NOT NULL,
	"createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	"updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	"sandbox_session_id" INTEGER,
	"description" VARCHAR NOT NULL,
	"objective" VARCHAR,
	"allocator_id" INTEGER NOT NULL,
	"simlet_coordinator_id" INTEGER NOT NULL,
	PRIMARY KEY("simlet_id"),
	FOREIGN KEY ("allocator_id") REFERENCES "Allocators"("allocator_id")
	ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY ("sandbox_session_id") REFERENCES "Sessions"("session_id")
	ON UPDATE CASCADE ON DELETE SET NULL,
	FOREIGN KEY ("simlet_coordinator_id") REFERENCES "Users"("user_id")
	ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "SIMLETs_index_0"
ON "SIMLETs" ("simlet_id");
CREATE TABLE IF NOT EXISTS "SIMLETs_groups" (
	"simlet_id" INTEGER NOT NULL,
	"group_id" INTEGER NOT NULL,
	PRIMARY KEY("simlet_id", "group_id"),
	FOREIGN KEY ("simlet_id") REFERENCES "SIMLETs"("simlet_id")
	ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY ("group_id") REFERENCES "ParticipantGroups"("group_id")
	ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "SIMLETs_groups_index_0"
ON "SIMLETs_groups" ("simlet_id", "group_id");
CREATE TABLE IF NOT EXISTS "SIMLETs_shlinks" (
	"simlet_id" INTEGER NOT NULL UNIQUE,
	"short_url" VARCHAR NOT NULL,
	"short_code" VARCHAR NOT NULL,
	"createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	"updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	"valid_date" DATETIME,
	"expiration_date" DATETIME,
	"title" VARCHAR NOT NULL,
	"domain" VARCHAR NOT NULL,
	PRIMARY KEY("simlet_id"),
	FOREIGN KEY ("simlet_id") REFERENCES "SIMLETs"("simlet_id")
	ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "SIMLETs_shlinks_index_0"
ON "SIMLETs_shlinks" ("simlet_id");
CREATE TABLE IF NOT EXISTS "Sessions" (
	"simlet_id" INTEGER NOT NULL,
	"session_id" INTEGER NOT NULL UNIQUE,
	"mongo_id" VARCHAR,
	"name" VARCHAR NOT NULL,
	"description" VARCHAR NOT NULL,
	"createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	"updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	"experimental_method" VARCHAR,
	"active" BOOLEAN,
	"session_start_date" DATETIME,
	"session_end_date" DATETIME,
	"session_supervisor_id" INTEGER NOT NULL,
	PRIMARY KEY("session_id"),
	FOREIGN KEY ("simlet_id") REFERENCES "SIMLETs"("simlet_id")
	ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY ("session_supervisor_id") REFERENCES "Users"("user_id")
	ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "Sessions_index_0"
ON "Sessions" ("session_id");
CREATE TABLE IF NOT EXISTS "Activities" (
	"session_id" INTEGER NOT NULL,
	"activity_id" INTEGER NOT NULL UNIQUE,
	"mongo_id" VARCHAR,
	"name" VARCHAR NOT NULL,
	"activity_type" VARCHAR NOT NULL CHECK(activity_type IN ("default", "manual", "limesurvey", "gameplay", "lti_tool")),
	"presignedUrl" VARCHAR,
	"generated_at" DATETIME,
	"expire_on_seconds" INTEGER,
	"trace_storage" BOOLEAN NOT NULL,
	"description" VARCHAR NOT NULL,
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
	"language" VARCHAR NOT NULL,
	"lrsset" INTEGER,
	PRIMARY KEY("activity_id"),
	FOREIGN KEY ("activity_id") REFERENCES "Activities"("activity_id")
	ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Limesurvey_Activities_index_0"
ON "Limesurvey_Activities" ("activity_id");
CREATE TABLE IF NOT EXISTS "GamePlay_Activities" (
	"activity_id" INTEGER NOT NULL UNIQUE,
	"backup" BOOLEAN NOT NULL,
	"scorm_xapi_by_game" BOOLEAN NOT NULL,
	"category_id" INTEGER,
	"subject_area_id" INTEGER,
	"game_type" VARCHAR NOT NULL CHECK(game_type IN ("WEB", "DESKTOP")),
	"game_url" VARCHAR NOT NULL,
	PRIMARY KEY("activity_id"),
	FOREIGN KEY ("activity_id") REFERENCES "Activities"("activity_id")
	ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY ("subject_area_id") REFERENCES "Subject_area_list"("subject_area_id")
	ON UPDATE CASCADE ON DELETE RESTRICT,
	FOREIGN KEY ("category_id") REFERENCES "Category_list"("category_id")
	ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "GamePlay_Activities_index_0"
ON "GamePlay_Activities" ("activity_id");
CREATE TABLE IF NOT EXISTS "Manual_Activities" (
	"activity_id" INTEGER NOT NULL UNIQUE,
	"user_managed" BOOLEAN NOT NULL,
	"ressource_type" VARCHAR NOT NULL CHECK(ressource_type IN ("WEB", "EXTERNAL")),
	"ressource_url" VARCHAR NOT NULL,
	PRIMARY KEY("activity_id"),
	FOREIGN KEY ("activity_id") REFERENCES "Activities"("activity_id")
	ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Manual_Activities_index_0"
ON "Manual_Activities" ("activity_id");
CREATE TABLE IF NOT EXISTS "Activities_completion" (
	"activity_id" INTEGER NOT NULL,
	"participant_id" INTEGER NOT NULL,
	"initialized" BOOLEAN NOT NULL,
	"completed" BOOLEAN NOT NULL,
	"progress" NUMERIC,
	PRIMARY KEY("activity_id", "participant_id"),
	FOREIGN KEY ("activity_id") REFERENCES "Activities"("activity_id")
	ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY ("participant_id") REFERENCES "Users"("user_id")
	ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Activities_completion_index_0"
ON "Activities_completion" ("activity_id", "participant_id");
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
CREATE TABLE IF NOT EXISTS "ParticipantGroups" (
	"group_id" INTEGER NOT NULL UNIQUE,
	"mongo_id" VARCHAR,
	"name" VARCHAR NOT NULL,
	"createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	"updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	"use_new_generation" BOOLEAN NOT NULL,
	"group_owner_id" INTEGER NOT NULL,
	PRIMARY KEY("group_id"),
	FOREIGN KEY ("group_owner_id") REFERENCES "Users"("user_id")
	ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "ParticipantGroups_index_0"
ON "ParticipantGroups" ("group_id");
CREATE TABLE IF NOT EXISTS "ParticipantGroups_permissions" (
	"group_id" INTEGER NOT NULL,
	"user_id" INTEGER NOT NULL,
	"permission" VARCHAR NOT NULL CHECK(permission IN ("READ","WRITE")),
	PRIMARY KEY("group_id", "user_id"),
	FOREIGN KEY ("group_id") REFERENCES "ParticipantGroups"("group_id")
	ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY ("user_id") REFERENCES "Users"("user_id")
	ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "ParticipantGroups_permission_index_0"
ON "ParticipantGroups_permissions" ("group_id", "user_id");
CREATE TABLE IF NOT EXISTS "Allocators" (
	"allocator_id" INTEGER NOT NULL UNIQUE,
	"mongo_id" VARCHAR,
	"allocator_type" VARCHAR NOT NULL CHECK(allocator_type IN ("default", "group", "random")),
	"createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	"updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	PRIMARY KEY("allocator_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Allocator_index_0"
ON "Allocators" ("allocator_id");
CREATE TABLE IF NOT EXISTS "Experimental_Participants" (
	"allocator_id" INTEGER NOT NULL,
	"group_id" INTEGER NOT NULL,
	"participant_id" INTEGER NOT NULL,
	"session_id" INTEGER NOT NULL,
	PRIMARY KEY("allocator_id", "group_id", "participant_id", "session_id"),
	FOREIGN KEY ("session_id") REFERENCES "Sessions"("session_id")
	ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY ("participant_id") REFERENCES "Users"("user_id")
	ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY ("allocator_id") REFERENCES "Allocators"("allocator_id")
	ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY ("group_id") REFERENCES "ParticipantGroups"("group_id")
	ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Experimental_Participants_index_0"
ON "Experimental_Participants" ("allocator_id", "group_id", "participant_id", "session_id");
CREATE TABLE IF NOT EXISTS "Random_Allocators" (
	"allocator_id" INTEGER NOT NULL,
	"session_id" INTEGER NOT NULL,
	"percentage" NUMERIC NOT NULL,
	PRIMARY KEY("allocator_id", "session_id"),
	FOREIGN KEY ("session_id") REFERENCES "Sessions"("session_id")
	ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY ("allocator_id") REFERENCES "Allocators"("allocator_id")
	ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Random_Allocators_index_0"
ON "Random_Allocators" ("allocator_id", "session_id");
CREATE TABLE IF NOT EXISTS "SIMLETs_tags" (
	"simlet_id" INTEGER NOT NULL,
	"tag_id" INTEGER NOT NULL,
	PRIMARY KEY("simlet_id", "tag_id"),
	FOREIGN KEY ("simlet_id") REFERENCES "SIMLETs"("simlet_id")
	ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY ("tag_id") REFERENCES "SIMLETs_tags_list"("simlet_tag_id")
	ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "SIMLETs_tags_index_0"
ON "SIMLETs_tags" ("simlet_id", "tag_id");
CREATE TABLE IF NOT EXISTS "Sessions_tags" (
	"session_id" INTEGER NOT NULL,
	"tag_id" INTEGER NOT NULL,
	PRIMARY KEY("session_id", "tag_id"),
	FOREIGN KEY ("tag_id") REFERENCES "Sessions_tags_list"("session_tag_id")
	ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY ("session_id") REFERENCES "Sessions"("session_id")
	ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Sessions_tags_index_0"
ON "Sessions_tags" ("session_id", "tag_id");
CREATE TABLE IF NOT EXISTS "ParticipantGroups_participants" (
	"group_id" INTEGER NOT NULL,
	"participant_id" INTEGER NOT NULL,
	PRIMARY KEY("group_id", "participant_id"),
	FOREIGN KEY ("group_id") REFERENCES "ParticipantGroups"("group_id")
	ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY ("participant_id") REFERENCES "Users"("user_id")
	ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "ParticipantGroups_participants_index_0"
ON "ParticipantGroups_participants" ("group_id", "participant_id");
CREATE TABLE IF NOT EXISTS "Sessions_permissions" (
	"session_id" INTEGER NOT NULL,
	"user_id" INTEGER NOT NULL,
	"permission" VARCHAR NOT NULL CHECK(permission IN ("READ","WRITE")),
	PRIMARY KEY("session_id", "user_id"),
	FOREIGN KEY ("user_id") REFERENCES "Users"("user_id")
	ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY ("session_id") REFERENCES "Sessions"("session_id")
	ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Sessions_permission_index_0"
ON "Sessions_permissions" ("session_id", "user_id");
CREATE TABLE IF NOT EXISTS "SIMLETs_permissions" (
	"simlet_id" INTEGER NOT NULL,
	"user_id" INTEGER NOT NULL,
	"permission" VARCHAR NOT NULL CHECK(permission IN ("READ","WRITE")),
	PRIMARY KEY("simlet_id", "user_id"),
	FOREIGN KEY ("user_id") REFERENCES "Users"("user_id")
	ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY ("simlet_id") REFERENCES "SIMLETs"("simlet_id")
	ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "SIMLETs_permission_index_0"
ON "SIMLETs_permissions" ("simlet_id", "user_id");
CREATE TABLE IF NOT EXISTS "Activities_template" (
	"activity_template_id" INTEGER NOT NULL UNIQUE,
	"name" VARCHAR NOT NULL,
	"activity_type" VARCHAR NOT NULL CHECK(activity_type IN ("default", "manual", "limesurvey", "gameplay", "lti_tool")),
	"description" VARCHAR NOT NULL,
	"public" BOOLEAN NOT NULL,
	"createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	"updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
	"owner_id" INTEGER NOT NULL,
	PRIMARY KEY("activity_template_id"),
	FOREIGN KEY ("owner_id") REFERENCES "Users"("user_id")
	ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "Activities_template_index_0"
ON "Activities_template" ("activity_template_id");
CREATE TABLE IF NOT EXISTS "Manual_Template_Activities" (
	"activity_template_id" INTEGER NOT NULL UNIQUE,
	"ressource_type" VARCHAR NOT NULL CHECK(ressource_type IN ("EXTERNAL","WEB")),
	"ressource_url" VARCHAR NOT NULL,
	PRIMARY KEY("activity_template_id"),
	FOREIGN KEY ("activity_template_id") REFERENCES "Activities_template"("activity_template_id")
	ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Manual_Template_Activities_index_0"
ON "Manual_Template_Activities" ("activity_template_id");
CREATE TABLE IF NOT EXISTS "GamePlay_Activities_Template" (
	"activity_template_id" INTEGER NOT NULL UNIQUE,
	"category_id" INTEGER,
	"subject_area_id" INTEGER,
	"game_type" VARCHAR NOT NULL CHECK(game_type IN ("WEB", "DESKTOP")),
	"game_url" VARCHAR NOT NULL,
	PRIMARY KEY("activity_template_id"),
	FOREIGN KEY ("activity_template_id") REFERENCES "Activities_template"("activity_template_id")
	ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY ("category_id") REFERENCES "Category_list"("category_id")
	ON UPDATE CASCADE ON DELETE RESTRICT,
	FOREIGN KEY ("subject_area_id") REFERENCES "Subject_area_list"("subject_area_id")
	ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "GamePlay_Activities_Template_index_0"
ON "GamePlay_Activities_Template" ("activity_template_id");
CREATE TABLE IF NOT EXISTS "Limesurvey_Activities_Template" (
	"activity_template_id" INTEGER NOT NULL UNIQUE,
	"survey_id" INTEGER NOT NULL,
	"survey_owner" INTEGER,
	PRIMARY KEY("activity_template_id"),
	FOREIGN KEY ("activity_template_id") REFERENCES "Activities_template"("activity_template_id")
	ON UPDATE CASCADE ON DELETE CASCADE,
	FOREIGN KEY ("survey_owner") REFERENCES "Users"("user_id")
	ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "Limesurvey_Activities_Template_index_0"
ON "Limesurvey_Activities_Template" ("activity_template_id");
CREATE TABLE IF NOT EXISTS "SIMLETs_tags_list" (
	"simlet_tag_id" INTEGER NOT NULL UNIQUE,
	"simlet_tag_name" VARCHAR NOT NULL,
	PRIMARY KEY("simlet_tag_id")
);

CREATE INDEX IF NOT EXISTS "SIMLETs_tags_list_index_0"
ON "SIMLETs_tags_list" ("simlet_tag_id");
CREATE TABLE IF NOT EXISTS "Sessions_tags_list" (
	"session_tag_id" INTEGER NOT NULL UNIQUE,
	"session_tag_name" VARCHAR NOT NULL,
	PRIMARY KEY("session_tag_id")
);

CREATE INDEX IF NOT EXISTS "sessions_tags_list_index_0"
ON "Sessions_tags_list" ("session_tag_id");
CREATE TABLE IF NOT EXISTS "Activities_template_permissions" (
	"activity_template_id" INTEGER NOT NULL,
	"user_id" INTEGER NOT NULL,
	"permission" VARCHAR NOT NULL CHECK(permission IN ("READ","WRITE")),
	PRIMARY KEY("activity_template_id", "user_id"),
	FOREIGN KEY ("activity_template_id") REFERENCES "Activities_template"("activity_template_id")
	ON UPDATE CASCADE ON DELETE RESTRICT,
	FOREIGN KEY ("user_id") REFERENCES "Users"("user_id")
	ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "Sessions_permission_index_0"
ON "Activities_template_permissions" ("session_id", "user_id");
CREATE TABLE IF NOT EXISTS "Subject_area_list" (
	"subject_area_id" INTEGER NOT NULL UNIQUE,
	"subject_area_name" VARCHAR NOT NULL,
	PRIMARY KEY("subject_area_id")
);

CREATE INDEX IF NOT EXISTS "sessions_tags_list_index_0"
ON "Subject_area_list" ("subject_area_id");
CREATE TABLE IF NOT EXISTS "Category_list" (
	"category_id" INTEGER NOT NULL UNIQUE,
	"category_name" VARCHAR NOT NULL,
	PRIMARY KEY("category_id")
);

CREATE INDEX IF NOT EXISTS "sessions_tags_list_index_0"
ON "Category_list" ("category_id");