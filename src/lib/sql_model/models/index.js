module.exports = (sequelize, DataTypes) => {
    return {
        User: require("./user.model")(sequelize, DataTypes),
    }
}