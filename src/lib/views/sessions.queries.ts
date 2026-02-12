import { QueryTemplate } from "@/lib/functions";

const queries: Record<string, QueryTemplate> = {
    bySimletIdAndUserId: {
        description: "Get all Sessions and Users permissions of a SIMLET by its ID with user permissions",
        sql: `
        SELECT *
        FROM v_complete_sessions_users_permissions 
        WHERE simlet_id = :simlet_id AND user_id = :user_id
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