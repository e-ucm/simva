import { Allocator } from "@/lib/classes/allocators/Allocator";
import { SessionAllocator } from "@/lib/classes/allocators/SessionAllocator";
import { RandomAllocator } from "@/lib/classes/allocators/RandomAllocator";
import { GroupAllocator } from "@/lib/classes/allocators/GroupAllocator";
import { logger } from "@/lib/logger";

class AllocatorType {
	type: string | undefined;
	name: string | undefined;
	description: string | undefined;
	utils: any;
}

export async function getAllocatorTypes() {
	let types = [ Allocator, GroupAllocator]; //, SessionAllocator, RandomAllocator ];
	let allocatortypes : AllocatorType[] = [];
	for (let i = 0; i < types.length; i++) {
		let allocatortype : AllocatorType = {
			type : types[i].getType(),
			name : types[i].getName(),
			description : types[i].getDescription(),
			utils : await types[i].getUtils("")	
		};
		logger.info(`Loaded allocator type: ${allocatortype.type}`);
		allocatortypes.push(allocatortype);
	}
	//logger.info({allocatortypes});
	return allocatortypes;
}
