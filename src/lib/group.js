const validator = require('./utils/validator');
var groupschema = validator.getSchema('#/components/schemas/group');
var mongoose = require("mongoose");
var ObjectId = mongoose.Types.ObjectId;
const logger = require('./logger');
const UsersController= require('./userscontroller');
const sendSimvaTaskToKafka = require('./utils/SimvaTaskToKafka');

class Group {
    constructor(params) {
        this.participants =[];
		this.owners = [];
		if(ObjectId.isValid(params)){
			this._id = params;
		}else if(typeof params == 'object'){
			this.params = params;
		}
    }

	toObject(){
		var params = {};
		for(var p in groupschema.properties){
			params[p] = this[p];
		}
		params['_id'] = this._id;

		return params;
	}

	async getCompleteGroup(objectUser) {
		try {
			const participantTask={
				task: 'getParticipants',
				params: '',
				object: 'Group',
				objectLoad: 'true',
				objectEvent: 'true',
				objectUser:objectUser,
				objectId: this._id
			};
			await sendSimvaTaskToKafka([participantTask]);
		} catch(e) {
			logger.warn(e);
		}
		return this.toObject();
	}

	set params(params){
		for(var p in groupschema.properties){
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

	async getParticipants() {
		var participants = this.participants.filter((p,i) => this.participants.indexOf(p) === i);
		return await UsersController.getUsers({"username" : {"$in" : participants}});
	}

	get id(){
		return this._id;
	}
    
    async save(){
        var params = {};

        for(var p in groupschema.properties){
            params[p] = this[p];
        }

        if(this.id){
            params['_id'] = this.id;
        }

        if(params._id){
            var result = await mongoose.model('group').updateOne({ _id: this.id }, params);
            if(result.ok !== result.n){
                throw { message: 'Error saving the group' };
            }
        }else{
            var group = new mongoose.model('group')(params);
            await group.save();
            this.id = group._id;
        }

        return true;
    }

    async remove(){
        await mongoose.model('group').deleteOne({_id: this.id});
        return true;
    }
};

// ##########################################
// Module exports
// ##########################################

module.exports = Group;