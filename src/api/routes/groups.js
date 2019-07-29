const express = require('express');
const groups = require('../services/groups');

const router = new express.Router();

// Validators
const validator = require('../../lib/validator');
validator.addValidations('/groups', router);

/**
 * Obtains the list of groups owned by current user.
 * 
 */
router.get('/', async (req, res, next) => {
  const options = {
    searchString: req.query['searchString'],
    skip: req.query['skip'],
    limit: req.query['limit']
  };

  try {
    const result = await groups.getGroups(options);
    res.status(result.status || 200).send(result.data);
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
    const result = await groups.addGroup(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * Obtains the requested group
 * 
 */
router.get('/:id', async (req, res, next) => {
  const options = {
    id: req.params['id']
  };

  try {
    const result = await groups.getGroup(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * Updates an existing group
 */
router.put('/:id', async (req, res, next) => {
  const options = {
    body: req.body,
    id: req.params['id']
  };

  try {
    const result = await groups.updateGroup(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * Obtains the list of studies assigned to the group
 * 
 */
router.get('/:id/studies', async (req, res, next) => {
  const options = {
    id: req.params['id']
  };

  try {
    const result = await groups.getGroupStudies(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * Adds a study for the current group
 * 
 */
router.post('/:id/studies', async (req, res, next) => {
  const options = {
    body: req.body,
    id: req.params['id']
  };

  try {
    const result = await groups.addStudyToGroup(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * Usefull for assistance in the classroom, the printable
 * 
 * version of the class allows the teacher to cut and
 * 
 * give the codes to the students easily to anonymize them.
 * 
 */
router.get('/:id/printable', async (req, res, next) => {
  const options = {
    id: req.params['id']
  };

  try {
    const result = await groups.getGroupPrintable(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
