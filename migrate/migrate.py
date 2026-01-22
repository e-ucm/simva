import os
import json
import time
from datetime import datetime
import sqlite3

def convert_iso_to_mysql_datetime_format(date):
    if date is None :
        return
    return datetime.fromisoformat(date.replace("Z", "+00:00")).strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]

# ---- Environment variables from docker-compose ----
SQL_SCRIPT_FOLDER = os.getenv("SQL_SCRIPT_FOLDER")
SQL_DB_FOLDER = os.getenv("SQL_DB_FOLDER")
SQL_DB_FILE = os.getenv("SQL_DB_FILE")
MONGO_BACKUP_FOLDER = os.getenv("MONGO_BACKUP_FOLDER")

# ---- Connect to MySQL ----
sqlite_con = sqlite3.connect(f"{SQL_DB_FOLDER}/{SQL_DB_FILE}")
print("SQLite is available!")

cursor = sqlite_con.cursor()

with open(f"{SQL_SCRIPT_FOLDER}/01-schemas.sql", "r") as f:
    schema_sql = f.read()
    cursor.executescript(schema_sql)
    sqlite_con.commit()

with open(f"{SQL_SCRIPT_FOLDER}/02-views.sql", "r") as f:
    views_sql = f.read()
    cursor.executescript(views_sql)
    sqlite_con.commit()


print("Starting migration...")
print("------------")
print("Adding Users")
print("------------")

# Get Users from MySQL
cursor.execute("SELECT username FROM Users WHERE mongo_id IS NOT NULL")
mysql_username = cursor.fetchall()
existing_usernames = set(u[0] for u in mysql_username)  # extract string from tuple

# Get Users from Mongo Backup
users=[]
with open(MONGO_BACKUP_FOLDER + "/users.json", "r") as f:
    for line in f:
        if line.strip():  # skip empty lines
            obj = json.loads(line)
            users.append(obj)


# Adding User into Users table
user_sql = """
INSERT INTO Users (mongo_id, username, isToken, token, email, role)
VALUES (?, ?, ?, ?, ?, ?)
"""

user_values = [
    (
        u["_id"]["$oid"],
        u["username"],
        u.get("isToken", "false") == "true",
        u.get("token",None),
        u["email"],
        u["role"]
    )
    for u in users
    if u["username"] not in existing_usernames
]
print(user_values)
cursor.executemany(user_sql, user_values)
sqlite_con.commit()

print("Inserted:")
print("  Users:", len(user_values))

#Dict to map Username to MySQL Id
cursor.execute("SELECT user_id, username FROM Users WHERE mongo_id IS NOT NULL")
mysql_users_ids = cursor.fetchall()
mongo_user_to_mysql_id = {username: user_id for user_id, username in mysql_users_ids}
print(mongo_user_to_mysql_id)

print("-------------")
print("Adding Groups")
print("-------------")

# Get existing Groups from MySQL
cursor.execute("SELECT mongo_id FROM ParticipantGroups WHERE mongo_id IS NOT NULL")
mysql_group_mongo_ids = cursor.fetchall()
existing_group_mongo_db = set(id[0] for id in mysql_group_mongo_ids)  # extract string from tuple

# Get Groups from Mongo Backup
groups=[]
with open(MONGO_BACKUP_FOLDER + "/groups.json", "r") as f:
    for line in f:
        if line.strip():  # skip empty lines
            obj = json.loads(line)
            groups.append(obj)

# Adding Group into Groups table
groups_sql = """
INSERT INTO ParticipantGroups (mongo_id, name, createdAt, use_new_generation, group_owner_id)
VALUES (?, ?, ?, ?, ?)
"""

filtered_groups = [
    ( g )
    for g in groups
    if g["_id"]["$oid"] not in existing_group_mongo_db
]
groups_values = [
    (
        u["_id"]["$oid"], 
        u["name"], 
        convert_iso_to_mysql_datetime_format(u["created"]["$date"]),
        True if u["version"] == "1" else False,
        mongo_user_to_mysql_id[u["owners"][0]]
    )
    for u in filtered_groups
]
print(groups_values)

cursor.executemany(groups_sql, groups_values)
sqlite_con.commit()

print("Inserted:")
print("  Groups:", len(groups_values))

#Dict to map Mongo Id to MySQL Id
cursor.execute("SELECT group_id, mongo_id FROM ParticipantGroups WHERE mongo_id IS NOT NULL")
mysql_groups_ids = cursor.fetchall()
mongo_group_to_mysql_id = {mongo_id: group_id for group_id, mongo_id in mysql_groups_ids}
print(mongo_group_to_mysql_id)

#adding groups participants
print("Adding Groups Participants")
groups_participant_sql = """
INSERT INTO ParticipantGroups_participants (group_id, participant_id)
VALUES (?, ?)
"""

groups_participant_values=[]
for g in filtered_groups:
    mongo_id=g["_id"]["$oid"]
    for participant in g["participants"]:
        groups_participant_values.append((mongo_group_to_mysql_id[mongo_id],mongo_user_to_mysql_id[participant]))
print(groups_participant_values)

cursor.executemany(groups_participant_sql, groups_participant_values)
sqlite_con.commit()

print("Inserted:")
print("  ParticipantGroups_participants:", len(groups_participant_values))

#adding groups owners
print("Adding Groups owners")
groups_owners_sql = """
INSERT INTO ParticipantGroups_permissions (group_id, user_id, permission)
VALUES (?, ?, ?)
"""
groups_owners_values=[]
for g in filtered_groups:
    mongo_id=g["_id"]["$oid"]
    owners=g["owners"]
    owners.pop(0)
    for owner in owners:
        groups_owners_values.append((mongo_group_to_mysql_id[mongo_id],mongo_user_to_mysql_id[owner], "WRITE"))
print(groups_owners_values)

cursor.executemany(groups_owners_sql, groups_owners_values)
sqlite_con.commit()

print("Inserted:")
print("  ParticipantGroups_permissions:", len(groups_owners_values))

print("----------------")
print("Adding Allocator")
print("----------------")
# Get existing Allocators from MySQL
cursor.execute("SELECT mongo_id FROM Allocators WHERE mongo_id IS NOT NULL")
mysql_allocator_mongo_ids = cursor.fetchall()
existing_allocator_mongo_db = set(id[0] for id in mysql_allocator_mongo_ids)  # extract string from tuple

# Get allocators from Mongo Backup
allocators=[]
with open(MONGO_BACKUP_FOLDER + "/allocators.json", "r") as f:
    for line in f:
        if line.strip():  # skip empty lines
            obj = json.loads(line)
            allocators.append(obj)

#adding allocators into allocators table
allocators_sql = """
INSERT INTO Allocators (mongo_id, allocator_type)
VALUES (?, ?)
"""

filtered_allocators = [
    ( a )
    for a in allocators
    if a["_id"]["$oid"] not in existing_allocator_mongo_db
]
allocators_values = [
    (a["_id"]["$oid"], a["type"])
    for a in filtered_allocators
]
print(allocators_values)
cursor.executemany(allocators_sql, allocators_values)
sqlite_con.commit()

print("Inserted:")
print("  Allocators:", len(filtered_allocators))

#Dict to map Mongo Id to MySQL Id
cursor.execute("SELECT allocator_id, mongo_id FROM Allocators WHERE mongo_id IS NOT NULL")
mysql_allocator_ids = cursor.fetchall()
mongo_allocator_to_mysql_id = {mongo_id: allocator_id for allocator_id, mongo_id in mysql_allocator_ids}
print(mongo_allocator_to_mysql_id)

print("---------------")
print("Adding SIMLETS ")
print("---------------")
# Get SIMLETs from MySQL
cursor.execute("SELECT mongo_id FROM SIMLETs WHERE mongo_id IS NOT NULL")
mysql_simlet_mongo_ids = cursor.fetchall()
existing_simlet_mongo_db = set(id[0] for id in mysql_simlet_mongo_ids)  # extract string from tuple

#Get simlets from Mongo Backup
simlets=[]
with open(MONGO_BACKUP_FOLDER + "/studies.json", "r") as f:
    for line in f:
        if line.strip():  # skip empty lines
            obj = json.loads(line)
            simlets.append(obj)

#adding simlets into simlets table
simlets_sql = """
INSERT INTO SIMLETs (mongo_id, name, createdAt, description, allocator_id, simlet_coordinator_id)
VALUES (?, ?, ?, ?, ?, ?)
"""

filtered_simlets = [
    ( s )
    for s in simlets
    if s["_id"]["$oid"] not in existing_simlet_mongo_db
]
simlets_values = [
    (
        s["_id"]["$oid"], 
        s["name"], 
        convert_iso_to_mysql_datetime_format(s.get("created", {}).get("$date", None)),
        "",
        mongo_allocator_to_mysql_id[s["allocator"]],
        mongo_user_to_mysql_id[s["owners"][0]]
    )
    for s in filtered_simlets
]
print(simlets_values)

cursor.executemany(simlets_sql, simlets_values)
sqlite_con.commit()

print("Inserted:")
print("  SIMLETs:", len(simlets_values))

#Dict to map Mongo Id to MySQL Id
cursor.execute("SELECT simlet_id, mongo_id FROM SIMLETs WHERE mongo_id IS NOT NULL")
mysql_simlet_ids = cursor.fetchall()
mongo_simlet_to_mysql_id = {mongo_id: simlet_id for simlet_id, mongo_id in mysql_simlet_ids}
print(mongo_simlet_to_mysql_id)

#adding SIMLETs Sessions, groups, coordinators and shlinks
print("Adding SIMLETs groups and shlinks")
simlet_group_sql = """
INSERT INTO SIMLETs_groups (simlet_id, group_id)
VALUES (?, ?)
"""
simlet_shlinks_sql = """
INSERT INTO SIMLETs_shlinks (simlet_id, short_url, short_code, createdAt, title, valid_date, expiration_date, domain )
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
"""

simlet_group_values=[]
simlet_shlinks_values=[]
for s in filtered_simlets:
    simlet_mongo_id=s["_id"]["$oid"]
    simlet_mysql_id=mongo_simlet_to_mysql_id[simlet_mongo_id]
    if s.get("shlink",None) is not None:
        simlet_shlinks_values.append((
            simlet_mysql_id, 
            s.get("shlink",{}).get("shortUrl"), 
            s.get("shlink",{}).get("shortCode"), 
            convert_iso_to_mysql_datetime_format(s.get("shlink",{}).get("dateCreated")),
            s.get("shlink",{}).get("title"),
            s.get("shlink",{}).get("meta").get("validSince"),
            s.get("shlink",{}).get("meta").get("validUntil"),
            s.get("shlink",{}).get("domain")
        ))
    for group_mongo_id in s.get("groups", []):
        simlet_group_values.append((simlet_mysql_id, mongo_group_to_mysql_id[group_mongo_id]))
print(simlet_shlinks_values)
print(simlet_group_values)
cursor.executemany(simlet_group_sql, simlet_group_values)
cursor.executemany(simlet_shlinks_sql, simlet_shlinks_values)
sqlite_con.commit()

print("Inserted:")
print("  SIMLETs_shlinks:", len(simlet_shlinks_values))
print("  SIMLETs_groups:", len(simlet_group_values))

#adding SIMLETs coordinators, test supervisors and activities owners
print("--------------------")
print("Adding OWNERS TABLES")
print("--------------------")
print("Adding SIMLET Coordinator and session supervisor mapping")
users_roles_sql = """
INSERT INTO SIMLETs_permissions (simlet_id, user_id, permission)
VALUES (?, ?, ?)
"""
users_roles_values=[]
for s in filtered_simlets:
    simlet_mongo_id=s["_id"]["$oid"]
    simlet_mysql_id=mongo_simlet_to_mysql_id[simlet_mongo_id]
    owners=s.get("owners", [])
    owners.pop(0)
    for owner_mongo_id in owners:
        owner_mysql=mongo_user_to_mysql_id[owner_mongo_id]
        users_roles_values.append((simlet_mysql_id, owner_mysql, "WRITE"))
print(users_roles_values)
cursor.executemany(users_roles_sql, users_roles_values)
sqlite_con.commit()
print("  SIMLETs_permissions:", len(users_roles_values))

print("----------------")
print("Adding sessions ")
print("----------------")
#Dict to map Mongo Id to MySQL Id
cursor.execute("SELECT mongo_id, simlet_coordinator_id FROM SIMLETs WHERE mongo_id IS NOT NULL")
mysql_simlet_owners_ids = cursor.fetchall()
mongo_simlet_owners_to_mysql_id = {mongo_id: simlet_coordinator_id for mongo_id, simlet_coordinator_id in mysql_simlet_owners_ids}
print(mongo_simlet_owners_to_mysql_id)

# Get Sessions from MySQL
cursor.execute("SELECT mongo_id FROM Sessions WHERE mongo_id IS NOT NULL")
mysql_session_mongo_ids = cursor.fetchall()
existing_session_mongo_db = set(id[0] for id in mysql_session_mongo_ids)  # extract string from tuple
print(existing_session_mongo_db)

# Get Sessions from Mongo Backup
sessions=[]
with open(MONGO_BACKUP_FOLDER + "/tests.json", "r") as f:
    for line in f:
        if line.strip():  # skip empty lines
            obj = json.loads(line)
            sessions.append(obj)

# Adding Sessions into sesions table
sessions_sql = """
INSERT INTO Sessions (simlet_id, mongo_id, name, description, active, session_supervisor_id)
VALUES (?, ?, ?, ?, ?, ?)
"""

filtered_sessions = [
    ( s )
    for s in sessions
    if s["_id"]["$oid"] not in existing_session_mongo_db
]
print(filtered_sessions)

sessions_values = [
    (
        mongo_simlet_to_mysql_id[s["study"]],
        s["_id"]["$oid"],
        s["name"],
        "",
        True,
        mongo_simlet_owners_to_mysql_id[s["study"]]
        )
    for s in filtered_sessions
]

cursor.executemany(sessions_sql, sessions_values)
sqlite_con.commit()

print("Inserted:")
print("  Sessions:", len(sessions_values))

#Dict to map Mongo Id to MySQL Id
cursor.execute("SELECT session_id, mongo_id FROM Sessions WHERE mongo_id IS NOT NULL")
mysql_session_ids = cursor.fetchall()
mongo_session_to_mysql_id = {mongo_id: session_id for session_id, mongo_id in mysql_session_ids}
print(mongo_session_to_mysql_id)

print("-----------------")
print("Adding Activities")
print("-----------------")
# Get Activities from MySQL
cursor.execute("SELECT mongo_id FROM Activities WHERE mongo_id IS NOT NULL")
mysql_activities_mongo_ids = cursor.fetchall()
existing_activities_mongo_db = set(id[0] for id in mysql_activities_mongo_ids)  # extract string from tuple

# Get Activities from Mongo Backup
activities=[]
with open(MONGO_BACKUP_FOLDER + "/activities.json", "r") as f:
    for line in f:
        if line.strip():  # skip empty lines
            obj = json.loads(line)
            activities.append(obj)

# Adding Activities into Activities table
activities_sql = """
INSERT INTO Activities (session_id, mongo_id, name, activity_type, presignedUrl, generated_at, expire_on_seconds, trace_storage, description)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
"""

filtered_activities = [
    ( a )
    for a in activities
    if a["_id"]["$oid"] not in existing_activities_mongo_db
]

activities_values = [
    (
        mongo_session_to_mysql_id[a["test"]],
        a["_id"]["$oid"], 
        a["name"],
        a["type"],
        a.get("extra_data", {}).get("minio_trace", {}).get("presignedUrl"), 
        convert_iso_to_mysql_datetime_format(a.get("extra_data", {}).get("minio_trace", {}).get("generated_at")),
        a.get("extra_data", {}).get("minio_trace", {}).get("expire_on_sec"), 
        a.get("extra_data", {}).get("config", {}).get("trace_storage","false") == "true", 
        ""
    )
    for a in filtered_activities
]
print(activities_values)

cursor.executemany(activities_sql, activities_values)
sqlite_con.commit()

print("Inserted:")
print("  Activities:", len(activities_values))

##Dict to map Mongo Id to MySQL Id
cursor.execute("SELECT activity_id, mongo_id FROM Activities WHERE mongo_id IS NOT NULL")
mysql_activity_ids = cursor.fetchall()
mongo_activity_to_mysql_id = {mongo_id: activity_id for activity_id, mongo_id in mysql_activity_ids}
print(mongo_activity_to_mysql_id)

#adding Manual Activities
print("Adding Manual Activities")
manual_activities_sql = """
INSERT INTO Manual_Activities (activity_id, user_managed, ressource_type, ressource_url)
VALUES (?, ?, ?, ?)
"""

manual_activities_values = [
    (
        mongo_activity_to_mysql_id[a["_id"]["$oid"]],
        a.get("extra_data", {}).get("user_managed", "false") == "true",
        "EXTERNAL" if a.get("extra_data", {}).get("uri", "") == "" else "WEB",
        a.get("extra_data", {}).get("uri", "")
    )
    for a in filtered_activities
    if a.get("type") == "manual"
]

print(manual_activities_values)

cursor.executemany(manual_activities_sql, manual_activities_values)
sqlite_con.commit()

print("Inserted:")
print("  ManualActivities:", len(manual_activities_values))

#adding Limesurvey Activities
print("Adding Limesurvey Activities")
limesurvey_activities_sql = """
INSERT INTO Limesurvey_Activities (activity_id, survey_id, language, lrsset)
VALUES (?, ?, ?, ?)
"""

limesurvey_activities_values = [
    (
        mongo_activity_to_mysql_id[a["_id"]["$oid"]],
        a.get("extra_data", {}).get("surveyId", ""),
        a.get("extra_data", {}).get("language", ""),
        a.get("extra_data", {}).get("lrsset", "")
    )
    for a in filtered_activities
    if a.get("type") == "limesurvey"
]
print(limesurvey_activities_values)

cursor.executemany(limesurvey_activities_sql, limesurvey_activities_values)
sqlite_con.commit()

print("Inserted:")
print("  LimesurveyActivities:", len(limesurvey_activities_values))

#adding Gameplay Activities
print("Adding Gameplay Activities")
gameplay_activities_sql = """
INSERT INTO GamePlay_Activities (activity_id, backup, scorm_xapi_by_game, game_type, game_url)
VALUES (?, ?, ?, ?, ?)
"""

gameplay_activities_values = [
    (
        mongo_activity_to_mysql_id[a["_id"]["$oid"]],
        a.get("extra_data", {}).get("config", {}).get("backup", "false") == "true",
        a.get("extra_data", {}).get("config", {}).get("scorm_xapi_by_game", "false") == "true",
        "DESKTOP" if a.get("extra_data", {}).get("game_uri", "") == "" else "WEB",
        a.get("extra_data", {}).get("game_uri", "")
    )
    for a in filtered_activities
    if a.get("type") == "gameplay"
]
print(gameplay_activities_values)

cursor.executemany(gameplay_activities_sql, gameplay_activities_values)
sqlite_con.commit()

print("Inserted:")
print("  GameplayActivities:", len(gameplay_activities_values))

#adding Activities completion
print("Adding Activities completion")
activities_completion_sql = """
INSERT INTO Activities_completion (activity_id, participant_id, initialized, progress, completed)
VALUES (?, ?, ?, ?, ?)
"""

activities_completion_values=[]
for a in filtered_activities:
    activity_mongo_id=a["_id"]["$oid"]
    for participant_mongo_id in a.get("extra_data", {}).get("participants", {}):
        participant_value = a.get("extra_data", {}).get("participants", {})[participant_mongo_id]
        completed=participant_value.get("completion", "false") == "true"
        actual_progress=participant_value.get("progress", 0)
        progress=None if actual_progress == 0 and not completed else actual_progress
        initialized=False if progress is None else True
        activities_completion_values.append((mongo_activity_to_mysql_id[activity_mongo_id],mongo_user_to_mysql_id[participant_mongo_id], initialized, progress, completed))
print(activities_completion_values)

cursor.executemany(activities_completion_sql, activities_completion_values)
sqlite_con.commit()

print("Inserted:")
print("  Activities_completion:", len(activities_completion_values))

print("-----------------")
print("Adding Allocation")
print("-----------------")
#adding Default and groups Allocators
print("Adding Experimental_Participants")
allocation_sql = """
INSERT INTO Experimental_Participants (allocator_id, group_id, participant_id, session_id)
VALUES (?, ?, ?, ?)
"""

def get_group_ids(participant_id, pairs):
    return {
        group_id
        for group_id, pid in pairs
        if pid == participant_id
    }

def get_participants(group_id, pairs):
    return {
        participant_id
        for gid, participant_id in pairs
        if gid == group_id
    }

allocation_values=[]
for a in filtered_allocators:
    allocator_mongo_id=a["_id"]["$oid"]
    allocator_id=mongo_allocator_to_mysql_id[allocator_mongo_id]
    allocator_type=a["type"]
    # Convert mongo group ids to mysql ids
    # Create placeholders for SQL IN clause
    query = f"""
            SELECT group_id, user_id
            FROM v_complete_groups_from_allocator_and_simlets
            WHERE allocator_id = ?
    """
    print(query)
    print(allocator_id)
    cursor.execute(query, [allocator_id])
    sql_participants_ids = cursor.fetchall()
    # Extract values from tuples
    existing_sql_participants_ids = {
            (group_id, participant_id)
            for group_id, participant_id in sql_participants_ids
    }
    print(existing_sql_participants_ids)
    for allocation_mongo_id in a.get("extra_data", {}).get("allocations", {}):
        session_id = mongo_session_to_mysql_id[a.get("extra_data", {}).get("allocations", {})[allocation_mongo_id]]
        if allocator_type == "default":
            allocation_id=mongo_user_to_mysql_id[allocation_mongo_id]
            for group_id in get_group_ids(allocation_id, existing_sql_participants_ids):
                allocation_values.append((allocator_id, group_id, allocation_id, session_id))
        elif allocator_type == "group":
            group_id=mongo_group_to_mysql_id[allocation_mongo_id]
            for id in get_participants(group_id, existing_sql_participants_ids):
                allocation_values.append((allocator_id, group_id, id, session_id))
        else:
            continue

print(allocation_values)
cursor.executemany(allocation_sql, allocation_values)
sqlite_con.commit()

print("Inserted:")
print("  Experimental_Participants:", len(allocation_values))


print("---------------------")
print("Adding SIMLET_Sandbox")
print("---------------------")
simlets_sandbox_sql = """
UPDATE SIMLETs SET sandbox_session_id = ? WHERE simlet_id = ?
"""
simlets_sandbox_values = [
    (
        mongo_simlet_to_mysql_id[s["_id"]["$oid"]],
        mongo_session_to_mysql_id[s.get("sandbox")]
    )
    for s in filtered_simlets if s.get("sandbox", None) is not None
]
print(simlets_sandbox_values)
cursor.executemany(simlets_sandbox_sql, simlets_sandbox_values)
sqlite_con.commit()

print("Update:")
print("  SIMLET_Sandbox:", len(simlets_sandbox_values))

print("Migration done!")
cursor.close()
sqlite_con.close()