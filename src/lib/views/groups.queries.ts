import { QueryTemplate } from "@/lib/functions";

const queries: Record<string, QueryTemplate> = {
    byVersionAndUserId: {
        description: "Get all Groups for a certain Version and User ID",
        sql: `
        SELECT *
        FROM v_complete_groups_users_permissions
        WHERE current_user_id = :current_user_id AND (:version IS NULL OR use_new_generation = :version)
        AND (:search IS NULL OR group_name LIKE '%' || :search || '%')
        `,
        params: {
            current_user_id: {
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
            search: {
                type: "string",
                required: false,
                description: "Search string to filter groups by name or description",
                example: "group",
            },
        },
    },

    byVersionAndUserIdWithPagination: {
        description: "Get all Groups for a certain Version and User ID",
        sql: `
        SELECT *
        FROM v_complete_groups_users_permissions
        WHERE current_user_id = :current_user_id AND (:version IS NULL OR use_new_generation = :version)
        AND (:search IS NULL OR group_name LIKE '%' || :search || '%')
        LIMIT :limit OFFSET :offset
        `,
        params: {
            current_user_id: {
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
            search: {
                type: "string",
                required: false,
                description: "Search string to filter groups by name or description",
                example: "group",
            },
            limit: {
                type: "number",
                required: true,
                description: "Maximum number of groups to return",
                example: 10,
            },
            offset: {
                type: "number",
                required: true,
                description: "Number of groups to skip for pagination",
                example: 20,
            },
        },
    },

    byGroupIdAndUserId: {
        description: "Get current Group for a certain Group ID and User ID",
        sql: `
        SELECT *
        FROM v_complete_groups_users_permissions
        WHERE current_user_id = :current_user_id AND group_id = :group_id
        `,
        params: {
            current_user_id: {
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
