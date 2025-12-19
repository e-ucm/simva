module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("GamePlay_Activity", {
    activity_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    backup: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    scorm_xapi_by_game: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    subject_area_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    game_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    game_url: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  },
  {
    tableName: "GamePlay_Activities",   // <-- use your existing table name
    timestamps: false,    // disable createdAt/updatedAt if not in table
    freezeTableName: true, // prevent Sequelize from pluralizing table name
  });

  return Model;
};