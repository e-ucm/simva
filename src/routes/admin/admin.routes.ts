///////////////////////////////////////////
////////////// ADMIN METHOD ///////////////
///////////////////////////////////////////

import * as adminLRSControler from "@/controlers/admin/adminLRS.controler";
import { Router } from "express";

const router: Router = Router();

router.get("/lrs/statements", adminLRSControler.getStatements);
router.post("/lrs/statements", adminLRSControler.postStatements);
router.get("/lrs/statements/more", adminLRSControler.getMoreStatements);

export default router;