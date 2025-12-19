module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("Manual_Activity", {
    activity_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    user_managed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    ressource_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ressource_url: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  },
  {
    tableName: "Manual_Activities",   // <-- use your existing table name
    timestamps: false,    // disable createdAt/updatedAt if not in table
    freezeTableName: true, // prevent Sequelize from pluralizing table name
  });

  return Model;
};