const express = require('express');
const users = require('../services/users');

const router = new express.Router();

// Validators
const validator = require('../../lib/utils/validator');
const Authenticator = require('../../lib/utils/authenticator');
validator.addValidations('/users', router);


/**
 * Obtains the list of groups owned by current user.
 * 
 */
router.get('/', Authenticator.auth, async (req, res, next) => {
  const options = {
    searchString: req.query['searchString'],
    skip: req.query['skip'],
    limit: req.query['limit']
  };

  try {
    const result = await users.getUsers(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    return res.status(500).send({
      status: 500,
      error: 'Server Error'
    });
  }
});

/**
 * Obtains the list of groups owned by current user.
 * 
 */
router.get('/me', Authenticator.auth, async (req, res, next) => {
  const options = {
    searchString: JSON.stringify({ username: req.user.data.username })
  };

  try {
    const result = await users.getUsers(options);
    res.status(result.status || 200).send(result.data[0]);
  } catch (err) {
    return res.status(500).send({
      status: 500,
      error: 'Server Error'
    });
  }
});

/**
 * Creates a new group for the current user as owner.
 * 
 */
router.post('/', async (req, res, next) => {
  const options = {
    body: req.body
  };

  try {
    const result = await users.addUser(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * Creates a new group for the current user as owner.
 * 
 */
router.post('/login', async (req, res, next) => {
  const options = {
    body: req.body
  };

  try {
    const result = await users.loginUser(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
