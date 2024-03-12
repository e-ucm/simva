const fs = require('fs');
const yaml = require('yaml');
const jwt = require('jsonwebtoken');
var UsersController = require('../userscontroller');

var Authenticator = {};
const descriptor = yaml.parse(fs.readFileSync('./api.yaml', 'utf8'));

var AllowedRoutes = {}

Authenticator.initPaths = function(){
	for(var path in descriptor.paths){
		var route = descriptor.paths[path];
		for(const [key, method] of Object.entries(route)){

			if(!method.tags){
				if(!AllowedRoutes['*']){
					AllowedRoutes['*'] = {};
				}

				let tag = AllowedRoutes['*'];

				if(!tag[key]){
					tag[key] = [];
				}

				tag[key].push(path);
			}else{
				for (var i = 0; i < method.tags.length; i++) {

					//remove the last 's' from the roles so its quicker later
					
					let stag = method.tags[i].substring(0, method.tags[i].length - 1);

					if(!AllowedRoutes[stag]){
						AllowedRoutes[stag] = {};
					}

					let tag = AllowedRoutes[stag];

					if(!tag[key]){
						tag[key] = [];
					}

					tag[key].push(path);
				}
			}
		}
	}

	console.log('####################### FINAL TREE OF ALLOWED ROUTES #######################');
	console.log(JSON.stringify(AllowedRoutes, null, 2));
	console.log('############################################################################');
}

Authenticator.CompareRoutes = function(generic, specific){
	let gsplit = generic.split('/');
	let ssplit = specific.split('/');

	if(gsplit.length !== ssplit.length){
		return false;
	}else{
		for (var i = 0; i < gsplit.length; i++) {
			if(gsplit[i][0] === '{'){
				continue;
			}else if(gsplit[i] === ssplit[i]){
				continue;
			}else{
				return false;
			}
		}
	}
	return true;
}

Authenticator.auth = async (req, res, next) => {
	var token = req.headers.authorization || "Bearer " + req.query.token;
	if(!token){
		return res.status(401).send({message: 'No authorization header'});
	}
	if(token.indexOf('Bearer') !== 0){
		
		res.status(401).send({message: 'Auth header is not a valid Bearer.'});
	}else{
		token = token.substring(7);
		let result;
		try{
			result = await UsersController.validateJWT(token);
			let users = await UsersController.getUsers({ username: result.data.username });
			if(users.length > 0){
				result.data = users[0];
			}else{
				return res.status(401).send({message: 'Username not found'});
			}
			
		}catch(e){
			return res.status(401).send({message: 'JWT token is not valid.', error: e });
		}

		req.user = result;
		console.log('TOKEN:');
		console.log(token);
		req.jwt = jwt.decode(token, { complete: true });

		console.log('REQ.JWT:');
		console.log(req.jwt);
		
		return Authenticator.roleAllowed(req, res, next);
	}
};

Authenticator.roleAllowed = async (req, res, next) => {
	let method = req.method.toLowerCase();
	if(!AllowedRoutes[req.user.data.role] || !AllowedRoutes[req.user.data.role][method]){
		return res.status(404).send({message: 'The route you are trying to access does not exist.'});
	}

	let url = req.originalUrl.split('?')[0];

	let allowedlist = AllowedRoutes[req.user.data.role][method];

	for (var i = 0; i < allowedlist.length; i++) {
		if(Authenticator.CompareRoutes(allowedlist[i], url)){
			return next();
		}
	}

	return res.status(401).send({message: 'You are not authorized to access this route.'});
}

Authenticator.initPaths();

module.exports = Authenticator;