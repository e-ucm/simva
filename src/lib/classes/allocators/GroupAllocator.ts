import { Allocator } from "@/lib/classes/allocators/Allocator";

export class GroupAllocator extends Allocator {
    static getType(){
        return 'group';
    }
    
    static getName(){
        return 'Group Allocator';
    }
    
    static getDescription(){
        return 'An allocator that assigns groups to sessions based on predefined criteria.';
    }

    static async getUtils(username : string){
        return {
            allocateToGroup: async (groupId: string) => {
                // Logic to allocate group to a specific session
            }
        };
    }

    async getDetails(){
        return {
            allocatedGroups: [] // Fetch allocated groups related to this allocator
        };
    }

    constructor(data: any) {
        super(data);
        // Additional initialization for GroupAllocator if needed
    }
}   