module.exports = {
  byRole: {
    description: "List users filtered by a single role",
    sql: `
      SELECT *
      FROM v_complete_simlets
      WHERE simlet_id = :role
    `,
    params: {
      role: {
        type: "string",
        required: true,
        description: "User role (e.g. admin, player)",
        example: "admin",
      },
    },
  },

  byRoles: {
    description: "List users filtered by multiple roles",
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
        description: "Max number of rows",
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
};
