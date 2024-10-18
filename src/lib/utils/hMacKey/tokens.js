const { signMessage, verifyMessage } = require("./crypto.js");

const DEFAULT_REGISTRO_VIEWER_URL = 'http://localhost:3000/registro.html';

/**
 * 
 * @param {CryptoKey} key
 * @param {number} numeroToken
 * @param {string} idStand
 * @param {string} stand
 *
 * @returns {Promise<TokenData>}
 */
async function generateData(key, numeroToken, idStand, stand) {
    const buffer = new Uint8Array(8);
    crypto.getRandomValues(buffer);

    const token = numeroToken.toString();
    /** @type {{name: string; value: string}[]} */
    const params = [
        {
            name: 'stand',
            value: idStand
        },
        {
            name: 'token',
            value: token
        }
    ];
    //params.sort((e1, e2) => e1.name.localeCompare(e2.name));
    let unsignedData = params.map((param) => `${param.name}=${param.value}`).join('\n');

    const signature = await signMessage(unsignedData, key);

    const searchParams = new URLSearchParams();
    params.forEach((param) => {
        searchParams.append(param.name, param.value);
    })
    searchParams.append('signature', signature);
    const baseUrl = window.__REGISTRO_VIEWER_URL__ ?? DEFAULT_REGISTRO_VIEWER_URL;
    const url = `${baseUrl}?${searchParams.toString()}`;

    /** @type {TokenData} */
    const tokenData = {
        stand,
        idStand,
        token,
        signature,
        url,
    };

    return tokenData;
}

/**
 * @param {GeneratorOptions} options
 * @returns {Promise<TokenData[]>}
 */
async function generateTokens(options) {
    const tokens = [];
    const limit = options.inicio + options.cuantos - 1;
    for(let idx = options.inicio; idx <= limit; idx++) {
        const data = await generateData(options.key, idx, options.idStand, options.stand);
        tokens.push(data);
    }
    return tokens;
}



/**
 * @param {CryptoKey} key
 * @param {TokenData[]} tokens
 * @returns {Promise<boolean[]>}
 */
async function verifyTokens(key, tokens) {
    const verifications = [];
    for(const token of tokens) {
        const verification = await verifyToken(key, token);
        verifications.push(verification);
    }
    return verifications;
}

/**
 * @param {CryptoKey} key
 * @param {TokenData} token
 * @returns {Promise<boolean>}
 */
async function verifyToken(key, token) {

    const tokenValue = token.token;
    /** @type {{name: string; value: string}[]} */
    const params = [
        {
            name: 'stand',
            value: token.idStand
        },
        {
            name: 'token',
            value: tokenValue
        }
    ];
    //params.sort((e1, e2) => e1.name.localeCompare(e2.name));
    let unsignedData = params.map((param) => `${param.name}=${param.value}`).join('\n');

    const verification = await verifyMessage(unsignedData, token.signature, key);
    return verification;
}

module.exports = {verifyToken, verifyTokens, generateTokens, generateData};