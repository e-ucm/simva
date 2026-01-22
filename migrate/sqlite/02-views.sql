DROP VIEW IF EXISTS v_direct_permissions;
CREATE VIEW v_direct_permissions AS
SELECT
    s.simlet_coordinator_id as user_id,
    'SIMLET' AS object_type,
    s.simlet_id AS object_id,
	'OWNER' AS permission
FROM SIMLETs s
UNION ALL
SELECT
    s.user_id as user_id,
    'SIMLET' AS object_type,
    s.simlet_id AS object_id,
	s.permission AS permission
FROM SIMLETs_permissions s
UNION ALL
SELECT
    s.session_supervisor_id as user_id,
    'SESSION' AS object_type,
    s.session_id AS object_id,
	'OWNER' AS permission
FROM Sessions s
UNION ALL
SELECT
    s.user_id as user_id,
    'SESSION' AS object_type,
    s.session_id AS object_id,
	s.permission AS permission
FROM Sessions_permissions s;

DROP VIEW IF EXISTS v_direct_permissions_users;
CREATE VIEW v_direct_permissions_users AS
SELECT
    dp.object_type,
    dp.object_id,
    dp.permission,
    'DIRECT' AS permission_type,
    u.user_id,
    u.username,
    u.isToken,
    u.token,
    u.email,
    u.role
FROM v_direct_permissions dp
JOIN Users u ON u.user_id = dp.user_id;

DROP VIEW IF EXISTS v_simlet_to_session;
CREATE VIEW v_simlet_to_session AS
SELECT
    'SESSION' AS object_type,
    s.session_id AS object_id,
    p.permission AS permission,
    'INDIRECT' AS permission_type,
    p.user_id,
    p.username,
    p.isToken,
    p.token,
    p.email,
    p.role
FROM v_direct_permissions_users p
JOIN Sessions s ON s.simlet_id = p.object_id AND p.object_type = 'SIMLET'
LEFT JOIN v_direct_permissions_users psim ON s.simlet_id = psim.object_id AND psim.object_type = 'SIMLET'
WHERE psim.permission IS NULL;

DROP VIEW IF EXISTS v_session_to_simlet;
CREATE VIEW v_session_to_simlet AS
SELECT
    'SIMLET' AS object_type,
    s.simlet_id AS object_id,
    'READ' AS permission,
    'INDIRECT' AS permission_type,
    p.user_id,
    p.username,
    p.isToken,
    p.token,
    p.email,
    p.role
FROM v_direct_permissions_users p
JOIN Sessions s ON s.session_id = p.object_id AND p.object_type = 'SESSION'
LEFT JOIN v_direct_permissions_users psim ON s.simlet_id = psim.object_id AND psim.object_type = 'SIMLET'
WHERE psim.permission IS NULL;

DROP VIEW IF EXISTS v_simlet_to_activity;
CREATE VIEW v_simlet_to_activity AS
SELECT
    'ACTIVITY' AS object_type,
    a.activity_id AS object_id,
    p.permission AS permission,
    'INDIRECT' AS permission_type,
    p.user_id,
    p.username,
    p.isToken,
    p.token,
    p.email,
    p.role
FROM v_direct_permissions_users p
JOIN Sessions s ON s.simlet_id = p.object_id AND p.object_type = 'SIMLET'
JOIN Activities a ON a.session_id = s.session_id
LEFT JOIN v_direct_permissions_users psim ON s.session_id = psim.object_id AND psim.object_type = 'SESSION'
WHERE psim.permission IS NULL;

DROP VIEW IF EXISTS v_session_to_activity;
CREATE VIEW v_session_to_activity AS
SELECT
    'ACTIVITY' AS object_type,
    a.activity_id AS object_id,
    p.permission AS permission,
    'INDIRECT' AS permission_type,
    p.user_id,
    p.username,
    p.isToken,
    p.token,
    p.email,
    p.role
FROM v_direct_permissions_users p
JOIN Activities a ON a.session_id = p.object_id
WHERE p.object_type = 'SESSION';

DROP VIEW IF EXISTS v_user_permissions;
CREATE VIEW v_user_permissions AS
SELECT * FROM v_direct_permissions_users
UNION ALL
SELECT * FROM v_simlet_to_session
UNION ALL
SELECT * FROM v_session_to_simlet
UNION ALL
SELECT * FROM v_simlet_to_activity
UNION ALL
SELECT * FROM v_session_to_activity
ORDER BY permission_type, permission, object_type;

DROP VIEW IF EXISTS v_complete_simlets;
CREATE VIEW v_complete_simlets AS
SELECT
    sim.simlet_id,
    sim.name,
    sim.createdAt,
    sandbox.username as sandbox_username,
    sandbox.token as sandbox_token,
    sandbox.role as sandbox_role,
    sim.description,
    sim.objective,
    al.allocator_type,
    shlink.short_url,
    COUNT(DISTINCT g.group_id) as total_groups,
    COUNT(DISTINCT ses.session_id) as total_sessions,
    GROUP_CONCAT(tag_list.simlet_tag_name) as tags,
    COUNT(DISTINCT upsim.user_id) as total_direct_supervisors,
    COUNT(DISTINCT upses.user_id) as total_direct_coordinators
FROM SIMLETs sim
LEFT JOIN SIMLETs_shlinks shlink ON sim.simlet_id = shlink.simlet_id
LEFT JOIN SIMLETs_groups g ON sim.simlet_id = g.simlet_id
LEFT JOIN Sessions ses ON sim.simlet_id = ses.simlet_id
LEFT JOIN SIMLETs_tags tag ON sim.simlet_id = tag.simlet_id
LEFT JOIN SIMLETs_tags_list tag_list ON tag_list.simlet_tag_id = tag.tag_id
LEFT JOIN Allocators al ON sim.allocator_id = al.allocator_id
LEFT JOIN Users sandbox ON sim.sandbox_session_id = sandbox.user_id
LEFT JOIN v_session_to_simlet upses ON upses.object_type = "SIMLET" AND sim.simlet_id = upses.object_id
LEFT JOIN v_direct_permissions upsim ON upsim.object_type = "SIMLET" AND sim.simlet_id = upsim.object_id
GROUP BY sim.simlet_id;

DROP VIEW IF EXISTS v_complete_simlets_sessions;
CREATE VIEW v_complete_simlets_sessions AS
SELECT
    ses.simlet_id,
    ses.session_id,
    ses.name,
    ses.description,
    ses.createdAt,
    ses.experimental_method,
    ses.active,
    ses.session_start_date,
    ses.session_end_date,
    COUNT(DISTINCT act.activity_id) as total_activities,
    GROUP_CONCAT(tag_list.session_tag_name) as tags,
    COUNT(DISTINCT upsim.user_id) as total_direct_supervisors,
    COUNT(DISTINCT upses.user_id) as total_direct_coordinators
FROM Sessions ses
LEFT JOIN Activities act ON ses.session_id = act.session_id
LEFT JOIN Sessions_tags tag ON ses.session_id = tag.session_id
LEFT JOIN Sessions_tags_list tag_list ON tag_list.session_tag_id = tag.tag_id
LEFT JOIN v_simlet_to_session upsim ON upsim.object_type = "SESSION" AND ses.simlet_id = upsim.object_id
LEFT JOIN v_direct_permissions upses ON upses.object_type = "SESSION" AND ses.session_id = upses.object_id
GROUP BY ses.simlet_id, ses.session_id;

DROP VIEW IF EXISTS v_complete_sessions_activities;
CREATE VIEW v_complete_sessions_activities AS
SELECT
    act.session_id,
    act.activity_id,
    act.mongo_id,
    act.name,
    act.activity_type,
    act.presignedUrl,
    act.generated_at,
    act.expire_on_seconds,
    act.trace_storage,
    act.description,
    COUNT(DISTINCT upsim.user_id) as total_direct_supervisors,
    COUNT(DISTINCT upses.user_id) as total_direct_coordinators
FROM Activities act
LEFT JOIN v_simlet_to_activity upsim ON upsim.object_type = "ACTIVITY" AND act.activity_id = upsim.object_id
LEFT JOIN v_session_to_activity upses ON upses.object_type = "ACTIVITY" AND act.activity_id = upses.object_id
GROUP BY act.session_id, act.activity_id;

DROP VIEW IF EXISTS v_complete_groups;
CREATE VIEW v_complete_groups AS
SELECT
    g.group_id,
    g.name,
    g.createdAt,
    g.use_new_generation,
    COUNT(DISTINCT p.participant_id) as total_participants,
    COUNT(DISTINCT o.user_id)+1 as total_permissions_owners
FROM ParticipantGroups g
LEFT JOIN ParticipantGroups_participants p ON g.group_id = p.group_id AND p.participant_id is not NULL
LEFT JOIN ParticipantGroups_permissions o ON g.group_id = o.group_id AND o.user_id is not NULL
GROUP BY g.group_id;

DROP VIEW IF EXISTS v_complete_new_groups;
CREATE VIEW v_complete_new_groups AS
SELECT
    * 
FROM v_complete_groups
WHERE use_new_generation IS True;

DROP VIEW IF EXISTS v_complete_previous_groups;
CREATE VIEW v_complete_previous_groups AS
SELECT
    * 
FROM v_complete_groups
WHERE use_new_generation IS False;

DROP VIEW IF EXISTS v_complete_group_participants;
CREATE VIEW v_complete_group_participants AS
SELECT
    p.group_id,
    u.user_id,
    u.username,
    u.isToken,
    u.token,
    u.email,
    u.role
FROM ParticipantGroups_participants p
JOIN Users u ON u.user_id = p.participant_id
WHERE p.participant_id is not NULL;

DROP VIEW IF EXISTS v_complete_groups_from_allocator_and_simlets;
CREATE VIEW v_complete_groups_from_allocator_and_simlets AS
SELECT
    a.allocator_id,
    pg.*
FROM Allocators a
JOIN SIMLETs s ON a.allocator_id = s.allocator_id
JOIN SIMLETs_groups g ON s.simlet_id = g.simlet_id
JOIN v_complete_group_participants pg ON pg.group_id = g.group_id;

DROP VIEW IF EXISTS v_complete_allocation_participants;
CREATE VIEW v_complete_allocation_participants AS
SELECT
    a.allocator_id,
    a.session_id,
    a.group_id,
    u.user_id,
    u.username,
    u.isToken,
    u.token,
    u.email,
    u.role
FROM Experimental_Participants a
JOIN Users u ON u.user_id = a.participant_id
WHERE a.participant_id is not NULL;

DROP VIEW IF EXISTS v_complete_simlets_users_permissions;
CREATE VIEW v_complete_simlets_users_permissions AS
SELECT 
    up.user_id,
    up.username,
    up.email,
    up.role,
    up.permission,
    up.permission_type,
    s.*
FROM v_complete_simlets s 
LEFT JOIN v_user_permissions up ON s.simlet_id = up.object_id AND up.object_type = "SIMLET";

DROP VIEW IF EXISTS v_complete_simlets_group_id;
CREATE VIEW v_complete_simlets_group_id AS
SELECT
    g.group_id,
    s.*
FROM v_complete_simlets s
LEFT JOIN SIMLETs_groups g ON s.simlet_id = g.simlet_id;

DROP VIEW IF EXISTS v_complete_sessions_users_permissions;
CREATE VIEW v_complete_sessions_users_permissions AS
SELECT 
    up.user_id,
    up.username,
    up.email,
    up.role,
    up.permission,
    up.permission_type,
    s.*
FROM v_complete_simlets_sessions s
LEFT JOIN v_user_permissions up ON s.session_id = up.object_id AND up.object_type = "SESSION";

DROP VIEW IF EXISTS v_complete_activities_users_permissions;
CREATE VIEW v_complete_activities_users_permissions AS
SELECT 
    up.user_id,
    up.username,
    up.email,
    up.role,
    up.permission,
    up.permission_type,
    a.*
FROM v_complete_sessions_activities a
LEFT JOIN v_user_permissions up ON a.activity_id = up.object_id AND up.object_type = "ACTIVITY";