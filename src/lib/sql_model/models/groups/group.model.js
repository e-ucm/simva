module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("ParticipantGroup", {
    group_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    use_new_generation: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    group_owner_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    createdAt:{
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt:{
      type: DataTypes.DATE,
      allowNull: false,
    }
  },
  {
    tableName: "ParticipantGroups",   // <-- use your existing table name
    timestamps: true,      // disable createdAt/updatedAt if not in table
    freezeTableName: true, // prevent Sequelize from pluralizing table name
  });

  return Model;
};
