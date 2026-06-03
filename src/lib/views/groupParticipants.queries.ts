import { QueryTemplate } from "@/lib/functions";

const queries: Record<string, QueryTemplate> = {
    IdsByGroupId: {
        description: "Get all Group Participant IDs of a Group by its ID",
        sql: `
        SELECT participant_id
        FROM ParticipantGroups_participants
        WHERE group_id = :group_id
        `,
        params: {
            group_id: {
                type: "number",
                required: true,
                description: "Group Identifier",
                example: 1,
            },
        },
    },
    byGroupId: {
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

    byGroupIdAndUserId: {
        description: "Get a Group Participant for a certain Group ID and its User ID",
        sql: `
        SELECT *
        FROM v_complete_group_participants 
        WHERE group_id = :group_id AND user_id = :user_id
        `,
        params: {
            group_id: {
                type: "number",
                required: true,
                description: "Group Identifier",
                example: 1
            },
            user_id: {
                type: "number",
                required: true,
                description: "Participant Identifier",
                example: 3
            },
        },
    },

    byAllocatorId: {
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
