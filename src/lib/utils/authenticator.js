var UsersController = require('../userscontroller');

var Authenticator = {};

Authenticator.auth = async (req, res, next) => {
	var token = req.headers.authorization;
	if(!token){
		return res.status(403).send({message: 'No authorization header'});
	}
	if(token.indexOf('Bearer') !== 0){
		res.status(403).send({message: 'Auth header is not a valid Bearer.'});
	}else{
		token = token.substring(7);
		let res;
		try{
			res = await UsersController.validateJWT(token);
		}catch(e){
			console.log(res.status(403).send({message: e}));
		}
		
		return next();
	}
};

module.exports = Authenticator;