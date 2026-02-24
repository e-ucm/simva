import { Allocator } from "@/lib/mappers/allocators/Allocator";
import { RandomPercentages } from "@/lib/mappers/allocators/RandomPercentages";
import { NotFoundError, ValidationError } from "@/lib/errors/appErrors";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * Random Allocator mapper class extending base Allocator.
 * Implements random assignment of participants to sessions/conditions.
 * 
 * @class RandomAllocator
 * @extends Allocator
 * @description Handles random allocation strategies for distributing participants
 * across different experimental conditions or sessions in a study.
 */
export class RandomAllocator extends Allocator {
    percentages: RandomPercentages[] = [];

    /**
     * Gets the allocator type identifier
     * 
     * @static
     * @returns {string} The random allocator type string
     * @description Returns the specific type identifier for random allocators.
     */
    static getType(){
        return 'random';
    }

    /**
     * Gets the human-readable name for this allocator type
     * 
     * @static
     * @returns {string} The random allocator type name
     * @description Returns a user-friendly name for random allocation strategy.
     */
    static getName(){
        return 'Random Allocator';
    }

    /**
     * Gets a description of this allocator type
     * 
     * @static
     * @returns {string} The random allocator description
     * @description Explains how random allocation works.
     */
    static getDescription(){
        return 'An allocator that randomly assigns users to sessions.';
    }

    /**
     * Gets utility functions specific to random allocation for a given user
     * 
     * @static
     * @async
     * @param {string} username - The username to get utilities for
     * @returns {Promise<object>} Object containing random allocation utility functions
     * @description Returns functions for performing random allocation operations.
     */
    static async getUtils(username : string){
        return {};
    }

    /**
     * Gets detailed information about this random allocator instance
     * 
     * @async
     * @returns {Promise<object>} Object containing allocator details
     * @description Returns allocation-specific details and statistics.
     */
    async getDetails(){
        return {};
    }
    
    /**
     * Creates a new RandomAllocator instance
     * 
     * @param {any} data - Raw data object containing allocator properties
     * @description Initializes random allocator with parent class constructor.
     */
    constructor(data: any) {
        super(data);
        // Additional initialization for RandomAllocator if needed
    }

    async init() : Promise<void> {
        super.init();
        this.percentages = await RandomPercentages.getAllFromDbData(this.allocator_id);
        // Additional initialization logic for RandomAllocator can be added here if needed in the future
    }

    private shuffle<T>(items: T[]): T[] {
        const shuffled = [...items];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    private splitByPercentages<T>(items: T[], percentages: number[]): T[][] {
        if (percentages.length === 0) {
            return [];
        }

        const total = percentages.reduce((sum, value) => sum + value, 0);
        if (total <= 0) {
            throw new ValidationError("Percentages must sum to a positive value");
        } else if (total !== 100) {
            logger.warn("Percentages do not sum to 100. Normalizing values.");
        }

        const normalized = percentages.map((value) => value / total);
        const shuffled = this.shuffle(items);
        const rawSizes = normalized.map((ratio) => ratio * shuffled.length);
        const baseSizes = rawSizes.map((size) => Math.floor(size));
        let assigned = baseSizes.reduce((sum, value) => sum + value, 0);

        const remainders = rawSizes
            .map((size, index) => ({ index, remainder: size - Math.floor(size) }))
            .sort((a, b) => b.remainder - a.remainder);

        let remainderIndex = 0;
        while (assigned < shuffled.length) {
            baseSizes[remainders[remainderIndex].index] += 1;
            assigned += 1;
            remainderIndex = (remainderIndex + 1) % remainders.length;
        }

        const buckets: T[][] = [];
        let cursor = 0;
        for (const size of baseSizes) {
            buckets.push(shuffled.slice(cursor, cursor + size));
            cursor += size;
        }

        return buckets;
    }

    async allocateRandomly(sessionsId: number[], groups_id: number[]) {
        if (!Array.isArray(sessionsId) || sessionsId.length === 0) {
            throw new ValidationError("sessionsId must be a non-empty array");
        }

        if (!Array.isArray(groups_id) || groups_id.length === 0) {
            throw new ValidationError("groups_id must be a non-empty array");
        }

        if (this.allocator_type !== RandomAllocator.getType()) {
            throw new ValidationError("Not valid");
        }

        const foundGroups = await db.Functions.runViewQuery(
            db.Views.AllocatedParticipants.byAllocatorId,
            { allocator_id: this.allocator_id, groups_id }
        );

        if (!foundGroups || foundGroups.length === 0) {
            throw new NotFoundError("Groups not found");
        }

        const sessionPercentages = sessionsId.map((sessionId) => {
            const percentage = this.percentages.find((p) => p.session_id === sessionId)?.percentage;
            return percentage ?? 0;
        });

        const hasConfiguredPercentages = sessionPercentages.some((value) => value > 0);
        const effectivePercentages = hasConfiguredPercentages
            ? sessionPercentages
            : sessionsId.map(() => 1);

        const users = foundGroups.map((row: { user_id: number; group_id: number }) => ({
            user_id: row.user_id,
            group_id: row.group_id,
        }));

        const usersBySession = this.splitByPercentages(users, effectivePercentages);

        await Promise.all(
            usersBySession.flatMap((usersInSession, index) => {
                const targetSessionId = sessionsId[index];

                return usersInSession.map(async (user) => {
                    const participant = await db.Tables.ExperimentalParticipants.findOne({
                        where: {
                            allocator_id: this.allocator_id,
                            participant_id: user.user_id,
                        },
                    });

                    if (participant) {
                        await participant.update({
                            session_id: targetSessionId,
                            group_id: user.group_id,
                        });
                        return;
                    }

                    await db.Tables.ExperimentalParticipants.create({
                        allocator_id: this.allocator_id,
                        participant_id: user.user_id,
                        group_id: user.group_id,
                        session_id: targetSessionId,
                    });
                });
            })
        );
    }

    async allocate(sessionId: number, groups_id: number | number[]) {
        const groups = Array.isArray(groups_id) ? groups_id : [groups_id];
        await this.allocateRandomly([sessionId], groups);
    }

    toJSON(): object {
        return {
            ...super.toJSON(),
            allocator_type: RandomAllocator.getType(),
            percentages: this.percentages.map(p => p.toJSON())
        }
    }
}