import { QueryTemplate } from "@/lib/functions";

const queries: Record<string, QueryTemplate> = {
  byUserId: {
    description: "Get all SIMLETs for a certain User",
    sql: `
      SELECT *
      FROM v_complete_simlets_users_permissions
      WHERE user_id = :user_id
    `,
    params: {
      user_id: {
        type: "number",
        required: true,
        description: "User Identifier",
        example: 123,
      },
    },
  },

  byUserIdAndSimletId: {
    description: "Get current SIMLET for a certain User",
    sql: `
      SELECT *
      FROM v_complete_simlets_users_permissions
      WHERE user_id = :user_id AND simlet_id = :simlet_id
    `,
    params: {
      user_id: {
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

  AllocatorBySimletId: {
    description: "Get Allocator Data By Simlet Identifier",
    sql: `
      SELECT *
      FROM v_complete_allocators
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

  GroupsBySimletId : {
    description: "Get Simlet Group By Simlet Identifier",
    sql: `
      SELECT *
      FROM v_complete_groups_simlets
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
  
  AllocatedParticipantsBySimletId: {
    description: "Get all allocated participants for a certain Simlet ID",
    sql: `
    SELECT *
    FROM v_complete_allocation_participants 
    WHERE simlet_id = :simlet_id
    `,
    params: {
        simlet_id: {
            type: "number",
            required: true,
            description: "Simlet Identifier",
            example: 1
        },
    },
  },

  SessionsBySimletIdAndUserId: {
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

  SessionBySimletIdSessionIdAndUserId: {
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
