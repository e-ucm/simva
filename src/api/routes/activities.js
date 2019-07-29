const express = require('express');
const activities = require('../services/activities');

const router = new express.Router();

// Validators
const validator = require('../../lib/validator');
validator.addValidations('/activities', router);

/**
 * Obtains the list of activities for the current teacher.
 * 
 */
router.get('/', async (req, res, next) => {
  const options = {
    searchString: req.query['searchString'],
    skip: req.query['skip'],
    limit: req.query['limit']
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
router.post('/', async (req, res, next) => {
  const options = {
    body: req.body
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
router.get('/:id', async (req, res, next) => {
  const options = {
    id: req.params['id']
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
router.put('/:id', async (req, res, next) => {
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
 * If the activity can be opened, e.g. is hosted in a web,
 * 
 * the activity will be openable as can be opened.
 * 
 */
router.get('/:id/openable', async (req, res, next) => {
  const options = {
    id: req.params['id']
  };

  try {
    const result = await activities.getOpenable(options);
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
router.get('/:id/open', async (req, res, next) => {
  const options = {
    id: req.params['id']
  };

  try {
    const result = await activities.openActivity(options);
    res.status(200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * Obtains the completion status of the activity
 * 
 */
router.get('/:id/completion', async (req, res, next) => {
  const options = {
    id: req.params['id']
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
router.post('/:id/completion', async (req, res, next) => {
  const options = {
    id: req.params['id'],
    user: req.query['user']
  };

  try {
    const result = await activities.setCompletion(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
