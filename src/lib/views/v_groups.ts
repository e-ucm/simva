import { QueryTemplate } from "@/lib/functions";

const queries: Record<string, QueryTemplate> = {
    byVersion: {
        description: "Get all Groups for a certain Version",
        sql: `
        SELECT *
        FROM v_complete_groups
        WHERE use_new_generation IS :version
        `,
        params: {
            version: {
                type: "boolean",
                required: true,
                description: "Version flag indicating whether to use new generation",
                example: true
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
