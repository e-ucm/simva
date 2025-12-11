const validator = require('./utils/validator');
var testschema = validator.getSchema('#/components/schemas/test');
var mongoose = require("mongoose");
var ObjectId = mongoose.Types.ObjectId;
const logger = require('./logger');
const sendSimvaTaskToKafka = require('./utils/SimvaTaskToKafka');

class Test {
    constructor(params) {
        this.activities =[];
		this.owners = [];
		if(ObjectId.isValid(params)){
			this._id = params;
		}else if(typeof params == 'object'){
			this.params = params;
		}
    }

	toObject(){
		var params = {};
		for(var p in testschema.properties){
			params[p] = this[p];
		}
		params['_id'] = this._id;

		return params;
	}

	set params(params){
		for(var p in testschema.properties){
			if(params[p]){
				this[p] = params[p];
			}
		}

		if(params['_id']){
			this._id = params['_id'];
		}
	}

	set id(id){
		if(!ObjectId.isValid(id)){
			throw {message: 'not a valid objectId'};
		}else{
			this._id = id;
		}
	}
	async getTestAndActivities(objectUser) {
		this.activities.forEach(async element => {
			var activityTask={
				task: 'toObject',
				params: '',
				object: 'Activity',
				objectEvent: 'true',
				objectLoad: 'true',
				objectUser: objectUser,
				objectId: element
			};
			logger.debug(JSON.stringify(activityTask));
			await sendSimvaTaskToKafka([activityTask]);
		});
		return this.toObject();
	}

	get id(){
		return this._id;
	}
    
    async save(){
        var params = {};

        for(var p in testschema.properties){
            params[p] = this[p];
        }

        if(this.id){
            params['_id'] = this.id;
        }

        if(params._id){
            var result = await mongoose.model('test').updateOne({ _id: this.id }, params);
            if(result.ok !== result.n){
                throw { message: 'Error saving the test' };
            }
        }else{
            var test = new mongoose.model('test')(params);
            await test.save();
            this.id = test._id;
        }

        return true;
    }

    async remove(){
        await mongoose.model('test').deleteOne({_id: this.id});
        return true;
    }
};

// ##########################################
// Module exports
// ##########################################

module.exports = Test;