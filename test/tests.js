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

var request = require('supertest'),
    app = require('../src/api/index'),
    config = require('../src/lib/config');

var config;

describe('API Test', function (done) {
    this.timeout(20000);
    /**Initialize MongoDB**/
    before(function (done) {
        console.log('##### CONNECTING TO API #####');
        app.listen(config.api.port, function (err) {
            if (err) {
                console.log('##### error connecting to api #####');
                done(err);
            } else {
                request = request(app);
                console.log('##### WAITING FOR MONGO #####');
                setTimeout(function () {
                    console.log('##### CONNECTED TO MONGO #####');
                    done();
                }, 2500);
            }
        });
    });

    it('Start tests', function (done) {
        require('./api/users')(request);
        done();
    });

});

