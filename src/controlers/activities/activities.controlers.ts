import { AuthenticatedRequest } from "@/middlewares/auth.middleware";
import { NextFunction, Response } from "express";
import * as activitiesService from "@/services/activities/activities.service";

export async function getActivity(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    let currentUser = req.user?.sql;
    const activityId = parseInt(req.params.activity_id as string);
    const activity = await activitiesService.getActivity(activityId, currentUser!.user_id as number);
    return res.json(activity);
  } catch (err) {
    next(err);
  }
}