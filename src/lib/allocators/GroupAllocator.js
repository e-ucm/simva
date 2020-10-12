const ServerError = require('../error');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;

var Allocator = require('./allocator');

const validator = require('../utils/validator');

var allocatorschema = validator.getSchema('#/components/schemas/allocator');
var StudiesController = require('../studiescontroller');
var GroupsController = require('../groupscontroller');

class GroupAllocator extends Allocator {

	// ##########################################
	// Constructor and basic set of functions
	// ##########################################

	constructor(params){
		super(params);
		this.type = GroupAllocator.getType();
	}

	toObject(){
		return super.toObject(params);
	}

	static getType(){
		return 'group';
	}

	static getName(){
		return 'Group Allocator'
	}

	static getDescription(){
		return 'This allocator allows you to select to which test branch is each group assigned.';
	}

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
		await super.load();
	}

	async save(){
		return super.save();
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
		let allocation = false;
		if(!this.extra_data){
			this.extra_data = {};
		}

		if(!this.extra_data.allocations){
			this.extra_data.allocations = {};
		}

		if(!this.study){
			this.study = await this.getStudy();

			if(this.study && this.study.tests){
				if(this.study.groups && this.study.groups.length > 0){
					let groups = await GroupsController.getGroups({ _id: { "$in" : this.study.groups }, participants: participant})

					if(groups.length > 0){
						let group = groups[0]._id;

						if(!this.extra_data.allocations[group]){
							this.extra_data.allocations[group] = this.study.tests[0];
						}

						allocation = this.extra_data.allocations[group];
					}
				}
			}
		}

		return allocation;
	}

	allocate(group, test){
		if(!this.extra_data){
			this.extra_data = {};
		}

		if(!this.extra_data.allocations){
			this.extra_data.allocations = {};
		}

		if(!this.extra_data.allocation[group]){
			this.extra_data.allocation[group] = tests;
		}

		return this.extra_data.allocation[group];
	}
};

// ##########################################
// Module exports
// ##########################################

module.exports = GroupAllocator;