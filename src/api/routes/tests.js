const express = require('express');
const tests = require('../services/tests');

const router = new express.Router();

// Validators
const validator = require('../../lib/utils/validator');
validator.addValidations('/tests', router);

/**
 * Obtains the requested test
 * 
 */
router.get('/:id', async (req, res, next) => {
  const options = {
    id: req.params['id']
  };

  try {
    const result = await tests.getTest(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * Updates an existing test
 */
router.put('/:id', async (req, res, next) => {
  const options = {
    body: req.body,
    id: req.params['id']
  };

  try {
    const result = await tests.updateTest(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * Creates a new test for the current teacher.
 * 
 */
router.get('/:id/activities', async (req, res, next) => {
  const options = {
    id: req.params['id']
  };

  try {
    const result = await tests.getTestActivities(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * Creates a new test for the current teacher.
 * 
 */
router.post('/:id/activities', async (req, res, next) => {
  const options = {
    body: req.body,
    id: req.params['id']
  };

  try {
    const result = await tests.addActivityToTest(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
