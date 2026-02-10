import { QueryTemplate } from "@/lib/functions";

const queries: Record<string, QueryTemplate> = {
    byGroupIdAndUserId: {
        description: "Get current Group for a certain Group ID and User ID",
        sql: `
        SELECT *
        FROM v_complete_groups_users_permissions
        WHERE user_id = :user_id AND group_id = :group_id
        `,
        params: {
            user_id: {
                type: "number",
                required: true,
                description: "User Identifier",
                example: 123,
            },
            group_id: {
                type: "number",
                required: true,
                description: "Group Identifier",
                example: 1
            },
        },
    },

    byVersionAndUserId: {
        description: "Get all Groups for a certain Version and User ID",
        sql: `
        SELECT *
        FROM v_complete_groups_users_permissions
        WHERE use_new_generation IS :version AND user_id = :user_id
        `,
        params: {
            version: {
                type: "boolean",
                required: true,
                description: "Version flag indicating whether to use new generation",
                example: true
            },
            user_id: {
                type: "number",
                required: true,
                description: "User Identifier",
                example: 123,
            },
        },
    },

    participantsById: {
        description: "Get all Group Participants for a certain Group ID",
        sql: `
        SELECT *
        FROM v_complete_group_participants 
        WHERE group_id = :group_id
        `,
        params: {
            group_id: {
                type: "number",
                required: true,
                description: "Group Identifier",
                example: 1
            },
        },
    },

    participantsByAllocatorId: {
        description: "Get all participants for a certain Allocator ID",
        sql: `
        SELECT *
        FROM v_complete_group_participants 
        WHERE allocator_id = :allocator_id
        `,
        params: {
            allocator_id: {
                type: "number",
                required: true,
                description: "Allocator Identifier",
                example: 1
            },
        },
    },
};

export default queries;
