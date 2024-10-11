const express = require('express');
const studies = require('../services/studies');
const sseManager = require('../../lib/utils/sseManager');  // Import SSE Manager
let UsersController = require('../../lib/userscontroller');
const router = new express.Router();

// Validators
const validator = require('../../lib/utils/validator');
validator.addValidations('/studies', router);
const Authenticator = require('../../lib/utils/authenticator');
const logger = require('../../lib/logger');

/**
 * Obtains the list of studies for the current teacher.
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
router.post('/', Authenticator.auth, async (req, res, next) => {
  const options = {
    body: req.body,
    user: req.user
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
router.get('/:id', Authenticator.auth, async (req, res, next) => {
  const options = {
    id: req.params['id'],
    user: req.user
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
router.put('/:id', Authenticator.auth, async (req, res, next) => {
  const options = {
    body: req.body,
    id: req.params['id'],
    user: req.user
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
router.delete('/:id', Authenticator.auth, async (req, res, next) => {
  const options = {
    id: req.params['id'],
    user: req.user
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
router.get('/:id/schedule', Authenticator.auth, async (req, res, next) => {
  const options = {
    id: req.params['id'],
    user: req.user
  };

  try {
    const result = await studies.getSchedule(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * To send Server Side Event to Client
 * 
 */
router.get('/:id/events', async (req, res, next) => {
  // Extract the token from the query parameters
  const token = req.query.token;

  if (!token) {
      return res.status(401).json({ message: 'No token provided' });
  }

  // Verify the JWT token
  try{
     let user = await UsersController.validateJWT(token);
     logger.info(user);
     const options = {
       id: req.params['id'],
       user: user
     };
     logger.info(JSON.stringify(options));
     sseManager.addClient(req, res, options);
  } catch(e) {
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
router.get('/:id/schedule', Authenticator.auth, async (req, res, next) => {
  const options = {
    id: req.params['id'],
    user: req.user
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
router.get('/:id/groups', Authenticator.auth, async (req, res, next) => {
  const options = {
    id: req.params['id'],
    user: req.user
  };

  try {
    const result = await studies.getStudyGroups(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * Obtains the list of tests assigned to the study
 * 
 */
router.get('/:id/tests', Authenticator.auth, async (req, res, next) => {
  const options = {
    id: req.params['id'],
    user: req.user
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
router.post('/:id/tests', Authenticator.auth, async (req, res, next) => {
  const options = {
    body: req.body,
    id: req.params['id'],
    user: req.user
  };

  try {
    const result = await studies.addTestToStudy(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * Obtains the list of participants of the group
 * 
 */
router.get('/:id/participants', Authenticator.auth, async (req, res, next) => {
  const options = {
    id: req.params['id'],
    user: req.user
  };

  try {
    const result = await studies.getStudyParticipants(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * Obtains the requested test
 * 
 */
router.get('/:id/tests/:testid', Authenticator.auth, async (req, res, next) => {
  const options = {
    id: req.params['id'],
    testid: req.params['testid'],
    user: req.user
  };

  try {
    const result = await studies.getTest(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * Updates an existing test
 */
router.put('/:id/tests/:testid', Authenticator.auth, async (req, res, next) => {
  const options = {
    body: req.body,
    id: req.params['id'],
    testid: req.params['testid'],
    user: req.user
  };

  try {
    const result = await studies.updateTest(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * Deletes an existing test and its references
 */
router.delete('/:id/tests/:testid', Authenticator.auth, async (req, res, next) => {
  const options = {
    body: req.body,
    id: req.params['id'],
    testid: req.params['testid'],
    user: req.user
  };

  try {
    const result = await studies.deleteTest(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * Creates a new test for the current teacher.
 * 
 */
router.get('/:id/tests/:testid/activities', Authenticator.auth, async (req, res, next) => {
  const options = {
    id: req.params['id'],
    testid: req.params['testid'],
    user: req.user
  };

  try {
    const result = await studies.getTestActivities(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * Creates a new test for the current teacher.
 * 
 */
router.post('/:id/tests/:testid/activities', Authenticator.auth, async (req, res, next) => {
  const options = {
    body: req.body,
    id: req.params['id'],
    testid: req.params['testid'],
    user: req.user
  };

  try {
    const result = await studies.addActivityToTest(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});


/**
 * Obtains the allocator used by the study
 * 
 */
router.get('/:id/allocator', Authenticator.auth, async (req, res, next) => {
  const options = {
    id: req.params['id'],
    user: req.user
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
router.put('/:id/allocator', Authenticator.auth, async (req, res, next) => {
  const options = {
    body: req.body,
    id: req.params['id'],
    user: req.user
  };

  try {
    const result = await studies.setStudyAllocator(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
