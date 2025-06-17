var mongoose = require('mongoose');
var { castActivityToClass } = require('../activities/activityTypes');
var Study = require('../study');

async function getObjectInDatabase(model, id) {
    let res = await mongoose.model(model).find({_id: id});

    if(res.length > 0) {
        return res[0];
    }else{
        return null;
    }
};

async function loadObjectModel(model, id) {
    var model=await getObjectInDatabase(model, id);
    switch(model) {
        case "Activity":
            return castActivityToClass(model);
        case "Study":
            var study = new Study(model);
            return study;
        default:
            break;
    }
}

module.exports = {loadObjectModel};