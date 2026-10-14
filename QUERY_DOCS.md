# Database View Queries

## Simlet

### tagsBySimletId

Get all tags of a SIMLET by its ID

**SQL**
```sql
SELECT 
        tag_id,
        tag_name,
        tag_color,
        tag_visible_user_id,
        tag_visible_user_name,
        tag_visible_permission
      FROM v_simlet_tags
      WHERE simlet_id = :simlet_id
      AND tag_visible_user_id = :current_user_id
        AND (deletedAt is NULL OR :is_admin is true)
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| simlet_id | number | yes | - | Simlet Identifier | 1 |
| current_user_id | number | yes | - | User Identifier | 123 |
| is_admin | boolean | no | false | - | - |

### filteredTagsByUserId

Get all tags by its ID and user ID

**SQL**
```sql
SELECT DISTINCT
        tag_id,
        tag_name,
        tag_color,
        tag_visible_user_id,
        tag_visible_user_name,
        tag_visible_permission
      FROM v_simlet_tags
      AND tag_visible_user_id = :current_user_id
        AND (deletedAt is NULL OR :is_admin is true)
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| current_user_id | number | yes | - | User Identifier | 123 |
| is_admin | boolean | no | false | - | - |

### groupIdsBySimletId

Get all groups of a SIMLET by its ID

**SQL**
```sql
SELECT group_id
      FROM ParticipantGroups
      WHERE simlet_id = :simlet_id
      AND (deletedAt is NULL OR :is_admin is true)
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| simlet_id | number | yes | - | Simlet Identifier | 1 |
| is_admin | boolean | no | false | - | - |

### directPermissionsBySimletId

Get all direct permissions of a SIMLET by its ID

**SQL**
```sql
SELECT *
      FROM v_simlet_direct_permissions_users
      WHERE simlet_id = :simlet_id AND (:user_id IS NULL OR user_id = :user_id)
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| simlet_id | number | yes | - | Simlet Identifier | 1 |
| user_id | number | no | - | User Identifier | 123 |

### byUserId

Get all SIMLETs for a certain User

**SQL**
```sql
SELECT *
      FROM v_complete_simlets_users_permissions
      WHERE current_user_id = :current_user_id
      AND (:search IS NULL OR simlet_name LIKE '%' || :search || '%' OR simlet_description LIKE '%' || :search || '%')
      AND (:simlet_archived IS NULL OR simlet_archived = :simlet_archived)
        AND (deletedAt is NULL OR :is_admin is true)
      ORDER BY {{orderBy}} {{order}}
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| current_user_id | number | yes | - | User Identifier | 123 |
| search | string | no | - | Search string to filter simlets by name or description | "math" |
| simlet_archived | boolean | no | - | Filter simlets by archived status | - |
| is_admin | boolean | no | false | - | - |

### byUserIdWithPagination

Get all SIMLETs for a certain User with pagination and search

**SQL**
```sql
SELECT *
      FROM v_complete_simlets_users_permissions
      WHERE current_user_id = :current_user_id
      AND (:search IS NULL OR simlet_name LIKE '%' || :search || '%' OR simlet_description LIKE '%' || :search || '%')
      AND (:simlet_archived IS NULL OR simlet_archived = :simlet_archived)
        AND (deletedAt is NULL OR :is_admin is true)
      ORDER BY {{orderBy}} {{order}}
      LIMIT :limit OFFSET :offset
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| current_user_id | number | yes | - | User Identifier | 123 |
| search | string | no | - | Search string to filter simlets by name or description | "math" |
| simlet_archived | boolean | no | - | Filter simlets by archived status | - |
| limit | number | yes | - | Maximum number of simlets to return | 10 |
| offset | number | yes | - | Number of simlets to skip for pagination | 20 |
| is_admin | boolean | no | false | - | - |

### byUserIdAndTagIds

Get all SIMLETs for a certain User and Tag

**SQL**
```sql
SELECT *
      FROM v_complete_simlets_users_permissions_tags
      WHERE current_user_id = :current_user_id
      AND (:search IS NULL OR simlet_name LIKE '%' || :search || '%' OR simlet_description LIKE '%' || :search || '%')
      AND tag_id IN (:tag_ids)
      AND (:simlet_archived IS NULL OR simlet_archived = :simlet_archived)
        AND (deletedAt is NULL OR :is_admin is true)
      GROUP BY simlet_id
      ORDER BY {{orderBy}} {{order}}
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| current_user_id | number | yes | - | User Identifier | 123 |
| search | string | no | - | Search string to filter simlets by name or description | "math" |
| tag_ids | array<number> | yes | - | List of tag IDs to filter simlets | [1,2,3] |
| simlet_archived | boolean | no | - | Filter simlets by archived status | - |
| is_admin | boolean | no | false | - | - |

### byUserIdAndTagIdsWithPagination

Get all SIMLETs for a certain User and Tag with pagination and search

**SQL**
```sql
SELECT *
      FROM v_complete_simlets_users_permissions_tags
      WHERE current_user_id = :current_user_id
      AND (:search IS NULL OR simlet_name LIKE '%' || :search || '%' OR simlet_description LIKE '%' || :search || '%')
      AND tag_id IN (:tag_ids)
      AND (:simlet_archived IS NULL OR simlet_archived = :simlet_archived)
        AND (deletedAt is NULL OR :is_admin is true)
      GROUP BY simlet_id
      ORDER BY {{orderBy}} {{order}}
      LIMIT :limit OFFSET :offset
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| current_user_id | number | yes | - | User Identifier | 123 |
| simlet_archived | boolean | no | - | Filter simlets by archived status | - |
| search | string | no | - | Search string to filter simlets by name or description | "math" |
| limit | number | yes | - | Maximum number of simlets to return | 10 |
| offset | number | yes | - | Number of simlets to skip for pagination | 20 |
| tag_ids | array<number> | yes | - | List of tag IDs to filter simlets | [1,2,3] |
| is_admin | boolean | no | false | - | - |

### ByAllocatedUserId

Get all SIMLETs for a certain Allocated User

**SQL**
```sql
SELECT *
      FROM v_complete_simlet_allocation_participants
      WHERE allocated_user_id = :current_user_id
      AND (:search IS NULL OR simlet_name LIKE '%' || :search || '%' OR simlet_description LIKE '%' || :search || '%')
        AND (deletedAt is NULL OR :is_admin is true)
      ORDER BY {{orderBy}} {{order}}
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| current_user_id | number | yes | - | User Identifier | 123 |
| search | string | no | - | Search string to filter simlets by name or description | "math" |
| is_admin | boolean | no | false | - | - |

### byAllocatedUserIdWithPagination

Get all SIMLETs for a certain Allocated User with pagination and search

**SQL**
```sql
SELECT *
      FROM v_complete_simlet_allocation_participants
      WHERE allocated_user_id = :current_user_id
      AND (:search IS NULL OR simlet_name LIKE '%' || :search || '%' OR simlet_description LIKE '%' || :search || '%')
        AND (deletedAt is NULL OR :is_admin is true)
      ORDER BY {{orderBy}} {{order}}
      LIMIT :limit OFFSET :offset
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| current_user_id | number | yes | - | User Identifier | 123 |
| search | string | no | - | Search string to filter simlets by name or description | "math" |
| limit | number | yes | - | Maximum number of simlets to return | 10 |
| offset | number | yes | - | Number of simlets to skip for pagination | 20 |
| is_admin | boolean | no | false | - | - |

### ByAllocatedUserIdAndTagIds

Get all SIMLETs for a certain Allocated User and Tag

**SQL**
```sql
SELECT *
      FROM v_complete_simlet_allocation_participants_tags
      WHERE allocated_user_id = :current_user_id
      AND tag_id IN (:tag_ids)
      AND (:search IS NULL OR simlet_name LIKE '%' || :search || '%' OR simlet_description LIKE '%' || :search || '%')
        AND (deletedAt is NULL OR :is_admin is true)
      GROUP BY simlet_id
      ORDER BY {{orderBy}} {{order}}
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| current_user_id | number | yes | - | User Identifier | 123 |
| search | string | no | - | Search string to filter simlets by name or description | "math" |
| tag_ids | array<number> | yes | - | List of tag IDs to filter simlets | [1,2,3] |
| is_admin | boolean | no | false | - | - |

### byAllocatedUserIdAndTagIdsWithPagination

Get all SIMLETs for a certain Allocated User with pagination and search

**SQL**
```sql
SELECT *
      FROM v_complete_simlet_allocation_participants_tags
      WHERE allocated_user_id = :current_user_id
      AND tag_id IN (:tag_ids)
      AND (:search IS NULL OR simlet_name LIKE '%' || :search || '%' OR simlet_description LIKE '%' || :search || '%')
        AND (deletedAt is NULL OR :is_admin is true)
      GROUP BY simlet_id
      ORDER BY {{orderBy}} {{order}}
      LIMIT :limit OFFSET :offset
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| current_user_id | number | yes | - | User Identifier | 123 |
| search | string | no | - | Search string to filter simlets by name or description | "math" |
| limit | number | yes | - | Maximum number of simlets to return | 10 |
| offset | number | yes | - | Number of simlets to skip for pagination | 20 |
| tag_ids | array<number> | yes | - | List of tag IDs to filter simlets | [1,2,3] |
| is_admin | boolean | no | false | - | - |

### byUserIdAndSimletId

Get current SIMLET for a certain User

**SQL**
```sql
SELECT *
      FROM v_complete_simlets_users_permissions
      WHERE current_user_id = :current_user_id AND simlet_id = :simlet_id
        AND (deletedAt is NULL OR :is_admin is true)
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| current_user_id | number | yes | - | User Identifier | 123 |
| simlet_id | number | yes | - | Simlet Identifier | 1 |
| is_admin | boolean | no | false | - | - |

### countByUserId

Get count of SIMLETs for a certain User with search

**SQL**
```sql
SELECT COUNT(*) as count
      FROM v_complete_simlets_users_permissions
      WHERE current_user_id = :current_user_id
      AND (:simlet_archived IS NULL OR simlet_archived = :simlet_archived)
      AND (:search IS NULL OR simlet_name LIKE '%' || :search || '%' OR simlet_description LIKE '%' || :search || '%')
        AND (deletedAt is NULL OR :is_admin is true)
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| current_user_id | number | yes | - | User Identifier | 123 |
| search | string | no | - | Search string to filter simlets by name or description | "math" |
| simlet_archived | boolean | no | - | Filter simlets by archived status | - |
| is_admin | boolean | no | false | - | - |

### countByUserIdAndTagIds

Get count of SIMLETs for a certain User with search and tag filtering

**SQL**
```sql
SELECT COUNT(DISTINCT simlet_id) as count
      FROM v_complete_simlets_users_permissions_tags
      WHERE current_user_id = :current_user_id
      AND tag_id IN (:tag_ids)
      AND (:simlet_archived IS NULL OR simlet_archived = :simlet_archived)
      AND (:search IS NULL OR simlet_name LIKE '%' || :search || '%' OR simlet_description LIKE '%' || :search || '%')
        AND (deletedAt is NULL OR :is_admin is true)
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| current_user_id | number | yes | - | User Identifier | 123 |
| search | string | no | - | Search string to filter simlets by name or description | "math" |
| simlet_archived | boolean | no | - | Filter simlets by archived status | - |
| tag_ids | array<number> | yes | - | List of tag IDs to filter simlets | [1,2,3] |
| is_admin | boolean | no | false | - | - |

### allocationCount

Get count of SIMLETs with allocated participants for a certain User with search

**SQL**
```sql
SELECT COUNT(DISTINCT simlet_id) as count
      FROM SIMLETs
      WHERE  (:search IS NULL OR simlet_name LIKE '%' || :search || '%' OR simlet_description LIKE '%' || :search || '%')
        AND (deletedAt is NULL OR :is_admin is true)
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| search | string | no | - | Search string to filter simlets by name or description | "math" |
| is_admin | boolean | no | false | - | - |

### countByAllocatedUserId

Get count of SIMLETs for a certain Allocated User with search

**SQL**
```sql
SELECT COUNT(*) as count
      FROM v_complete_simlet_allocation_participants
      WHERE allocated_user_id = :current_user_id
      AND (:search IS NULL OR simlet_name LIKE '%' || :search || '%' OR simlet_description LIKE '%' || :search || '%')
        AND (deletedAt is NULL OR :is_admin is true)
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| current_user_id | number | yes | - | User Identifier | 123 |
| search | string | no | - | Search string to filter simlets by name or description | "math" |
| is_admin | boolean | no | false | - | - |

### countByAllocatedUserIdAndTagIds

Get count of SIMLETs for a certain Allocated User with search and tag filtering

**SQL**
```sql
SELECT COUNT(DISTINCT simlet_id) as count
      FROM v_complete_simlet_allocation_participants_tags
      WHERE allocated_user_id = :current_user_id
      AND tag_id IN (:tag_ids)
      AND (:search IS NULL OR simlet_name LIKE '%' || :search || '%' OR simlet_description LIKE '%' || :search || '%')
        AND (deletedAt is NULL OR :is_admin is true)
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| current_user_id | number | yes | - | User Identifier | 123 |
| search | string | no | - | Search string to filter simlets by name or description | "math" |
| tag_ids | array<number> | yes | - | List of tag IDs to filter simlets | [1,2,3] |
| is_admin | boolean | no | false | - | - |

## Activity

### IdsBySessionId

Get all Activity IDs of a Session by its ID

**SQL**
```sql
SELECT activity_id
        FROM Activities
        WHERE session_id = :session_id
        AND (deletedAt is NULL OR :is_admin is true)
        ORDER BY activity_order
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| session_id | number | yes | - | Session Identifier | 1 |
| is_admin | boolean | no | false | - | - |

### bySessionIdUserId

Get all Activities for a certain User and optionally filter by Session

**SQL**
```sql
SELECT *
      FROM v_complete_activities_users_permissions
      WHERE current_user_id = :current_user_id AND (:session_id IS NULL OR session_id = :session_id)
      AND (deletedAt is NULL OR :is_admin is true)
      ORDER BY activity_order
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| current_user_id | number | yes | - | User Identifier | 123 |
| session_id | number | no | - | Session Identifier to filter activities by session | 456 |
| is_admin | boolean | no | false | - | - |

### byActivityIdAndUserId

Get Activity and Users permissions of an activity by its ID with user permissions

**SQL**
```sql
SELECT *
      FROM v_complete_activities_users_permissions 
      WHERE activity_id = :activity_id AND current_user_id = :current_user_id
      AND (deletedAt is NULL OR :is_admin is true)
      ORDER BY activity_order
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| activity_id | number | yes | - | Activity Identifier | 1 |
| current_user_id | number | yes | - | User Identifier | 123 |
| is_admin | boolean | no | false | - | - |

### byActivityIdAndParticipantId

Get actual allocated Activity of the actual user with access to this activity

**SQL**
```sql
SELECT *
      FROM v_complete_activity_allocation_participants  
      WHERE activity_id = :activity_id AND allocated_user_id = :allocated_user_id
      AND (deletedAt is NULL OR :is_admin is true)
      ORDER BY activity_order
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| activity_id | number | yes | - | Activity Identifier | 1 |
| allocated_user_id | number | yes | - | User Identifier | 123 |
| is_admin | boolean | no | false | - | - |

### byPreviousActivityIdAndParticipantId

Get previous allocated Activities of the actual user with access to this activity

**SQL**
```sql
SELECT *
      FROM v_complete_activity_allocation_participants  
      WHERE allocated_session_id = :session_id AND activity_order < :activity_order AND allocated_user_id = :allocated_user_id
      AND (deletedAt is NULL OR :is_admin is true)
      ORDER BY activity_order
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| session_id | number | yes | - | Session Identifier | 1 |
| activity_order | number | yes | - | Activity Order | 1 |
| allocated_user_id | number | yes | - | User Identifier | 123 |
| is_admin | boolean | no | false | - | - |

### bySurveyId

Get all Activities for a certain Survey ID

**SQL**
```sql
SELECT *
        FROM v_activities_by_survey_id
        WHERE survey_id = :survey_id
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| survey_id | number | yes | - | Survey Identifier | 1 |

## Group

### byVersionAndUserId

Get all Groups for a certain Version and User ID

**SQL**
```sql
SELECT *
        FROM v_complete_groups_user_permissions
        WHERE current_user_id = :current_user_id AND (:version IS NULL OR group_use_new_generation = :version)
        AND (:simlet_id IS NULL OR simlet_id = :simlet_id)
        AND (:search IS NULL OR group_name LIKE '%' || :search || '%')
        AND (:sandbox IS NULL OR group_sandbox = :sandbox)
        AND (deletedAt is NULL OR :is_admin is true)
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| current_user_id | number | yes | - | User Identifier | 123 |
| version | boolean | no | - | Version flag indicating whether to use new generation | true |
| simlet_id | number | no | - | Simlet Identifier to filter groups by simlet | 1 |
| search | string | no | - | Search string to filter groups by name or description | "group" |
| sandbox | boolean | no | - | Sandbox boolean to filter groups by sandbox | "true" |
| is_admin | boolean | no | false | - | - |

### countByUserId

Get the count of Groups for a certain Version and User ID

**SQL**
```sql
SELECT COUNT(*) AS count
        FROM v_complete_groups_user_permissions
        WHERE current_user_id = :current_user_id AND (:version IS NULL OR group_use_new_generation = :version)
        AND (:simlet_id IS NULL OR simlet_id = :simlet_id)
        AND (:search IS NULL OR group_name LIKE '%' || :search || '%')
        AND (:sandbox IS NULL OR group_sandbox = :sandbox)
        AND (deletedAt is NULL OR :is_admin is true)
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| current_user_id | number | yes | - | User Identifier | 123 |
| version | boolean | no | - | Version flag indicating whether to use new generation | true |
| simlet_id | number | no | - | Simlet Identifier to filter groups by simlet | 1 |
| search | string | no | - | Search string to filter groups by name or description | "group" |
| sandbox | boolean | no | - | Sandbox boolean to filter groups by sandbox | "true" |
| is_admin | boolean | no | false | - | - |

### byVersionAndUserIdWithPagination

Get all Groups for a certain Version and User ID

**SQL**
```sql
SELECT *
        FROM v_complete_groups_user_permissions
        WHERE current_user_id = :current_user_id AND (:version IS NULL OR group_use_new_generation = :version)
        AND (:search IS NULL OR group_name LIKE '%' || :search || '%')
        AND (:simlet_id IS NULL OR simlet_id = :simlet_id)
        AND (:sandbox IS NULL OR group_sandbox = :sandbox)
        AND (deletedAt is NULL OR :is_admin is true)
        LIMIT :limit OFFSET :offset
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| version | boolean | no | - | Version flag indicating whether to use new generation | true |
| simlet_id | number | no | - | Simlet Identifier to filter groups by simlet | 1 |
| search | string | no | - | Search string to filter groups by name or description | "group" |
| limit | number | yes | - | Maximum number of groups to return | 10 |
| offset | number | yes | - | Number of groups to skip for pagination | 20 |
| current_user_id | number | yes | - | User Identifier | 123 |
| sandbox | boolean | no | - | Sandbox boolean to filter groups by sandbox | "true" |
| is_admin | boolean | no | false | - | - |

### byGroupIdAndUserId

Get current Group for a certain Group ID and User ID

**SQL**
```sql
SELECT *
        FROM v_complete_groups_user_permissions
        WHERE current_user_id = :current_user_id AND group_id = :group_id
        AND (:simlet_id IS NULL OR simlet_id = :simlet_id)
        AND (deletedAt is NULL OR :is_admin is true)
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| simlet_id | number | no | - | Simlet Identifier to filter groups by simlet | 1 |
| group_id | number | yes | - | Group Identifier | 1 |
| is_admin | boolean | no | false | - | - |

### bySimletId

Get Simlet Group By Simlet Identifier

**SQL**
```sql
SELECT *
        FROM v_complete_groups_simlets
        WHERE simlet_id = :simlet_id
        AND (:search IS NULL OR group_name LIKE '%' || :search || '%')
        AND (:sandbox IS NULL OR group_sandbox = :sandbox)
        AND (deletedAt is NULL OR :is_admin is true)
        ORDER BY {{orderBy}} {{order}}
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| simlet_id | number | yes | - | Simlet Identifier | 1 |
| search | string | no | - | Search string to filter groups by name | "group" |
| sandbox | boolean | no | - | Sandbox boolean to filter groups by sandbox | "true" |
| is_admin | boolean | no | false | - | - |

### bySimletIdWithPagination

Get Simlet Group By Simlet Identifier with Pagination

**SQL**
```sql
SELECT *
        FROM v_complete_groups_simlets
        WHERE simlet_id = :simlet_id
        AND (:search IS NULL OR group_name LIKE '%' || :search || '%')
        AND (:sandbox IS NULL OR group_sandbox = :sandbox)
        AND (deletedAt is NULL OR :is_admin is true)
        ORDER BY {{orderBy}} {{order}}
        LIMIT :limit OFFSET :offset
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| simlet_id | number | yes | - | Simlet Identifier | 1 |
| search | string | no | - | Search string to filter groups by name or description | "group" |
| limit | number | yes | - | Maximum number of groups to return | 10 |
| offset | number | yes | - | Number of groups to skip for pagination | 20 |
| sandbox | boolean | no | - | Sandbox boolean to filter groups by sandbox | "true" |
| is_admin | boolean | no | false | - | - |

### directPermissionsByGroupId

Get all direct permissions of a Group by its ID

**SQL**
```sql
SELECT *
        FROM vv_group_total_permissions
        WHERE group_id = :group_id AND (:user_id IS NULL OR user_id = :user_id)
        AND (deletedAt is NULL OR :is_admin is true)
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| group_id | number | yes | - | Group Identifier | 1 |
| user_id | number | no | - | User Identifier | 123 |
| is_admin | boolean | no | false | - | - |

## GroupParticipant

### IdsByGroupId

Get all Group Participant IDs of a Group by its ID

**SQL**
```sql
SELECT participant_id
        FROM ParticipantGroups_participants
        WHERE group_id = :group_id
        AND (deletedAt is NULL OR :is_admin is true)
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| group_id | number | yes | - | Group Identifier | 1 |
| is_admin | boolean | no | false | - | - |

### byGroupId

Get all Group Participants for a certain Group ID

**SQL**
```sql
SELECT *
        FROM v_complete_group_participants 
        WHERE group_id = :group_id
        AND (deletedAt is NULL OR :is_admin is true)
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| group_id | number | yes | - | Group Identifier | 1 |
| is_admin | boolean | no | false | - | - |

### byGroupIdAndUserId

Get a Group Participant for a certain Group ID and its User ID

**SQL**
```sql
SELECT *
        FROM v_complete_group_participants 
        WHERE group_id = :group_id AND user_id = :user_id
        AND (deletedAt is NULL OR :is_admin is true)
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| group_id | number | yes | - | Group Identifier | 1 |
| user_id | number | yes | - | Participant Identifier | 3 |
| is_admin | boolean | no | false | - | - |

### byAllocatorId

Get all participants for a certain Allocator ID

**SQL**
```sql
SELECT *
        FROM v_complete_group_participants 
        WHERE allocator_id = :allocator_id
        AND (deletedAt is NULL OR :is_admin is true)
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| allocator_id | number | yes | - | Allocator Identifier | 1 |
| is_admin | boolean | no | false | - | - |

## AllocatedParticipants

### bySimletId

Get all allocated participants for a certain Simlet ID

**SQL**
```sql
SELECT *
        FROM v_complete_allocation_participants 
        WHERE simlet_id = :simlet_id
        AND (deletedAt is NULL OR :is_admin is true)
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| simlet_id | number | yes | - | Simlet Identifier | 1 |
| is_admin | boolean | no | false | - | - |

### bySessionId

Get all allocated participants for a certain Session ID

**SQL**
```sql
SELECT *
        FROM v_complete_allocation_participants 
        WHERE session_id = :session_id
        AND (deletedAt is NULL OR :is_admin is true)
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| session_id | number | yes | - | Session Identifier | 1 |
| is_admin | boolean | no | false | - | - |

### byAllocatorId

Get all allocated participants for a certain Allocator ID

**SQL**
```sql
SELECT *
        FROM vv_complete_groups_from_allocator_and_simlets  
        WHERE allocator_id = :allocator_id 
        AND (:group_id IS NULL or group_id = :group_id)
        AND (:groups_id IS NULL or group_id IN (:groups_id))
        AND (:user_id IS NULL or user_id = :user_id)
        AND (deletedAt is NULL OR :is_admin is true)
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| allocator_id | number | yes | - | Allocator Identifier | 1 |
| group_id | number | no | - | Group Identifier | 1 |
| groups_id | array<number> | no | - | Groups Identifier | [1,2,3] |
| user_id | number | no | - | User Identifier | 5 |
| is_admin | boolean | no | false | - | - |

## Session

### IdsBySimletId

Get all Session IDs of a SIMLET by its ID

**SQL**
```sql
SELECT session_id
        FROM Sessions
        WHERE simlet_id = :simlet_id
        AND (deletedAt is NULL OR :is_admin is true)
        ORDER BY {{orderBy}} {{order}}
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| simlet_id | number | yes | - | Simlet Identifier | 1 |
| is_admin | boolean | no | false | - | - |

### IdsBySimletIdAndUserId

Get all Session IDs of a SIMLET by its ID

**SQL**
```sql
SELECT session_id
        FROM v_simlet_sessions_users_permissions
        WHERE simlet_id = :simlet_id AND current_user_id = :current_user_id 
        AND (deletedAt is NULL OR :is_admin is true)
        ORDER BY {{orderBy}} {{order}}
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| simlet_id | number | yes | - | Simlet Identifier | 1 |
| current_user_id | number | yes | - | User Identifier | 123 |
| is_admin | boolean | no | false | - | - |

### tagsBySessionId

Get all tags of a Session by its ID and current user access

**SQL**
```sql
SELECT DISTINCT ON (tag_id)
        tag_id,
        tag_name,
        tag_color,
        tag_visible_user_id,
        tag_visible_user_name,
        tag_visible_permission
      FROM v_simlet_tags
      WHERE session_id = :session_id
      AND tag_visible_user_id = :current_user_id
      AND (deletedAt is NULL OR :is_admin is true)
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| session_id | number | yes | - | Session Identifier | 1 |
| current_user_id | number | yes | - | Current User Identifier | 123 |
| is_admin | boolean | no | false | - | - |

### directPermissionsBySessionId

Get all direct permissions of a Session by its ID

**SQL**
```sql
SELECT *
      FROM v_session_direct_permissions_users
      WHERE session_id = :session_id  AND (:user_id IS NULL OR user_id = :user_id)
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| session_id | number | yes | - | Session Identifier | 1 |
| user_id | number | no | - | User Identifier | 123 |

### bySimletIdAndUserId

Get all Sessions and Users permissions of a SIMLET by its ID with user permissions

**SQL**
```sql
SELECT *
      FROM v_complete_sessions_users_permissions 
      WHERE simlet_id = :simlet_id AND current_user_id = :current_user_id
      AND (:search IS NULL OR session_name LIKE '%' || :search || '%' OR session_description LIKE '%' || :search || '%')
      AND (:session_status IS NULL OR session_status = :session_status)
      AND (deletedAt is NULL OR :is_admin is true)
      ORDER BY {{orderBy}} {{order}}
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| simlet_id | number | yes | - | Simlet Identifier | 1 |
| current_user_id | number | yes | - | User Identifier | 123 |
| session_status | string | no | - | Filter sessions by status (active, paused or archived) | "active" |
| search | string | no | - | Search string to filter sessions by name or description | "session" |
| is_admin | boolean | no | false | - | - |

### bySimletIdAndUserIdWithPagination

Get all Sessions and Users permissions of a SIMLET by its ID with user permissions

**SQL**
```sql
SELECT *
        FROM v_complete_sessions_users_permissions 
        WHERE simlet_id = :simlet_id AND current_user_id = :current_user_id
        AND (:search IS NULL OR session_name LIKE '%' || :search || '%' OR session_description LIKE '%' || :search || '%')
        AND (:session_status IS NULL OR session_status = :session_status)
        AND (deletedAt is NULL OR :is_admin is true)
        ORDER BY {{orderBy}} {{order}}
        LIMIT :limit OFFSET :offset
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| simlet_id | number | yes | - | Simlet Identifier | 1 |
| current_user_id | number | yes | - | User Identifier | 123 |
| search | string | no | - | Search string to filter sessions by name or description | "session" |
| session_status | string | no | - | Filter sessions by status (active, paused or archived) | "active" |
| limit | number | yes | - | Maximum number of sessions to return | 10 |
| offset | number | yes | - | Number of sessions to skip for pagination | 20 |
| is_admin | boolean | no | false | - | - |

### bySimletIdAndUserIdAndTagIds

Get all Sessions and Users permissions of a SIMLET by its ID with user permissions and filtered by tag IDs

**SQL**
```sql
SELECT *
      FROM v_complete_sessions_users_permissions_tags
      WHERE simlet_id = :simlet_id AND current_user_id = :current_user_id
      AND tag_id IN (:tag_ids)
      AND (:search IS NULL OR session_name LIKE '%' || :search || '%' OR session_description LIKE '%' || :search || '%')
      AND (:session_status IS NULL OR session_status = :session_status)
        AND (deletedAt is NULL OR :is_admin is true)
      GROUP BY session_id
      ORDER BY {{orderBy}} {{order}}
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| simlet_id | number | yes | - | Simlet Identifier | 1 |
| current_user_id | number | yes | - | User Identifier | 123 |
| session_status | string | no | - | Filter sessions by status (active, paused or archived) | "active" |
| search | string | no | - | Search string to filter sessions by name or description | "session" |
| tag_ids | array<number> | yes | - | List of tag IDs to filter sessions | [1,2,3] |
| is_admin | boolean | no | false | - | - |

### bySimletIdAndUserIdAndTagIdsWithPagination

Get all Sessions and Users permissions of a SIMLET by its ID with user permissions and filtered by tag IDs

**SQL**
```sql
SELECT *
        FROM v_complete_sessions_users_permissions_tags
        WHERE simlet_id = :simlet_id AND current_user_id = :current_user_id
        AND tag_id IN (:tag_ids)
        AND (:search IS NULL OR session_name LIKE '%' || :search || '%' OR session_description LIKE '%' || :search || '%')
        AND (:session_status IS NULL OR session_status = :session_status)
        AND (deletedAt is NULL OR :is_admin is true)
        GROUP BY session_id
        ORDER BY {{orderBy}} {{order}}
        LIMIT :limit OFFSET :offset
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| simlet_id | number | yes | - | Simlet Identifier | 1 |
| current_user_id | number | yes | - | User Identifier | 123 |
| session_status | string | no | - | Filter sessions by status (active, paused or archived) | "active" |
| search | string | no | - | Search string to filter sessions by name or description | "session" |
| limit | number | yes | - | Maximum number of sessions to return | 10 |
| offset | number | yes | - | Number of sessions to skip for pagination | 20 |
| tag_ids | array<number> | yes | - | List of tag IDs to filter sessions | [1,2,3] |
| is_admin | boolean | no | false | - | - |

### bySimletIdSessionIdAndUserId

Get current Session with users permissions of a SIMLET by its ID with user permissions

**SQL**
```sql
SELECT *
      FROM v_complete_sessions_users_permissions 
      WHERE simlet_id = :simlet_id AND session_id = :session_id AND current_user_id = :current_user_id
        AND (deletedAt is NULL OR :is_admin is true)
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| simlet_id | number | yes | - | Simlet Identifier | 1 |
| current_user_id | number | yes | - | User Identifier | 123 |
| session_id | number | yes | - | Session Identifier | 456 |
| is_admin | boolean | no | false | - | - |

### byAllocatedUserIdAndSimletId

Get a SIMLET for a certain User and Simlet ID, including allocated user information

**SQL**
```sql
SELECT *
      FROM v_complete_activity_allocation_participants 
      WHERE allocated_user_id = :current_user_id AND simlet_id = :simlet_id
      AND (deletedAt is NULL OR :is_admin is true)
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| current_user_id | number | yes | - | User Identifier | 123 |
| simlet_id | number | yes | - | Simlet Identifier | 1 |
| is_admin | boolean | no | false | - | - |

### countBySimletIdAndUserId

Get the count of sessions for a certain User ID

**SQL**
```sql
SELECT COUNT(*) as count
        FROM v_complete_sessions_users_permissions
        WHERE current_user_id = :current_user_id AND simlet_id = :simlet_id
        AND (:search IS NULL OR session_name LIKE '%' || :search || '%')
        AND (:session_status IS NULL OR session_status = :session_status)
        AND (deletedAt is NULL OR :is_admin is true)
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| current_user_id | number | yes | - | User Identifier | 123 |
| simlet_id | number | yes | - | Simlet Identifier | 1 |
| search | string | no | - | Search string to filter simlets by name or description | "simlet" |
| session_status | string | no | - | Filter sessions by status (active, paused or archived) | "active" |
| is_admin | boolean | no | false | - | - |

### countBySimletIdAndUserIdAndTagIds

Get the count of sessions for a certain User ID and tag IDs

**SQL**
```sql
SELECT COUNT(DISTINCT session_id) as count
        FROM v_complete_sessions_users_permissions_tags
        WHERE current_user_id = :current_user_id AND simlet_id = :simlet_id
        AND tag_id IN (:tag_ids)
        AND (:session_status IS NULL OR session_status = :session_status)
        AND (:search IS NULL OR session_name LIKE '%' || :search || '%')
        AND (deletedAt is NULL OR :is_admin is true)
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| current_user_id | number | yes | - | User Identifier | 123 |
| simlet_id | number | yes | - | Simlet Identifier | 1 |
| search | string | no | - | Search string to filter simlets by name or description | "simlet" |
| tag_ids | array<number> | yes | - | List of tag IDs to filter sessions | [1,2,3] |
| session_status | string | no | - | Filter sessions by status (active, paused or archived) | "active" |
| is_admin | boolean | no | false | - | - |

