const logger = require("./logger");

var Model = {};

Model.selectAll = async (db, table) => {
  const [rows] = await db.query(
    `SELECT * FROM ${table}`
  );
  return rows || null;
};


Model.selectElementFromId = async (db, table, object_id, id) => {
    try {
        const query = `SELECT * FROM ${table} WHERE ${object_id} = ?`; 
        logger.info(query);
        const [rows] = await db.query(query,[id]);
        return rows[0] || null;
    } catch (error) {
        console.error(error);
        return [];
    }
};

Model.selectSpecificElementFromList = async (db, table, object_id, tab) => {
  try {
    const placeholders = tab.map(() => '?').join(', ');
    const query = `SELECT * FROM ${table} WHERE ${object_id} IN (${placeholders})`;
    logger.info(query);
    const [rows] = await db.query(query, [...tab]);
    return rows;
  } catch (error) {
    console.error(error);
    return [];
  }
};

Model.insert = async (db, table, data) => {
  try {
    const placeholders_values = Object.values(data).map(() => '?').join(', ');
    const query =`INSERT INTO ${table} (${Object.keys(data).join(', ')}) VALUES (${placeholders_values})`;
    logger.info(query);
    const [rows] = await db.query(query, [...Object.values(data)]);
  } catch (error) {
    console.error(error);
  }
};

Model.update = async (db, table, data, object_id, id) => {
  try {
    const placeholders_data = Object.keys(data).map((key) => `${key} = ?`).join(', ');
    const query = `UPDATE ${table} SET ${placeholders_data} WHERE ${object_id} = ?`;
    logger.info(query);
    const [rows] = await db.query(query, [...Object.values(data), id]);
  } catch (error) {
    console.error(error);
  }
};

Model.deleteElementFromId = async (db, table, object_id, id) => {
    const query = `DELETE FROM ${table} WHERE ${object_id} = ?`;
    logger.info(query);
    const [rows] = await db.query(query,[id]);
};

module.exports = Model;