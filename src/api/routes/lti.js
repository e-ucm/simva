const express = require('express');
const lti = require('../services/lti');
let tool = require('../../lib/lti/tool');
const logger = require('../../lib/logger');

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
  logger.debug('claims get');
  logger.debug(req.query);
  logger.debug(req.body);

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
  logger.debug('claims post');
  logger.debug(req.query);
  logger.debug(req.body);
  logger.debug(req.headers.authorization);
  
  const options = {
    lti_login_hint: req.body['login_hint'],
    lti_message_hint: req.body['lti_message_hint']
  };

  try {
    let result = { status: 200, data: { error: 'No message hint received' } };

    logger.debug('#### Claims post:');

    if(options.lti_message_hint){
      result = await lti.getLtiClaims(options);
    }else{
      logger.debug('## Bad Claims request');
      logger.debug(req.body);
    }


    logger.debug(JSON.stringify(result));
    
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

router.use('/tool', tool.provider.app);

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

/**
 * gets the list of LTI platforms
 */
router.get('/platforms', Authenticator.auth, async (req, res, next) => {
  const options = {
    searchString: req.query['searchString'],
    skip: req.query['skip'],
    limit: req.query['limit']
  };

  logger.debug(options);

  try {
    const result = await lti.getLtiPlatforms(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    return res.status(500).send({
      status: 500,
      error: 'Server Error'
    });
  }
});

/**
 * Adds an lti platform that will be later available for the studies
 */
router.post('/platforms', Authenticator.auth, async (req, res, next) => {
  const options = {
    body: req.body,
    user: req.user
  };

  try {
    const result = await lti.addLtiPlatform(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * gets the LTI platform with the given ID
 */
router.get('/platforms/:id', Authenticator.auth, async (req, res, next) => {
  const options = {
    id: req.params['id']
  };

  try {
    const result = await lti.getLtiPlatform(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * Updates an existing LTI platform
 */
router.put('/platforms/:id', Authenticator.auth, async (req, res, next) => {
  const options = {
    body: req.body,
    id: req.params['id']
  };

  try {
    const result = await lti.updateLtiPlatform(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * Deletes an existing LTI platform
 */
router.delete('/platforms/:id', Authenticator.auth, async (req, res, next) => {
  const options = {
    id: req.params['id']
  };

  try {
    const result = await lti.deleteLtiPlatform(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

router.get('/context/:id/lineitems', async (req, res, next) => {
  let options = {
    context_id: req.params['id']
  };

  try {
    const result = await lti.getLtiLineItems(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    return res.status(500).send({
      status: 500,
      error: 'Server Error'
    });
  }
});

router.get('/context/:id/lineitems/:lineitem', async (req, res, next) => {
  let options = {
    context_id: req.params['id'],
    lineitem: req.params['lineitem']
  };

  try {
    const result = await lti.getLtiLineItem(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    return res.status(500).send({
      status: 500,
      error: 'Server Error'
    });
  }
});

router.put('/context/:id/lineitems/:lineitem', async (req, res, next) => {
  let options = {
    context_id: req.params['id'],
    lineitem: req.params['lineitem'],
    content: req.body
  };

  try {
    const result = await lti.putLtiLineItem(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    return res.status(500).send({
      status: 500,
      error: 'Server Error'
    });
  }
});

router.post('/context/:id/lineitems/:lineitem/score', async (req, res, next) => {
  let options = {
    context_id: req.params['id'],
    lineitem: req.params['lineitem'],
    content: req.body
  };

  try {
    const result = await lti.setLtiLineItemScore(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    return res.status(500).send({
      status: 500,
      error: 'Server Error'
    });
  }
});

router.get('/context/:id/lineitems/:lineitem/results', async (req, res, next) => {
  let options = {
    context_id: req.params['id'],
    lineitem: req.params['lineitem']
  };

  try {
    const result = await lti.getLtiLineItemResults(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    return res.status(500).send({
      status: 500,
      error: 'Server Error'
    });
  }
});

router.get('/context/:id/memberships', async (req, res, next) => {
  let options = {
    context_id: req.params['id']
  };

  try {
    const result = await lti.getLtiMemberships(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    return res.status(500).send({
      status: 500,
      error: 'Server Error'
    });
  }
});

module.exports = router;
