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
            console.log('ID: ' + id + ' NOT FOUND');
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
                console.log('############## OBJECT 1 ##############')
                console.log(JSON.stringify(o1, null, 2));
                console.log('############## OBJECT 2 ##############')
                console.log(JSON.stringify(o2, null, 2));
                console.log('######################################')
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
                                console.log(err, res);
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
                                        console.log(err, res);
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
                                                            console.log(err, res);
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
                        done();
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
                        console.log(err, res);
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

        it('should be able to add an activity to a test', function (done) {
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
                        console.log(err, res);
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

        it('should NOT be able to obtain if it is openable or not if its only owner', function (done) {
           request.get('/activities/' + activityid + '/openable')
                .expect(401)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    should.not.exist(err);
                    should(res.body).be.Object();
                    should(res.body.message).be.String();

                    done();
                });
        });

        it('should be able to obtain if it is openable if it is a student participant', function (done) {

            request.post('/users/login')
                .expect(200)
                .send({username: 's1', password: 'pass1'})
                .end(function (err, res) {
                    if(err){
                        console.log(err, res);
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

        it('should be able to set its completion status', function (done) {

            request.post('/users/login')
                .expect(200)
                .send({username: 's1', password: 'pass1'})
                .end(function (err, res) {
                    if(err){
                        console.log(err, res);
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

                            console.log(res.body);

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
                        console.log(err, res);
                    }
                    should(res.body).be.Object();
                    should.exist(res.body.token);
                    let tmptoken = res.body.token;

                    request.get('/activities/' + activityid + '/completion')
                        .expect(200)
                        .send({ status: true })
                        .set('Accept', 'application/json')
                        .set('Authorization', 'Bearer ' + tmptoken)
                        .end(function (err, res) {
                            should.not.exist(err);
                            should(res.body).be.Object();

                            console.log(res.body);

                            done();
                        });
                });
        });

    });
};
