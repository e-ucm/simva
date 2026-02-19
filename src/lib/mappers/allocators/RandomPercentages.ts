import { db } from "@/lib/db";

export class RandomPercentages {
    allocator_id: number;
    session_id: number;
    percentage: RandomPercentages[];
 
    constructor(data: any) {
        this.allocator_id = data.allocator_id;
        this.session_id = data.session_id;
        this.percentage = data.percentage;
    }

    static async getAllFromDbData(allocator_id: number) : Promise<RandomPercentages[]> {
        let percentages = await db.Tables.RandomAllocators.findAll({where : {allocator_id}});
        return percentages.map(p => new RandomPercentages(p));
    }

    toJSON(): object {
        return {
            session_id: this.session_id,
            percentage: this.percentage.map(p => p.toJSON())
        }
    }
}