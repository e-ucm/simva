import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { Buffer } from "buffer";
import { config } from "@/lib/config";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { NotFoundError } from "@/lib/errors/appErrors";
import KafkaClient from "@/lib/utils/kafkaclient";
import { LimesurveyActivity } from "@/lib/mappers/activities/LimesurveyActivity";
import { User } from "@/lib/mappers/Users/User";

let kafkaClient : KafkaClient = new KafkaClient({
    clientId: config.kafka.clientId,
    brokers: config.kafka.brokers,
    groupId: config.kafka.groupId,
    topic: config.kafka.eventsTopic
});

export async function limesurveyWebhookHandler(req: Request, res: Response) {
  // Process the webhook payload here
  logger.info("Received valid webhook payload:", req.body);

  logger.info(JSON.stringify(req.body));
  var type;
  if(req.body.event == "beforeSurveyPage") {
    type='activity_initialized';
  } else if(req.body.event == "afterSurveyComplete") {
    type='activity_completed';
  } else {
    throw new NotFoundError("Event not treated");
  };
  let surveyId = req.body.event_details.surveyId;
  let limesurvey_activity = await db.Functions.runViewQuery(db.Views.Activity.byLimesurveySurveyId, { surveyId });
  let messages : string[] = [];
  if (Array.isArray(limesurvey_activity) && limesurvey_activity.length > 0) {
    if(limesurvey_activity.length > 1) {
        logger.warn({ surveyId, count: limesurvey_activity.length }, 'Multiple activities found for the same surveyId, this should not happen');
    }
    const activity = limesurvey_activity[0];
    const token: string = req.body.event_details.token;
    let participant_id: number | undefined;
    try {
      const user = await User.getFromDbData(undefined, token);
      participant_id = user.user_id;
    } catch (e) {
      logger.warn({ token }, 'Could not resolve participant_id for limesurvey token');
    }
    const message = {
      type: type,
      activity_type: LimesurveyActivity.getType(),
      survey_id: surveyId,
      activity_id: activity.activity_id,
      simlet_id: activity.simlet_id,
      username: token,
      ...(participant_id !== undefined ? { participant_id } : {})
    };
    messages.push(JSON.stringify(message));
  }
  if(messages.length > 0) {
    await kafkaClient.connectToProducer();
    await kafkaClient.sendMessages(messages);
  }
  res.status(200).send({ message: 'Message treated' });
}


export async function verifyHookdeckSignature(
  req : Request,
  res : Response,
  next : NextFunction
) {
  if (!config.limesurvey.SECRET) {
    console.warn(
      "No Hookdeck Signing Secret: Skipping webhook verification. Do not do this in production!"
    );
    return next();
  }

  const headers: { [key: string]: any } = {};
  const incomingHeaders = req.headers;

  for (const [key, value] of Object.entries(incomingHeaders)) {
    headers[key] = value;
  }

  const rawBody = req.body;

  const conf={
    checkSourceVerification: false,
  };
  const result = validatePayload(headers,
    rawBody,
    conf
  );

  if (!result.isValidSignature) {
    logger.info("Signature is invalid, rejected");
    res.sendStatus(401);
  } else {
    logger.info("Signature is valid, accepted");
    next();
  }
};

//Validate payload
function validatePayload(headers : any, rawBody : any, conf : any) {
  if (headers[config.limesurvey.headerName]) {
    //Extract Signature header
    const signature = headers[config.limesurvey.headerName] || "";
    logger.info(signature);
    const sig = Buffer.from(signature);

    //Calculate HMAC
    const hmac = crypto.createHmac("sha256", config.limesurvey.SECRET);
    const digest = Buffer.from(
      config.limesurvey.headerPrefix + hmac.update(JSON.stringify(rawBody)).digest("hex"),
      "utf8",
    );
    logger.info(digest.toString());

    //Compare HMACs
    if (sig.length !== digest.length || !crypto.timingSafeEqual(digest, sig)) {
      return { isValidSignature: false };
    } else {
      return { isValidSignature: true };
    }
  }
  return { isValidSignature: false };
}