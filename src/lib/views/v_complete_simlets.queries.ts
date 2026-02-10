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
  
  bySimletId: {
    description: "Get Simlet Data By Identifier",
    sql: `
      SELECT *
      FROM vv_complete_simlets
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

  groupByAllocator: {
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
  allocatedParticipantsBySimletId: {
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
};

export default queries;
