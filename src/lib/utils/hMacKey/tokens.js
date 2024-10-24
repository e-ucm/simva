const { signMessage, verifyMessage } = require("./crypto.js");
const logger = require('../../logger.js');

async function validateUrl(url, query, hmacKey) {
  const signature = query.signature;
  logger.info(signature);
  var toSign=Object.entries(query)
          .filter(([key, value])=> key !== "signature")
          .sort(([keyA], [keyB]) => keyA.localeCompare(keyB)) // Sort by keys
          .map(([key, value]) => `${key}=${value}`)
          .join('\n');
  toSign= url + '\n' + toSign;
  logger.info(toSign);
  try {
    if(await verifyMessage(toSign, signature, hmacKey)) {
      logger.info("Valid signature !");
      return true;
    } else {
      logger.info("Invalid signature !");
      return false;
    }
  } catch(e) {
      logger.info(e);
      return false;
  }
};


async function createUrl(url, mapParameters, hmacKey) {
  const buffer = new Uint8Array(8);
  crypto.getRandomValues(buffer);

  mapParameters.ts = (new Date()).toISOString();
  var toSign=Object.entries(mapParameters)
          .sort(([keyA], [keyB]) => keyA.localeCompare(keyB)) // Sort by keys
          .map(([key, value]) => `${key}=${value}`)
          .join('\n');
  toSign=url + '\n' + toSign;
  var signature;
  try {
     signature = await signMessage(toSign, hmacKey);
  } catch(e) {
      logger.info(e);
      signature = "TODO";
  }
  const queryString = Object.entries(mapParameters)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB)) // Sort by keys
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
      url = url + `?${queryString}&signature=${signature}`;

  return { data : {url : url} };
}

module.exports = {validateUrl, createUrl};