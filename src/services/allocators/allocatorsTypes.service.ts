import { Allocator } from "@/lib/mappers/allocators/Allocator";
import { SessionAllocator } from "@/lib/mappers/allocators/SessionAllocator";
import { RandomAllocator } from "@/lib/mappers/allocators/RandomAllocator";
import { GroupAllocator } from "@/lib/mappers/allocators/GroupAllocator";
import { logger } from "@/lib/logger";

class AllocatorType {
	type: string | undefined;
	name: string | undefined;
	description: string | undefined;
	utils: any;
}

export async function getAllocatorTypes() {
	let types = [ Allocator, GroupAllocator, SessionAllocator, RandomAllocator ];
	let allocatortypes : AllocatorType[] = [];
	for (let i = 0; i < types.length; i++) {
		let allocatortype : AllocatorType = {
			type : types[i].getType(),
			name : types[i].getName(),
			description : types[i].getDescription(),
			utils : await types[i].getUtils("")	
		};
		logger.debug(`Loaded allocator type: ${allocatortype.type}`);
		allocatortypes.push(allocatortype);
	}
	logger.debug({allocatortypes});
	return allocatortypes;
}
