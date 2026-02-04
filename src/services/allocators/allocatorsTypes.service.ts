import { Allocator } from "@/services/allocators/libs/Allocator";
import { SessionAllocator } from "@/services/allocators/libs/SessionAllocator";
import { RandomAllocator } from "@/services/allocators/libs/RandomAllocator";
import { GroupAllocator } from "@/services/allocators/libs/GroupAllocator";
import { logger } from "@/lib/logger";

class AllocatorType {
	type: string | undefined;
	name: string | undefined;
	description: string | undefined;
	utils: any;
}

export async function getAllocatorTypes(user : string) {
	let types = [ Allocator, GroupAllocator]; //, SessionAllocator, RandomAllocator ];
	let allocatortypes : AllocatorType[] = [];
	for (let i = 0; i < types.length; i++) {
		let allocatortype : AllocatorType = {
			type : types[i].getType(),
			name : types[i].getName(),
			description : types[i].getDescription(),
			utils : await types[i].getUtils(user)	
		};
		logger.info(`Loaded allocator type: ${allocatortype.type}`);
		allocatortypes.push(allocatortype);
	}
	logger.info({allocatortypes});
	return allocatortypes;
}
