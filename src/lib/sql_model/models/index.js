module.exports = (sequelize, DataTypes) => {
    return {
        User: require("./user.model")(sequelize, DataTypes),
        Group: require("./group.model")(sequelize, DataTypes),
        GroupParticipants: require("./groupParticipants.model")(sequelize, DataTypes),
        GroupPermissions: require("./groupPermissions.model")(sequelize, DataTypes),
        

    }
}