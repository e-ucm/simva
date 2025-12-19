module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("Limesurvey_Activity", {
    activity_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    survey_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    language: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lrsset: {
      type: DataTypes.INTEGER,
      allowNull: false,
    }
  },
  {
    tableName: "Limesurvey_Activities",   // <-- use your existing table name
    timestamps: false,    // disable createdAt/updatedAt if not in table
    freezeTableName: true, // prevent Sequelize from pluralizing table name
  });

  return Model;
};