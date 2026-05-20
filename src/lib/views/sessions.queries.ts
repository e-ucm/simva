import { QueryTemplate } from "@/lib/functions";

const queries: Record<string, QueryTemplate> = {
    IdsBySimletId: {
        description: "Get all Session IDs of a SIMLET by its ID",
        sql: `
        SELECT session_id
        FROM Sessions
        WHERE simlet_id = :simlet_id
        ORDER BY session_order
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
    IdsBySimletIdAndUserId: {
        description: "Get all Session IDs of a SIMLET by its ID",
        sql: `
        SELECT session_id
        FROM v_simlet_sessions_users_permissions
        WHERE simlet_id = :simlet_id AND current_user_id = :current_user_id
        ORDER BY session_order
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
        },
    },
  tagsBySessionId: {
    description: "Get all tags of a Session by its ID and current user access",
    sql: `
      SELECT 
        tag_id,
        tag_name,
        tag_color,
        tag_visible_user_id,
        tag_visible_user_name,
        tag_visible_permission
      FROM v_simlet_tags
      WHERE session_id = :session_id
      AND tag_visible_user_id = :current_user_id
    `,
    params: {
      session_id: {
        type: "number",
        required: true,
        description: "Session Identifier",
        example: 1,
      },
      current_user_id: {
        type: "number",
        required: true,
        description: "Current User Identifier",
        example: 123,
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
  byAllocatedUserIdAndSimletId: {
    description: "Get a SIMLET for a certain User and Simlet ID, including allocated user information",
    sql: `
      SELECT *
      FROM v_complete_activity_allocation_participants 
      WHERE allocated_user_id = :current_user_id AND simlet_id = :simlet_id
    `,
    params: {
      current_user_id: {
        type: "number",
        required: true,
        description: "User Identifier",
        example: 123,
      },
      simlet_id: {
        type: "number",
        required: true,
        description: "Simlet Identifier",
        example: 1,
      },
    },
  },
};
export default queries;