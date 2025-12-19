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
db.Tables = require("./models/index")(sequelize, Sequelize);

// Utilities
db.Functions = require("./functions")(sequelize);

// Views (query templates only)
db.Views = require("./views/index");

module.exports = db;