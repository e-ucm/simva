/*
 * Copyright 2016 e-UCM (http://www.e-ucm.es/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * This project has received funding from the European Union’s Horizon
 * 2020 research and innovation programme under grant agreement No 644187.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0 (link is external)
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';
const logger = require('../src/lib/logger');
var should = require('should'),
    mongoose = require('mongoose'),
    User = mongoose.model('user'),
    Group = mongoose.model('group'),
    Study = mongoose.model('study'),
    Test = mongoose.model('test'),
    Activity = mongoose.model('activity'),
    Comparator = require('../utils/comparator');

var CompareStoredObject = function(id, object, collection, callback){
    collection.find({_id: id}, function(error, docs){
        if(docs.length !== 1 ){
            logger.debug('ID: ' + id + ' NOT FOUND');
            callback({message: 'id not found'}, false);
        }else{
            let p1 = JSON.parse(JSON.stringify(docs[0]));

            if(collection === Activity){
                if(!p1.extra_data){
                    p1.extra_data = {};
                }
                delete p1.__v;
            }
            
            let o1 = JSON.parse(JSON.stringify(p1, Object.keys(p1).sort()));
            let o2 = JSON.parse(JSON.stringify(object, Object.keys(object).sort()));

            if(!Comparator.deepCompare(o1, o2)){
                logger.debug('############## OBJECT 1 ##############')
                logger.debug(JSON.stringify(o1, null, 2));
                logger.debug('############## OBJECT 2 ##############')
                logger.debug(JSON.stringify(o2, null, 2));
                logger.debug('######################################')
                callback({message: 'objects are not equal'}, false);
            }else{
                callback(null, true);
            } 
        }
    });
}

var GetFirstStoredObject = function(callback){
    Groups.find({}, function(error, docs){
        if(docs.length === 0){
            callback({message: 'id not found'});
        }else{
            callback(null, docs[0]);
        }
    });
}

let authToken = null;
let teacherid = null;
let groupid1 = null;
let groupid2 = null;
let studyid = null;
let groupid_unauth = null;
let studyid_unauth = null;
let testid = null;
let testid2 = null;
let activityid = null;
let activityid2 = null;

module.exports = function (request) {

    /**-------------------------------------------------------------**/
    /**-------------------------------------------------------------**/
    /**                     Test Group API                          **/
    /**-------------------------------------------------------------**/
    /**-------------------------------------------------------------**/
    describe('Activity tests', function () {
        before(function (done) {

            let teacher = {
                username: 'teacher',
                password: 'pass1',
                email: 'teacher@test.com',
                role: 'teacher'
            }

            let student = {
                username: 's1',
                password: 'pass1',
                email: 's1@test.com',
                role: 'student'
            };

            mongoose.connection.collection('groups').drop(function(){
                mongoose.connection.collection('users').drop(function(){
                    request.post('/users')
                        .expect(200)
                        .send(teacher)
                        .set('Accept', 'application/json')
                        .end(function (err, res) {
                            if(err){
                                logger.info(err, res);
                            }

                            should.not.exist(err);
                            should(res.body).be.Object();
                            should(res.body._id).be.String();
                            teacherid = res.body.id;
                            request.post('/users')
                                .expect(200)
                                .send(student)
                                .set('Accept', 'application/json')
                                .end(function (err, res) {
                                    if(err){
                                        logger.info(err, res);
                                    }

                                    should.not.exist(err);
                                    mongoose.connection.collection('users').insertMany(
                                        [{
                                            username: 's2',
                                            password: 's2',
                                            email: 's2@test.com',
                                            role: 'student',
                                            external_entity: []
                                        },
                                        {
                                            username: 's3',
                                            password: 's3',
                                            email: 's3@test.com',
                                            role: 'student',
                                            external_entity: []
                                        },
                                        {
                                            username: 's4',
                                            password: 's4',
                                            email: 's4@test.com',
                                            role: 'student',
                                            external_entity: []
                                        },
                                        {
                                            username: 's5',
                                            password: 's5',
                                            email: 's5@test.com',
                                            role: 'student',
                                            external_entity: []
                                        },
                                        {
                                            username: 'sadditional',
                                            password: 'sadditional',
                                            email: 'sadditional@test.com',
                                            role: 'student',
                                            external_entity: []
                                        }]
                                    ,function(){
                                        mongoose.connection.collection('groups').insertMany(
                                            [{
                                                name: 'g1',
                                                owners: ['teacher'],
                                                participants: ['s1', 's2', 's3'],
                                                created: Date.now()
                                            },
                                            {
                                                name: 'g2',
                                                owners: ['teacher'],
                                                participants: ['s3', 's4', 's5'],
                                                created: Date.now()
                                            },
                                            {
                                                name: 'g3',
                                                owners: ['unaccessible'],
                                                participants: ['s1', 's2','s3', 's4', 's5'],
                                                created: Date.now()
                                            }]
                                        ,function(err, result){
                                            groupid1 = result.ops[0]._id;
                                            groupid2 = result.ops[1]._id;
                                            groupid_unauth = result.ops[2]._id;
                                            mongoose.connection.collection('studies').insertMany(
                                                [{
                                                    "tests" : [],
                                                    "groups" : ['g3'],
                                                    "owners" : ["unaccessible"],
                                                    "name" : "teststudy",
                                                    "allocator" : "5ddff46fbeccac38f888339a",
                                                    "created" : Date.now()
                                                }]
                                            ,function(err, result){
                                                studyid_unauth = result.ops[0]._id;
                                                request.post('/users/login')
                                                    .expect(200)
                                                    .send({username: 'teacher', password: 'pass1'})
                                                    .end(function (err, res) {
                                                        if(err){
                                                            logger.info(err, res);
                                                        }
                                                        should(res.body).be.Object();
                                                        should.exist(res.body.token);
                                                        authToken = res.body.token;

                                                        done();
                                                    });
                                            });
                                        });
                                    });
                                });
                        });
                });
            });
        });
        after(function (done) {
            mongoose.connection.collection('groups').drop(function(){
                mongoose.connection.collection('users').drop(function(){
                    mongoose.connection.collection('studies').drop(function(){
                        mongoose.connection.collection('activities').drop(function(){
                            mongoose.connection.collection('allocators').drop(function(){
                                done();
                            });
                        });
                    });
                });
            });
        });

        it('should be able to add an study', function (done) {
            let study = {
                name: 'teststudy'
            }

            request.post('/studies')
                .expect(200)
                .send(study)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    if(err){
                        logger.info(err, res);
                    }

                    should.not.exist(err);
                    should(res.body).be.Object();
                    should(res.body.name).equals(study.name);
                    should(res.body.owners).be.instanceof(Array).and.have.lengthOf(1);
                    should(res.body.tests).be.instanceof(Array).and.have.lengthOf(0);
                    should(mongoose.Types.ObjectId.isValid(res.body.allocator)).equals(true);
                    should(res.body.owners.indexOf('teacher')).equals(0);
                    studyid = res.body._id;

                    CompareStoredObject(res.body._id, res.body, Study, function(err, res){
                        should.not.exist(err);
                        should(res).equals(true);
                        done();
                    });
                });
        });

        it('should be able to add a test to an existing study updating it correctly', function (done) {
            let test = {
                name: 'testtest'
            }
            request.get('/studies/' + studyid)
                .expect(200)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    let study = res.body;

                    request.post('/studies/' + studyid + '/tests')
                        .expect(200)
                        .send(test)
                        .set('Accept', 'application/json')
                        .set('Authorization', 'Bearer ' + authToken)
                        .end(function (err, res) {
                            should.not.exist(err);
                            should(res.body).be.Object();
                            should(res.body.name).equals(test.name);
                            study.tests.push(res.body._id);

                            testid = res.body._id;

                            CompareStoredObject(studyid, study, Study, function(err, res){
                                should.not.exist(err);
                                should(res).equals(true);
                                done();
                            });
                        });
                    });
        });

        it('should be able to add an activity to a test and its testid should be correct', function (done) {
            let activity = {
                name: 'testactivity',
                type: 'activity'
            }

           request.post('/studies/' + studyid + '/tests/' + testid + '/activities')
                .expect(200)
                .send(activity)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    should.not.exist(err);
                    should(res.body).be.Object();
                    should(res.body.name).equals(activity.name);
                    should(res.body.type).equals(activity.type);
                    should(res.body.test).equals(testid);

                    activityid = res.body._id;

                    CompareStoredObject(activityid, res.body, Activity, function(err, res){
                        should.not.exist(err);
                        should(res).equals(true);
                        done();
                    });
                });
        });

        var addActivity = function(sid, tid, activity, expect, callback){
            request.post('/studies/' + sid + '/tests/' + tid + '/activities')
                .expect(expect)
                .send(activity)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    callback(err, res);
                });
        }

        it('should not be able to add an activity to a test without you as owner', function (done) {
            let activity = {
                name: 'testactivity',
                type: 'activity',
                owners: ['other']
            }
            
            addActivity(studyid, testid, activity, 400, function (err, res) {
                should.not.exist(err);
                should(res.body).be.Object();
                should(res.body.message).be.String();
                done();
            });
        });

        it('should be able to get the list of activities of the test', function (done) {
            request.get('/studies/' + studyid + '/tests/' + testid + '/activities')
                .expect(200)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    should.not.exist(err);
                    should(res.body).be.Object();
                    should(res.body.length).equals(1);
                    should(res.body[0]._id).equals(activityid);
                    done();
                });
        });

        it('should be able to add a group to the study and update the activity participants', function (done) {
            request.get('/studies/' + studyid)
                .expect(200)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    let study = res.body;

                    study.groups.push(groupid1);

                    request.put('/studies/' + studyid)
                        .expect(200)
                        .send(study)
                        .set('Accept', 'application/json')
                        .set('Authorization', 'Bearer ' + authToken)
                        .end(function (err, res) {
                            should.not.exist(err);

                            CompareStoredObject(studyid, study, Study, function(err, res){
                                should.not.exist(err);
                                should(res).equals(true);

                                request.get('/activities/' + activityid)
                                    .expect(200)
                                    .set('Accept', 'application/json')
                                    .set('Authorization', 'Bearer ' + authToken)
                                    .end(function (err, res) {
                                        should.not.exist(err);
                                        should(res.body).be.Object();

                                        let activity = res.body;

                                        should(activity.extra_data).be.Object();
                                        should(activity.extra_data.participants).be.Object();
                                        should(Object.keys(activity.extra_data.participants).length).equals(3);

                                        done();
                                    });
                            });
                        });
                    });
        });

        it('should be able to add a participant to the group and update activity participants', function (done) {
            request.get('/groups/' + groupid1)
                .expect(200)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    let group = res.body;

                    group.participants.push('sadditional');

                    request.put('/groups/' + groupid1)
                        .expect(200)
                        .send(group)
                        .set('Accept', 'application/json')
                        .set('Authorization', 'Bearer ' + authToken)
                        .end(function (err, res) {
                            should.not.exist(err);

                            CompareStoredObject(groupid1, group, Group, function(err, res){
                                should.not.exist(err);
                                should(res).equals(true);

                                request.get('/activities/' + activityid)
                                    .expect(200)
                                    .set('Accept', 'application/json')
                                    .set('Authorization', 'Bearer ' + authToken)
                                    .end(function (err, res) {
                                        should.not.exist(err);
                                        should(res.body).be.Object();

                                        let activity = res.body;

                                        should(activity.extra_data).be.Object();
                                        should(activity.extra_data.participants).be.Object();
                                        should(Object.keys(activity.extra_data.participants).length).equals(4);
                                        should(Object.keys(activity.extra_data.participants)).containEql('sadditional');

                                        done();
                                    });
                            });
                        });
                    });
        });

        it('should be able to remove a participant from the group and update activity participants', function (done) {
            request.get('/groups/' + groupid1)
                .expect(200)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    let group = res.body;

                    group.participants.splice(group.participants.length -1);

                    request.put('/groups/' + groupid1)
                        .expect(200)
                        .send(group)
                        .set('Accept', 'application/json')
                        .set('Authorization', 'Bearer ' + authToken)
                        .end(function (err, res) {
                            should.not.exist(err);

                            CompareStoredObject(groupid1, group, Group, function(err, res){
                                should.not.exist(err);
                                should(res).equals(true);

                                request.get('/activities/' + activityid)
                                    .expect(200)
                                    .set('Accept', 'application/json')
                                    .set('Authorization', 'Bearer ' + authToken)
                                    .end(function (err, res) {
                                        should.not.exist(err);
                                        should(res.body).be.Object();

                                        let activity = res.body;

                                        should(activity.extra_data).be.Object();
                                        should(activity.extra_data.participants).be.Object();
                                        should(Object.keys(activity.extra_data.participants).length).equals(3);
                                        should(Object.keys(activity.extra_data.participants)).not.containEql('sadditional');

                                        done();
                                    });
                            });
                        });
                    });
        });

        var putAndGet = function(study, activity, callback){
            request.put('/studies/' + study._id)
                .expect(200)
                .send(study)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    if(err){
                        callback(err);
                    }

                   request.get('/activities/' + activity._id)
                        .expect(200)
                        .set('Accept', 'application/json')
                        .set('Authorization', 'Bearer ' + authToken)
                        .end(function (err, res) {
                            callback(err, res);
                        });
                });
        }

        it('should be able to manage participants correctly', function (done) {
            let study = {
                name: 'participantsstudy'
            }

            let groupManagement = function(study, test){
                let activity = {
                    name: 'testactivity',
                    type: 'activity',
                    owners: ['teacher']
                }
                
                addActivity(study._id, test._id, activity, 200, function (err, res) {
                    should.not.exist(err);
                    should(res.body).be.Object();

                    activity = res.body;

                    study.groups.push(groupid1);
                    putAndGet(study, activity, function(err, res){
                        should.not.exist(err);
                        should(res.body).be.Object();

                        should(res.body.extra_data).be.Object();
                        should(res.body.extra_data.participants).be.Object();
                        should(Object.keys(res.body.extra_data.participants).length).equals(3);

                        should(res.body.extra_data.participants['s1']).be.Object();
                        should(res.body.extra_data.participants['s2']).be.Object();
                        should(res.body.extra_data.participants['s3']).be.Object();

                        study.groups.push(groupid2);

                        putAndGet(study, activity, function(err, res){
                            should.not.exist(err);
                            should(res.body).be.Object();

                            should(res.body.extra_data).be.Object();
                            should(res.body.extra_data.participants).be.Object();
                            should(Object.keys(res.body.extra_data.participants).length).equals(5);

                            should(res.body.extra_data.participants['s1']).be.Object();
                            should(res.body.extra_data.participants['s2']).be.Object();
                            should(res.body.extra_data.participants['s3']).be.Object();
                            should(res.body.extra_data.participants['s4']).be.Object();
                            should(res.body.extra_data.participants['s5']).be.Object();

                            study.groups.shift();

                            putAndGet(study, activity, function(err, res){
                                should.not.exist(err);
                                should(res.body).be.Object();

                                should(res.body.extra_data).be.Object();
                                should(res.body.extra_data.participants).be.Object();
                                should(Object.keys(res.body.extra_data.participants).length).equals(3);
                                should(res.body.extra_data.participants['s3']).be.Object();
                                should(res.body.extra_data.participants['s4']).be.Object();
                                should(res.body.extra_data.participants['s5']).be.Object();

                                done(); 
                            });
                        });
                    });
                });
            }

            let currentid = '';
            request.post('/studies')
                .expect(200)
                .send(study)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    if(err){
                        logger.info(err, res);
                    }
                    should.not.exist(err);

                    study = res.body

                    let test = {
                        name: 'testparticipants'
                    }

                    request.post('/studies/' + study._id + '/tests')
                        .expect(200)
                        .send(test)
                        .set('Accept', 'application/json')
                        .set('Authorization', 'Bearer ' + authToken)
                        .end(function (err, res) {
                            let test = res.body;
                            should.not.exist(err);
                            study.tests.push(res.body._id);

                            CompareStoredObject(study._id, study, Study, function(err, res){
                               groupManagement(study, test);
                           });
                        });
                });
        });

        it('should be able to obtain if it is openable or not if its only owner', function (done) {
           request.get('/activities/' + activityid + '/openable')
                .expect(200)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    should.not.exist(err);
                    should(res.body).be.Object();

                    done();
                });
        });

        it('should be able to obtain if it is openable if it is a student participant', function (done) {

            request.post('/users/login')
                .expect(200)
                .send({username: 's1', password: 'pass1'})
                .end(function (err, res) {
                    if(err){
                        logger.info(err, res);
                    }
                    should(res.body).be.Object();
                    should.exist(res.body.token);
                    let tmptoken = res.body.token;

                    request.get('/activities/' + activityid + '/openable')
                        .expect(200)
                        .set('Accept', 'application/json')
                        .set('Authorization', 'Bearer ' + tmptoken)
                        .end(function (err, res) {
                            should.not.exist(err);
                            should(res.body).be.Object();

                            done();
                        });
                });
        });

        it('should be able to get its completion status', function (done) {

            request.post('/users/login')
                .expect(200)
                .send({username: 's1', password: 'pass1'})
                .end(function (err, res) {
                    if(err){
                        logger.info(err, res);
                    }
                    should(res.body).be.Object();
                    should.exist(res.body.token);
                    let tmptoken = res.body.token;

                    request.get('/activities/' + activityid + '/completion')
                        .expect(200)
                        .set('Accept', 'application/json')
                        .set('Authorization', 'Bearer ' + tmptoken)
                        .end(function (err, res) {
                            should.not.exist(err);
                            should(res.body).be.Object();
                            should(res.body['s1']).equals(false);
                            done();
                        });
                });
        });

        it('should NOT be able to set s5 completion status as a teacher because s5 is not participant', function (done) {

            request.post('/activities/' + activityid + '/completion?user=s5')
                .expect(400)
                .send({ status: true })
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    should.not.exist(err);
                    should(res.body).be.Object();
                    should(res.body.message).equals('The user you are trying to set completion to is not a participant');

                    done();
                });
        });

        it('should be able to set s2 completion status as a teacher and obtain his changed completion', function (done) {

            request.post('/activities/' + activityid + '/completion?user=s2')
                .expect(200)
                .send({ status: true })
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    should.not.exist(err);
                    should(res.body).be.Object();
                    should(res.body.result).equals(true);

                    request.get('/activities/' + activityid + '/completion')
                        .expect(200)
                        .set('Accept', 'application/json')
                        .set('Authorization', 'Bearer ' + authToken)
                        .end(function (err, res) {
                            should.not.exist(err);
                            should(res.body).be.Object();

                            should(Object.keys(res.body).length).equals(3);

                            should(res.body).be.Object();
                            should(res.body['s1']).equals(false);
                            should(res.body['s2']).equals(true);
                            should(res.body['s3']).equals(false);
                            done();
                        });
                });
        });

        it('should be able to get the results as a teacher but filtered', function (done) {
            request.get('/activities/' + activityid + '/completion?users=s2,s3')
                .expect(200)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    should.not.exist(err);
                    should(res.body).be.Object();

                    should(Object.keys(res.body).length).equals(2);

                    should(res.body['s1']).not.be.Object();

                    should(res.body['s2']).equals(true);
                    should(res.body['s3']).equals(false);

                    done();
                });
        });

        it('should be able to set its completion status and obtain it changed', function (done) {

            request.post('/users/login')
                .expect(200)
                .send({username: 's1', password: 'pass1'})
                .end(function (err, res) {
                    if(err){
                        logger.info(err, res);
                    }
                    should(res.body).be.Object();
                    should.exist(res.body.token);
                    let tmptoken = res.body.token;

                    request.post('/activities/' + activityid + '/completion')
                        .expect(200)
                        .send({ status: true })
                        .set('Accept', 'application/json')
                        .set('Authorization', 'Bearer ' + tmptoken)
                        .end(function (err, res) {
                            should.not.exist(err);
                            should(res.body).be.Object();
                            should(res.body.result).equals(true);

                            request.get('/activities/' + activityid + '/completion')
                                .expect(200)
                                .set('Accept', 'application/json')
                                .set('Authorization', 'Bearer ' + tmptoken)
                                .end(function (err, res) {
                                    should.not.exist(err);
                                    should(res.body).be.Object();
                                    should(res.body['s1']).equals(true);

                                    done();
                                });
                        });
                });
        });

        it('should be able to get its result', function (done) {

            request.post('/users/login')
                .expect(200)
                .send({username: 's1', password: 'pass1'})
                .end(function (err, res) {
                    if(err){
                        logger.info(err, res);
                    }
                    should(res.body).be.Object();
                    should.exist(res.body.token);
                    let tmptoken = res.body.token;

                    request.get('/activities/' + activityid + '/result')
                        .expect(200)
                        .set('Accept', 'application/json')
                        .set('Authorization', 'Bearer ' + tmptoken)
                        .end(function (err, res) {
                            should.not.exist(err);
                            should(res.body).be.Object();
                            should(res.body['s1']).equals(null);

                            done();
                        });
                });
        });

        it('should be able to set its result and obtain it changed', function (done) {

            request.post('/users/login')
                .expect(200)
                .send({username: 's1', password: 'pass1'})
                .end(function (err, res) {
                    if(err){
                        logger.info(err, res);
                    }
                    should(res.body).be.Object();
                    should.exist(res.body.token);
                    let tmptoken = res.body.token;

                    request.post('/activities/' + activityid + '/result')
                        .expect(200)
                        .send({ result: { final_score: 10, avg_score: 7, attempts: 5, failures: 2, success: 3 } })
                        .set('Accept', 'application/json')
                        .set('Authorization', 'Bearer ' + tmptoken)
                        .end(function (err, res) {
                            should.not.exist(err);
                            should(res.body).be.Object();
                            should(res.body.result).equals(true);

                            request.get('/activities/' + activityid + '/result')
                                .expect(200)
                                .set('Accept', 'application/json')
                                .set('Authorization', 'Bearer ' + tmptoken)
                                .end(function (err, res) {
                                    should.not.exist(err);

                                    should(res.body).be.Object();
                                    should(res.body['s1']).be.Object();
                                    should(Object.keys(res.body['s1']).length).equals(5);
                                    should(res.body['s1'].final_score).equals(10);
                                    should(res.body['s1'].avg_score).equals(7);
                                    should(res.body['s1'].attempts).equals(5);
                                    should(res.body['s1'].failures).equals(2);
                                    should(res.body['s1'].success).equals(3);

                                    done();
                                });
                        });
                });
        });

        it('should be able to get all results as a teacher', function (done) {
            request.get('/activities/' + activityid + '/result')
                .expect(200)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    should.not.exist(err);
                    should(res.body).be.Object();

                    should(Object.keys(res.body).length).equals(3);

                    should(res.body['s1']).be.Object();
                    should(Object.keys(res.body['s1']).length).equals(5);
                    should(res.body['s1'].final_score).equals(10);
                    should(res.body['s1'].avg_score).equals(7);
                    should(res.body['s1'].attempts).equals(5);
                    should(res.body['s1'].failures).equals(2);

                    should(res.body['s2']).equals(null);
                    should(res.body['s3']).equals(null);

                    done();
                });
        });

        it('should NOT be able to set s5 results as a teacher because s5 is not participant', function (done) {

            request.post('/activities/' + activityid + '/result?user=s5')
                .expect(400)
                .send({ result: { final_score: 9, avg_score: 8, attempts: 7, failures: 6, success: 5 } })
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    should.not.exist(err);
                    should(res.body).be.Object();
                    should(res.body.message).equals('The user you are trying to set result to is not a participant');

                    done();
                });
        });

        it('should be able to set s2 results as a teacher and obtain all the changed results', function (done) {

            request.post('/activities/' + activityid + '/result?user=s2')
                .expect(200)
                .send({ result: { final_score: 9, avg_score: 8, attempts: 7, failures: 6, success: 5 } })
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    should.not.exist(err);
                    should(res.body).be.Object();
                    should(res.body.result).equals(true);

                    request.get('/activities/' + activityid + '/result')
                        .expect(200)
                        .set('Accept', 'application/json')
                        .set('Authorization', 'Bearer ' + authToken)
                        .end(function (err, res) {
                            should.not.exist(err);

                            should(res.body).be.Object();
                            should(res.body['s1']).be.Object();
                            should(Object.keys(res.body['s1']).length).equals(5);
                            should(res.body['s1'].final_score).equals(10);
                            should(res.body['s1'].avg_score).equals(7);
                            should(res.body['s1'].attempts).equals(5);
                            should(res.body['s1'].failures).equals(2);
                            should(res.body['s1'].success).equals(3);

                            should(res.body).be.Object();
                            should(res.body['s2']).be.Object();
                            should(Object.keys(res.body['s2']).length).equals(5);
                            should(res.body['s2'].final_score).equals(9);
                            should(res.body['s2'].avg_score).equals(8);
                            should(res.body['s2'].attempts).equals(7);
                            should(res.body['s2'].failures).equals(6);
                            should(res.body['s2'].success).equals(5);

                            done();
                        });
                });
        });

        it('should be able to get all results as a teacher', function (done) {
            request.get('/activities/' + activityid + '/result?user=s2')
                .expect(200)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    should.not.exist(err);
                    should(res.body).be.Object();

                    should(Object.keys(res.body).length).equals(3);

                    should(res.body['s1']).be.Object();
                    should(Object.keys(res.body['s1']).length).equals(5);
                    should(res.body['s1'].final_score).equals(10);
                    should(res.body['s1'].avg_score).equals(7);
                    should(res.body['s1'].attempts).equals(5);
                    should(res.body['s1'].failures).equals(2);

                    should(res.body['s2']).be.Object();
                    should(Object.keys(res.body['s2']).length).equals(5);
                    should(res.body['s2'].final_score).equals(9);
                    should(res.body['s2'].avg_score).equals(8);
                    should(res.body['s2'].attempts).equals(7);
                    should(res.body['s2'].failures).equals(6);
                    should(res.body['s2'].success).equals(5);

                    should(res.body['s3']).equals(null);

                    done();
                });
        });

        it('should be able to get the results as a teacher but filtered', function (done) {
            request.get('/activities/' + activityid + '/result?users=s2,s3')
                .expect(200)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    should.not.exist(err);
                    should(res.body).be.Object();

                    should(Object.keys(res.body).length).equals(2);

                    should(res.body['s1']).not.be.Object();

                    should(res.body['s2']).be.Object();
                    should(Object.keys(res.body['s2']).length).equals(5);
                    should(res.body['s2'].final_score).equals(9);
                    should(res.body['s2'].avg_score).equals(8);
                    should(res.body['s2'].attempts).equals(7);
                    should(res.body['s2'].failures).equals(6);
                    should(res.body['s2'].success).equals(5);

                    should(res.body['s3']).equals(null);

                    done();
                });
        });

        it('should be able know if hasresults as a teacher', function (done) {
            request.get('/activities/' + activityid + '/hasresult')
                .expect(200)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    should.not.exist(err);
                    should(res.body).be.Object();

                    should(Object.keys(res.body).length).equals(3);
                    
                    should(res.body['s1']).equals(true);
                    should(res.body['s2']).equals(true);
                    should(res.body['s3']).equals(false);

                    done();
                });
        });

        it('should NOT be able to obtain the study schedule if you are a teacher but you dont participate', function (done) {
            request.get('/studies/' + studyid + '/schedule')
                .expect(400)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    should.not.exist(err);
                    should(res.body).be.Object();
                    should(res.body.message).equals('You are owner of the study but not participant');

                    done();
                });
        });

        it('should NOT have allocated the student before he tries to get its schedule', function (done) {
            request.get('/studies/' + studyid + '/allocator')
                .expect(200)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    should.not.exist(err);
                    should(res.body).be.Object();

                    if(res.body.extra_data){
                        if(res.body.allocations){
                            should.not.exist(res.body.allocations['s1']);
                        }
                    }

                    done();
                });
        });

        it('should be able to obtain the study schedule if user is a student', function (done) {
            request.post('/users/login')
                .expect(200)
                .send({username: 's1', password: 'pass1'})
                .end(function (err, res) {
                    if(err){
                        logger.info(err, res);
                    }
                    should(res.body).be.Object();
                    should.exist(res.body.token);
                    let tmptoken = res.body.token;

                    request.get('/studies/' + studyid + '/schedule')
                        .expect(200)
                        .set('Accept', 'application/json')
                        .set('Authorization', 'Bearer ' + tmptoken)
                        .end(function (err, res) {
                            should.not.exist(err);
                            should(res.body).be.Object();
                            
                            should(res.body).be.Object();
                                
                            should(res.body.activities).be.Object();
                            should(Object.keys(res.body.activities).length).equals(1);
                            should(res.body.activities[activityid].name).equals('testactivity');
                            should(res.body.activities[activityid].completed).equals(true);
                            should(res.body.activities[activityid].result).is.Object();
                            should(res.body.activities[activityid].result.final_score).equals(10);
                            should(res.body.next).equals(null);

                            done();
                        });
                });
        });

        it('should specify details in each of the activities of the schedule', function (done) {
            request.post('/users/login')
                .expect(200)
                .send({username: 's1', password: 'pass1'})
                .end(function (err, res) {
                    if(err){
                        logger.info(err, res);
                    }
                    should(res.body).be.Object();
                    should.exist(res.body.token);
                    let tmptoken = res.body.token;

                    request.get('/studies/' + studyid + '/schedule')
                        .expect(200)
                        .set('Accept', 'application/json')
                        .set('Authorization', 'Bearer ' + tmptoken)
                        .end(function (err, res) {
                            should.not.exist(err);
                            should(res.body).be.Object();
                                
                            should(res.body.activities).be.Object();
                            should(Object.keys(res.body.activities).length).equals(1);
                            should(res.body.activities[activityid].name).equals('testactivity');
                            should(res.body.activities[activityid].details).is.Object();

                            done();
                        });
                });
        });

        it('should have allocated the student after he tries to get its schedule', function (done) {
            request.get('/studies/' + studyid + '/allocator')
                .expect(200)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    should.not.exist(err);
                    should(res.body).be.Object();

                    if(res.body.extra_data){
                        if(res.body.allocations){
                            should.exist(res.body.allocations['s1']);
                        }
                    }

                    done();
                });
        });

        it('should be able to obtain a new schedule after teacher adding another activity', function (done) {

            let activity = {
                name: 'secondactivity',
                type: 'activity',
                owners: ['teacher']
            }
            
            addActivity(studyid, testid, activity, 200, function (err, res) {
                should.not.exist(err);
                activity = res.body;

                request.post('/users/login')
                    .expect(200)
                    .send({username: 's1', password: 'pass1'})
                    .end(function (err, res) {
                        if(err){
                            logger.info(err, res);
                        }
                        should(res.body).be.Object();
                        should.exist(res.body.token);
                        let tmptoken = res.body.token;

                        request.get('/studies/' + studyid + '/schedule')
                            .expect(200)
                            .set('Accept', 'application/json')
                            .set('Authorization', 'Bearer ' + tmptoken)
                            .end(function (err, res) {
                                should.not.exist(err);
                                should(res.body).be.Object();
                                
                                should(res.body.activities).be.Object();
                                should(Object.keys(res.body.activities).length).equals(2);
                                should(res.body.activities[activity._id].name).equals(activity.name);
                                should(res.body.next).equals(activity._id);

                                done();
                            });
                    });
            });
        });

        it('should be able to allocate the student to another test updating the allocator', function (done) {
            request.get('/studies/' + studyid)
                .expect(200)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    should.not.exist(err);
                    should(res.body).be.Object();

                    request.post('/studies/' + studyid + '/tests')
                        .expect(200)
                        .send({name: 'test b'})
                        .set('Accept', 'application/json')
                        .set('Authorization', 'Bearer ' + authToken)
                        .end(function (err, res) {
                            should.not.exist(err);
                            should(res.body).be.Object();
                            let tmpid = res.body._id;


                            request.get('/studies/' + studyid + '/allocator')
                                .expect(200)
                                .set('Accept', 'application/json')
                                .set('Authorization', 'Bearer ' + authToken)
                                .end(function (err, res) {
                                    should.not.exist(err);
                                    should(res.body).be.Object();

                                    let allocator = res.body;

                                    allocator.extra_data.allocations['s2'] = tmpid;

                                    request.put('/studies/' + studyid + '/allocator')
                                        .expect(200)
                                        .send(allocator)
                                        .set('Accept', 'application/json')
                                        .set('Authorization', 'Bearer ' + authToken)
                                        .end(function (err, res) {
                                            should.not.exist(err);
                                            should(res.body).be.Object();

                                            request.get('/studies/' + studyid + '/allocator')
                                                .expect(200)
                                                .set('Accept', 'application/json')
                                                .set('Authorization', 'Bearer ' + authToken)
                                                .end(function (err, res) {
                                                    should.not.exist(err);
                                                    should(res.body).be.Object();
                                                    should(res.body.extra_data.allocations["s2"]).equals(tmpid);
                                                    done();
                                                });
                                        });
                                });
                        });
                });
        });

        it('should be able to delete an activity by updating the test', function (done) {
            request.get('/studies/' + studyid + '/tests/' + testid)
                .expect(200)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    let test = res.body;
                    let tmpactivityid = test.activities[0];
                    test.activities.splice(0, 1);

                    request.put('/studies/' + studyid + '/tests/' + testid)
                        .expect(200)
                        .send(test)
                        .set('Accept', 'application/json')
                        .set('Authorization', 'Bearer ' + authToken)
                        .end(function (err, res) {
                            should.not.exist(err);
                            should(res.body).be.Object();
                            should(res.body.message).be.String();

                            Activity.find({_id: tmpactivityid}, function(error, docs){
                                should.not.exist(error);

                                should(docs.length).equals(0);
                                done();
                            });
                        });
                });
        });

        it('should NOT be able to add an activity by updating the test', function (done) {
            request.get('/studies/' + studyid + '/tests/' + testid)
                .expect(200)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    let test = res.body;
                    let tmpactivityid = test.activities[0];
                    test.activities.push('whatever')

                    request.put('/studies/' + studyid + '/tests/' + testid)
                        .expect(400)
                        .send(test)
                        .set('Accept', 'application/json')
                        .set('Authorization', 'Bearer ' + authToken)
                        .end(function (err, res) {
                            should.not.exist(err);
                            should(res.body).be.Object();
                            should(res.body.message).be.String();
                            should(res.body.message).equals('Activities cannot be added through put interface.');
                            done();
                        });
                });
        });

        it('should be able to delete an activity through activity delete api', function (done) {
            request.get('/studies/' + studyid + '/tests/' + testid)
                .expect(200)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    let test = res.body;
                    let tmpactivityid = test.activities[0];

                    request.delete('/activities/' + tmpactivityid)
                        .expect(200)
                        .set('Accept', 'application/json')
                        .set('Authorization', 'Bearer ' + authToken)
                        .end(function (err, res) {
                            should.not.exist(err);
                            should(res.body).be.Object();
                            should(res.body.message).be.String();

                            request.get('/studies/' + studyid + '/tests/' + testid)
                                .expect(200)
                                .set('Accept', 'application/json')
                                .set('Authorization', 'Bearer ' + authToken)
                                .end(function (err, res) {
                                    should.not.exist(err);
                                    should(res.body).be.Object();
                                    should(res.body.activities).be.Object();
                                    should(res.body.activities.indexOf(tmpactivityid)).equals(-1);
                                    done();
                                });
                        });
                });
        });
    });
};
