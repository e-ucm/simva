import { NextFunction, Request, Response, Router } from "express";
import { logger } from '@/lib/logger';
import fs from 'fs';
import yaml from 'yaml';
// @ts-ignore: No type definitions for 'express-body-schema'
import { checkSchema, validationResult, Schema } from "express-validator";
import { config } from "@/lib/config";

const descriptor = yaml.parse(fs.readFileSync(`${config.appFolder}/api.yaml`, 'utf8'));

export function addValidations(base : string, router: Router){
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
					var schema = getSchema(schemaRef);
					if(schema['schema'] && schema['schema']['$ref']){
						var schema = getSchema(schema['schema']['$ref']);
					}
					let reducedPath = path.substr(base.length);
					reducedPath = reducedPath.replace('{', ':');
					reducedPath = reducedPath.replace('}', '');
					reducedPath = reducedPath === '' ? '/' : reducedPath;
					logger.info(schema, 'Added validation to: ' + method + ' - ' + base + reducedPath);
					const expressValidatorSchema = convertOpenApiSchemaToExpressValidator(schema);
					 const routeHandler = (router[method as keyof Router] as unknown) as Function;
					 routeHandler?.call(
					   router,
					   reducedPath,
					   checkSchema(expressValidatorSchema),
                        (req: Request, res: Response, next: NextFunction) => {
                            const errors = validationResult(req);
                            if (!errors.isEmpty()) {
                                return res.status(400).json({ errors: errors.array() });
                            }
                            next();
					   }
					 );
				}
			}
		}
	}
}

// Helper to convert OpenAPI schema to express-validator schema
function convertOpenApiSchemaToExpressValidator(openApiSchema: any): Schema {
	const properties = openApiSchema.properties || {};
	const required = openApiSchema.required || [];
	const schema: Schema = {};
	       for (const [key, value] of Object.entries(properties)) {
		       const typedValue = value as any;
		       schema[key] = {
			       in: ["body"],
			       optional: !required.includes(key),
		       };
		       if (typedValue.type) {
			       switch (typedValue.type) {
				       case "string":
					       schema[key].isString = true;
					       break;
				       case "number":
					       schema[key].isNumeric = true;
					       break;
				       case "integer":
					       schema[key].isInt = true;
					       break;
				       case "boolean":
					       schema[key].isBoolean = true;
					       break;
			       }
		       }
	       }
	return schema;
}

function getSchema(schemaRef : string) : any {
	const schemaParts = schemaRef.split('/');
	let schema = descriptor;
	for (let i = 1; i < schemaParts.length; i++) {
		schema = schema[schemaParts[i]];
	}
	return schema;
}