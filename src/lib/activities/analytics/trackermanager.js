let TrackerAsset = require('xapi-tracker');
let config = require('../../config');

let ONE_HOUR = 60 * 60 * 1000;

class TrackerManager {

	set Protocol(_protocol){
		this.protocol = _protocol;
	}

	get Protocol(){
		if(this.protocol){
			return this.protocol;
		}else{
			return config.a2.protocol;
		}
	}
	
	set Host(_host){
		this.host = _host;
	}

	get Host(){
		if(this.host){
			return this.host;
		}else{
			return config.a2.host;
		}
	}

	set Port(_port){
		this.port = _port;
	}

	get Port(){
		if(this.port){
			return this.port;
		}else{
			return config.a2.port;
		}
	}

	get URL(){
		return this.Protocol + '://' + this.Host + ':' + this.Port + '/';
	}

	constructor(){
		setInterval(this.FlushTrackers, 5000);
		setInterval(this.CleanUnusedTrackers, 300000);
	}

	setTracker(activityId, user, tracker){
		if(!this.trackers){
			this.trackers = {};
		}

		if(!this.trackers[activityId]){
			this.trackers[activityId] = [];
		}

		this.trackers[activityId][user] = {
			tracker: tracker,
			timeused: Date.now()
		};
	}

	hasTracker(activityId, user){
		if(this.trackers && this.trackers[activityId] && this.trackers[activityId][user]){
			return true;
		}else{
			return false;
		}
	}

	async InitTracker(activity, user, password){
		return new Promise((resolve, reject) => {
			let self = this;
			let tracker = new TrackerAsset();

			tracker.settings.host = this.URL;
			tracker.settings.port = this.Port;
			tracker.settings.trackingCode = activity.trackingCode;

			tracker.Login(user, password, function(data,error){
				if(!error){
					tracker.Start(function(result, error){
						if(!error){
							self.setTracker(activity._id, user, tracker);
							resolve(tracker);
						}else{
							reject({ message: 'Unable to start the tracker.', error: error});
						}
					});
				}else{
					reject({ message: 'Unable to login.', error: error});
				}
			});
		})
	}

	RemoveTracker(activityId, user){
		if(this.trackers && this.trackers[activityId] && this.trackers[activityId][user]){
			delete this.trackers[activityId][user];

			if(Object.keys(this.trackers[activityId]).length === 0){
				delete this.trackers[activityId];
			}
		}
	}

	async AddTrace(activityId, user, traces){
		return new Promise((resolve, reject) => {
			try{
				if(!this.hasTracker(activityId, user)){
					reject({ message: 'Tracker not initialized for user ' + user + ' and activity ' + activityId });
				}else{
					console.log(traces);
					let tracker = this.trackers[activityId][user].tracker;
					for (var i = traces.length - 1; i >= 0; i--) {
						traces[i].actor = tracker.actor;
					}

					tracker.tracesPending.push(JSON.stringify(traces));
					this.trackers[activityId][user].timeused = Date.now();
					resolve();
				}
			}catch(e){
				console.log(e);
				reject({ message: 'Malformed Traces' });
			}
		});
	}

	async FlushTrackers(){
		return new Promise((resolve, reject) => {
			if(!this.trackers){
				resolve()
			}else{
				let activities = Object.keys(this.trackers);

				let alldone = 0;
				let allcompleted = function(){
					alldone++;

					if(alldone >= activities.length){
						resolve();
					}
				}

				let flushUsers = function(activityId, users){
					let usersdone = 0;
					let userscompleted = function(){
						usersdone++;

						if(usersdone >= activities.length){
							allcompleted();
						}
					}

					for (let j = users.length - 1; j >= 0; j--) {
						users[j].tracker.Flush(function(result, error){
							userscompleted();
						});
					}
				}

				for (let i = activities.length - 1; i >= 0; i--) {
					let users = Object.keys(this.trackers[activities[i]]);
					flushUsers(activities[i], users);
				}
			}
		});
	}

	CleanUnusedTrackers(){
		console.log('Cleaning Unused Trackers');
		if(!this.trackers){
			return;
		}

		let activities = Object.keys(this.trackers);
		
		for (let i = activities.length - 1; i >= 0; i--) {
			let users = Object.keys(this.trackers[activities[i]]);
			for (let j = users.length - 1; j >= 0; j--) {
				if((users[j].timeused + ONE_HOUR) < Date.now()){
					console.log('Cleaned: ' + activities[i] + '-' + users[j]);
					RemoveTracker(activities[i], users[j]);
				}
			}
		}
	}
}

module.exports = TrackerManager;