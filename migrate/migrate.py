import os
import json
import time
from datetime import datetime, timedelta
import sqlite3

def convert_iso_to_mysql_datetime_format(date):
    if date is None :
        return
    return datetime.fromisoformat(date.replace("Z", "+00:00")).strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]

def get_mongo_oid(value):
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        if "$oid" in value:
            return value["$oid"]
        nested_id = value.get("_id")
        if isinstance(nested_id, str):
            return nested_id
        if isinstance(nested_id, dict):
            return nested_id.get("$oid")
    return None

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
    print("Creating tables...")
    schema_sql = f.read()
    cursor.executescript(schema_sql)
    sqlite_con.commit()
    print ("Tables created!")

with open(f"{SQL_SCRIPT_FOLDER}/02-views.sql", "r") as f:
    print("Creating views...")
    views_sql = f.read()
    cursor.executescript(views_sql)
    sqlite_con.commit()
    print ("Views created!")

if not MONGO_BACKUP_FOLDER or not MONGO_BACKUP_FOLDER.strip():
    print("MONGO_BACKUP_FOLDER is empty. Skipping migration. Saving database with only new tables and views created.")
    cursor.close()
    sqlite_con.close()
    print("Migration skipped due to missing Mongo backup folder. Database saved with new tables and views created.")
    raise SystemExit(0)

required_backup_files = [
    "users.json",
    "groups.json",
    "allocators.json",
    "studies.json",
    "tests.json",
    "activities.json"
]

missing_backup_files = [
    file_name
    for file_name in required_backup_files
    if not os.path.isfile(os.path.join(MONGO_BACKUP_FOLDER, file_name))
]

if missing_backup_files:
    print(
        "Missing required Mongo backup files in "
        f"{MONGO_BACKUP_FOLDER}: {', '.join(missing_backup_files)}. "
        "Skipping migration."
    )
    cursor.close()
    sqlite_con.close()
    print("Migration skipped due to missing Mongo backup files in mongo backup folder. Database saved with new tables and views created.")
    raise SystemExit(0)

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
cursor.execute("SELECT user_id, username, mongo_id FROM Users WHERE mongo_id IS NOT NULL")
mysql_users_ids = cursor.fetchall()
mongo_user_to_mysql_id = {username: user_id for user_id, username, mongo_id in mysql_users_ids}
print(mongo_user_to_mysql_id)
mongo_id_user_to_mysql_id = {mongo_id: user_id for user_id, username, mongo_id in mysql_users_ids}
mysql_id_user_to_mongo_id = {user_id: mongo_id for user_id, username, mongo_id in mysql_users_ids}  
print(mongo_id_user_to_mysql_id)

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
INSERT INTO SIMLETs (mongo_id, simlet_name, simlet_archived, simlet_description, simlet_supervisor_id, createdAt)
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
        False,
        "",
        mongo_user_to_mysql_id[s["owners"][0]],
        convert_iso_to_mysql_datetime_format(s.get("created", {}).get("$date", None))
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

print("--------------------")
print("Adding SIMLET Groups")
print("--------------------")

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

filtered_groups = [
    ( g )
    for g in groups
    if g["_id"]["$oid"] not in existing_group_mongo_db
]

# Get existing Groups from MySQL
cursor.execute("SELECT group_allocator_mongo_id FROM ParticipantGroups WHERE mongo_id IS NOT NULL")
mysql_allocator_mongo_ids = cursor.fetchall()
existing_allocator_mongo_db = set(id[0] for id in mysql_allocator_mongo_ids)  # extract string from tuple

# Get allocators from Mongo Backup
allocators=[]
with open(MONGO_BACKUP_FOLDER + "/allocators.json", "r") as f:
    for line in f:
        if line.strip():  # skip empty lines
            obj = json.loads(line)
            allocators.append(obj)

filtered_allocators = [
    ( a )
    for a in allocators
    if a["_id"]["$oid"] not in existing_allocator_mongo_db
]
print("Adding SIMLETs groups and shlinks")
# Adding Group into Groups table
simlet_group_sql = """
INSERT INTO ParticipantGroups (simlet_id, mongo_id, group_name, group_use_new_generation, group_owner_id, group_sandbox, group_allocator_mongo_id, group_allocator_type, createdAt)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
"""
simlet_shlinks_sql = """
INSERT INTO SIMLETs_shlinks (simlet_id, short_url, short_code, createdAt, short_title, short_valid_date, short_expiration_date, short_domain )
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
"""
allocator_id_to_type={}
for a in filtered_allocators:
    allocator_id_to_type[a["_id"]["$oid"]]=a["type"]
group_mongo_id_to_simlet_mysql_id={}
group_simlet_to_allocator_mongo_id={}  # Maps (group_mongo_id, simlet_mysql_id) -> allocator_mongo_id
simlet_shlinks_values=[]
for s in filtered_simlets:
    simlet_mongo_id=s["_id"]["$oid"]
    simlet_mysql_id=mongo_simlet_to_mysql_id[simlet_mongo_id]
    allocator_mongo_id=s.get("allocator")
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
        if group_mongo_id in group_mongo_id_to_simlet_mysql_id.keys():
            group_mongo_id_to_simlet_mysql_id[group_mongo_id].add(simlet_mysql_id)
        else:
            group_mongo_id_to_simlet_mysql_id[group_mongo_id] = {simlet_mysql_id}
        # Store allocator for this specific (group, simlet) pair
        group_simlet_to_allocator_mongo_id[(group_mongo_id, simlet_mysql_id)] = allocator_mongo_id

simlet_group_values = []
for u in filtered_groups:
    group_mongo_id = u["_id"]["$oid"]
    for simlet_id in group_mongo_id_to_simlet_mysql_id.get(group_mongo_id, []):
        allocator_mongo_id = group_simlet_to_allocator_mongo_id.get((group_mongo_id, simlet_id))
        simlet_group_values.append((
            simlet_id,
            group_mongo_id,
            u["name"],
            True if u["version"] == "1" else False,
            mongo_user_to_mysql_id[u["owners"][0]],
            False,
            allocator_mongo_id,
            allocator_id_to_type.get(allocator_mongo_id, "default"),
            convert_iso_to_mysql_datetime_format(u["created"]["$date"])
        ))
print(simlet_shlinks_values)
print(simlet_group_values)
cursor.executemany(simlet_group_sql, simlet_group_values)
cursor.executemany(simlet_shlinks_sql, simlet_shlinks_values)
sqlite_con.commit()

print("Inserted:")
print("  SIMLETs_shlinks:", len(simlet_shlinks_values))
print("  SIMLETs_groups:", len(simlet_group_values))

#Dict to map (Mongo Id, simlet_id) to MySQL group_id
cursor.execute("SELECT group_id, group_allocator_mongo_id, simlet_id FROM ParticipantGroups WHERE group_allocator_mongo_id IS NOT NULL")
mysql_simlet_group_ids = cursor.fetchall()
# Maps (mongo_id, simlet_id) -> group_id
mongo_allocator_group_simlet_to_mysql_id = {}
for group_id, group_allocator_mongo_id, simlet_id in mysql_simlet_group_ids:
    print("group_id:", group_id, "group_allocator_mongo_id:", group_allocator_mongo_id, "simlet_id:", simlet_id)
    if group_allocator_mongo_id not in mongo_allocator_group_simlet_to_mysql_id:
        mongo_allocator_group_simlet_to_mysql_id[group_allocator_mongo_id] = set()
    mongo_allocator_group_simlet_to_mysql_id[group_allocator_mongo_id].add((simlet_id, group_id))
print(mongo_allocator_group_simlet_to_mysql_id)

#Dict to map (Mongo Id, simlet_id) to MySQL group_id
cursor.execute("SELECT group_id, mongo_id, simlet_id FROM ParticipantGroups WHERE mongo_id IS NOT NULL")
mysql_simlet_group_ids = cursor.fetchall()
# Maps (mongo_id, simlet_id) -> group_id
mongo_group_simlet_to_mysql_id = {(mongo_id, simlet_id): group_id for group_id, mongo_id, simlet_id in mysql_simlet_group_ids}
# Also keep a mapping from mongo_id -> list of group_ids (for participants)
mongo_group_to_mysql_ids = {}
for group_id, mongo_id, simlet_id in mysql_simlet_group_ids:
    if mongo_id not in mongo_group_to_mysql_ids:
        mongo_group_to_mysql_ids[mongo_id] = []
    mongo_group_to_mysql_ids[mongo_id].append(group_id)
print(mongo_group_simlet_to_mysql_id)

#adding groups participants
print("Adding Groups Participants")
groups_participant_sql = """
INSERT INTO ParticipantGroups_participants (group_id, participant_id)
VALUES (?, ?)
"""

groups_participant_values=[]
for g in filtered_groups:
    mongo_id=g["_id"]["$oid"]
    # Insert participants for all group_ids associated with this mongo_id
    for group_id in mongo_group_to_mysql_ids.get(mongo_id, []):
        for participant in g["participants"]:
            groups_participant_values.append((group_id, mongo_user_to_mysql_id[participant]))
print(groups_participant_values)

cursor.executemany(groups_participant_sql, groups_participant_values)
sqlite_con.commit()

print("Inserted:")
print("  ParticipantGroups_participants:", len(groups_participant_values))

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
cursor.execute("SELECT mongo_id, simlet_supervisor_id FROM SIMLETs WHERE mongo_id IS NOT NULL")
mysql_simlet_owners_ids = cursor.fetchall()
mongo_simlet_owners_to_mysql_id = {mongo_id: simlet_supervisor_id for mongo_id, simlet_supervisor_id in mysql_simlet_owners_ids}
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

session_order_by_mongo_id = {}
for simlet in simlets:
    for index, session_ref in enumerate(simlet.get("tests", [])):
        session_mongo_id = get_mongo_oid(session_ref)
        if session_mongo_id is not None:
            session_order_by_mongo_id[session_mongo_id] = index+1

print(session_order_by_mongo_id)

# Adding Sessions into sesions table
sessions_sql = """
INSERT INTO Sessions (simlet_id, mongo_id, session_order, session_name, session_description, session_status, session_can_be_manually_activated, session_coordinator_id)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
        session_order_by_mongo_id.get(s["_id"]["$oid"], 0),
        s["name"],
        "",
        "inactive",
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

activity_order_by_mongo_id = {}
for session in sessions:
    for index, activity_ref in enumerate(session.get("activities", [])):
        activity_mongo_id = get_mongo_oid(activity_ref)
        if activity_mongo_id is not None:
            activity_order_by_mongo_id[activity_mongo_id] = index+1

# Adding Activities into Activities table
activities_sql = """
INSERT INTO Activities (session_id, mongo_id, activity_order, activity_name, activity_type, activity_trace_storage, activity_description, activity_comply_with_GDPR, activity_can_be_restarted)
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
        activity_order_by_mongo_id.get(a["_id"]["$oid"], 0),
        a["name"],
        a["type"],
        a.get("extra_data", {}).get("config", {}).get("trace_storage","false") == "true", 
        "",
        False,
        False
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
INSERT INTO Manual_Activities (activity_id, manual_user_managed, manual_ressource_type, manual_ressource_url)
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
INSERT INTO Limesurvey_Activities (activity_id, survey_id, survey_language, survey_lrsset)
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
INSERT INTO GamePlay_Activities (activity_id, game_backup, game_scorm_xapi, game_type, game_url)
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
INSERT INTO Activities_completion (activity_id, participant_id, activity_initialized, activity_progress, activity_suspended, activity_completed)
VALUES (?, ?, ?, ?, ?, ?)
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
        suspended=participant_value.get("suspended", "false") == "true"
        activities_completion_values.append((mongo_activity_to_mysql_id[activity_mongo_id],mongo_user_to_mysql_id[participant_mongo_id], initialized, progress, suspended, completed))
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
INSERT INTO Experimental_Participants (simlet_id, group_id, participant_id, session_id)
VALUES (?, ?, ?, ?)
ON CONFLICT(simlet_id, group_id, participant_id)
DO UPDATE SET
    session_id = excluded.session_id,
    updatedAt = datetime('now')
"""
allocation_group_sql = """
INSERT INTO Experimental_Groups (simlet_id, group_id, session_id)
VALUES (?, ?, ?)
ON CONFLICT(simlet_id, group_id)
DO UPDATE SET
    session_id = excluded.session_id,
    updatedAt = datetime('now')
"""

# Build session_id to simlet_id mapping
cursor.execute("SELECT session_id, simlet_id FROM Sessions WHERE mongo_id IS NOT NULL")
session_simlet_mapping = cursor.fetchall()
session_id_to_simlet_id = {session_id: simlet_id for session_id, simlet_id in session_simlet_mapping}

query = f"""
    SELECT simlet_id, group_id, user_id
    FROM vv_complete_groups_from_simlets
"""
print(query)
cursor.execute(query)
sql_participants_ids = cursor.fetchall()
# Extract values from tuples
group_id_to_simlet_id={
    group_id: simlet_id
    for simlet_id, group_id, participant_id in sql_participants_ids
}
print(group_id_to_simlet_id)
group_id_to_participants_ids={
    group_id: set(participant_id for simlet_id, group_id, participant_id in sql_participants_ids if simlet_id == group_id_to_simlet_id[group_id])
    for group_id in group_id_to_simlet_id.keys()
}
print(group_id_to_participants_ids)

session_simlet_query = f"""
    SELECT session_id, simlet_id
    FROM Sessions WHERE session_order = 1
"""
cursor.execute(session_simlet_query)
simlet_session_id = cursor.fetchall()
simlet_id_to_default_session_id = {simlet_id: session_id for session_id, simlet_id in simlet_session_id}
print("Simlet ID to default session ID mapping:", simlet_id_to_default_session_id)

allocation_values=[]
allocation_group_values=[]
for a in filtered_allocators:
    allocator_mongo_id=a["_id"]["$oid"]
    allocator_type=a["type"]
    for (simlet_id, group_id) in mongo_allocator_group_simlet_to_mysql_id.get(allocator_mongo_id, set()):
        print("Processing group:", group_id, "simlet_id:", simlet_id, "for allocator_mongo_id:", allocator_mongo_id, "allocator_type:", allocator_type)
        allocations = a.get("extra_data", {}).get("allocations", {})
        print("Allocations for allocator_mongo_id:", allocator_mongo_id, "allocations:", allocations)
        if allocator_type == "default":
            print("Processing allocation_mongo_id:", allocation_mongo_id)
            participants_id = group_id_to_participants_ids.get(group_id, set())
            allocations_sql_ids = {}
            if(len(allocations.keys()) != len(participants_id)):
                print("Warning: Number of allocations for default allocator does not match number of participants in the group. Allocations:", len(allocations), "Participants:", len(group_id_to_participants_ids.get(group_id, set())))
                default_session_id = simlet_id_to_default_session_id.get(simlet_id, None)
                print("Default session id for simlet_id:", simlet_id, "is:", default_session_id)
                if default_session_id is not None:
                    for participant_id in participants_id:
                        if allocations.get(participant_id) is None:
                            allocations_sql_ids[participant_id] = default_session_id  # Assign to default session
                        else:
                            allocations_sql_ids[participant_id] = mongo_session_to_mysql_id[allocations[mysql_id_user_to_mongo_id[participant_id]]]
            print("Allocations SQL IDs for allocator_mongo_id:", allocator_mongo_id, "allocations_sql_ids:", allocations_sql_ids)
            for allocation_id in allocations_sql_ids.keys():
                session_id = allocations_sql_ids.get(allocation_id, None)
                print("Allocation for participant:", allocation_id, "session_id:", session_id, "default_session_id:", simlet_id_to_default_session_id.get(simlet_id, None))
                allocation_values.append((simlet_id, group_id, allocation_id, session_id))
        elif allocator_type == "group":
            for allocation_mongo_id in allocations:
                session_id = mongo_session_to_mysql_id[allocations[allocation_mongo_id]]
                print("Processing allocation_mongo_id:", allocation_mongo_id, "session_id:", session_id)
                # A mongo group can have multiple SQL group_ids (one per simlet)
                lookup_group_id = mongo_group_to_mysql_ids.get(allocation_mongo_id)
                print("Processing group_id:", allocation_mongo_id, "lookup_group_id:", lookup_group_id)
                # Only allocate if group belongs to the same simlet as the session
                if group_id in lookup_group_id:
                    allocation_group_values.append((simlet_id, group_id, session_id))
                    for participant_id in group_id_to_participants_ids.get(group_id, []):
                        allocation_values.append((simlet_id, group_id, participant_id, session_id))
        else:
            continue
print(allocation_values)
cursor.executemany(allocation_sql, allocation_values)
cursor.executemany(allocation_group_sql, allocation_group_values)
sqlite_con.commit()

print("Inserted:")
print("  Experimental_Participants:", len(allocation_values))
print("  Experimental_Groups:", len(allocation_group_values))

print("Migration done!")
cursor.close()
sqlite_con.close()