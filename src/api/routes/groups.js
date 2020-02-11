const express = require('express');
const groups = require('../services/groups');

const router = new express.Router();

// Validators
const validator = require('../../lib/utils/validator');
validator.addValidations('/groups', router);
const Authenticator = require('../../lib/utils/authenticator');

/**
 * Obtains the list of groups owned by current user.
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
router.post('/', Authenticator.auth, async (req, res, next) => {
  const options = {
    body: req.body,
    user: req.user
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
router.get('/:id', Authenticator.auth, async (req, res, next) => {
  const options = {
    id: req.params['id'],
    user: req.user
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
router.put('/:id', Authenticator.auth, async (req, res, next) => {
  const options = {
    body: req.body,
    id: req.params['id'],
    user: req.user
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
router.get('/:id/studies', Authenticator.auth, async (req, res, next) => {
  const options = {
    id: req.params['id'],
    user: req.user
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
router.post('/:id/studies', Authenticator.auth, async (req, res, next) => {
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
 * Obtains the list of participants of the group
 * 
 */
router.get('/:id/participants', Authenticator.auth, async (req, res, next) => {
  const options = {
    id: req.params['id'],
    user: req.user
  };

  try {
    const result = await groups.getGroupParticipants(options);
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
router.get('/:id/printable', Authenticator.auth, async (req, res, next) => {
  const options = {
    id: req.params['id'],
    user: req.user
  };

  try {
    const result = await groups.getGroupPrintable(options);

    if(result.status === 200){
      res.writeHead(200, [['Content-Type', 'application/pdf']]);
      res.end(new Buffer(result.data, 'base64'));
    }else{
      res.status(result.status).send(result.data);
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
