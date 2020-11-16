const express = require('express');
const studies = require('../services/studies');

const router = new express.Router();

// Validators
const validator = require('../../lib/utils/validator');
validator.addValidations('/activities', router);
const Authenticator = require('../../lib/utils/authenticator');

/**
 * Obtains the list of activities for the current teacher.
 * 
 */
router.get('/', Authenticator.auth, async (req, res, next) => {
  const options = {
    user: req.user
  };

  try {
    const result = await studies.getAllocatorTypes(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    return res.status(500).send({
      status: 500,
      error: 'Server Error'
    });
  }
});

module.exports = router;
