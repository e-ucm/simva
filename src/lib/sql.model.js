var Model = {};

Model.selectAll = async (db, table) => {
  const [rows] = await db.query(
    `SELECT * FROM ${table}`
  );
  return rows || null;
};


Model.selectElementFromId = async (db, table, object_id, id) => {
  const [rows] = await db.query(
    `SELECT * FROM ${table} WHERE ${object_id} = ?`,
    [id]
  );
  return rows[0] || null;
};

Model.selectSpecificElementFromList = async (db, table, object_id, tab) => {
  try {
    const placeholders = tab.map(() => '?').join(', ');
    const [rows] = await db.query(`SELECT * FROM ${table} WHERE ${object_id} IN (${placeholders})`, [...tab]);
    return rows;
  } catch (error) {
    console.error(error);
    return [];
  }
};

Model.insert = async (db, table, data) => {
  try {
    const placeholders_keys = Object.keys(data).join(', ');
    const placeholders_values = Object.values(data).map(() => '?').join(', ');
    await db.query(`INSERT INTO ${table} (${placeholders_keys}) VALUES (${placeholders_values})`, [...Object.values(data)]);
  } catch (error) {
    console.error(error);
  }
};

Model.update = async (db, table, data, object_id, id) => {
  try {
    const placeholders_data = Object.keys(data).map((key) => `${key} = ?`).join(', ');
    await db.query(`UPDATE ${table} SET ${placeholders_data} WHERE ${object_id} = ?`, [...Object.values(data), id]);
  } catch (error) {
    console.error(error);
  }
};

Model.deleteElementFromId = async (db, table, object_id, id) => {
  await db.query(
    `DELETE FROM ${table} WHERE ${object_id} = ?`,
    [id]
  );
};

module.exports = Model;