const { decode, encode } = require('./base58-universal/index.js');

/**
 * 
 * @param {string} message 
 * @returns 
 */
function getMessageEncoding(message) {
    let enc = new TextEncoder();
    return enc.encode(message);
}

/**
 * 
 * @param {string} message
 * @param {CryptoKey} key 
 * 
 * @returns {Promise<string>}
 */
async function signMessage(message, key) {
    const encoded = getMessageEncoding(message);
    const signature = await crypto.subtle.sign(
        "HMAC",
        key,
        encoded
    );

    const value = encode(new Uint8Array(signature));
    return value;
}

/**
 * 
 * @param {string} message
 * @param {string} signature
 * @param {CryptoKey} key 
 * 
 * @returns {Promise<boolean>}
 */
async function verifyMessage(message, signature, key) {
    const decodedSignature = decode(signature);
    const encoded = getMessageEncoding(message);
    const result = await crypto.subtle.verify(
        "HMAC",
        key,
        decodedSignature,
        encoded
    );

    return result;
}

/** @type {HmacKeyGenParams} */
const ALGORITHM = {
    name: "HMAC",
    hash: { name: "SHA-1" }
};

/**
 * @returns {Promise<CryptoKey>}
 */
async function generateRandomHMACKey() {
    const key = await crypto.subtle.generateKey(
        ALGORITHM,
        true,
        ["sign", "verify"]
    );
    return key;
}

/**
 * @param {string} textKey
 *
 * @returns {Promise<CryptoKey>}
 */
async function importKey(textKey) {
    const encoded = getMessageEncoding(textKey);

    const key = await crypto.subtle.importKey(
        "raw", // raw format of the key - should be Uint8Array
        encoded,
        ALGORITHM,
        false, // = false
        ["sign", "verify"] // what this key can do
    );

    return key;
}

/**
 * 
 * @param {Uint8Array | string} password 
 * @returns {Promise<CryptoKey>}
 */
async function getKeyMaterial(password) {
    let encodedPassword;

    if (typeof password === 'string') {
        encodedPassword = getMessageEncoding(password);
    } else {
        encodedPassword = password;
    }

    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encodedPassword,
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"],
    );

    return keyMaterial;
}

/**
 * 
 * @param {CryptoKey} keyMaterial 
 * @param {Uint8Array} salt 
 * @returns 
 */
async function getWrapKey(keyMaterial, salt) {
    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt,
            iterations: 100000,
            hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-KW", length: 256 },
        true,
        ["wrapKey", "unwrapKey"],
    );
}

/**
 * 
 * @param {CryptoKey} keyToWrap 
 * @param {CryptoKey} keyMaterial 
 * @param {Uint8Array} salt
 * 
 * @returns {Promise<string>}
 */
async function wrapCryptoKey(keyToWrap, keyMaterial, salt) {
    const wrappingKey = await getWrapKey(keyMaterial, salt);

    const wrappedKey = await crypto.subtle.wrapKey("raw", keyToWrap, wrappingKey, "AES-KW");
    const encodedWrappedKey = encode(new Uint8Array(wrappedKey));
    return encodedWrappedKey;
}

/**
 * 
 * @param {number} size
 * 
 * @returns {Uint8Array} 
 */
function generateSalt(size = 16) {
    return crypto.getRandomValues(new Uint8Array(size));
}

// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/wrapKey#examples
/*
window.crypto.subtle
  .generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"],
  )
  .then((secretKey) => wrapCryptoKey(secretKey))
  .then((wrappedKey) => console.log(wrappedKey));
  */

/**
 * 
 * @param {Uint8Array} wrappedKey 
 * @param {CryptoKey} keyMaterial 
 * @param {Uint8Array} salt
 * @returns {Promise<CryptoKey>}
 */
async function unwrapHmacKey(wrappedKey, keyMaterial, salt) {
    const unwrappingKey = await getWrapKey(keyMaterial, salt);

    const unwrappedKey = await crypto.subtle.unwrapKey(
        "raw", // import format
        wrappedKey, // ArrayBuffer representing key to unwrap
        unwrappingKey, // CryptoKey representing key encryption key
        "AES-KW", // algorithm identifier for key encryption key
        ALGORITHM, // algorithm identifier for key to unwrap
        true, // extractability of key to unwrap
        ["sign", "verify"], // key usages for key to unwrap
    );
    return unwrappedKey;
}


const DEFAULT_PASSWORD='12345';

/**
 * @param {string} [encodedPassword]
 * @param {HMACKey} [hmacKey]
 *
 * @returns {Promise<CreateHMACKey>}
 */
async function createHMACKey(encodedPassword = DEFAULT_PASSWORD, hmacKey) {
    let encodedSalt = '';
    let encodedKey = '';
    if (hmacKey) {
        encodedKey = hmacKey.encodedKey;
        encodedSalt = hmacKey.encodedSalt;
    }

    let salt;
    if (encodedSalt && encodedSalt.length > 0) {
        salt = decode(encodedSalt);
    } else {
        salt = generateSalt();
        encodedSalt = encode(salt)
    }

    let keyMaterial;
    if (encodedPassword && encodedPassword.length > 0) {
        const password = decode(encodedPassword);
        keyMaterial = await getKeyMaterial(password);
    } else {
        const password = generateSalt();
        encodedPassword = encode(password);
        keyMaterial = await getKeyMaterial(password);
    }

    let key;
    if (encodedKey && encodedKey.length > 0) {
        const keyBytes = decode(encodedKey);
        key = await unwrapHmacKey(keyBytes, keyMaterial, salt);
    } else {
        key = await generateRandomHMACKey();
        encodedKey = await wrapCryptoKey(key, keyMaterial, salt);
    }


    return {
        key,
        salt,
        encodedKey,
        encodedSalt,
        encodedPassword
    };
}
