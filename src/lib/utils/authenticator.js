const logger = require('../logger');
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

	logger.info('####################### FINAL TREE OF ALLOWED ROUTES #######################');
	logger.info(JSON.stringify(AllowedRoutes, null, 2));
	logger.info('############################################################################');
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
		req.jwt = jwt.decode(token, { complete: true });

		return Authenticator.roleAllowed(req, res, next);
	}
};

Authenticator.getRoleFromRealmAccessRoles = function(userdata){
	let role = 'norole';
	if(userdata.realm_access.roles.includes('administrator')){
		role = 'administrator';
	} else if(userdata.realm_access.roles.includes('teacher') || userdata.realm_access.roles.includes('researcher')){
		role = 'teacher';
	} else if(userdata.realm_access.roles.includes('teaching-assistant') || userdata.realm_access.roles.includes('student')){
		role = 'student';
	};
	console.log(role);
	return role;
},


Authenticator.roleAllowed = async (req, res, next) => {
	let method = req.method.toLowerCase();
	//if(!req.user.data.role) {
	//	req.user.data.role=Authenticator.getRoleFromRealmAccessRoles(req.user.data);
	//}
	if(!AllowedRoutes[req.user.data.role] || !AllowedRoutes[req.user.data.role][method]){
		return res.status(404).send({message: 'The route you are trying to access does not exist.'});
	}

	let url = req.originalUrl.split('?')[0];
	logger.debug(url);
	logger.debug(method);
	logger.debug(req.user.data.role);
	
	let allowedlist = AllowedRoutes[req.user.data.role][method];
	for (var i = 0; i < allowedlist.length; i++) {
		if(Authenticator.CompareRoutes(allowedlist[i], url)){
			logger.debug("Allowed");
			return next();
		}
	}

	return res.status(401).send({message: 'You are not authorized to access this route.'});
}

Authenticator.initPaths();

module.exports = Authenticator;