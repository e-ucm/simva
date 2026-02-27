DROP VIEW IF EXISTS vv_simlet_direct_permissions;
CREATE VIEW vv_simlet_direct_permissions AS
SELECT
    s.simlet_coordinator_id as user_id,
    s.simlet_id,
	'FULL' AS permission
FROM SIMLETs s
UNION ALL
SELECT
    s.user_id as user_id,
    s.simlet_id,
	s.permission AS permission
FROM SIMLETs_permissions s;

DROP VIEW IF EXISTS v_simlet_direct_permissions_users;
CREATE VIEW v_simlet_direct_permissions_users AS
SELECT
    dp.simlet_id,
    dp.permission,
    'DIRECT' AS permission_type,
    u.user_id,
    u.username
FROM vv_simlet_direct_permissions dp
JOIN Users u ON u.user_id = dp.user_id;

DROP VIEW IF EXISTS vv_session_direct_permissions;
CREATE VIEW vv_session_direct_permissions AS
SELECT
    s.session_supervisor_id as user_id,
    s.session_id,
	'FULL' AS permission
FROM Sessions s
UNION ALL
SELECT
    s.user_id as user_id,
    s.session_id,
	s.permission AS permission
FROM Sessions_permissions s;

DROP VIEW IF EXISTS v_session_direct_permissions_users;
CREATE VIEW v_session_direct_permissions_users AS
SELECT
    dp.session_id,
    dp.permission,
    'DIRECT' AS permission_type,
    u.user_id,
    u.username
FROM vv_session_direct_permissions dp
JOIN Users u ON u.user_id = dp.user_id;

DROP VIEW IF EXISTS vv_direct_permissions_users;
CREATE VIEW vv_direct_permissions_users AS
SELECT 
    'SIMLET' AS object_type,
    simlet_id AS object_id,
    permission,
    permission_type,
    user_id,
    username
FROM v_simlet_direct_permissions_users
UNION ALL
SELECT
    'SESSION' AS object_type,
    session_id AS object_id,
    permission,
    permission_type,
    user_id,
    username
FROM v_session_direct_permissions_users;

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
FROM v_simlet_direct_permissions_users p
JOIN Sessions s ON s.simlet_id = p.simlet_id
LEFT JOIN v_simlet_direct_permissions_users psim ON s.simlet_id = psim.simlet_id
WHERE psim.permission IS NULL
UNION ALL
SELECT
    'SIMLET' AS object_type,
    s.simlet_id AS object_id,
    'READ' AS permission,
    'INDIRECT' AS permission_type,
    p.user_id,
    p.username
FROM v_session_direct_permissions_users p
JOIN Sessions s ON s.session_id = p.session_id
LEFT JOIN v_simlet_direct_permissions_users psim ON s.simlet_id = psim.simlet_id
WHERE psim.permission IS NULL
UNION ALL
SELECT
    'ACTIVITY' AS object_type,
    a.activity_id AS object_id,
    p.permission AS permission,
    'INDIRECT' AS permission_type,
    p.user_id,
    p.username
FROM v_simlet_direct_permissions_users p
JOIN Sessions s ON s.simlet_id = p.simlet_id
JOIN Activities a ON a.session_id = s.session_id
LEFT JOIN v_session_direct_permissions_users psim ON s.session_id = psim.session_id
WHERE psim.permission IS NULL
UNION ALL
SELECT
    'ACTIVITY' AS object_type,
    a.activity_id AS object_id,
    p.permission AS permission,
    'INDIRECT' AS permission_type,
    p.user_id,
    p.username
FROM v_session_direct_permissions_users p
JOIN Activities a ON a.session_id = p.session_id
ORDER BY permission_type, permission, object_type;

DROP VIEW IF EXISTS v_complete_simlets_users_permissions;
CREATE VIEW v_complete_simlets_users_permissions AS
SELECT 
    up.user_id as current_user_id,
    up.username as current_user_username,
    up.permission as current_user_permission,
    up.permission_type as current_user_permission_type,
    sim.simlet_id,
    sim.simlet_name,
    sim.createdAt,
    sim.updatedAt,
    sim.simlet_description,
    shlink.short_url,
    sim.allocator_id
FROM SIMLETs sim
LEFT JOIN SIMLETs_shlinks shlink ON sim.simlet_id = shlink.simlet_id
LEFT JOIN vv_user_permissions up ON sim.simlet_id = up.object_id AND up.object_type = "SIMLET"
GROUP BY up.user_id, up.username, up.permission, sim.simlet_id;

DROP VIEW IF EXISTS v_simlet_tags;
CREATE VIEW v_simlet_tags AS
SELECT
    tag.simlet_id,
    tag.tag_id,
    tag_list.tag_type as simlet_tag_type,
    tag_list.tag_name as simlet_tag_name
FROM SIMLETs_tags tag
LEFT JOIN tags_list tag_list ON tag_list.tag_id = tag.tag_id;

DROP VIEW IF EXISTS v_session_tags;
CREATE VIEW v_session_tags AS
SELECT
    tag.session_id,
    tag.tag_id,
    tag_list.tag_type as session_tag_type,
    tag_list.tag_name as session_tag_name
FROM Sessions_tags tag
LEFT JOIN tags_list tag_list ON tag_list.tag_id = tag.tag_id;

DROP VIEW IF EXISTS v_complete_sessions_users_permissions;
CREATE VIEW v_complete_sessions_users_permissions AS
SELECT 
    up.user_id as current_user_id,
    up.username as current_user_username,
    up.permission as current_user_permission,
    up.permission_type as current_user_permission_type,
    ses.simlet_id,
    ses.session_id,
    ses.session_order,
    ses.session_name,
    ses.session_description,
    ses.createdAt,
    ses.updatedAt,
    ses.session_experimental_method,
    ses.session_active,
    ses.session_can_be_manually_activated,
    ses.session_start_date,
    ses.session_end_date
FROM Sessions ses
LEFT JOIN vv_user_permissions up ON ses.session_id = up.object_id AND up.object_type = "SESSION"
GROUP BY ses.simlet_id, ses.session_id;

DROP VIEW IF EXISTS v_complete_activities_users_permissions;
CREATE VIEW v_complete_activities_users_permissions AS
SELECT 
    up.user_id as current_user_id,
    up.username as current_user_username,
    up.permission as current_user_permission,
    up.permission_type as current_user_permission_type,
    act.session_id,
    act.activity_id,
    act.activity_order,
    act.mongo_id,
    act.activity_name,
    act.createdAt,
    act.updatedAt,
    act.activity_type,
    act.activity_presignedUrl,
    act.activity_presignedUrl_generated_at,
    act.activity_presignedUrl_expire_at,
    act.activity_trace_storage,
    act.activity_description,
    act.activity_comply_with_GDPR,
    act.activity_can_be_restarted
FROM Activities act
LEFT JOIN vv_user_permissions up ON act.activity_id = up.object_id AND up.object_type = "ACTIVITY";

DROP VIEW IF EXISTS vv_group_total_permissions;
CREATE VIEW vv_group_total_permissions AS
SELECT
    g.group_id,
    u.user_id,
    "FULL" AS permission,
    u.username
FROM ParticipantGroups g
JOIN Users u ON u.user_id = g.group_owner_id
WHERE g.group_sandbox IS NOT TRUE
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
    up.user_id as current_user_id,
    up.username as current_user_username,
    up.permission as current_user_permission,
    g.group_id,
    g.group_name,
    g.createdAt,
    g.group_use_new_generation,
    u.user_id as group_owner_user_id,
    u.username as group_owner_username
FROM ParticipantGroups g
LEFT JOIN Users u ON u.user_id = g.group_owner_id
LEFT JOIN vv_group_total_permissions up ON g.group_id = up.group_id
WHERE g.group_sandbox IS NOT TRUE
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
JOIN v_complete_group_participants pg ON pg.group_id = g.group_id;

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
    u.token,
    u.email,
    u.role
FROM Experimental_Participants a
JOIN SIMLETs s ON a.allocator_id = s.allocator_id
JOIN Users u ON u.user_id = a.participant_id
WHERE a.participant_id is not NULL;

DROP VIEW IF EXISTS v_complete_activity_allocation_participants;
CREATE VIEW v_complete_activity_allocation_participants AS
SELECT
    ap.user_id as allocated_user_id,
    ap.username as allocated_username,
    ap.isToken as allocated_isToken,
    ap.token as allocated_token,
    ap.simlet_id,
    ap.session_id as allocated_session_id,
    s.session_can_be_manually_activated,
    s.session_active,
    s.session_order,
    s.session_start_date,
    s.session_end_date,
    act.activity_id,
    act.activity_order,
    act.activity_name,
    act.activity_type,
    act.activity_trace_storage,
    act.activity_comply_with_GDPR,
    act.activity_can_be_restarted,
    ac.activity_initialized,
    ac.activity_initialization_date,
    ac.activity_progress,
    ac.activity_suspended,
    ac.activity_suspension_date,
    ac.activity_completed,
    ac.activity_completion_date,
    ac.activity_registration_id
FROM v_complete_allocation_participants ap
LEFT JOIN Sessions s ON ap.session_id = s.session_id
LEFT JOIN Activities act ON ap.session_id = act.session_id
LEFT JOIN Activities_completion ac ON ac.activity_id = act.activity_id AND ac.participant_id = ap.user_id
WHERE act.activity_id IS NOT NULL;

DROP VIEW IF EXISTS v_complete_simlet_allocation_participants;
CREATE VIEW v_complete_simlet_allocation_participants AS
SELECT
    ap.user_id as allocated_user_id,
    ap.username as allocated_username,
    ap.isToken as allocated_isToken,
    ap.token as allocated_token,
    ap.simlet_id,
    s.simlet_name,
    s.createdAt,
    s.updatedAt,
    s.simlet_description,
    s.simlet_objective,
    shlink.short_url,
    s.allocator_id
FROM v_complete_allocation_participants ap
LEFT JOIN SIMLETs s ON ap.simlet_id = s.simlet_id
LEFT JOIN SIMLETs_shlinks shlink ON s.simlet_id = shlink.simlet_id
WHERE s.simlet_id IS NOT NULL;

DROP VIEW IF EXISTS v_complete_groups_simlets;
CREATE VIEW v_complete_groups_simlets AS
SELECT
    sg.simlet_id,
    g.*
FROM SIMLETs_groups sg
LEFT JOIN v_complete_groups_users_permissions g ON sg.group_id = g.group_id;

DROP VIEW IF EXISTS v_activities_by_survey_id;
CREATE VIEW v_activities_by_survey_id AS
SELECT
    s.simlet_id,
    s.session_id,
    a.activity_id,
    la.survey_id
FROM Activities a
JOIN Sessions s ON a.session_id = s.session_id
JOIN LimeSurvey_Activities la ON a.activity_id = la.activity_id
WHERE la.survey_id IS NOT NULL;