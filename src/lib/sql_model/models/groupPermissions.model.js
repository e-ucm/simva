module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("ParticipantGroups_permission", {
    group_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    permission: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
  },
  {
    tableName: "ParticipantGroups_permissions",   // <-- use your existing table name
    timestamps: false,      // disable createdAt/updatedAt if not in table
    freezeTableName: true, // prevent Sequelize from pluralizing table name
  });

  return Model;
};
