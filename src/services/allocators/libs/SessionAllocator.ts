import { Allocator } from "@/services/allocators/libs/Allocator";

export class SessionAllocator extends Allocator {
    static getType(){
        return 'session';
    }
    
    static getName(){
        return 'Session Allocator';
    }
    
    static getDescription(){
        return 'An allocator that assigns the users to all sessions and check if the date dont overlap.';
    }

    static async getUtils(username : string){
        return {
            allocateToSessions: async (sessions: any[]) => {
                // Logic to allocate user to sessions ensuring no date overlaps
            },
            checkSessionOverlap: async (session1: any, session2: any) => {
                // Logic to check if two sessions overlap
            }
        };
    }

    async getDetails(){
        return {
            allocatedSessions: [] // Fetch allocated sessions related to this allocator
        };
    }
}