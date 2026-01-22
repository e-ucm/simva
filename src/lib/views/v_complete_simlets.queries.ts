import { QueryTemplate } from "@/lib/functions";

const queries: Record<string, QueryTemplate> = {
  byId: {
    description: "Get SIMLET by its ID",
    sql: `
      SELECT *
      FROM v_complete_simlets
      WHERE simlet_id = :simlet_id
    `,
    params: {
      simlet_id: {
        type: "number",
        required: true,
        description: "Simlet Identifier",
        example: "1",
      },
    },
  },
  
  byUsername: {
    description: "Get all SIMLETs for a certain User",
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

  DirectUserPermissionbyId: {
    description: "Get Direct Users Permission for SIMLET by its ID",
    sql: `
      SELECT *
      FROM v_direct_permissions_users
      WHERE object_id = :simlet_id AND object_type = "SIMLET"
    `,
    params: {
      simlet_id: {
        type: "number",
        required: true,
        description: "Simlet Identifier",
        example: "1",
      },
    },
  },
};

export default queries;
