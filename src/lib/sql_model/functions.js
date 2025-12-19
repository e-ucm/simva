const validateParams = require("./validateParams");

module.exports = (sequelize) => {
  return {
    runViewQuery: async (query, params = {}) => {
      if (!query.sql || !query.params) {
        throw new Error("Invalid query template");
      }

      validateParams(query.params, params);

      return sequelize.query(query.sql, {
        replacements: params,
        type: sequelize.QueryTypes.SELECT,
      });
    },
  };
};
