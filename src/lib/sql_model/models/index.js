module.exports = (sequelize, DataTypes) => {
    return {
        User: require("./users/user.model")(sequelize, DataTypes),
        Group: require("./groups/group.model")(sequelize, DataTypes),
        GroupParticipants: require("./groups/groupParticipants.model")(sequelize, DataTypes),
        GroupPermissions: require("./groups/groupPermissions.model")(sequelize, DataTypes),
        Activities: require("./activities/activity.model")(sequelize, DataTypes),
        ManualActivities: require("./activities/manualActivity.model")(sequelize, DataTypes),
        GamePlayActivities: require("./activities/gameplayActivity.model")(sequelize, DataTypes),
        LimesurveyActivities: require("./activities/limesurveyActivity.model")(sequelize, DataTypes),
    }
}