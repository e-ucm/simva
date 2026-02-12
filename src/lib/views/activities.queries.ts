import { QueryTemplate } from "@/lib/functions";

const queries: Record<string, QueryTemplate> = {
  bySessionIdUserId: {
    description: "Get all Activities for a certain User and optionally filter by Session",
    sql: `
      SELECT *
      FROM v_complete_activities_users_permissions
      WHERE user_id = :user_id AND (:session_id IS NULL OR session_id = :session_id)
    `,
    params: {
      user_id: {
        type: "number",
        required: true,
        description: "User Identifier",
        example: 123,
      },
      session_id: {
        type: "number",
        required: false,
        description: "Session Identifier to filter activities by session",
        example: 456,
      },
    },
  },
  
  byActivityIdAndUserId: {
    description: "Get Activity and Users permissions of an activity by its ID with user permissions",
    sql: `
      SELECT *
      FROM v_complete_activities_users_permissions 
      WHERE activity_id = :activity_id AND user_id = :user_id
    `,
    params: {
      activity_id: {
        type: "number",
        required: true,
        description: "Activity Identifier",
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
};

export default queries;