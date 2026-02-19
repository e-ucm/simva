import { QueryTemplate } from "@/lib/functions";

const queries: Record<string, QueryTemplate> = {
    IdsBySimletId: {
        description: "Get all Session IDs of a SIMLET by its ID",
        sql: `
        SELECT session_id
        FROM Sessions
        WHERE simlet_id = :simlet_id
        `,
        params: {
            simlet_id: {
                type: "number",
                required: true,
                description: "Simlet Identifier",
                example: 1,
            },
        },
    },
  tagsBySessionId: {
    description: "Get all tags of a Session by its ID",
    sql: `
      SELECT session_tag_name
      FROM v_session_tags
      WHERE session_id = :session_id
    `,
    params: {
      session_id: {
        type: "number",
        required: true,
        description: "Session Identifier",
        example: 1,
      },
    },
  },
  directPermissionsBySessionId: {
    description: "Get all direct permissions of a Session by its ID",
    sql: `
      SELECT *
      FROM v_session_direct_permissions_users
      WHERE session_id = :session_id  AND (:user_id IS NULL OR user_id = :user_id)
    `,
    params: {
      session_id: {
        type: "number",
        required: true,
        description: "Session Identifier",
        example: 1,
      },
      user_id: {
        type: "number",
        required: false,
        description: "User Identifier",
        example: 123,
      },
    },
  },
  bySimletIdAndUserId: {
      description: "Get all Sessions and Users permissions of a SIMLET by its ID with user permissions",
      sql: `
      SELECT *
      FROM v_complete_sessions_users_permissions 
      WHERE simlet_id = :simlet_id AND current_user_id = :current_user_id
      AND (:search IS NULL OR session_name LIKE '%' || :search || '%' OR session_description LIKE '%' || :search || '%')
      `,
      params: {
          simlet_id: {
              type: "number",
              required: true,
              description: "Simlet Identifier",
              example: 1,
          },
          current_user_id: {
              type: "number",
              required: true,
              description: "User Identifier",
              example: 123,
          },
          search: {
            type: "string",
            required: false,
            description: "Search string to filter sessions by name or description",
            example: "session",
          }
      },
  },

  bySimletIdAndUserIdWithPagination: {
    description: "Get all Sessions and Users permissions of a SIMLET by its ID with user permissions",
        sql: `
        SELECT *
        FROM v_complete_sessions_users_permissions 
        WHERE simlet_id = :simlet_id AND current_user_id = :current_user_id
        AND (:search IS NULL OR session_name LIKE '%' || :search || '%' OR session_description LIKE '%' || :search || '%')
        LIMIT :limit OFFSET :offset
        `,
        params: {
            simlet_id: {
                type: "number",
                required: true,
                description: "Simlet Identifier",
                example: 1,
            },
            current_user_id: {
                type: "number",
                required: true,
                description: "User Identifier",
                example: 123,
            },
            search: {
              type: "string",
              required: false,
              description: "Search string to filter sessions by name or description",
              example: "session",
            },
            limit: {
              type: "number",
              required: true,
              description: "Maximum number of sessions to return",
              example: 10,
            },
            offset: {
              type: "number",
              required: true,
              description: "Number of sessions to skip for pagination",
              example: 20,
          },
        },
  },

  bySimletIdSessionIdAndUserId: {
    description: "Get all Sessions and Users permissions of a SIMLET by its ID with user permissions",
    sql: `
      SELECT *
      FROM v_complete_sessions_users_permissions 
      WHERE simlet_id = :simlet_id AND session_id = :session_id AND current_user_id = :current_user_id
    `,
    params: {
      simlet_id: {
        type: "number",
        required: true,
        description: "Simlet Identifier",
        example: 1,
      },
      current_user_id: {
        type: "number",
        required: true,
        description: "User Identifier",
        example: 123,
      },
      session_id: {
        type: "number",
        required: true,
        description: "Session Identifier",
        example: 456,
      },
    },
  },
};
export default queries;