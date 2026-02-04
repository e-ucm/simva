import { QueryTemplate } from "@/lib/functions";

const queries: Record<string, QueryTemplate> = {
  bySimletIdAndUsername: {
    description: "Get all Sessions and Users permissions of a SIMLET by its ID with user permissions",
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

  userPermissionbyId: {
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
      
  allocatedParticipantsBySessionId: {
    description: "Get all allocated participants for a certain Session ID",
    sql: `
    SELECT *
    FROM v_complete_allocation_participants 
    WHERE session_id = :session_id
    `,
    params: {
        session_id: {
            type: "number",
            required: true,
            description: "Session Identifier",
            example: 1
        },
    },
  },
};

export default queries;