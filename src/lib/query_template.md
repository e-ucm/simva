# Query Template Definition Guide

This document describes how to define **read-only SQL query templates** for database **VIEWS** using Sequelize raw queries.

These templates are:
- Safe (no schema changes)
- Typed (runtime validation)
- Documented (auto-generated docs)
- Reusable

---

## 1. Design Principles

- Queries are **read-only**
- One file per VIEW
- SQL is written explicitly
- Parameters are validated before execution
- Documentation is generated from the same source

---

## 2. File Structure

```text
sql_model/
├── models/
│   ├── groups/
│   │     ├── group.model.js
│   │     └── groupParticipants.model.js
│   ├── users/
│   │     └── user.model.js
│   └── index.js
├── views/
│   ├── userView.queries.js
│   ├── statsView.queries.js
│   └── index.js
├── functions.js
└── generateQueryDocs.js
```

## 3. Query Template Format
Each query is defined as an object with the following fields:

Field	Required	Description
description	No	Human-readable description
sql	Yes	SQL query using named replacements
params	No	Parameter schema (types, defaults, docs)

## 4. Basic Query Example
```js
Copy code
module.exports = {
  listAll: {
    description: "List all users",
    sql: '
      SELECT *
      FROM user_view
    ',
  },
};
```

## 5. Scalar Parameters
Scalar parameters include string, number, boolean, date.

Example: string parameter
```js
Copy code
byRole: {
  description: "List users by role",
  sql: `
    SELECT *
    FROM user_view
    WHERE role = :role
  `,
  params: {
    role: {
      type: "string",
      required: true,
      description: "User role",
      example: "admin",
    },
  },
},
```

## 6. Optional Parameters with Defaults
```js
Copy code
paginated: {
  description: "Paginated user list",
  sql: `
    SELECT *
    FROM user_view
    ORDER BY username
    LIMIT :limit OFFSET :offset
  `,
  params: {
    limit: {
      type: "number",
      required: false,
      default: 20,
      description: "Maximum number of rows",
      example: 20,
    },
    offset: {
      type: "number",
      required: false,
      default: 0,
      description: "Pagination offset",
      example: 0,
    },
  },
},
```
If a parameter is omitted:

If required: true → error

If default exists → default is applied

## 7. Array Parameters (IMPORTANT)
Array parameters are supported and commonly used with IN (...).

Example: array of strings
```js
Copy code
byRoles: {
  description: "List users by multiple roles",
  sql: `
    SELECT *
    FROM user_view
    WHERE role IN (:roles)
  `,
  params: {
    roles: {
      type: "array",
      of: "string",
      required: true,
      description: "List of allowed roles",
      example: ["admin", "moderator"],
    },
  },
},
```

Supported array types
Type	Example
array<string>	["admin", "player"]
array<number>	[1, 2, 3]

## 8. Supported Parameter Types
Type	Description
string	Text values
number	Integers or floats
boolean	true / false
date	JavaScript Date object
array	List of values (use of)

## 9. Using Named Replacements in SQL
All parameters must be referenced using named replacements:

sql
Copy code
WHERE username = :username
AND role IN (:roles)
LIMIT :limit OFFSET :offset
❌ Positional parameters (?) are not allowed
✅ Named replacements only

## 10. Execution Rules
Queries are executed using sequelize.query

Validation happens before execution

Only SELECT queries are allowed

Never call:

sync()

create()

update()

destroy()

## 11. Documentation Metadata Fields
Each parameter may define:

Field	Description
description	Human-readable explanation
example	Example value shown in docs
default	Default value if omitted

These fields are used for auto-generated Markdown and JSON docs.

## 12. Complete Example
```js
Copy code
module.exports = {
  byUsernameAndRoles: {
    description: "Find a user by username and allowed roles",
    sql: `
      SELECT *
      FROM user_view
      WHERE username = :username
        AND role IN (:roles)
    `,
    params: {
      username: {
        type: "string",
        required: true,
        description: "User login name",
        example: "alice",
      },
      roles: {
        type: "array",
        of: "string",
        required: true,
        description: "Allowed roles",
        example: ["admin", "player"],
      },
    },
  },
};
```

## 13. Why This Pattern
Single source of truth

Self-documented SQL

Runtime-safe parameters

Works perfectly with SQL views

Scales to analytics & reporting

## 14. Best Practices
One query = one responsibility

Prefer views over joins in application code

Always document parameters

Use arrays instead of string concatenation

Keep SQL readable and formatted

## 15. Summary
✔ Explicit SQL
✔ Typed parameters
✔ Array-safe
✔ Auto-documented
✔ View-friendly
✔ No ORM magic

This pattern is recommended for analytics, reporting, dashboards, and serious-game telemetry systems.