const express = require('express');
const activities = require('../services/activities');
const config = require('../../lib/config');
const logger = require('../../lib/logger');
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
    searchString: req.query['searchString'],
    skip: req.query['skip'],
    limit: req.query['limit'],
    user: req.user
  };

  try {
    const result = await activities.getActivities(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    return res.status(500).send({
      status: 500,
      error: 'Server Error'
    });
  }
});

/**
 * Creates a new activity for the current teacher.
 * 
 */
router.post('/', Authenticator.auth, async (req, res, next) => {
  const options = {
    body: req.body,
    files: req.files
  };

  try {
    const result = await activities.addActivity(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * Obtains the requested activity
 * 
 */
router.get('/:id', Authenticator.auth, async (req, res, next) => {
  const options = {
    id: req.params['id'],
    user: req.user
  };

  try {
    const result = await activities.getActivity(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * Updates an existing test
 */
router.put('/:id', Authenticator.auth, async (req, res, next) => {
  const options = {
    body: req.body,
    id: req.params['id']
  };

  try {
    const result = await activities.updateActivity(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * Deletes the specified activity
 * 
 */
router.delete('/:id', Authenticator.auth, async (req, res, next) => {
  const options = {
    id: req.params['id']
  };

  try {
    const result = await activities.deleteActivity(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * If the activity can be opened, e.g. is hosted in a web,
 * 
 * the activity will be openable as can be opened.
 * 
 */
router.get('/:id/openable', Authenticator.auth, async (req, res, next) => {
  const options = {
    id: req.params['id'],
    user: req.user
  };

  try {
    const result = await activities.getOpenable(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * If the activity is openable, gets the target URI
 * 
 * the activity landing.
 * 
 */
router.get('/:id/target', Authenticator.auth, async (req, res, next) => {
  const options = {
    id: req.params['id'],
    user: req.user,
    users: req.query['users']
  };

  try {
    logger.debug("Get target activity");
    const result = await activities.getTarget(options);
    logger.debug(result.data);
    //res.setHeader('Access-Control-Allow-Origin', config.external_url);
    //res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    //res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * If the activity is openable, redirects the user to
 * 
 * the activity landing.
 * 
 */
router.get('/:id/open', Authenticator.auth, async (req, res, next) => {
  const options = {
    id: req.params['id'],
    user: req.user
  };

  try {
    logger.debug("Redirect user to activity");
    const result = await activities.getTarget(options);
    //res.setHeader('Access-Control-Allow-Origin', config.external_url);
    //res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    //res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if(result && result.data && result.data[req.user.data.username]){
      logger.debug(result.data[req.user.data.username]);
      res.redirect(result.data[req.user.data.username]);
    }else{
      res.status(200).send({ message: 'Cannot be opened' });
    }
  } catch (err) {
    next(err);
  }
});

/**
 * Obtains the completion status of the activity
 * 
 */
router.get('/:id/completion', Authenticator.auth, async (req, res, next) => {
  const options = {
    id: req.params['id'],
    user: req.user,
    users: req.query['users']
  };

  try {
    const result = await activities.getCompletion(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * Set the completion status of the activity for a student
 * 
 */
router.post('/:id/completion', Authenticator.auth, async (req, res, next) => {
  const options = {
    id: req.params['id'],
    user: req.user,
    postuser: req.query['user'],
    body: req.body
  };

  try {
    const result = await activities.setCompletion(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * Set the completion status of the activity for a student
 * 
 */
router.get('/:id/presignedurl', Authenticator.auth, async (req, res, next) => {
  const options = {
    id: req.params['id'],
    user: req.user,
    postuser: req.query['user'],
    body: req.body
  };
  logger.info("/presignedurl")
  try {
    const result = await activities.getPresignedFileUrl(options);
    logger.info(result);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * Obtains the completion status of the activity
 * 
 */
router.get('/:id/result', Authenticator.auth, async (req, res, next) => {
  const options = {
    id: req.params['id'],
    user: req.user,
    users: req.query['users'],
    type: req.query['type'],
    token: (req.headers.authorization ? req.headers.authorization.split(" ")[1] : req.query.token),
    res: res,
  };

  try {
    const result = await activities.getResult(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * Set the completion status of the activity for a student
 * 
 */
router.post('/:id/result', Authenticator.auth, async (req, res, next) => {
  const options = {
    id: req.params['id'],
    user: req.user,
    postuser: req.query['user'],
    body: req.body
  };

  try {
    const result = await activities.setResult(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * Obtains if has result or not
 * 
 */
router.get('/:id/hasresult', Authenticator.auth, async (req, res, next) => {
  const options = {
    id: req.params['id'],
    user: req.user,
    users: req.query['users'],
    type: req.query['type']
  };

  try {
    const result = await activities.hasResult(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
