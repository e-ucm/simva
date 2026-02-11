import { Activity } from "@/lib/mappers/activities/Activity";
import { GamePlayActivity } from "@/lib/mappers/activities/GameplayActivity";
import { LimesurveyActivity } from "@/lib/mappers/activities/LimesurveyActivity";
import { ManualActivity } from "@/lib/mappers/activities/ManualActivity";

class ActivityType {
	type: string | undefined;
	name: string | undefined;
	description: string | undefined;
	utils: any;
}

let activitytypes : ActivityType[] = [];

export async function getActivityTypes(user : string) {
	let types = [ GamePlayActivity, LimesurveyActivity, ManualActivity ];
	let activitytypes : ActivityType[] = [];

	for (let i = 0; i < types.length; i++) {
		let activitytype : ActivityType = {
			type : types[i].getType(),
			name : types[i].getName(),
			description : types[i].getDescription(),
			utils : await types[i].getUtils(user)	
		};
		activitytypes.push(activitytype);
	}
	return activitytypes;
}
