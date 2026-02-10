import { Activity } from "@/lib/classes/activities/Activity";
import { GamePlayActivity } from "@/lib/classes/activities/GameplayActivity";
import { LimesurveyActivity } from "@/lib/classes/activities/LimesurveyActivity";
import { ManualActivity } from "@/lib/classes/activities/ManualActivity";

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
