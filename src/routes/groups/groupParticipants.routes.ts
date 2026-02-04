import { Router } from "express";
import { 
  getGroupParticipants, 
  addParticipantToGroup,
  removeParticipantFromGroup,
  getParticipantGroups,
  isParticipantInGroup,
  getGroupParticipantsCount
} from "@/controlers/groups/groupParticipants.controler";

/**
 * Express router for group participants-related API endpoints.
 * 
 * Routes:
 * - GET /group/:groupId - Get all participants in a specific group
 * - POST /group/:groupId/participant/:participantId - Add a participant to a group
 * - DELETE /group/:groupId/participant/:participantId - Remove a participant from a group
 * - GET /participant/:participantId - Get all groups for a specific participant
 * - GET /group/:groupId/participant/:participantId/exists - Check if participant is in group
 * - GET /group/:groupId/count - Get count of participants in a group
 * 
 * @type {Router}
 * 
 * @example
 * ```typescript
 * import groupParticipantsRoutes from '@/routes/groups/groupParticipants.routes';
 * app.use('/group-participants', groupParticipantsRoutes);
 * 
 * // GET /group-participants/group/5 - participants in group 5
 * // POST /group-participants/group/5/participant/123 - add participant 123 to group 5
 * // DELETE /group-participants/group/5/participant/123 - remove participant 123 from group 5
 * // GET /group-participants/participant/123 - groups for participant 123
 * ```
 */
const router = Router();

// Group-based operations
router.get("/group/:groupId", getGroupParticipants);
router.get("/group/:groupId/count", getGroupParticipantsCount);
router.post("/group/:groupId/participant/:participantId", addParticipantToGroup);
router.delete("/group/:groupId/participant/:participantId", removeParticipantFromGroup);
router.get("/group/:groupId/participant/:participantId/exists", isParticipantInGroup);

// Participant-based operations
router.get("/participant/:participantId", getParticipantGroups);

export default router;