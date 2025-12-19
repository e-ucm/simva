const { Sequelize } = require("sequelize");
const { logger } = require("../config");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "/data/db/simva_data.db", // file-based DB
  logging: logger.info,            // SQL logs (optional)
});


const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models (tables)
db.Table = require("./models/index")(sequelize, Sequelize);

// Utilities
db.functions = require("./functions")(sequelize);

// Views (query templates only)
db.View = require("./views/index");

module.exports = db;