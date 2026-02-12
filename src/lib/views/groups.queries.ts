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
        WHERE user_id = :user_id AND (:version IS NULL OR use_new_generation = :version)
        `,
        params: {
            user_id: {
                type: "number",
                required: true,
                description: "User Identifier",
                example: 123,
            },
            version: {
                type: "boolean",
                required: false,
                description: "Version flag indicating whether to use new generation",
                example: true
            },
        },
    },

    bySimletId : {
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
};

export default queries;
