import validateParams, { ParamSchema } from "./validateParams";
import { Sequelize, QueryTypes } from "sequelize";

export interface QueryTemplate {
  description?: string;
  sql: string;
  params: ParamSchema;
}

export default (sequelize: Sequelize) => {
  return {
    runViewQuery: async (query: QueryTemplate, params: Record<string, any> = {}) => {
      if (!query.sql || !query.params) {
        throw new Error("Invalid query template");
      }

      validateParams(query.params, params);

      return sequelize.query(query.sql, {
        replacements: params,
        type: QueryTypes.SELECT,
      });
    },
  };
};
