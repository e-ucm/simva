import { db } from "@/lib/db";
import { NotFoundError, ValidationError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";
import { Group } from "../group/Group";
import { GroupParticipant } from "../group/GroupParticipant";
import { Allocation } from "../allocators/Allocation";

/**
 * Simlet Group mapper class representing a group assignment within a study (simlet).
 * Maps groups to studies with participant information and permissions.
 * 
 * @class SimletGroup
 * @description Manages the relationship between groups and studies,
 * including participant lists and permission management.
 */
export class SimletGroup {
    /**
     * ID of the simlet (study) this group is assigned to
     */
    simlet_id: number;
    
    /**
     * ID of the group
     */
    group_id: number;
    
    /**
     * Name of the group for display purposes
     */
    group_name: string;

    group_use_new_generation: boolean;

    group_allocator_type: string;
    /**
     * Array of participant identifiers in this group
     */
    participants: string[];

    createdAt?: Date;

    updatedAt?: Date;

    allocation: Allocation[] = [];

    group_owner_user_id : number;
    group_owner_username: string;

    /**
     * Creates a new SimletGroup instance
     * 
     * @param {any} data - Raw data object containing group and study relationship properties
     * @description Initializes group-study relationship and parses participant arrays from string format.
     * Uses database utility functions to properly convert string arrays to typed arrays.
     */
    constructor(data: any) {
        this.simlet_id = data.simlet_id;
        this.group_id = data.group_id;
        this.group_name = data.group_name;
        this.participants = [];
        this.group_owner_user_id = data.group_owner_user_id || "";
        this.group_owner_username = data.group_owner_username || "";
        this.createdAt = data.createdAt ? new Date(data.createdAt) : undefined;
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : undefined;
        this.group_use_new_generation = Boolean(data.group_use_new_generation);
        this.group_allocator_type = data.group_allocator_type;
    }

    async init() {
        //Additional initialization logic can be added here if needed in the future
        const participantIds = await db.Functions.runViewQuery(db.Views.GroupParticipant.IdsByGroupId, { group_id: this.group_id })
        this.participants = participantIds.map((row: any) => row.participant_id) || [];
        this.allocation = await Allocation.getFromDbData(this.simlet_id, this.group_id, this.group_allocator_type);
        logger.debug({ allocationCount: this.allocation.length, allocation: this.allocation }, 'Group initialized with allocations');
    }

    static async createSimletGroup(simlet_id: number, group_id: number) : Promise<SimletGroup> {
        await db.Tables.SimletGroups.create({ simlet_id, group_id });
        return await SimletGroup.getFromDbData(simlet_id, group_id);
    }

    static async getAllFromDbData(simlet_id: number): Promise<SimletGroup[]> {
        const groups = await db.Functions.runViewQuery(
            db.Views.Group.bySimletId,
            { simlet_id }
        );
        logger.debug({groups} , "Groups data from view");
        return Promise.all(groups.map(async (group: any) => {
            const simletGroup = new SimletGroup(group);
            await simletGroup.init();
            return simletGroup;
        }));
    }

    static async getFromDbData(simlet_id: number, group_id: number) : Promise<SimletGroup> {
        let simletGroupData = await db.Tables.SimletGroups.findOne({ where: { simlet_id, group_id } });
        if (!simletGroupData) {
            throw new NotFoundError(`SimletGroup with simlet_id ${simlet_id} and group_id ${group_id} not found`);
        }
        const simletGroup = new SimletGroup(simletGroupData);
        await simletGroup.init();
        return simletGroup;
    }
    
    async delete(): Promise<void> {
        let simletGroup = await db.Tables.SimletGroups.findOne({ where: { simlet_id: this.simlet_id, group_id: this.group_id } });
        if (!simletGroup) {
            throw new NotFoundError(`SimletGroup with simlet_id ${this.simlet_id} and group_id ${this.group_id} not found`);
        }
        await simletGroup.destroy();
    }

    printInfo(): void {
        logger.debug({ SimletGroup : this }, `SimletGroup information - Simlet ID: ${this.simlet_id}, Group ID: ${this.group_id}, Group Name: ${this.group_name}`);
    }

    async export(withData: boolean): Promise<object> {
        throw new Error("Export functionality not implemented for SimletGroup yet");
    }

    toJSON(): object {
        return {
            simlet_id: this.simlet_id,
            group_id: this.group_id,
            group_name: this.group_name,
            group_allocator_type: this.group_allocator_type,
            group_use_new_generation:this.group_use_new_generation,
            participants: this.participants,
            group_owner_user_id: this.group_owner_user_id,
            group_owner_username: this.group_owner_username,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt, 
            allocations: this.allocation.reduce((acc, curr) => {
                const json = curr.toJSON() as any;
                acc[json.object_id] = json.session_id;
                return acc;
            }, {} as Record<number, number>)
        };
    }
}