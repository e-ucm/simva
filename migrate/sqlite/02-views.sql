DROP VIEW IF EXISTS vv_simlet_direct_permissions;
CREATE VIEW vv_simlet_direct_permissions AS
SELECT
    s.simlet_coordinator_id as user_id,
    s.simlet_id,
	'OWNER' AS permission
FROM SIMLETs s
UNION ALL
SELECT
    s.user_id as user_id,
    s.simlet_id,
	s.permission AS permission
FROM SIMLETs_permissions s;

DROP VIEW IF EXISTS vv_session_direct_permissions;
CREATE VIEW vv_session_direct_permissions AS
SELECT
    s.session_supervisor_id as user_id,
    s.session_id,
	'OWNER' AS permission
FROM Sessions s
UNION ALL
SELECT
    s.user_id as user_id,
    s.session_id,
	s.permission AS permission
FROM Sessions_permissions s;

DROP VIEW IF EXISTS vv_direct_permissions;
CREATE VIEW vv_direct_permissions AS
SELECT 
    user_id,
    simlet_id as object_id,
    'SIMLET' AS object_type,
    permission
FROM vv_simlet_direct_permissions
UNION ALL
SELECT
    user_id,
    session_id as object_id,
    'SESSION' AS object_type,
    permission
FROM vv_session_direct_permissions;

DROP VIEW IF EXISTS vv_direct_permissions_users;
CREATE VIEW vv_direct_permissions_users AS
SELECT
    dp.object_type,
    dp.object_id,
    dp.permission,
    'DIRECT' AS permission_type,
    u.user_id,
    u.username
FROM vv_direct_permissions dp
JOIN Users u ON u.user_id = dp.user_id;

DROP VIEW IF EXISTS vv_user_permissions;
CREATE VIEW vv_user_permissions AS
SELECT * FROM vv_direct_permissions_users
UNION ALL
SELECT
    'SESSION' AS object_type,
    s.session_id AS object_id,
    p.permission AS permission,
    'INDIRECT' AS permission_type,
    p.user_id,
    p.username
FROM vv_direct_permissions_users p
JOIN Sessions s ON s.simlet_id = p.object_id AND p.object_type = 'SIMLET'
LEFT JOIN vv_direct_permissions_users psim ON s.simlet_id = psim.object_id AND psim.object_type = 'SIMLET'
WHERE psim.permission IS NULL
UNION ALL
SELECT
    'SIMLET' AS object_type,
    s.simlet_id AS object_id,
    'READ' AS permission,
    'INDIRECT' AS permission_type,
    p.user_id,
    p.username
FROM vv_direct_permissions_users p
JOIN Sessions s ON s.session_id = p.object_id AND p.object_type = 'SESSION'
LEFT JOIN vv_direct_permissions_users psim ON s.simlet_id = psim.object_id AND psim.object_type = 'SIMLET'
WHERE psim.permission IS NULL
UNION ALL
SELECT
    'ACTIVITY' AS object_type,
    a.activity_id AS object_id,
    p.permission AS permission,
    'INDIRECT' AS permission_type,
    p.user_id,
    p.username
FROM vv_direct_permissions_users p
JOIN Sessions s ON s.simlet_id = p.object_id AND p.object_type = 'SIMLET'
JOIN Activities a ON a.session_id = s.session_id
LEFT JOIN vv_direct_permissions_users psim ON s.session_id = psim.object_id AND psim.object_type = 'SESSION'
WHERE psim.permission IS NULL
UNION ALL
SELECT
    'ACTIVITY' AS object_type,
    a.activity_id AS object_id,
    p.permission AS permission,
    'INDIRECT' AS permission_type,
    p.user_id,
    p.username
FROM vv_direct_permissions_users p
JOIN Activities a ON a.session_id = p.object_id
WHERE p.object_type = 'SESSION'
ORDER BY permission_type, permission, object_type;

DROP VIEW IF EXISTS v_complete_simlets_users_permissions;
CREATE VIEW v_complete_simlets_users_permissions AS
SELECT 
    up.user_id,
    up.username,
    up.permission,
    sim.simlet_id,
    sim.name,
    sim.createdAt,
    sim.updatedAt,
    sim.description,
    sim.objective,
    shlink.short_url,
    JSON_GROUP_ARRAY(DISTINCT g.group_id) as groups,
    JSON_GROUP_ARRAY(DISTINCT ses.session_id) as sessions,
    JSON_GROUP_ARRAY(tag_list.simlet_tag_name) as tags
FROM SIMLETs sim
LEFT JOIN SIMLETs_shlinks shlink ON sim.simlet_id = shlink.simlet_id
LEFT JOIN SIMLETs_groups g ON sim.simlet_id = g.simlet_id
LEFT JOIN Sessions ses ON sim.simlet_id = ses.simlet_id
LEFT JOIN SIMLETs_tags tag ON sim.simlet_id = tag.simlet_id
LEFT JOIN SIMLETs_tags_list tag_list ON tag_list.simlet_tag_id = tag.tag_id
LEFT JOIN vv_user_permissions up ON sim.simlet_id = up.object_id AND up.object_type = "SIMLET"
GROUP BY up.user_id, up.username, up.permission, sim.simlet_id;

DROP VIEW IF EXISTS v_complete_sessions_users_permissions;
CREATE VIEW v_complete_sessions_users_permissions AS
SELECT 
    up.user_id,
    up.username,
    up.permission,
    up.permission_type,
    ses.simlet_id,
    ses.session_id,
    ses.name,
    ses.description,
    ses.createdAt,
    ses.updatedAt,
    ses.experimental_method,
    ses.active,
    ses.session_start_date,
    ses.session_end_date,
    JSON_GROUP_ARRAY(DISTINCT act.activity_id) as activities,
    JSON_GROUP_ARRAY(tag_list.session_tag_name) as tags
FROM Sessions ses
LEFT JOIN Activities act ON ses.session_id = act.session_id
LEFT JOIN Sessions_tags tag ON ses.session_id = tag.session_id
LEFT JOIN Sessions_tags_list tag_list ON tag_list.session_tag_id = tag.tag_id
LEFT JOIN vv_user_permissions up ON ses.session_id = up.object_id AND up.object_type = "SESSION"
GROUP BY ses.simlet_id, ses.session_id;

DROP VIEW IF EXISTS v_complete_activities_users_permissions;
CREATE VIEW v_complete_activities_users_permissions AS
SELECT 
    up.user_id,
    up.username,
    up.permission,
    up.permission_type,
    act.session_id,
    act.activity_id,
    act.mongo_id,
    act.name,
    act.createdAt,
    act.updatedAt,
    act.activity_type,
    act.presignedUrl,
    act.generated_at,
    act.expire_on_seconds,
    act.trace_storage,
    act.description
FROM Activities act
LEFT JOIN vv_user_permissions up ON act.activity_id = up.object_id AND up.object_type = "ACTIVITY";

DROP VIEW IF EXISTS vv_group_total_permissions;
CREATE VIEW vv_group_total_permissions AS
SELECT
    g.group_id,
    u.user_id,
    "OWNER" AS permission,
    u.username
FROM ParticipantGroups g
JOIN Users u ON u.user_id = g.group_owner_id
UNION ALL
SELECT
    p.group_id,
    u.user_id,
    p.permission,
    u.username
FROM ParticipantGroups_permissions p
JOIN Users u ON u.user_id = p.user_id
ORDER BY group_id, permission, user_id;

DROP VIEW IF EXISTS v_complete_groups_users_permissions;
CREATE VIEW v_complete_groups_users_permissions AS
SELECT 
    up.user_id,
    up.username,
    up.permission,
    g.group_id,
    g.name,
    g.createdAt,
    g.use_new_generation,
    u.username as coordinator_owner,
    JSON_GROUP_ARRAY(DISTINCT p.participant_id) as participants
FROM ParticipantGroups g
LEFT JOIN Users u ON u.user_id = g.group_owner_id
LEFT JOIN ParticipantGroups_participants p ON g.group_id = p.group_id AND p.participant_id is not NULL
LEFT JOIN vv_group_total_permissions up ON g.group_id = up.group_id
GROUP BY up.user_id, up.username, up.permission, g.group_id;

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

DROP VIEW IF EXISTS vv_complete_groups_from_allocator_and_simlets;
CREATE VIEW vv_complete_groups_from_allocator_and_simlets AS
SELECT
    a.allocator_id,
    pg.*
FROM Allocators a
JOIN SIMLETs s ON a.allocator_id = s.allocator_id
JOIN SIMLETs_groups g ON s.simlet_id = g.simlet_id
JOIN vv_complete_group_participants pg ON pg.group_id = g.group_id;

DROP VIEW IF EXISTS v_complete_allocation_participants;
CREATE VIEW v_complete_allocation_participants AS
SELECT
    s.simlet_id,
    a.allocator_id,
    a.session_id,
    a.group_id,
    u.user_id,
    u.username,
    u.isToken,
    u.token
FROM Experimental_Participants a
JOIN SIMLETs s ON a.allocator_id = s.allocator_id
JOIN Users u ON u.user_id = a.participant_id
WHERE a.participant_id is not NULL;

DROP VIEW IF EXISTS v_complete_allocators;
CREATE VIEW v_complete_allocators AS
SELECT 
    s.simlet_id,
    a.allocator_id,
    a.allocator_type,
    a.createdAt,
    a.updatedAt
FROM Allocators a
JOIN SIMLETs s ON a.allocator_id = s.allocator_id;

DROP VIEW IF EXISTS v_complete_groups_simlets;
CREATE VIEW v_complete_groups_simlets AS
SELECT
    sg.simlet_id,
    g.*
FROM SIMLETs_groups sg
LEFT JOIN v_complete_groups_users_permissions g ON sg.group_id = g.group_id;