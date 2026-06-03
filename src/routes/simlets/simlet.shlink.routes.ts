
import { Router } from "express";
import * as SimletShlinkControler from "@/controlers/simlets/simlet.shlink.controler";
const router = Router({ mergeParams: true });

router.post("/", SimletShlinkControler.createShlinkURL);
router.get("/", SimletShlinkControler.getShlinkURL);
router.patch("/", SimletShlinkControler.updateShlinkURL);
router.delete("/", SimletShlinkControler.deleteShlinkURL);

export default router;