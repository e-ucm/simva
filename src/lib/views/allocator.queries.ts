import { QueryTemplate } from "@/lib/functions";

const queries: Record<string, QueryTemplate> = {
    bySimletId: {
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
    bySessionId: {
        description: "Get all allocated participants for a certain Session ID",
        sql: `
        SELECT *
        FROM v_complete_allocation_participants 
        WHERE session_id = :session_id
        `,
        params: {
            session_id: {
                type: "number",
                required: true,
                description: "Session Identifier",
                example: 1
            },
        },
    },
};
export default queries;