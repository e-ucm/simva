import { QueryTemplate } from "@/lib/functions";

const queries: Record<string, QueryTemplate> = {
    bySimletIdAndUserId: {
        description: "Get all Sessions and Users permissions of a SIMLET by its ID with user permissions",
        sql: `
        SELECT *
        FROM v_complete_sessions_users_permissions 
        WHERE simlet_id = :simlet_id AND user_id = :user_id
        AND (:search IS NULL OR name LIKE '%' || :search || '%' OR description LIKE '%' || :search || '%')
        `,
        params: {
            simlet_id: {
                type: "number",
                required: true,
                description: "Simlet Identifier",
                example: 1,
            },
            user_id: {
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
        WHERE simlet_id = :simlet_id AND user_id = :user_id
        AND (:search IS NULL OR name LIKE '%' || :search || '%' OR description LIKE '%' || :search || '%')
        LIMIT :limit OFFSET :offset
        `,
        params: {
            simlet_id: {
                type: "number",
                required: true,
                description: "Simlet Identifier",
                example: 1,
            },
            user_id: {
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
      WHERE simlet_id = :simlet_id AND session_id = :session_id AND user_id = :user_id
    `,
    params: {
      simlet_id: {
        type: "number",
        required: true,
        description: "Simlet Identifier",
        example: 1,
      },
      user_id: {
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