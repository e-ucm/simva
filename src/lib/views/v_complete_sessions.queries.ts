import { QueryTemplate } from "@/lib/functions";

const queries: Record<string, QueryTemplate> = {
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
  
  byIdAndUsername: {
    description: "Get all SIMLETs and Users permissions of a Session by its ID",
    sql: `
      SELECT *
      FROM v_complete_sessions_users_permissions 
      WHERE simlet_id = :simlet_id AND username = :username
    `,
    params: {
      simlet_id: {
        type: "number",
        required: true,
        description: "Simlet Identifier",
        example: "1",
      },
      username: {
        type: "string",
        required: true,
        description: "User username",
        example: "myuser",
      },
    },
  },

  UserPermissionbyId: {
    description: "Get Users Direct Permissions for Session by its ID",
    sql: `
      SELECT *
      FROM v_direct_permissions_users
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

export default queries;
