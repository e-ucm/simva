const express = require('express');
const lti = require('../services/lti');

const router = new express.Router();

// Validators
const validator = require('../../lib/utils/validator');
validator.addValidations('/lti', router);
const Authenticator = require('../../lib/utils/authenticator');

/**
 * Returns an object that specifies if simva is acting as
 * an LTI platform and/or LTI tool
 */
router.get('/', Authenticator.auth, async (req, res, next) => {
  const options = {
    user: req.user
  };

  try {
    const result = await lti.getLtiStatus(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    return res.status(500).send({
      status: 500,
      error: 'Server Error'
    });
  }
});

/**
 * An lti tool launch will provide two parameters including
 * lti_message_hint and lti_login_hint and, in base of that,
 * this endpoint will return an object including all the claims
 * needed for the tool to work.
 */
router.get('/claims', async (req, res, next) => {
  const options = {
    lti_login_hint: req.query['login_hint'],
    lti_message_hint: req.query['lti_message_hint']
  };

  try {
    const result = await lti.getLtiClaims(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    return res.status(500).send({
      status: 500,
      error: 'Server Error'
    });
  }
});

/**
 * An lti tool launch will provide two parameters including
 * lti_message_hint and lti_login_hint and, in base of that,
 * this endpoint will return an object including all the claims
 * needed for the tool to work.
 */
router.post('/claims', async (req, res, next) => {
  const options = {
    lti_login_hint: req.body['login_hint'],
    lti_message_hint: req.body['lti_message_hint']
  };

  try {
    const result = await lti.getLtiClaims(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    return res.status(500).send({
      status: 500,
      error: 'Server Error'
    });
  }
});

/**
 * Obtains the list of lti tools available
 */
router.get('/tools', Authenticator.auth, async (req, res, next) => {
  const options = {
    searchString: req.query['searchString'],
    skip: req.query['skip'],
    limit: req.query['limit']
  };

  try {
    const result = await lti.getLtiTools(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    return res.status(500).send({
      status: 500,
      error: 'Server Error'
    });
  }
});

/**
 * Adds an lti tool that will be later available for the activities
 */
router.post('/tools', Authenticator.auth, async (req, res, next) => {
  const options = {
    body: req.body,
    user: req.user
  };

  try {
    const result = await lti.addLtiTool(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * gets the LTI tool with the given ID
 */
router.get('/tools/:id', Authenticator.auth, async (req, res, next) => {
  const options = {
    id: req.params['id']
  };

  try {
    const result = await lti.getLtiTool(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * Updates an existing LTI tool
 */
router.put('/tools/:id', Authenticator.auth, async (req, res, next) => {
  const options = {
    body: req.body,
    id: req.params['id']
  };

  try {
    const result = await lti.updateLtiTool(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * Deletes an existing LTI tool
 */
router.delete('/tools/:id', Authenticator.auth, async (req, res, next) => {
  const options = {
    id: req.params['id']
  };

  try {
    const result = await lti.deleteLtiTool(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
