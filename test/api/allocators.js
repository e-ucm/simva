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
    describe('GroupAllocator tests', function () {
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

        it('should be able to obtain the list of allocator types', function (done) {

            request.get('/allocatortypes')
                .expect(200)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    should.not.exist(err);

                    should(res.body.length).equals(2);
                    should(res.body[0].type).equals('default');
                    should(res.body[1].type).equals('group');
                    done();
                });
        });

        it('should be able to prepare the study with test, groups, and one activity', function (done) {
            let study = {
                name: 'teststudy',
                groups: [groupid1, groupid2]
            }

            let test = {
                name: 'CASEA'
            }

            let activity = {
                name: 'testactivity',
                type: 'activity'
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
                    should(res.body.groups).be.instanceof(Array).and.have.lengthOf(2);
                    should(mongoose.Types.ObjectId.isValid(res.body.allocator)).equals(true);
                    should(res.body.owners.indexOf('teacher')).equals(0);
                    studyid = res.body._id;

                    request.post('/studies/' + studyid + '/tests')
                        .expect(200)
                        .send(test)
                        .set('Accept', 'application/json')
                        .set('Authorization', 'Bearer ' + authToken)
                        .end(function (err, res) {
                            should.not.exist(err);
                            should(res.body).be.Object();
                            should(res.body.name).equals(test.name);

                            testid = res.body._id;

                            let activity = {
                                name: 'testactivity',
                                type: 'activity',
                                owners: ['teacher']
                            }
                            
                            addActivity(studyid, testid, activity, 200, function (err, res) {
                                should.not.exist(err);
                                should(res.body).be.Object();
                                done();
                            });
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

        it('should be able to Add another test and activity to the same study', function (done) {
            let test2 = {
                name: 'CASEB'
            }

            let activity = {
                name: 'testactivity2',
                type: 'activity'
            }

            request.post('/studies/' + studyid + '/tests')
                .expect(200)
                .send(test2)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    should.not.exist(err);
                    should(res.body).be.Object();
                    should(res.body.name).equals(test2.name);

                    testid2 = res.body._id;

                    let activity = {
                        name: 'testactivity2',
                        type: 'activity',
                        owners: ['teacher']
                    }
                    
                    addActivity(studyid, testid2, activity, 200, function (err, res) {
                        should.not.exist(err);
                        should(res.body).be.Object();
                        done();
                    });
                });
        });

        it('should be able to set the allocator to GroupAllocator', function (done) {
            let allocator = {
                type: 'group'
            }

            request.put('/studies/' + studyid + '/allocator')
                .expect(200)
                .send(allocator)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    should.not.exist(err);
                    should(res.body).be.Object();
                    should(res.body.message).equals("Allocator updated");

                    request.get('/studies/' + studyid + '/allocator')
                        .expect(200)
                        .set('Accept', 'application/json')
                        .set('Authorization', 'Bearer ' + authToken)
                        .end(function (err, res) {
                            should.not.exist(err);
                            should(res.body.type).equals(allocator.type);

                            done();
                        });
                });
        });

        it('should be able to obtain the schedule if user is a student', function (done) {
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
                            should(res.body.activities[res.body.next].name).equals('testactivity');

                            done();
                        });
                });
        });

        it('should be able to update the allocation for group1 to be test CASEB', function (done) {

            request.get('/studies/' + studyid)
                .expect(200)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    let study = res.body;

                    request.get('/studies/' + studyid + '/allocator')
                        .expect(200)
                        .set('Accept', 'application/json')
                        .set('Authorization', 'Bearer ' + authToken)
                        .end(function (err, res) {
                            should.not.exist(err);

                            let allocator = res.body;

                            allocator.extra_data.allocations[groupid1] = testid2;

                            request.put('/studies/' + studyid + '/allocator')
                                .expect(200)
                                .send(allocator)
                                .set('Accept', 'application/json')
                                .set('Authorization', 'Bearer ' + authToken)
                                .end(function (err, res) {
                                    should.not.exist(err);

                                    done();
                                });
                        });
                });
        });

        it('should be able to obtain the schedule if user is a student and now shoud be testactivity2', function (done) {
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
                            should(res.body.activities[res.body.next].name).equals('testactivity2');

                            done();
                        });
                });
        });
    });
};
