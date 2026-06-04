-- This file contains the views related to permissions and their relation with users, simlets, sessions and activities.
-- View : Permissions directly assigned to users for simlets and sessions

DROP VIEW IF EXISTS vv_simlet_direct_permissions;
CREATE VIEW vv_simlet_direct_permissions AS
SELECT
    s.simlet_supervisor_id as user_id,
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
    s.session_coordinator_id as user_id,
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
-- Indirect SESSION permissions from SIMLET (if no direct SESSION permission for user)
SELECT
    'SESSION' AS object_type,
    s.session_id AS object_id,
    p.permission AS permission,
    'INDIRECT' AS permission_type,
    p.user_id,
    p.username
FROM v_simlet_direct_permissions_users p
JOIN Sessions s ON s.simlet_id = p.simlet_id
WHERE NOT EXISTS (
    SELECT 1 FROM v_session_direct_permissions_users d
    WHERE d.session_id = s.session_id AND d.user_id = p.user_id
)
UNION ALL
SELECT
    'SIMLET' AS object_type,
    s.simlet_id AS object_id,
    p.permission AS permission,
    'INDIRECT' AS permission_type,
    p.user_id,
    p.username
FROM v_session_direct_permissions_users p
JOIN Sessions s ON s.session_id = p.session_id
WHERE NOT EXISTS (
    SELECT 1 FROM v_simlet_direct_permissions_users d
    WHERE d.simlet_id = s.simlet_id AND d.user_id = p.user_id
)
UNION ALL
-- Indirect ACTIVITY permissions from SIMLET and sessions
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
LEFT JOIN v_session_direct_permissions_users psim ON s.session_id = psim.session_id;

-- Views : Complete information about simlets, sessions and activities with permissions for each user
DROP VIEW IF EXISTS v_complete_simlets_users_permissions;
CREATE VIEW v_complete_simlets_users_permissions AS
SELECT 
    up.user_id as current_user_id,
    up.username as current_user_username,
    up.permission as current_user_permission,
    up.permission_type as current_user_permission_type,
    sim.simlet_id,
    sim.simlet_name,
    sim.simlet_description,
    sim.simlet_archived,
    shlink.short_url,
    sim.createdAt,
    sim.updatedAt
FROM SIMLETs sim
LEFT JOIN SIMLETs_shlinks shlink ON sim.simlet_id = shlink.simlet_id
LEFT JOIN vv_user_permissions up ON sim.simlet_id = up.object_id AND up.object_type = "SIMLET";

DROP VIEW IF EXISTS v_simlet_sessions_users_permissions;
CREATE VIEW v_simlet_sessions_users_permissions AS
SELECT 
    up.user_id as current_user_id,
    up.username as current_user_username,
    up.permission as current_user_permission,
    up.permission_type as current_user_permission_type,
    ses.simlet_id,
    ses.session_id,
    ses.session_order
FROM Sessions ses
LEFT JOIN vv_user_permissions up ON ses.session_id = up.object_id AND up.object_type = "SESSION";

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
    ses.session_status,
    ses.session_can_be_manually_activated,
    ses.session_sandbox_user_id,
    u.username as session_sandbox_username,
    u.role as session_sandbox_user_role,
    ses.createdAt,
    ses.updatedAt
FROM Sessions ses
LEFT JOIN vv_user_permissions up ON ses.session_id = up.object_id AND up.object_type = "SESSION"
LEFT JOIN Users u ON ses.session_sandbox_user_id = u.user_id;

DROP VIEW IF EXISTS v_complete_activities_users_permissions;
CREATE VIEW v_complete_activities_users_permissions AS
SELECT 
    up.user_id as current_user_id,
    up.username as current_user_username,
    up.permission as current_user_permission,
    up.permission_type as current_user_permission_type,
    ses.simlet_id,
    act.session_id,
    act.activity_id,
    act.activity_order,
    act.mongo_id,
    act.activity_name,
    act.createdAt,
    act.updatedAt,
    act.activity_type,
    act.activity_trace_storage,
    act.activity_description,
    act.activity_comply_with_GDPR,
    act.activity_can_be_restarted
FROM Activities act
LEFT JOIN Sessions ses ON act.session_id = ses.session_id
LEFT JOIN vv_user_permissions up ON act.activity_id = up.object_id AND up.object_type = "ACTIVITY";

-- Views : Complete information about simplet groups and their participants
DROP VIEW IF EXISTS v_complete_groups_simlets;
CREATE VIEW v_complete_groups_simlets AS
SELECT 
    g.simlet_id,
    g.group_id,
    g.group_name,
    g.createdAt,
    g.updatedAt,
    g.group_use_new_generation,
    g.group_allocator_type,
    g.group_sandbox,
    g.group_owner_id,
    u.username as group_owner_username
FROM ParticipantGroups g
LEFT JOIN Users u ON u.user_id = g.group_owner_id;

DROP VIEW IF EXISTS v_complete_group_participants;
CREATE VIEW v_complete_group_participants AS
SELECT
    p.group_id,
    u.user_id,
    u.username,
    u.isToken,
    u.token,
    u.email,
    u.role,
    u.createdAt,
    u.updatedAt
FROM ParticipantGroups_participants p
JOIN ParticipantGroups g ON g.group_id = p.group_id
JOIN Users u ON u.user_id = p.participant_id
WHERE p.participant_id is not NULL;

DROP VIEW IF EXISTS vv_complete_groups_from_simlets;
CREATE VIEW vv_complete_groups_from_simlets AS
SELECT 
    g.simlet_id,
    cgp.*
FROM v_complete_group_participants cgp
JOIN ParticipantGroups g ON g.group_id = cgp.group_id;

-- View : Complete information about simplet groups, their participants and permissions for each user
DROP VIEW IF EXISTS v_complete_groups_user_permissions;
CREATE VIEW v_complete_groups_user_permissions AS
SELECT
    up.user_id as current_user_id,
    up.username as current_user_username,
    up.permission as current_user_permission,
    up.permission_type as current_user_permission_type,
    cgp.*
FROM v_complete_groups_simlets cgp
LEFT JOIN vv_user_permissions up ON cgp.simlet_id = up.object_id AND up.object_type = "SIMLET";

-- Views : Allocation of participants to sessions and groups with complete information about them
DROP VIEW IF EXISTS v_complete_allocation_participants;
CREATE VIEW v_complete_allocation_participants AS
SELECT
    a.simlet_id,
    a.session_id,
    a.group_id,
    g.group_allocator_type,
    u.*
FROM Experimental_Participants a
JOIN ParticipantGroups g ON g.group_id = a.group_id
JOIN Users u ON u.user_id = a.participant_id
WHERE a.participant_id IS NOT NULL;

-- View : Complete information about the allocation of participants to sessions and activities with complete information about them and permissions for each user
DROP VIEW IF EXISTS v_complete_simlet_allocation_participants;
CREATE VIEW v_complete_simlet_allocation_participants AS
SELECT
    ap.user_id as allocated_user_id,
    ap.username as allocated_user_username,
    ap.isToken as allocated_isToken,
    ap.token as allocated_token,
    ap.simlet_id,
    s.simlet_name,
    s.createdAt,
    s.updatedAt,
    s.simlet_description,
    shlink.short_url
FROM v_complete_allocation_participants ap
LEFT JOIN SIMLETs s ON ap.simlet_id = s.simlet_id
LEFT JOIN Sessions ses ON ap.session_id = ses.session_id
LEFT JOIN SIMLETs_shlinks shlink ON s.simlet_id = shlink.simlet_id
WHERE s.simlet_id IS NOT NULL AND ses.session_status = 'active';

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
    s.session_status,
    s.session_order,
    act.activity_id,
    act.activity_order,
    act.activity_name,
    act.activity_type,
    act.activity_trace_storage,
    act.activity_comply_with_GDPR,
    act.activity_can_be_restarted,
    act.createdAt,
    act.updatedAt,
    ap.user_id as participant_id,
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

-- Views : Allocation of surveys to sessions and activities with complete information about them
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

-- Views : Allocation of tags to sessions and activities with complete information about them
DROP VIEW IF EXISTS v_simlet_tags;
CREATE VIEW v_simlet_tags AS
SELECT DISTINCT
    ses.simlet_id,
    tag.session_id,
    tag.tag_id,
    tag_list.tag_name,
    tag_list.tag_color,
    tag_list.user_id as tag_creator_user_id,
    u.username as tag_creator_username,
    u.email as tag_creator_email,
    u.role as tag_creator_role,
    perm.user_id as tag_visible_user_id,
    perm.username as tag_visible_username,
    CASE WHEN tag_list.user_id = perm.user_id THEN 'WRITE' ELSE 'READ' END as tag_visible_permission
FROM Sessions_tags tag
LEFT JOIN Sessions_tags_list tag_list ON tag_list.tag_id = tag.tag_id
LEFT JOIN Users u ON tag_list.user_id = u.user_id
LEFT JOIN Sessions ses ON ses.session_id = tag.session_id
JOIN vv_user_permissions perm ON perm.object_type = 'SIMLET' AND perm.object_id = ses.simlet_id;

DROP VIEW IF EXISTS v_activity_template_tags;
CREATE VIEW v_activity_template_tags AS
SELECT
    tag.activity_template_id,
    tag.tag_id,
    tag_list.tag_name,
    tag_list.tag_color,
    tag_list.public,
    tag_list.user_id as tag_creator_user_id,
    u.username  as tag_creator_username,
    u.email as tag_creator_email,
    u.role as tag_creator_role
FROM Activities_template_tags tag
LEFT JOIN Activities_template_tags_list tag_list ON tag_list.tag_id = tag.tag_id
LEFT JOIN Users u ON tag_list.user_id = u.user_id;