import { NotFoundError, ValidationError } from "@/lib/errors/appErrors";
import { RandomPercentages } from "./RandomPercentages";
import { SimletGroup } from "./SimletGroup";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * Random Allocator mapper class extending base SimletGroup.
 * Implements random assignment of participants to sessions/conditions.
 * 
 * @class RandomAllocatorSimletGroup
 * @extends SimletGroup
 * @description Handles random allocation strategies for distributing participants
 * across different experimental conditions or sessions in a study.
 * 
 * @module lib/mappers/simletGroup/RandomAllocatorSimletGroup
 * @requires @/lib/errors/appErrors
 * @requires @/lib/mappers/simletGroup/RandomPercentages
 * @requires @/lib/mappers/simletGroup/SimletGroup
 * @requires @/lib/db
 * @requires @/lib/logger
 */
export class RandomAllocatorSimletGroup extends SimletGroup {
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
     * @returns {Promise<object>} Object containing random allocation utility functions
     * @description Returns functions for performing random allocation operations.
     */
    static async getUtils(){
        return super.getUtils();
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

    async init() : Promise<void> {
        super.init();
        this.percentages = await RandomPercentages.getFromDbData(this.group_id);
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

    async allocateRandomly(sessionsId: number[]) {
        const sessionPercentageMap = this.percentages.reduce((acc, current) => {
            acc.set(current.session_id, (acc.get(current.session_id) ?? 0) + current.percentage);
            return acc;
        }, new Map<number, number>());

        const sessionPercentages = sessionsId.map((sessionId) => {
            const percentage = sessionPercentageMap.get(sessionId);
            return percentage ?? 0;
        });

        const hasConfiguredPercentages = sessionPercentages.some((value) => value > 0);
        const effectivePercentages = hasConfiguredPercentages
            ? sessionPercentages
            : sessionsId.map(() => 1);

        const users = this.participants.map((participant_id: number) => ({
            user_id: participant_id,
            group_id: this.group_id,
        }));
        const usersBySession: Array<Array<{ user_id: number; group_id: number }>> = this.splitByPercentages(users, effectivePercentages);
        await Promise.all(
            usersBySession.flatMap((usersInSession, index) => {
                const targetSessionId = sessionsId[index];
                return usersInSession.map(async (user) => {
                    await super.allocateToSession(targetSessionId, user.user_id);
                });
            })
        );
    }

    async allocate(sessionId: number) {
        await this.allocateRandomly([sessionId]);
    }
}