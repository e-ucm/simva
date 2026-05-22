import { QueryTemplate } from "@/lib/functions";

const queries: Record<string, QueryTemplate> = {
      IdsBySessionId: {
        description: "Get all Activity IDs of a Session by its ID",
        sql: `
        SELECT activity_id
        FROM Activities
        WHERE session_id = :session_id
        ORDER BY activity_order
        `,
        params: {
            session_id: {
                type: "number",
                required: true,
                description: "Session Identifier",
                example: 1,
            },
        },
    },
  bySessionIdUserId: {
    description: "Get all Activities for a certain User and optionally filter by Session",
    sql: `
      SELECT *
      FROM v_complete_activities_users_permissions
      WHERE current_user_id = :current_user_id AND (:session_id IS NULL OR session_id = :session_id)
      ORDER BY activity_order
    `,
    params: {
      current_user_id: {
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
      WHERE activity_id = :activity_id AND current_user_id = :current_user_id
      ORDER BY activity_order
    `,
    params: {
      activity_id: {
        type: "number",
        required: true,
        description: "Activity Identifier",
        example: 1,
      },
      current_user_id: {
        type: "number",
        required: true,
        description: "User Identifier",
        example: 123,
      },
    },
  },

  byActivityIdAndParticipantId: {
    description: "Get actual allocated Activity of the actual user with access to this activity",
    sql: `
      SELECT *
      FROM v_complete_activity_allocation_participants  
      WHERE activity_id = :activity_id AND allocated_user_id = :allocated_user_id
      ORDER BY activity_order
    `,
    params: {
      activity_id: {
        type: "number",
        required: true,
        description: "Activity Identifier",
        example: 1,
      },
      allocated_user_id: {
        type: "number",
        required: true,
        description: "User Identifier",
        example: 123,
      },
    },
  },

  byPreviousActivityIdAndParticipantId: {
    description: "Get previous allocated Activities of the actual user with access to this activity",
    sql: `
      SELECT *
      FROM v_complete_activity_allocation_participants  
      WHERE allocated_session_id = :session_id AND activity_order < :activity_order AND allocated_user_id = :allocated_user_id
      ORDER BY activity_order
    `,
    params: {
      session_id: {
        type: "number",
        required: true,
        description: "Session Identifier",
        example: 1,
      },
      activity_order: {
        type: "number",
        required: true,
        description: "Activity Order",
        example: 1,
      },
      allocated_user_id: {
        type: "number",
        required: true,
        description: "User Identifier",
        example: 123,
      },
    },
  },

  bySurveyId: {
        description: "Get all Activities for a certain Survey ID",
        sql: `
        SELECT *
        FROM v_activities_by_survey_id
        WHERE survey_id = :survey_id
        `,
        params: {
            survey_id: {
                type: "number",
                required: true,
                description: "Survey Identifier",
                example: 1
            },
        },
    },
};

export default queries;