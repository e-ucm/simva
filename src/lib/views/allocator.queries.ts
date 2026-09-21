import { QueryTemplate } from "@/lib/functions";

const queries: Record<string, QueryTemplate> = {
    bySimletId: {
        description: "Get all allocated participants for a certain Simlet ID",
        sql: `
        SELECT *
        FROM v_complete_allocation_participants 
        WHERE simlet_id = :simlet_id
        AND (deletedAt is NULL OR :is_admin is true)
        `,
        params: {
            simlet_id: {
                type: "number",
                required: true,
                description: "Simlet Identifier",
                example: 1
            },
            is_admin: {
              type: "boolean",
              required: false,
              default: "false"
            }
        },
    },
    bySessionId: {
        description: "Get all allocated participants for a certain Session ID",
        sql: `
        SELECT *
        FROM v_complete_allocation_participants 
        WHERE session_id = :session_id
        AND (deletedAt is NULL OR :is_admin is true)
        `,
        params: {
            session_id: {
                type: "number",
                required: true,
                description: "Session Identifier",
                example: 1
            },
            is_admin: {
              type: "boolean",
              required: false,
              default: "false"
            }
        },
    },
    byAllocatorId: {
        description: "Get all allocated participants for a certain Allocator ID",
        sql: `
        SELECT *
        FROM vv_complete_groups_from_allocator_and_simlets  
        WHERE allocator_id = :allocator_id 
        AND (:group_id IS NULL or group_id = :group_id)
        AND (:groups_id IS NULL or group_id IN (:groups_id))
        AND (:user_id IS NULL or user_id = :user_id)
        AND (deletedAt is NULL OR :is_admin is true)
        `,
        params: {
            allocator_id: {
                type: "number",
                required: true,
                description: "Allocator Identifier",
                example: 1
            },
            group_id: {
                type: "number",
                required: false,
                description: "Group Identifier",
                example: 1
            },
            groups_id: {
                type: "array",
                of: "number",
                required: false,
                description: "Groups Identifier",
                example: [1,2,3]
            },
            user_id: {
                type: "number",
                required: false,
                description: "User Identifier",
                example: 5
            },
            is_admin: {
              type: "boolean",
              required: false,
              default: "false"
            }
        },
    }
};
export default queries;