module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("ParticipantGroups_participant", {
    group_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    participant_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
  },
  {
    tableName: "ParticipantGroups_participants",   // <-- use your existing table name
    timestamps: false,      // disable createdAt/updatedAt if not in table
    freezeTableName: true, // prevent Sequelize from pluralizing table name
  });

  return Model;
};
