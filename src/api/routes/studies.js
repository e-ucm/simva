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
const config = require('../../lib/config');
const { verifyMessage, createHMACKey } = require("../../lib/utils/hMacKey/crypto.js");

initHmacKey();

async function initHmacKey() {
  console.log("Initialized hmacKey");
  config.hmac.hmacKey = (await createHMACKey(config.hmac.password
    //, {
    //  encodedSalt: config.hmac.salt,
    //  encodedKey: config.hmac.key
    //}
  )).key;
}

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
 * Creates a new study from import for the current teacher.
 * 
 */
router.post('/import', Authenticator.auth, async (req, res, next) => {
  const options = {
    file: req.body.file,
    user: req.user
  };

  try {
    const result = await studies.addStudyFromImport(options);
    res.status(result.status || 200).send(result.data);
  } catch (err) {
    next(err);
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
router.get('/:id/schedule/events', async (req, res, next) => {
  // Extract the token from the query parameters
  const signature = req.query.signature;

  if (!signature) {
      return res.status(401).json({ message: 'No signature provided' });
  }

  const url = config.api.url + req.baseUrl + req.path;
  const query = req.query;
  if(validateUrl(url, query)) {
    let user = req.query.username;
    logger.info(user);
    var clientId = sseManager.addClient(req, res);
    const options = {
        id: req.params['id'],
        user: user,
        userRole: "student",
        clientId: clientId
    };
    await studies.getStudyEvents(options);
  } else {
      return res.status(401).json({ message: 'Signature not valid' });
  }
});

/**
 * To send Server Side Event to Client
 * 
 */
router.get('/:id/events', async (req, res, next) => {
  // Extract the token from the query parameters
  const signature = req.query.signature;

  if (!signature) {
      return res.status(401).json({ message: 'No signature provided' });
  }

  const url = config.api.url + req.baseUrl + req.path;
  const query = req.query;
  if(validateUrl(url, query)) {
    var clientId= sseManager.addClient(req, res);
    const options = {
        id: req.params['id'],
        userRole: "teacher",
        clientId: clientId
    };
    await studies.getStudyEvents(options);
  } else {
      return res.status(401).json({ message: 'Signature not valid' });
  }
});

async function validateUrl(url, query) {
  const signature = query.signature;
  console.log(signature);
  var toSign=Object.entries(query)
          .filter(([key, value])=> key !== "signature")
          .sort(([keyA], [keyB]) => keyA.localeCompare(keyB)) // Sort by keys
          .map(([key, value]) => `${key}=${value}`)
          .join('\n');
  toSign= url + '\n' + toSign;
  console.log(toSign);
  if(config.hmac.hmacKey == null) {
      console.log("Initialized hmacKey");
      config.hmac.hmacKey = (await createHMACKey(config.hmac.password
        //, {
        //  encodedSalt: config.hmac.salt,
        //  encodedKey: config.hmac.key
        //}
      )).key;
  }
  if(verifyMessage(toSign, signature, config.hmac.hmacKey)) {
    console.log("Valid signature !");
    return true;
  } else {
    console.log("Invalid signature !");
    return false;
  }
};

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
 * Obtains the study export
 * 
 */
router.get('/:id/export', Authenticator.auth, async (req, res, next) => {
  const options = {
    id: req.params['id'],
    user: req.user
  };

  try {
    const result = await studies.getStudyExport(options);
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
 * Updates an existing test
 */
router.patch('/:id/tests/:testid', Authenticator.auth, async (req, res, next) => {
  const options = {
    body: req.body,
    id: req.params['id'],
    testid: req.params['testid'],
    user: req.user
  };

  console.log(options);

  try {
    const result = await studies.updateTestName(options);
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
