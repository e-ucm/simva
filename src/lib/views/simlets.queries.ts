import { QueryTemplate } from "@/lib/functions";

const queries: Record<string, QueryTemplate> = {
    tagsBySimletId: {
    description: "Get all tags of a SIMLET by its ID",
    sql: `
      SELECT 
        tag_id,
        tag_name,
        tag_color,
        tag_visible_user_id,
        tag_visible_user_name,
        tag_visible_permission
      FROM v_simlet_tags
      WHERE simlet_id = :simlet_id
      AND tag_visible_user_id = :current_user_id
        AND deletedAt IS NULL
    `,
    params: {
      simlet_id: {
        type: "number",
        required: true,
        description: "Simlet Identifier",
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
  filteredTagsByUserId: {
    description: "Get all tags by its ID and user ID",
    sql: `
      SELECT DISTINCT
        tag_id,
        tag_name,
        tag_color,
        tag_visible_user_id,
        tag_visible_user_name,
        tag_visible_permission
      FROM v_simlet_tags
      AND tag_visible_user_id = :current_user_id
        AND deletedAt IS NULL
    `,
    params: {
      current_user_id: {
        type: "number",
        required: true,
        description: "User Identifier",
        example: 123,
      },
    },
  },
  groupIdsBySimletId: {
    description: "Get all groups of a SIMLET by its ID",
    sql: `
      SELECT group_id
      FROM ParticipantGroups
      WHERE simlet_id = :simlet_id
        AND deletedAt IS NULL
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
  directPermissionsBySimletId: {
    description: "Get all direct permissions of a SIMLET by its ID",
    sql: `
      SELECT *
      FROM v_simlet_direct_permissions_users
      WHERE simlet_id = :simlet_id AND (:user_id IS NULL OR user_id = :user_id)
    `,
    params: {
      simlet_id: {
        type: "number",
        required: true,
        description: "Simlet Identifier",
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
  byUserId: {
    description: "Get all SIMLETs for a certain User",
    sql: `
      SELECT *
      FROM v_complete_simlets_users_permissions
      WHERE current_user_id = :current_user_id
      AND (:search IS NULL OR simlet_name LIKE '%' || :search || '%' OR simlet_description LIKE '%' || :search || '%')
      AND (:simlet_archived IS NULL OR simlet_archived = :simlet_archived)
        AND deletedAt IS NULL
      ORDER BY {{orderBy}} {{order}}
    `,
    params: {
      current_user_id: {
        type: "number",
        required: true,
        description: "User Identifier",
        example: 123,
      },
      search: {
        type: "string",
        required: false,
        description: "Search string to filter simlets by name or description",
        example: "math",
      },
      simlet_archived: {
        type: "boolean",
        required: false,
        description: "Filter simlets by archived status",
        example: false,
      },
    },
  },
  byUserIdWithPagination: {
    description: "Get all SIMLETs for a certain User with pagination and search",
    sql: `
      SELECT *
      FROM v_complete_simlets_users_permissions
      WHERE current_user_id = :current_user_id
      AND (:search IS NULL OR simlet_name LIKE '%' || :search || '%' OR simlet_description LIKE '%' || :search || '%')
      AND (:simlet_archived IS NULL OR simlet_archived = :simlet_archived)
        AND deletedAt IS NULL
      ORDER BY {{orderBy}} {{order}}
      LIMIT :limit OFFSET :offset 
    `,
    params: {
      current_user_id: {
        type: "number",
        required: true,
        description: "User Identifier",
        example: 123,
      },
      search: {
        type: "string",
        required: false,
        description: "Search string to filter simlets by name or description",
        example: "math",
      },
      simlet_archived: {
        type: "boolean",
        required: false,
        description: "Filter simlets by archived status",
        example: false,
      },
      limit: {
        type: "number",
        required: true,
        description: "Maximum number of simlets to return",
        example: 10,
      },
      offset: {
        type: "number",
        required: true,
        description: "Number of simlets to skip for pagination",
        example: 20,
      },
    },
  },
  byUserIdAndTagIds: {
    description: "Get all SIMLETs for a certain User and Tag",
    sql: `
      SELECT *
      FROM v_complete_simlets_users_permissions_tags
      WHERE current_user_id = :current_user_id
      AND (:search IS NULL OR simlet_name LIKE '%' || :search || '%' OR simlet_description LIKE '%' || :search || '%')
      AND tag_id IN (:tag_ids)
      AND (:simlet_archived IS NULL OR simlet_archived = :simlet_archived)
        AND deletedAt IS NULL
      GROUP BY simlet_id
      ORDER BY {{orderBy}} {{order}}
    `,
    params: {
      current_user_id: {
        type: "number",
        required: true,
        description: "User Identifier",
        example: 123,
      },
      search: {
        type: "string",
        required: false,
        description: "Search string to filter simlets by name or description",
        example: "math",
      },
      tag_ids: {
        type: "array",
        of: "number",
        required: true,
        description: "List of tag IDs to filter simlets",
        example: [1, 2, 3],
      },
      simlet_archived: {
        type: "boolean",
        required: false,
        description: "Filter simlets by archived status",
        example: false,
      }
    },
  },
  byUserIdAndTagIdsWithPagination: {
    description: "Get all SIMLETs for a certain User and Tag with pagination and search",
    sql: `
      SELECT *
      FROM v_complete_simlets_users_permissions_tags
      WHERE current_user_id = :current_user_id
      AND (:search IS NULL OR simlet_name LIKE '%' || :search || '%' OR simlet_description LIKE '%' || :search || '%')
      AND tag_id IN (:tag_ids)
      AND (:simlet_archived IS NULL OR simlet_archived = :simlet_archived)
        AND deletedAt IS NULL
      GROUP BY simlet_id
      ORDER BY {{orderBy}} {{order}}
      LIMIT :limit OFFSET :offset 
    `,
    params: {
      current_user_id: {
        type: "number",
        required: true,
        description: "User Identifier",
        example: 123,
      },
      simlet_archived: {
        type: "boolean",
        required: false,
        description: "Filter simlets by archived status",
        example: false,
      },
      search: {
        type: "string",
        required: false,
        description: "Search string to filter simlets by name or description",
        example: "math",
      },
      limit: {
        type: "number",
        required: true,
        description: "Maximum number of simlets to return",
        example: 10,
      },
      offset: {
        type: "number",
        required: true,
        description: "Number of simlets to skip for pagination",
        example: 20,
      },
      tag_ids: {
        type: "array",
        of: "number",
        required: true,
        description: "List of tag IDs to filter simlets",
        example: [1, 2, 3],
      },
    },
  },
  ByAllocatedUserId: {
    description: "Get all SIMLETs for a certain Allocated User",
    sql: `
      SELECT *
      FROM v_complete_simlet_allocation_participants
      WHERE allocated_user_id = :current_user_id
      AND (:search IS NULL OR simlet_name LIKE '%' || :search || '%' OR simlet_description LIKE '%' || :search || '%')
        AND deletedAt IS NULL
      ORDER BY {{orderBy}} {{order}}
    `,
    params: {
      current_user_id: {
        type: "number",
        required: true,
        description: "User Identifier",
        example: 123,
      },
      search: {
        type: "string",
        required: false,
        description: "Search string to filter simlets by name or description",
        example: "math",
      },
    },
  },
  byAllocatedUserIdWithPagination: {
    description: "Get all SIMLETs for a certain Allocated User with pagination and search",
    sql: `
      SELECT *
      FROM v_complete_simlet_allocation_participants
      WHERE allocated_user_id = :current_user_id
      AND (:search IS NULL OR simlet_name LIKE '%' || :search || '%' OR simlet_description LIKE '%' || :search || '%')
        AND deletedAt IS NULL
      ORDER BY {{orderBy}} {{order}}
      LIMIT :limit OFFSET :offset 
    `,
    params: {
      current_user_id: {
        type: "number",
        required: true,
        description: "User Identifier",
        example: 123,
      },
      search: {
        type: "string",
        required: false,
        description: "Search string to filter simlets by name or description",
        example: "math",
      },
      limit: {
        type: "number",
        required: true,
        description: "Maximum number of simlets to return",
        example: 10,
      },
      offset: {
        type: "number",
        required: true,
        description: "Number of simlets to skip for pagination",
        example: 20,
      },
    },
  },
  ByAllocatedUserIdAndTagIds: {
    description: "Get all SIMLETs for a certain Allocated User and Tag",
    sql: `
      SELECT *
      FROM v_complete_simlet_allocation_participants_tags
      WHERE allocated_user_id = :current_user_id
      AND tag_id IN (:tag_ids)
      AND (:search IS NULL OR simlet_name LIKE '%' || :search || '%' OR simlet_description LIKE '%' || :search || '%')
        AND deletedAt IS NULL
      GROUP BY simlet_id
      ORDER BY {{orderBy}} {{order}}
    `,
    params: {
      current_user_id: {
        type: "number",
        required: true,
        description: "User Identifier",
        example: 123,
      },
      search: {
        type: "string",
        required: false,
        description: "Search string to filter simlets by name or description",
        example: "math",
      },
      tag_ids: {
        type: "array",
        of: "number",
        required: true,
        description: "List of tag IDs to filter simlets",
        example: [1, 2, 3],
      },
    },
  },
  byAllocatedUserIdAndTagIdsWithPagination: {
    description: "Get all SIMLETs for a certain Allocated User with pagination and search",
    sql: `
      SELECT *
      FROM v_complete_simlet_allocation_participants_tags
      WHERE allocated_user_id = :current_user_id
      AND tag_id IN (:tag_ids)
      AND (:search IS NULL OR simlet_name LIKE '%' || :search || '%' OR simlet_description LIKE '%' || :search || '%')
        AND deletedAt IS NULL
      GROUP BY simlet_id
      ORDER BY {{orderBy}} {{order}}
      LIMIT :limit OFFSET :offset 
    `,
    params: {
      current_user_id: {
        type: "number",
        required: true,
        description: "User Identifier",
        example: 123,
      },
      search: {
        type: "string",
        required: false,
        description: "Search string to filter simlets by name or description",
        example: "math",
      },
      limit: {
        type: "number",
        required: true,
        description: "Maximum number of simlets to return",
        example: 10,
      },
      offset: {
        type: "number",
        required: true,
        description: "Number of simlets to skip for pagination",
        example: 20,
      },
      tag_ids: {
        type: "array",
        of: "number",
        required: true,
        description: "List of tag IDs to filter simlets",
        example: [1, 2, 3],
      },
    },
  },
  byUserIdAndSimletId: {
    description: "Get current SIMLET for a certain User",
    sql: `
      SELECT *
      FROM v_complete_simlets_users_permissions
      WHERE current_user_id = :current_user_id AND simlet_id = :simlet_id
        AND deletedAt IS NULL
    `,
    params: {
      current_user_id: {
        type: "number",
        required: true,
        description: "User Identifier",
        example: 123,
      },
      simlet_id: {
        type: "number",
        required: true,
        description: "Simlet Identifier",
        example: 1,
      },
    },
  },
  countByUserId: {
    description: "Get count of SIMLETs for a certain User with search",
    sql: `
      SELECT COUNT(*) as count
      FROM v_complete_simlets_users_permissions
      WHERE current_user_id = :current_user_id
      AND (:simlet_archived IS NULL OR simlet_archived = :simlet_archived)
      AND (:search IS NULL OR simlet_name LIKE '%' || :search || '%' OR simlet_description LIKE '%' || :search || '%')
        AND deletedAt IS NULL
    `,
    params: {
      current_user_id: {
        type: "number",
        required: true,
        description: "User Identifier",
        example: 123,
      },
      search: {
        type: "string",
        required: false,
        description: "Search string to filter simlets by name or description",
        example: "math",
      },
      simlet_archived: {
        type: "boolean",
        required: false,
        description: "Filter simlets by archived status",
        example: false,
      },
    },
  },
  countByUserIdAndTagIds: {
    description: "Get count of SIMLETs for a certain User with search and tag filtering",
    sql: `
      SELECT COUNT(DISTINCT simlet_id) as count
      FROM v_complete_simlets_users_permissions_tags
      WHERE current_user_id = :current_user_id
      AND tag_id IN (:tag_ids)
      AND (:simlet_archived IS NULL OR simlet_archived = :simlet_archived)
      AND (:search IS NULL OR simlet_name LIKE '%' || :search || '%' OR simlet_description LIKE '%' || :search || '%')
        AND deletedAt IS NULL
    `,
    params: {
      current_user_id: {
        type: "number",
        required: true,
        description: "User Identifier",
        example: 123,
      },
      search: {
        type: "string",
        required: false,
        description: "Search string to filter simlets by name or description",
        example: "math",
      },
      simlet_archived: {
        type: "boolean",
        required: false,
        description: "Filter simlets by archived status",
        example: false,
      },
      tag_ids: {
        type: "array",
        of: "number",
        required: true,
        description: "List of tag IDs to filter simlets",
        example: [1, 2, 3],
      },
    },
  },
  allocationCount: {
    description: "Get count of SIMLETs with allocated participants for a certain User with search",
    sql: `
      SELECT COUNT(DISTINCT simlet_id) as count
      FROM SIMLETs
      WHERE  (:search IS NULL OR simlet_name LIKE '%' || :search || '%' OR simlet_description LIKE '%' || :search || '%')
        AND deletedAt IS NULL
    `,
    params: {
      search: {
        type: "string",
        required: false,
        description: "Search string to filter simlets by name or description",
        example: "math",
      },
    },
  },
  countByAllocatedUserId: {
    description: "Get count of SIMLETs for a certain Allocated User with search",
    sql: `
      SELECT COUNT(*) as count
      FROM v_complete_simlet_allocation_participants
      WHERE allocated_user_id = :current_user_id
      AND (:search IS NULL OR simlet_name LIKE '%' || :search || '%' OR simlet_description LIKE '%' || :search || '%')
        AND deletedAt IS NULL
    `,
    params: {
      current_user_id: {
        type: "number",
        required: true,
        description: "User Identifier",
        example: 123,
      },
      search: {
        type: "string",
        required: false,
        description: "Search string to filter simlets by name or description",
        example: "math",
      },
    },
  },
  countByAllocatedUserIdAndTagIds: {
    description: "Get count of SIMLETs for a certain Allocated User with search and tag filtering",
    sql: `
      SELECT COUNT(DISTINCT simlet_id) as count
      FROM v_complete_simlet_allocation_participants_tags
      WHERE allocated_user_id = :current_user_id
      AND tag_id IN (:tag_ids)
      AND (:search IS NULL OR simlet_name LIKE '%' || :search || '%' OR simlet_description LIKE '%' || :search || '%')
        AND deletedAt IS NULL
    `,
    params: {
      current_user_id: {
        type: "number",
        required: true,
        description: "User Identifier",
        example: 123,
      },
      search: {
        type: "string",
        required: false,
        description: "Search string to filter simlets by name or description",
        example: "math",
      },
      tag_ids: {
        type: "array",
        of: "number",
        required: true,
        description: "List of tag IDs to filter simlets",
        example: [1, 2, 3],
      },
    },
  },
};

export default queries;
