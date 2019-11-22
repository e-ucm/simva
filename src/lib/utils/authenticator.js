var UsersController = require('../userscontroller');

var Authenticator = {};

Authenticator.auth = async (req, res, next) => {
	var token = req.headers.authorization;
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
		}catch(e){
			return res.status(401).send({message: 'JWT token is not valid.'});
		}

		req.user = result;
		
		return next();
	}
};

module.exports = Authenticator;