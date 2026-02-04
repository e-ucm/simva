export class Activity {
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