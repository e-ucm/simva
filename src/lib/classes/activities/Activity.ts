import { db } from "@/lib/db";

export class Activity {
 	session_id: number;
	activity_id: number;
	activity_type: string;
	createdAt: Date;
	updatedAt: Date;
	presignedURL?: string;
	generated_at?: Date;
	expires_on_seconds?: number;
	trace_storage:boolean;
	description?: string;
	indirect_supervisors_read?: string[];
	indirect_supervisors_write?: string[];
	indirect_coordinators_read?: string[];
	indirect_coordinators_write?: string[];
	[key: string]: any;
	static stringKeys = ['indirect_supervisors_read', 'indirect_supervisors_write', 'indirect_coordinators_read', 'indirect_coordinators_write'];

	constructor(data: any) {
		this.session_id = data.session_id;
		this.activity_id = data.activity_id;
		this.activity_type = data.activity_type;
		this.createdAt = data.createdAt;
		this.updatedAt = data.updatedAt;
		this.presignedURL = data.presignedURL;
		this.generated_at = data.generated_at;
		this.expires_on_seconds = data.expires_on_seconds;
		this.trace_storage = data.trace_storage || false; // Default to false if not provided
		this.description = data.description || ""; // Default to empty string if not provided
		let result = db.Functions.parseStringArraysToTypedArrays(data, Activity.stringKeys, 'string');
		Object.assign(this, result);
	}
	
	static getType(){
		return 'activity';
    }

	static getName(){
		return 'Default Activity';
	}

	static getDescription(){
		return 'A basic activity with completion state and a place to save results.';
	}

	static async getUtils(username : string){
		return {};
	}

	async getDetails(){
		return {};
	}
}