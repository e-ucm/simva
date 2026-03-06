import { db } from "@/lib/db";

export class RandomPercentages {
    group_id: number;
    session_id: number;
    percentage: number;
    createdAt?: Date;
    updatedAt?: Date;
 
    constructor(data: any) {
        this.group_id = data.group_id;
        this.session_id = data.session_id;
        this.percentage = Number(data.allocator_percentage ?? data.percentage ?? 0);
        this.createdAt = data.createdAt ? new Date(data.createdAt) : undefined;
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : undefined;
    }

    static async getFromDbData(group_id: number) : Promise<RandomPercentages[]> {
        let percentages = await db.Tables.RandomAllocators.findAll({ where: { group_id } });
        return percentages.map((p: any) => new RandomPercentages(p));
    }

    toJSON(): object {
        return {
            session_id: this.session_id,
            percentage: this.percentage,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        }
    }
}