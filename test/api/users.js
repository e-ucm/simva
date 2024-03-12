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
    Comparator = require('../utils/comparator');

var CompareStoredObject = function(id, object, callback){
    User.find({_id: id}, function(error, docs){
        if(docs.length !== 1 ){
            console.log('ID: ' + id + ' NOT FOUND');
            callback({message: 'id not found'}, false);
        }else{
            let o1 = JSON.parse(JSON.stringify(docs[0]));
            let o2 = JSON.parse(JSON.stringify(object));

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
    User.find({}, function(error, docs){
        if(docs.length === 0){
            callback({message: 'id not found'});
        }else{
            callback(null, docs[0]);
        }
    });
}

let authToken = null;

module.exports = function (request) {

    /**-------------------------------------------------------------**/
    /**-------------------------------------------------------------**/
    /**                     Test Users API                          **/
    /**-------------------------------------------------------------**/
    /**-------------------------------------------------------------**/
    describe('Users tests', function () {
        /*before(function (done) {
            mongoose.connection.collection('users').insert(
                [{
                    username: 'user1',
                    password: 'pass1',
                    email: '1@test.com',
                    role: 'teacher',
                    external_entity: []
                },
                {
                    username: 'user3',
                    password: 'pass3',
                    email: '3@test.com',
                    role: 'teacher',
                    external_entity: []
                },
                {
                    username: 'user3',
                    password: 'pass3',
                    email: '3@test.com',
                    role: 'teacher',
                    external_entity: []
                }]
        });*/
        after(function (done) {
            mongoose.connection.collection('users').drop(function(){
                done();
            });
        });

        it('should add an user', function (done) {
            let user = {
                username: 'test',
                password: 'testing',
                email: 'test@testerino.com',
                role: 'teacher'
            }

            request.post('/users')
                .expect(200)
                .send(user)
                .set('Accept', 'application/json')
                .end(function (err, res) {
                    if(err){
                        console.log(err, res);
                    }

                    should.not.exist(err);
                    should(res.body).be.Object();
                    should(res.body.username).equals(user.username);
                    should(res.body.email).equals(user.email);
                    should(res.body.role).equals(user.role);

                    CompareStoredObject(res.body._id, res.body, function(err, res){
                        should.not.exist(err);
                        should(res).equals(true);
                        done();
                    });
                });
        });

        it('should NOT add an user with an existing username', function (done) {
            let user = {
                username: 'test',
                password: 'testing',
                email: 'test@testerino.com',
                role: 'teacher'
            }

            request.post('/users')
                .expect(400)
                .send(user)
                .set('Accept', 'application/json')
                .end(function (err, res) {
                    if(err){
                        console.log(err, res);
                    }

                    should.not.exist(err);
                    should(res.body).be.Object();
                    should(res.body.message).equals('Username already exists.');
                    done();
                });
        });

        it('should NOT add an user with an existing email', function (done) {
            let user = {
                username: 'testwhatever',
                password: 'testing',
                email: 'test@testerino.com',
                role: 'teacher'
            }

            request.post('/users')
                .expect(400)
                .send(user)
                .set('Accept', 'application/json')
                .end(function (err, res) {
                    if(err){
                        console.log(err, res);
                    }

                    should.not.exist(err);
                    should(res.body).be.Object();
                    should(res.body.message).equals('Email already exists.');
                    done();
                });
        });

        it('should not allow to add a user without username', function (done) {
            let user = {
                password: 'testing',
                email: 'test@testerino.com',
                role: 'teacher'
            }

            request.post('/users')
                .expect(400)
                .send(user)
                .set('Accept', 'application/json')
                .end(function (err, res) {
                    should.not.exist(err);
                    should(res.body).be.Object();
                    should(res.body.message).be.String();
                    done();
                });
        });

        it('should not allow to add a user without password', function (done) {
            let user = {
                username: "testing",
                email: 'test@testerino.com',
                role: 'teacher'
            }

            request.post('/users')
                .expect(400)
                .send(user)
                .set('Accept', 'application/json')
                .end(function (err, res) {
                    should.not.exist(err);
                    should(res.body).be.Object();
                    should(res.body.message).be.String();
                    done();
                });
        });

        it('should not allow to add a user without email', function (done) {
            let user = {
                username: "testing",
                password: 'testing',
                role: 'teacher'
            }

            request.post('/users')
                .expect(400)
                .send(user)
                .set('Accept', 'application/json')
                .end(function (err, res) {
                    should.not.exist(err);
                    should(res.body).be.Object();
                    should(res.body.message).be.String();
                    done();
                });
        });

        it('should not allow to add a user without role', function (done) {
            let user = {
                username: "testing",
                password: 'testing',
                email: 'test@testerino.com'
            }

            request.post('/users')
                .expect(400)
                .send(user)
                .set('Accept', 'application/json')
                .end(function (err, res) {
                    should.not.exist(err);
                    should(res.body).be.Object();
                    should(res.body.message).be.String();
                    done();
                });
        });

        it('should login the user', function (done) {
            let user = {
                username: 'test',
                password: 'testing'
            }

            request.post('/users/login')
                .expect(200)
                .send(user)
                .set('Accept', 'application/json')
                .end(function (err, res) {
                    if(err){
                        console.log(err, res);
                    }

                    should.not.exist(err);
                    should(res.body).be.Object();
                    should.exist(res.body.token);
                    authToken = res.body.token;
                    done();
                });
        });

        it('should login the user ignoring letter case', function (done) {
            let user = {
                username: 'tEsT',
                password: 'testing'
            }

            request.post('/users/login')
                .expect(200)
                .send(user)
                .set('Accept', 'application/json')
                .end(function (err, res) {
                    if(err){
                        console.log(err, res);
                    }

                    should.not.exist(err);
                    should(res.body).be.Object();
                    should.exist(res.body.token);
                    authToken = res.body.token;
                    done();
                });
        });

        it('should NOT login the user if User exists but pass is wrong', function (done) {
            let user = {
                username: 'test',
                password: 'badpass'
            }

            request.post('/users/login')
                .expect(400)
                .send(user)
                .set('Accept', 'application/json')
                .end(function (err, res) {
                    should.not.exist(err);
                    should(res.body).be.Object();
                    should.exist(res.body.message);
                    done();
                });
        });

        it('should NOT login the user if User not exists', function (done) {
            let user = {
                username: 'unexistent',
                password: 'testingasd'
            }

            request.post('/users/login')
                .expect(400)
                .send(user)
                .set('Accept', 'application/json')
                .end(function (err, res) {
                    should.not.exist(err);
                    should(res.body).be.Object();
                    should.exist(res.body.message);
                    done();
                });
        });

        it('should get the user details', function (done) {
            request.get('/users/me')
                .expect(200)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    if(err){
                        console.log(err, res);
                    }

                    should.not.exist(err);
                    should(res.body).be.Object();
                    CompareStoredObject(res.body._id, res.body, function(err, result){
                        should.not.exist(err);
                        should(result).equals(true);
                        done();
                    });
                });
        });

        it('should not be able to obtain detais if not authorized', function (done) {
            request.get('/users/me')
                .expect(401)
                .set('Accept', 'application/json')
                .end(function (err, res) {
                    if(err){
                        console.log(err, res);
                    }
                    should.not.exist(err);
                    should(res.body).be.Object();
                    should(res.body.message).equals('No authorization header');

                    done();
                });
        });

        it('should not be able to obtain detais if auth is not bearer', function (done) {
            request.get('/users/me')
                .expect(401)
                .set('Accept', 'application/json')
                .set('Authorization', 'whatever auth')
                .end(function (err, res) {
                    if(err){
                        console.log(err, res);
                    }
                    should.not.exist(err);
                    should(res.body).be.Object();
                    should(res.body.message).equals('Auth header is not a valid Bearer.');

                    done();
                });
        });

        it('should not be able to obtain detais if auth is wrong', function (done) {
            request.get('/users/me')
                .expect(401)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer wrong')
                .end(function (err, res) {
                    if(err){
                        console.log(err, res);
                    }
                    should.not.exist(err);
                    should(res.body).be.Object();
                    should(res.body.message).equals('JWT token is not valid.');

                    done();
                });
        });

        it('should NOT accept JWT tokens signed with algorithm "none"', function (done) {
            let token = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJkYXRhIjp7ImlkIjoiNWViYzYzYz'
                + 'cwNTUxY2E0Y2E4N2FmZGQwIiwidXNlcm5hbWUiOiJ0ZXN0IiwiZW1haWwiOiJ0ZXN0QHRlc3'
                + 'Rlcmluby5jb20iLCJyb2xlIjoidGVhY2hlciJ9LCJpYXQiOjE1ODk0MDQ2MTUsImV4cCI6MTU4OTQ5MTAxNSwiaXNzIjoic2ltdmEifQ';

            request.get('/users/me')
                .expect(401)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + token)
                .end(function (err, res) {
                    if(err){
                        console.log(err, res);
                    }
                    should.not.exist(err);
                    should(res.body).be.Object();
                    should(res.body.message).equals('JWT token is not valid.');
                    should(res.body.error.message).equals('JWT not valid or unsupported signing algoritm');

                    done();
                });
        });

        it('should NOT add a secondary account and link it to the first one if bad JWT', function (done) {
            let linkbody = {
                main: authToken,
                secondary: 'asddsadsadsa',
                domain: 'simva'
            }

            request.post('/users/link')
                .expect(400)
                .send(linkbody)
                .set('Accept', 'application/json')
                .end(function (err, res) {
                    should.not.exist(err);
                    should(res.body).be.Object();
                    should.exist(res.body.message);
                    done();
                });
        });

        it('should add a secondary account and link it to the first one', function (done) {
            let user = {
                username: 'test2',
                password: 'testing',
                email: 'test2@testerino.com',
                role: 'teacher'
            }

            request.post('/users')
                .expect(200)
                .send(user)
                .set('Accept', 'application/json')
                .end(function (err, res) {
                    if(err){
                        console.log(err, res);
                    }

                    should.not.exist(err);
                    should(res.body).be.Object();
                    should(res.body.username).equals(user.username);
                    should(res.body.email).equals(user.email);
                    should(res.body.role).equals(user.role);

                    CompareStoredObject(res.body._id, res.body, function(err, res){
                        should.not.exist(err);
                        should(res).equals(true);
                        let user = {
                            username: 'test2',
                            password: 'testing'
                        }

                        request.post('/users/login')
                            .expect(200)
                            .send(user)
                            .set('Accept', 'application/json')
                            .end(function (err, res) {
                                if(err){
                                    console.log(err, res);
                                }

                                should.not.exist(err);
                                should(res.body).be.Object();
                                should.exist(res.body.token);

                                let linkbody = {
                                    main: authToken,
                                    secondary: res.body.token
                                }
                                

                                request.post('/users/link')
                                    .expect(200)
                                    .send(linkbody)
                                    .set('Accept', 'application/json')
                                    .end(function (err, res) {
                                        if(err){
                                            console.log(err, res);
                                        }

                                        should.not.exist(err);
                                        should(res.body).be.Object();
                                        should.exist(res.body.external_entity);
                                        done();
                                    });
                            });
                    });
                });   
        });
    });
};
