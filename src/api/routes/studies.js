const express = require('express');
const studies = require('../services/studies');

const router = new express.Router();

// Validators
const validator = require('../../lib/utils/validator');
validator.addValidations('/studies', router);

/**
 * Obtains the list of studies for the current teacher.
 * 
 */
router.get('/', async (req, res, next) => {
  const options = {
    searchString: req.query['searchString'],
    skip: req.query['skip'],
    limit: req.query['limit']
  };

  try {
    const result = await studies.getStudies(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    return res.status(500).send({
      status: 500,
      error: 'Server Error'
    });
  }
});

/**
 * Creates a new study for the current teacher.
 * 
 */
router.post('/', async (req, res, next) => {
  const options = {
    body: req.body
  };

  try {
    const result = await studies.addStudy(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * Obtains the requested study
 * 
 */
router.get('/:id', async (req, res, next) => {
  const options = {
    id: req.params['id']
  };

  try {
    const result = await studies.getStudy(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * Updates an existing stidy
 */
router.put('/:id', async (req, res, next) => {
  const options = {
    body: req.body,
    id: req.params['id']
  };

  try {
    const result = await studies.updateStudy(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * Deleted designed study
 * 
 */
router.delete('/:id', async (req, res, next) => {
  const options = {
    id: req.params['id']
  };

  try {
    const result = await studies.deleteStudy(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * Obtains the list of scheduled activities for the current
 * 
 * student and study, and its completion status. Hides the
 * 
 * current used test to the user.
 * 
 */
router.get('/:id/schedule', async (req, res, next) => {
  const options = {
    id: req.params['id']
  };

  try {
    const result = await studies.getSchedule(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * Obtains the list of groups assigned to the study
 * 
 */
router.get('/:id/groups', async (req, res, next) => {
  const options = {
    id: req.params['id']
  };

  try {
    const result = await studies.getStudyGroups(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * Adds a group for the current study
 * 
 */
router.post('/:id/groups', async (req, res, next) => {
  const options = {
    body: req.body,
    id: req.params['id']
  };

  try {
    const result = await studies.addGroupToStudy(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * removes a group from the study
 * 
 */
router.delete('/:id/groups', async (req, res, next) => {
  const options = {
    body: req.body,
    id: req.params['id']
  };

  try {
    const result = await studies.addGroupToStudy(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * Obtains the list of tests assigned to the study
 * 
 */
router.get('/:id/tests', async (req, res, next) => {
  const options = {
    id: req.params['id']
  };

  try {
    const result = await studies.getStudyTests(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * Adds a test for the current group
 * 
 */
router.post('/:id/tests', async (req, res, next) => {
  const options = {
    body: req.body,
    id: req.params['id']
  };

  try {
    const result = await studies.addTestToStudy(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * Obtains the allocator used by the study
 * 
 */
router.get('/:id/allocator', async (req, res, next) => {
  const options = {
    id: req.params['id']
  };

  try {
    const result = await studies.getStudyAllocator(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * Updates the allocator from the study
 * 
 */
router.put('/:id/allocator', async (req, res, next) => {
  const options = {
    body: req.body,
    id: req.params['id']
  };

  try {
    const result = await studies.setStudyAllocator(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
