const express = require('express');

const router = new express.Router();

const Authenticator = require('../../lib/utils/authenticator');
var sendSimvaTaskToKafka = require('../../lib/utils/SimvaTaskToKafka.js');

/**
 * Obtains the list of activities for the current teacher.
 * 
 */
router.post('/', Authenticator.auth, async (req, res, next) => {
  try {
    result=await sendSimvaTaskToKafka(req.body);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    return res.status(500).send({
      status: 500,
      error: 'Server Error'
    });
  }
});

module.exports = router;
