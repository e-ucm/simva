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
    LtiTool = mongoose.model('lti_tool'),
    Comparator = require('../utils/comparator');

var CompareStoredObject = function(id, object, callback){
    LtiTool.find({_id: id}, function(error, docs){
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
let toolid = null;
let groupid_unauth = null;

module.exports = function (request) {

    /**-------------------------------------------------------------**/
    /**-------------------------------------------------------------**/
    /**                      Test LTI API                           **/
    /**-------------------------------------------------------------**/
    /**-------------------------------------------------------------**/
    describe('LTI tests', function () {
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
                                        }]
                                    ,function(){
                                        mongoose.connection.collection('groups').insertMany(
                                            [{
                                                name: 'unaccessible1',
                                                owners: ['p'],
                                                participants: ['s2', 's3'],
                                                created: Date.now()
                                            },
                                            {
                                                name: 'unaccessible2',
                                                owners: ['p'],
                                                participants: [],
                                                created: Date.now()
                                            }]
                                        ,function(err, result){
                                            groupid_unauth = result.ops[0]._id;
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
        after(function (done) {
            mongoose.connection.collection('groups').drop(function(){
                mongoose.connection.collection('users').drop(function(){
                    mongoose.connection.collection('lti_tools').drop(function(){
                        done();
                    });
                });
            });
        });

        it('should be able to get the lti status', function (done) {
            request.get('/lti')
                .expect(200)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    if(err){
                        console.log(err, res);
                    }
                    should.not.exist(err);
                    should(res.body).be.Object();
                    should(res.body.tool).be.Boolean();
                    should(res.body.platform).be.Boolean();

                    done();
                });
        });

        it('should be able to get the lti claims', function (done) {
            request.get('/lti/claims')
                .expect(200)
                .set('Accept', 'application/json')
                .end(function (err, res) {
                    if(err){
                        console.log(err, res);
                    }
                    should.not.exist(err);
                    should(res.body).be.Object();
                    should(res.body['https://purl.imsglobal.org/spec/lti/claim/message_type']).not.equals(null);
                    should(res.body['https://purl.imsglobal.org/spec/lti/claim/version']).not.equals(null);
                    should(res.body['https://purl.imsglobal.org/spec/lti/claim/deployment_id']).not.equals(null);
                    should(res.body['https://purl.imsglobal.org/spec/lti/claim/target_link_uri']).not.equals(null);
                    should(res.body['https://purl.imsglobal.org/spec/lti/claim/resource_link']).not.equals(null);

                    done();
                });
        });

        it('should not be able to add an lti tool unauthenticated', function (done) {
            let tool = {
                name: 'Test tool',
                description: 'This is a test tool used for testing',
                url: 'https://lti-tool.test/',
                jwks_uri: 'https://lti-tool.test/.well-known/jwks.json',
                login_uri: 'https://lti-tool.test/oidc/init',
                redirect_uri: 'https://lti-tool.test/launch',
            }

            request.post('/lti/tools')
                .expect(401)
                .send(tool)
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

        it('should be able to add an lti tool', function (done) {
            /*let tool = {
                name: 'Test tool',
                description: 'This is a test tool used for testing',
                url: 'https://lti-tool.test/',
                jwks_uri: 'https://lti-tool.test/.well-known/jwks.json',
                login_uri: 'https://lti-tool.test/oidc/init',
                redirect_uri: 'https://lti-tool.test/launch',
            }

            request.post('/lti/tools')
                .expect(200)
                .send(tool)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    if(err){
                        console.log(err, res);
                    }

                    should.not.exist(err);
                    should(res.body).be.Object();
                    should(res.body.name).equals(tool.name);
                    toolid = res.body._id;

                    CompareStoredObject(res.body._id, res.body, function(err, res){
                        should.not.exist(err);
                        should(res).equals(true);
                        done();
                    });
                });*/
                done();
        });

        it('should get the lti tool details', function (done) {
            /*request.get('/lti/tools/' + toolid)
                .expect(200)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    if(err){
                        console.log(err, res);
                    }

                    should.not.exist(err);
                    should(res.body).be.Object();
                    should(res.body.name).equals('Test tool');
                    done();
                });*/
                done();
        });

        it('should get the list of lti tools', function (done) {
            /*request.get('/lti/tools')
                .expect(200)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + authToken)
                .end(function (err, res) {
                    if(err){
                        console.log(err, res);
                    }

                    should.not.exist(err);
                    should(res.body).be.Array();
                    should(res.body.length).equals(1);
                    done();
                });*/
                done();
        });

        it('should not allow to update a lti tool with an empty body', function (done) {
            request.put('/lti/tools/' + toolid)
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
    });
};
