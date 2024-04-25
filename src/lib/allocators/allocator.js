const ServerError = require('../error');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;

const validator = require('../utils/validator');

var allocatorschema = validator.getSchema('#/components/schemas/allocator');
var StudiesController = require('../studiescontroller');

class Allocator {

	// ##########################################
	// Constructor and basic set of functions
	// ##########################################

	constructor(params){
		this.extra_data = {};
		this.type = Allocator.getType();

		if(ObjectId.isValid(params)){
			this._id = params;
		}else if(typeof params == 'object'){
			this.params = params;
		}
	}

	toObject(){
		var params = {};
		for(var p in allocatorschema.properties){
			params[p] = this[p];
		}
		params['_id'] = this._id;

		return params;
	}

	static getType(){
		return 'default';
	}

	static getName(){
		return 'Basic Allocator'
	}

	static getDescription(){
		return 'This allocator allows you to manually assign the participants to the tests one by one. (If not assigned, it will get the first one)';
	}

	getAllocator = async (id) => {
		var res = await mongoose.model('allocator').find({_id: id});
	
		if(res.length > 0) {
			return res[0];
		}else{
			return null;
		}
	};
	

	set params(params){
		for(var p in allocatorschema.properties){
			if(params[p]){
				this[p] = params[p]
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

	get id(){
		return this._id;
	}

	async load(){
		var res = await mongoose.model('allocator').find({_id: this.id});

		if(res.length > 0) {
			for(var k in res[0]){
				this[k] = res[0][k];
			}
		}
	}

	async save(){
		var params = {};

		for(var p in allocatorschema.properties){
			params[p] = this[p];
		}

		if(this.id){
			params['_id'] = this.id;
		}

		if(params._id){
			var result = await mongoose.model('allocator').updateOne({ _id: this.id }, params);
			if(result.ok !== result.n){
				throw { message: 'Error saving the allocator' };
			}
		}else{
			var allocator = new mongoose.model('allocator')(params);
			await allocator.save();
			this.id = allocator._id;
		}

		return true;
	}

	// ##########################################
	// Allocator-related functions
	// ##########################################
	
	async getStudy(){
		if(this.id !== null){
			let docs = await mongoose.model('study').find({allocator: this.id});
			if(docs.length === 1){
				return docs[0];
			}else{
				return null;
			}
		}else{
			return null;
		}
	}

	async getAllocation(participant){
		if(!this.extra_data){
			this.extra_data = {};
		}

		if(!this.extra_data.allocations){
			this.extra_data.allocations = {};
		}

		if(!this.extra_data.allocations[participant]){
			if(!this.study){
				this.study = await this.getStudy();
			}
			
			if(this.study && this.study.tests){
				this.extra_data.allocations[participant] = this.study.tests[0];
			}else{
				return false;
			}
		}

		return this.extra_data.allocations[participant];
	}

	allocate(participant, test){
		if(!this.extra_data){
			this.extra_data = {};
		}

		if(!this.extra_data.allocations){
			this.extra_data.allocations = {};
		}

		if(!this.extra_data.allocations[participant]){
			this.extra_data.allocations[participant] = test;
		}

		return this.extra_data.allocations[participant];
	}

	async getAllocatedForTest(test) {
		var allocation = []
		if(this.extra_data && this.extra_data.allocations) {
			console.log(this.extra_data.allocations)
			let participant,value
			for([participant, value] of Object.entries(this.extra_data.allocations)) {
				if(value == test) {
					allocation.push(participant);
				}
			}
		}
		return allocation;
	}
};

// ##########################################
// Module exports
// ##########################################

module.exports = Allocator;