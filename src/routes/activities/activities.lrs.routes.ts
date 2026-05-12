///////////////////////////////////////////
/////////////// LRS METHOD ////////////////
///////////////////////////////////////////

import * as activitiesLRSControler from "@/controlers/activities/activitiesLRS.controler";
import { Router } from "express";

const router: Router = Router({ mergeParams: true });

router.get("/statements", activitiesLRSControler.getStatementsLRSForActivity);
router.get("/statements/more", activitiesLRSControler.getMoreStatementsLRSForActivity);
router.post("/statements", activitiesLRSControler.postStatementsLRSForActivity);
router.put("/statements", activitiesLRSControler.putStatementsLRSForActivity);
router.get("/agents", activitiesLRSControler.getAgentsLRSForActivity);
router.get("/agents/profile", activitiesLRSControler.getAgentsProfileLRSForActivity);
router.post("/agents/profile", activitiesLRSControler.postAgentsProfileLRSForActivity);
router.put("/agents/profile", activitiesLRSControler.putAgentsProfileLRSForActivity);
router.delete("/agents/profile", activitiesLRSControler.deleteAgentsProfileLRSForActivity);
router.get("/activities", activitiesLRSControler.getActivitiesLRSForActivity);
router.get("/activities/profile", activitiesLRSControler.getActivitiesProfileLRSForActivity);
router.post("/activities/profile", activitiesLRSControler.postActivitiesProfileLRSForActivity);
router.put("/activities/profile", activitiesLRSControler.putActivitiesProfileLRSForActivity);
router.delete("/activities/profile", activitiesLRSControler.deleteActivitiesProfileLRSForActivity);
router.get("/activities/state", activitiesLRSControler.getActivitiesStateLRSForActivity);
router.post("/activities/state", activitiesLRSControler.postActivitiesStateLRSForActivity);
router.put("/activities/state", activitiesLRSControler.updateActivitiesStateLRSForActivity);
router.delete("/activities/state", activitiesLRSControler.deleteActivitiesStateLRSForActivity);
router.get("/about", activitiesLRSControler.getAboutLRSForActivity);
router.get("/extension/:extension_id", activitiesLRSControler.getExtensionLRSForActivity);    

export default router;