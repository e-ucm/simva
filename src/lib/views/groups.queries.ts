import { QueryTemplate } from "@/lib/functions";

const queries: Record<string, QueryTemplate> = {
    byVersionAndUserId: {
        description: "Get all Groups for a certain Version and User ID",
        sql: `
        SELECT *
        FROM v_complete_groups_user_permissions
        WHERE current_user_id = :current_user_id AND (:version IS NULL OR group_use_new_generation = :version)
        AND (:simlet_id IS NULL OR simlet_id = :simlet_id)
        AND (:search IS NULL OR group_name LIKE '%' || :search || '%')
        AND (:sandbox IS NULL OR group_sandbox = :sandbox)
        AND deletedAt IS NULL
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
            simlet_id: {
                type: "number",
                required: false,
                description: "Simlet Identifier to filter groups by simlet",
                example: 1,
            },
            search: {
                type: "string",
                required: false,
                description: "Search string to filter groups by name or description",
                example: "group",
            },
            sandbox: {
                type: "boolean",
                required: false,
                description: "Sandbox boolean to filter groups by sandbox",
                example: "true",
            }
        },
    },
    countByUserId: {
        description: "Get the count of Groups for a certain Version and User ID",
        sql: `
        SELECT COUNT(*) AS count
        FROM v_complete_groups_user_permissions
        WHERE current_user_id = :current_user_id AND (:version IS NULL OR group_use_new_generation = :version)
        AND (:simlet_id IS NULL OR simlet_id = :simlet_id)
        AND (:search IS NULL OR group_name LIKE '%' || :search || '%')
        AND (:sandbox IS NULL OR group_sandbox = :sandbox)
        AND deletedAt IS NULL
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
            simlet_id: {
                type: "number",
                required: false,
                description: "Simlet Identifier to filter groups by simlet",
                example: 1,
            },
            search: {
                type: "string",
                required: false,
                description: "Search string to filter groups by name or description",
                example: "group",
            },
            sandbox: {
                type: "boolean",
                required: false,
                description: "Sandbox boolean to filter groups by sandbox",
                example: "true",
            }
        },
    },
    byVersionAndUserIdWithPagination: {
        description: "Get all Groups for a certain Version and User ID",
        sql: `
        SELECT *
        FROM v_complete_groups_user_permissions
        WHERE current_user_id = :current_user_id AND (:version IS NULL OR group_use_new_generation = :version)
        AND (:search IS NULL OR group_name LIKE '%' || :search || '%')
        AND (:simlet_id IS NULL OR simlet_id = :simlet_id)
        AND (:sandbox IS NULL OR group_sandbox = :sandbox)
        AND deletedAt IS NULL
        LIMIT :limit OFFSET :offset
        `,
        params: {
            version: {
                type: "boolean",
                required: false,
                description: "Version flag indicating whether to use new generation",
                example: true
            },
            simlet_id: {
                type: "number",
                required: false,
                description: "Simlet Identifier to filter groups by simlet",
                example: 1,
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
            current_user_id: {
                type: "number",
                required: true,
                description: "User Identifier",
                example: 123,
            },
            sandbox: {
                type: "boolean",
                required: false,
                description: "Sandbox boolean to filter groups by sandbox",
                example: "true",
            }
        },
    },

    byGroupIdAndUserId: {
        description: "Get current Group for a certain Group ID and User ID",
        sql: `
        SELECT *
        FROM v_complete_groups_user_permissions
        WHERE current_user_id = :current_user_id AND group_id = :group_id
        AND (:simlet_id IS NULL OR simlet_id = :simlet_id)
        AND deletedAt IS NULL
        `,
        params: {
            simlet_id: {
                type: "number",
                required: false,
                description: "Simlet Identifier to filter groups by simlet",
                example: 1,
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
        AND (:search IS NULL OR group_name LIKE '%' || :search || '%')
        AND (:sandbox IS NULL OR group_sandbox = :sandbox)
        AND deletedAt IS NULL
        ORDER BY {{orderBy}} {{order}}
        `,
        params: {
            simlet_id: {
                type: "number",
                required: true,
                description: "Simlet Identifier",
                example: 1,
            },
            search: {
                type: "string",
                required: false,
                description: "Search string to filter groups by name",
                example: "group",
            },
            sandbox: {
                type: "boolean",
                required: false,
                description: "Sandbox boolean to filter groups by sandbox",
                example: "true",
            }
        },
    },
    bySimletIdWithPagination: {
        description: "Get Simlet Group By Simlet Identifier with Pagination",
        sql: `
        SELECT *
        FROM v_complete_groups_simlets
        WHERE simlet_id = :simlet_id
        AND (:search IS NULL OR group_name LIKE '%' || :search || '%')
        AND (:sandbox IS NULL OR group_sandbox = :sandbox)
        AND deletedAt IS NULL
        ORDER BY {{orderBy}} {{order}}
        LIMIT :limit OFFSET :offset
        `,
        params: {
            simlet_id: {
                type: "number",
                required: true,
                description: "Simlet Identifier",
                example: 1,
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
            sandbox: {
                type: "boolean",
                required: false,
                description: "Sandbox boolean to filter groups by sandbox",
                example: "true",
            }
        },
    },
    directPermissionsByGroupId: {
        description: "Get all direct permissions of a Group by its ID",
        sql: `
        SELECT *
        FROM vv_group_total_permissions
        WHERE group_id = :group_id AND (:user_id IS NULL OR user_id = :user_id)
        AND deletedAt IS NULL
        `,
        params: {
            group_id: {
                type: "number",
                required: true,
                description: "Group Identifier",
                example: 1,
            },
            user_id: {
                type: "number",
                required: false,
                description: "User Identifier",
                example: 123,
            },
        },
    },
};

export default queries;
