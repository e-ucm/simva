const fs = require('fs');
const yaml = require('yaml');
const validate = require("express-body-schema");

const descriptor = yaml.parse(fs.readFileSync('./api.yaml', 'utf8'));

var validator = {};

validator.addValidations = function(base, router){
	for(var path in descriptor.paths){
		if(!path.startsWith(base)){
			continue;
		}

		var route = descriptor.paths[path];
		for(var method in route){
			var request = route[method];

			if(request['requestBody']){
				var schemaRef = request['requestBody']['content']['application/json']['schema']['$ref'];

				if(schemaRef){
					var schema = validator.getSchema(schemaRef);

					if(schema['schema'] && schema['schema']['$ref']){
						var schema = validator.getSchema(schema['schema']['$ref']);
					}

					reducedPath = path.substr(base.length);
					reducedPath = reducedPath.replace('{', ':');
					reducedPath = reducedPath.replace('}', '');
					reducedPath = reducedPath === '' ? '/' : reducedPath;

					console.log('Added validation to: ' + method + ' - ' + base + reducedPath);

					router[method](reducedPath, validate.schema(schema));
				}
			}
		}
	}
}

validator.getSchema = function(schemaRef){
	schemaRef = schemaRef.split('/');
	var schema = descriptor;

	for (var i = 1; i < schemaRef.length; i++) {
		schema = schema[schemaRef[i]];
	}

	return schema;
}

module.exports = validator;