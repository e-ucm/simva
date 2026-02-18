import { QueryTemplate } from "@/lib/functions";

const queries: Record<string, QueryTemplate> = {
  byUserId: {
    description: "Get all SIMLETs for a certain User",
    sql: `
      SELECT *
      FROM v_complete_simlets_users_permissions
      WHERE current_user_id = :current_user_id
      AND (:search IS NULL OR simlet_name LIKE '%' || :search || '%' OR simlet_description LIKE '%' || :search || '%')
    `,
    params: {
      current_user_id: {
        type: "number",
        required: true,
        description: "User Identifier",
        example: 123,
      },
      search: {
        type: "string",
        required: false,
        description: "Search string to filter simlets by name or description",
        example: "math",
      },
    },
  },

  byUserIdWithPagination: {
    description: "Get all SIMLETs for a certain User with pagination and search",
    sql: `
      SELECT *
      FROM v_complete_simlets_users_permissions
      WHERE current_user_id = :current_user_id
      AND (:search IS NULL OR simlet_name LIKE '%' || :search || '%' OR simlet_description LIKE '%' || :search || '%')
      ORDER BY simlet_id
      LIMIT :limit OFFSET :offset
    `,
    params: {
      current_user_id: {
      type: "number",
      required: true,
      description: "User Identifier",
      example: 123,
      },
      search: {
      type: "string",
      required: false,
      description: "Search string to filter simlets by name or description",
      example: "math",
      },
      limit: {
      type: "number",
      required: true,
      description: "Maximum number of simlets to return",
      example: 10,
      },
      offset: {
      type: "number",
      required: true,
      description: "Number of simlets to skip for pagination",
      example: 20,
      },
    },
  },

  byUserIdAndSimletId: {
    description: "Get current SIMLET for a certain User",
    sql: `
      SELECT *
      FROM v_complete_simlets_users_permissions
      WHERE current_user_id = :current_user_id AND simlet_id = :simlet_id
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
