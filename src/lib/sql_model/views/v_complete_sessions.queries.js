module.exports = {
  byId: {
    description: "Get Session by its ID",
    sql: `
      SELECT *
      FROM v_complete_simlets_sessions
      WHERE session_id = :session_id
    `,
    params: {
      session_id: {
        type: "number",
        required: true,
        description: "Session Identifier",
        example: "1",
      },
    },
  },
  
  byUsername: {
    description: "Get Session by its ID",
    sql: `
      SELECT *
      FROM v_complete_simlets_users_permissions
      WHERE username = :username
    `,
    params: {
      username: {
        type: "string",
        required: true,
        description: "User username",
        example: "myuser",
      },
    },
  },

  UserPermissionbyId: {
    description: "Get Users Permission for Session by its ID",
    sql: `
      SELECT *
      FROM v_direct_permissions
      WHERE object_id = :session_id AND object_type = "SESSION"
    `,
    params: {
      session_id: {
        type: "number",
        required: true,
        description: "Simlet Identifier",
        example: "1",
      },
    },
  },
};
