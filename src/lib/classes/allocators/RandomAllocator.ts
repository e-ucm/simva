import { Allocator } from "@/lib/classes/allocators/Allocator";

export class RandomAllocator extends Allocator {
    static getType(){
        return 'random';
    }

    static getName(){
        return 'Random Allocator';
    }

    static getDescription(){
        return 'An allocator that randomly assigns users to sessions.';
    }

    static async getUtils(username : string){
        return {
            allocateRandomly: async (sessions: any[]) => {
                // Logic to randomly allocate user to sessions
            }
        };
    }

    async getDetails(){
        return {
            allocatedSessions: [] // Fetch allocated sessions related to this allocator
        };
    }
    
    constructor(data: any) {
        super(data);
        // Additional initialization for GroupAllocator if needed
    }
}