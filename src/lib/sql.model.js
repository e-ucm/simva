const logger = require("./logger");

var Model = {};

/**
 * Select all elements from database table
 * @param {*} db mysql database pool
 * @param {string} table table name
 * @returns response from db
 */
Model.selectAll = async (db, table) => {
  const [rows] = await db.query(
    `SELECT * FROM ${table}`
  );
  return rows || null;
};

/**
 * Select specific element from database table using WHERE condition and object_id and object_value
 * @param {*} db mysql database pool
 * @param {string} table table name
 * @param {string} object_id object for the WHERE condition
 * @param {string} object_value value of this object for the WHERE condition
 * @returns response from db
 */
Model.selectElementFromId = async (db, table, object_id, object_value) => {
    try {
        const query = `SELECT * FROM ${table} WHERE ${object_id} = ?`; 
        logger.info(query);
        const [rows] = await db.query(query,[object_value]);
        return rows[0] || null;
    } catch (error) {
        console.error(error);
        return [];
    }
};

/**
 * Select specific element from database table using WHERE condition and multiple AND/OR list conditions
 * @param {*} db mysql database pool
 * @param {string} table table name
 * @param {Object} conditions conditions<key,value> to apply
 * @param {string} andOrOperator And Or operator (by default AND)
 * @returns response from db
 */
Model.selectFromConditions= async(db, table, conditions, andOrOperator = '') => {
    let query = `SELECT * FROM ${table}`;
    let whereClause = '';
    for (let condition in conditions) {
        if (!whereClause) {
            whereClause += ` WHERE ${condition} = ?`;
        } else {
            if (andOrOperator === '') {
                whereClause += ` AND ${condition} = ?`;
                andOrOperator = 'AND';
            } else if (andOrOperator === 'AND') {
                whereClause += ` OR ${condition} = ?`;
                andOrOperator = 'OR';
            }
        }
    }
    if (whereClause) {
        query += ` ${whereClause}`;
    }
    try {
        logger.info(query);
        const [rows] = await db.query(query,[id]);
        return rows;
    } catch (error) {
        console.error(error);
        return [];
    }
}

/**
 * Select specific element from database table with WHERE condition using a contain list
 * @param {*} db mysql database pool
 * @param {string} table table name
 * @param {string} object_id object for the WHERE condition
 * @param {Object} tab list with the values
 * @returns response from db
 */
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

/**
 * Insert element into database table
 * @param {*} db mysql database pool
 * @param {string} table table name
 * @param {Object} data 
 */
Model.insert = async (db, table, data) => {
  try {
    const placeholders_values = Object.values(data).map(() => '?').join(', ');
    const query =`INSERT INTO ${table} (${Object.keys(data).join(', ')}) VALUES (${placeholders_values})`;
    logger.info(query);
    await db.query(query, [...Object.values(data)]);
  } catch (error) {
    console.error(error);
  }
};


/**
* Update element(s) from database table
 * @param {*} db mysql database pool
 * @param {string} table table name
 * @param {Object} data date to update for the element(s)
 * @param {string} object_id object for the WHERE condition
 * @param {string} object_value value of this object for the WHERE condition
 */
Model.update = async (db, table, data, object_id, object_value) => {
  try {
    const placeholders_data = Object.keys(data).map((key) => `${key} = ?`).join(', ');
    const query = `UPDATE ${table} SET ${placeholders_data} WHERE ${object_id} = ?`;
    logger.info(query);
    await db.query(query, [...Object.values(data), object_value]);
  } catch (error) {
    console.error(error);
  }
};

/**
 * Delete element(s) from database table
 * @param {*} db mysql database pool
 * @param {string} table table name
 * @param {string} object_id object for the WHERE condition
 * @param {string} object_value value of this object for the WHERE condition
 */
Model.deleteElementFromId = async (db, table, object_id, object_value) => {
    const query = `DELETE FROM ${table} WHERE ${object_id} = ?`;
    logger.info(query);
    await db.query(query,[object_value]);
};

module.exports = Model;