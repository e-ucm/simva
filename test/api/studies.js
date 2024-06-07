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
    Comparator = require('../utils/comparator');

var CompareStoredObject = function(id, object, callback){
    Study.find({_id: id}, function(error, docs){
        if(docs.length !== 1 ){
            logger.info('ID: ' + id + ' NOT FOUND');
            callback({message: 'id not found'}, false);
        }else{
            let o1 = JSON.parse(JSON.stringify(docs[0]));
            let o2 = JSON.parse(JSON.stringify(object));

            if(!Comparator.deepCompare(o1, o2)){
                logger.info('############## OBJECT 1 ##############')
                logger.info(JSON.stringify(o1, null, 2));
                logger.info('############## OBJECT 2 ##############')
                logger.info(JSON.stringify(o2, null, 2));
                logger.info('######################################')
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
let authToken2 = null;
let teacherid = null;
let groupid1 = null;
let groupid2 = null;
let studyid = null;
let groupid_unauth = null;
let studyid_unauth = null;

module.exports = function (request) {

    /**-------------------------------------------------------------**/
    /**-------------------------------------------------------------**/
    /**                     Test Group API                          **/
    /**-------------------------------------------------------------**/
    /**-------------------------------------------------------------**/
    describe('Study tests', function () {
        before(function (done) {

            let teacher = {
                username: 'teacher',
                password: 'pass1',
                email: 'teacher@test.com',
                role: 'teacher'
            }

            let teacher2 = {
                username: 'teacher2',
                password: 'pass2',
                email: 'teacher2@test.com',
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

                            request.post('/users')
                                .expect(200)
                                .send(teacher2)
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
        });
        after(function (done) {
            mongoose.connection.collection('groups').drop(function(){
                mongoose.connection.collection('users').drop(function(){
                    mongoose.connection.collection('studies').drop(function(){
                        mongoose.connection.collection('tests').drop(function(){
                            done();
                        });
                    });
                });
            });
        });

        it('should not be able to add an study unauthenticated', function (done) {
            let group = {
                name: 'teststudy'
            }

            request.post('/studies')
                .expect(401)
                .send(group)
                .set('Accept', 'application/json')
                .end(function (err, res) {
                    if(err){
                        logger.info(err, res);
                    }
                    should.not.exist(err);
                    should(res.body).be.Object();
                    should(res.body.message).equals('No authorization header');

                    done();
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

                    CompareStoredObject(res.body._id, res.body, function(err, res){
                        should.not.exist(err);
                        should(res).equals(true);
                        done();
                    });
                });
        });

        it('should be able to obtain only its studies', function (done) {
            request.get('/studies')
                .expect(200)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    /*if(err){
                        logger.info(err, res);
                    }*/

                    should.not.exist(err);
                    should(res.body).be.instanceof(Array).and.have.lengthOf(1);
                    for(let i = 0; i < res.body.length; i++){
                        should(res.body[i].owners.indexOf('teacher')).equals(0);
                    }

                    done();
                });
        });

        it('should get the study details', function (done) {
            request.get('/studies/' + studyid)
                .expect(200)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    if(err){
                        logger.info(err, res);
                    }

                    should.not.exist(err);
                    should(res.body).be.Object();
                    should(res.body.name).equals('teststudy');
                    done();
                });
        });

        it('should not get study details if its not owner', function (done) {
            request.get('/studies/' + studyid_unauth)
                .expect(401)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    if(err){
                        logger.info(err, res);
                    }
                    done();
                });
        });

        it('should not allow to update an study with an empty body', function (done) {
            request.put('/studies/' + studyid)
                .expect(400)
                .send({})
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    should.not.exist(err);
                    should(res.body).be.Object();
                    should(res.body.message).be.String();
                    done();
                });
        });

        it('should not allow to update a study without name', function (done) {
            request.get('/studies/' + studyid)
                .expect(200)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    let study = res.body;
                    delete study.name;
                    request.put('/studies/' + studyid)
                        .expect(400)
                        .send(study)
                        .set('Accept', 'application/json')
                        .set('Authorization', 'Bearer ' + authToken)
                        .end(function (err, res) {
                            should.not.exist(err);
                            should(res.body).be.Object();
                            should(res.body.message).be.String();
                            done();
                        });
                });
        });

        it('should not allow to update an study and remove yourself as owner', function (done) {
            request.get('/studies/' + studyid)
                .expect(200)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    let study = res.body;
                    study.owners = [];
                    request.put('/studies/' + studyid)
                        .expect(400)
                        .send(study)
                        .set('Accept', 'application/json')
                        .set('Authorization', 'Bearer ' + authToken)
                        .end(function (err, res) {
                            should.not.exist(err);
                            should(res.body).be.Object();
                            should(res.body.message).be.String();
                            done();
                        });
                });
        });

        it('should not allow to update an study and add an owner that doesnt exist', function (done) {
            request.get('/studies/' + studyid)
                .expect(200)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    let study = res.body;
                    study.owners.push('unexistent');
                    request.put('/studies/' + studyid)
                        .expect(404)
                        .send(study)
                        .set('Accept', 'application/json')
                        .set('Authorization', 'Bearer ' + authToken)
                        .end(function (err, res) {
                            should.not.exist(err);
                            should(res.body).be.Object();
                            should(res.body.message).be.String();

                            study.owners.splice(study.owners.indexOf('unexistent'),1);

                            CompareStoredObject(studyid, study, function(err, res){
                                should.not.exist(err);
                                should(res).equals(true);
                                done();
                            });
                        });
                });
        });

        it('should be able to delete a test by the delete test route', function (done) {
            let test = {
                name: 'testtest'
            }

            request.post('/studies/' + studyid + '/tests')
                .expect(200)
                .send(test)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    should.not.exist(err);
                    should(res.body).be.Object();
                    should(res.body.name).equals(test.name);
                    let testid = res.body._id;

                    request.get('/studies/' + studyid)
                        .expect(200)
                        .set('Accept', 'application/json')
                        .set('Authorization', 'Bearer ' + authToken)
                        .end(function (err, res) {
                            let study = res.body;
                            study.tests = [];
                            request.delete('/studies/' + studyid + '/tests/' + testid)
                                .expect(200)
                                .send(study)
                                .set('Accept', 'application/json')
                                .set('Authorization', 'Bearer ' + authToken)
                                .end(function (err, res) {
                                    should.not.exist(err);
                                    should(res.body).be.Object();
                                    should(res.body.message).be.String();
                                    Test.find({_id: testid}, function(error, docs){
                                        should.not.exist(error);

                                        should(docs.length).equals(0);
                                        done();
                                    });
                                });
                        });
                });
        });

        it('should not contain the test after deleting a test through delete test route', function (done) {
            request.get('/studies/' + studyid)
                .expect(200)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    should.not.exist(err);
                    should(res.body).be.Object();

                    let study = res.body;
                    should(study.tests.length).equals(0);

                    done();
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

                            CompareStoredObject(studyid, study, function(err, res){
                                should.not.exist(err);
                                should(res).equals(true);
                                done();
                            });
                        });
                    });
        });

        it('should be able to delete a test by updating the study', function (done) {
            request.get('/studies/' + studyid)
                .expect(200)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    let study = res.body;
                    let testid = res.body.tests[0];
                    study.tests = [];
                    request.put('/studies/' + studyid)
                        .expect(200)
                        .send(study)
                        .set('Accept', 'application/json')
                        .set('Authorization', 'Bearer ' + authToken)
                        .end(function (err, res) {
                            should.not.exist(err);
                            should(res.body).be.Object();
                            should(res.body.message).be.String();

                            Test.find({_id: testid}, function(error, docs){
                                should.not.exist(error);

                                should(docs.length).equals(0);
                                done();
                            });
                        });
                });
        });

        it('should be able to obtain study participants', function (done) {
            request.get('/studies/' + studyid)
                .expect(200)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    should.not.exist(err);
                    let study = res.body;

                    study.groups.push(groupid1);

                    request.put('/studies/' + studyid)
                        .expect(200)
                        .send(study)
                        .set('Accept', 'application/json')
                        .set('Authorization', 'Bearer ' + authToken)
                        .end(function (err, res) {
                            should.not.exist(err);
                            request.get('/studies/' + studyid + '/participants')
                                .expect(200)
                                .set('Accept', 'application/json')
                                .set('Authorization', 'Bearer ' + authToken)
                                .end(function (err, res) {
                                    should.not.exist(err);
                                    should(res.body).be.Object();
                                    should(res.body.length).equals(3);
                                    should(res.body[0].username).equals('s1');
                                    done();
                                });
                        });
                });
        });

        it('should be able to obtain the studies where the group participates', function (done) {
            request.get('/groups/' + groupid1 + '/studies')
                .expect(200)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    should.not.exist(err);
                    should(res.body).be.Object();
                    should(res.body.length).equals(1);
                    should(res.body[0]._id).equals(studyid);
                    done();
                });

        });

        it('should be able to link two accounts', function (done) {
            let user = {
                username: "teacher2",
                password: "pass2"
            }

            request.post('/users/login')
                .expect(200)
                .send(user)
                .set('Accept', 'application/json')
                .end(function (err, res) {
                    if(err){
                        logger.info(err, res);
                    }

                    should.not.exist(err);
                    should(res.body).be.Object();
                    should.exist(res.body.token);

                    authToken2 = res.body.token;

                    let linkbody = {
                        main: authToken,
                        secondary: authToken2
                    }
                    

                    request.post('/users/link')
                        .expect(200)
                        .send(linkbody)
                        .set('Accept', 'application/json')
                        .end(function (err, res) {
                            if(err){
                                logger.info(err, res);
                            }

                            should.not.exist(err);
                            should(res.body).be.Object();
                            should.exist(res.body.external_entity);
                            done();
                        });
                });
        });

        it('should be able to obtain the studies of the secondary linked account', function (done) {
            request.get('/studies')
                .expect(200)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    should(res.body.length).equals(1);
                    done();
                });
        });

        it('should be able to obtain the studies of the main linked account', function (done) {
            request.get('/studies')
                .expect(200)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken2)
                .end(function (err, res) {
                    should(res.body.length).equals(1);
                    done();
                });
        });
    });
};
