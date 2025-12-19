# Database View Queries

## User

### byRole

List users filtered by a single role

**SQL**
```sql
SELECT *
      FROM v_complete_simlets
      WHERE simlet_id = :role
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| role | string | yes | - | User role (e.g. admin, player) | "admin" |

### byRoles

List users filtered by multiple roles

**SQL**
```sql
SELECT *
      FROM user_view
      WHERE role IN (:roles)
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| roles | array<string> | yes | - | List of allowed roles | ["admin","moderator"] |

### paginated

Paginated user list

**SQL**
```sql
SELECT *
      FROM user_view
      ORDER BY username
      LIMIT :limit OFFSET :offset
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| limit | number | no | 20 | Max number of rows | 20 |
| offset | number | no | 0 | Pagination offset | - |

## Simlet

### byId

Get SIMLET by its ID

**SQL**
```sql
SELECT *
      FROM v_complete_simlets
      WHERE simlet_id = :simlet_id
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| simlet_id | number | yes | - | Simlet Identifier | "1" |

### byUsername

Get all SIMLETs for a certain User

**SQL**
```sql
SELECT *
      FROM v_complete_simlets_users_permissions
      WHERE username = :username
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| username | string | yes | - | User username | "myuser" |

### DirectUserPermissionbyId

Get Direct Users Permission for SIMLET by its ID

**SQL**
```sql
SELECT *
      FROM v_direct_permissions_users
      WHERE object_id = :simlet_id AND object_type = "SIMLET"
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| simlet_id | number | yes | - | Simlet Identifier | "1" |

## Session

### byId

Get Session by its ID

**SQL**
```sql
SELECT *
      FROM v_complete_simlets_sessions
      WHERE session_id = :session_id
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| session_id | number | yes | - | Session Identifier | "1" |

### byIdAndUsername

Get all SIMLETs and Users permissions of a Session by its ID

**SQL**
```sql
SELECT *
      FROM v_complete_sessions_users_permissions 
      WHERE simlet_id = :simlet_id AND username = :username
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| session_id | number | yes | - | Session Identifier | "1" |
| username | string | yes | - | User username | "myuser" |

### UserPermissionbyId

Get Users Direct Permissions for Session by its ID

**SQL**
```sql
SELECT *
      FROM v_direct_permissions_users
      WHERE object_id = :session_id AND object_type = "SESSION"
```

**Parameters**

| Name | Type | Required | Default | Description | Example |
|------|------|----------|---------|-------------|---------|
| session_id | number | yes | - | Simlet Identifier | "1" |

