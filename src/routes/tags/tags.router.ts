import * as tagsControler from "@/controlers/simlets/tags.controler";
import { Router } from "express";
const router = Router({ mergeParams: true });

router.get("/", tagsControler.getSimletTagsForUser);
router.post("/", tagsControler.createTagElement);
router.patch("/:tag_id", tagsControler.updateTagElement);
router.delete("/:tag_id", tagsControler.deleteTagElement);

export default router;