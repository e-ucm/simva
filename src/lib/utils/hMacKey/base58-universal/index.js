/*!
 * Copyright (c) 2019-2022 Digital Bazaar, Inc. All rights reserved.
 */
const {
    encode : _encode,
    decode : _decode
} = require('./baseN.js');

// base58 characters (Bitcoin alphabet)
const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/**
 * 
 * @param {Uint8Array} input 
 * @returns {string}
 */

function encode(input, maxline) {
    return _encode(input, alphabet, maxline);
}

/**
 * 
 * @param {string} input 
 * @returns {Uint8Array}
 */
function decode(input) {
    return _decode(input, alphabet);
}