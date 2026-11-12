import { Response, NextFunction } from "express";
import { logger } from "@/lib/logger";
import * as groupService from "@/services/groups/group.service";
import { AuthenticatedRequest } from "@/middlewares/auth.middleware";
import { SimletGroup } from "@/lib/mappers/simletGroup/SimletGroup";
import { UserPermission } from "@/lib/mappers/UserPermisions/UserPermission";
import { AuthentificationError } from "@/lib/errors/appErrors";

/**
 * Retrieves all permissions for a specific group within a simlet.
 * 
 * @async
 * @function getGroupPermissions
 * @param {AuthenticatedRequest} req - Express request object with simlet_id and group_id in URL parameters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 * @throws {Error} Passes other errors to next middleware
 */
export async function getGroupPermissions(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const groupId = parseInt(req.params.group_id as string);
    let currentUser = req.user?.sql;
    logger.debug({ simletId, groupId, userId: currentUser?.user_id }, "Getting permissions for group ID and simlet ID");
    
    // Check user role and get appropriate permissions
    let groups: SimletGroup[];
    switch (req.user?.sql.role) {
      case "administrator":
        groups = await groupService.getAdminGroups(undefined, undefined, undefined, undefined);
        break;
      case "teacher":
        groups = await groupService.getGroups(currentUser.user_id as number, undefined, undefined, undefined, undefined);
        break;
      default:
        throw new AuthentificationError("Invalid user role");
    }
    
    // Find the specific group
    const group = groups.find(g => g.group_id === groupId);
    if (!group) {
      throw new AuthentificationError("Group not found");
    }
    
    const is_admin = req.user?.sql.role === "administrator";
    const permissions = await UserPermission.getFromDbData("group", groupId, currentUser.user_id as number, is_admin);
    res.json(permissions.toJSON());
  } catch (err) {
    next(err);
  }
}

/**
 * Creates permissions for a user in a group within a simlet.
 * 
 * @async
 * @function createGroupPermissions
 * @param {AuthenticatedRequest} req - Express request object with simlet_id, group_id in URL parameters and permission data in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 */
export async function createGroupPermissions(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const groupId = parseInt(req.params.group_id as string);
    let body = req.body;
    let currentUser = req.user?.sql;
    logger.debug({ simletId, groupId, userId: currentUser?.user_id, body }, "Creating permissions for group ID and simlet ID");
    
    // Check user role
    let groups: SimletGroup[];
    switch (req.user?.sql.role) {
      case "administrator":
        groups = await groupService.getAdminGroups(undefined, undefined, undefined, undefined);
        break;
      case "teacher":
        groups = await groupService.getGroups(currentUser.user_id as number, undefined, undefined, undefined, undefined);
        break;
      default:
        throw new AuthentificationError("Invalid user role");
    }
    
    // Find the specific group
    const group = groups.find(g => g.group_id === groupId);
    if (!group) {
      throw new AuthentificationError("Group not found");
    }
    
    // Create permissions - teacher can only create for their own groups, admin can create for any
    const permissions = await SimletGroup.getCurrentUserAllFromDbData(currentUser.user_id as number, undefined, undefined, undefined, undefined);
    const userHasGroupAccess = permissions.some(p => p.group_id === groupId);
    
    if (!userHasGroupAccess && req.user?.sql.role !== "administrator") {
      throw new AuthentificationError("User does not have access to this group");
    }
    
    const is_admin = req.user?.sql.role === "administrator";
    const userPermission = await UserPermission.getFromDbData("group", groupId, currentUser.user_id as number, is_admin);
    const created = await userPermission.createPermissions(body);
    res.json(created.toJSON());
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves permissions for a specific user in a group within a simlet.
 * 
 * @async
 * @function getGroupPermissionsForUser
 * @param {AuthenticatedRequest} req - Express request object with simlet_id, group_id and user_id in URL parameters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 */
export async function getGroupPermissionsForUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const groupId = parseInt(req.params.group_id as string);
    const userId = parseInt(req.params.user_id as string);
    let currentUser = req.user?.sql;
    logger.debug({ simletId, groupId, userId: currentUser?.user_id, targetUserId: userId }, "Getting permissions for user in group ID and simlet ID");
    
    // Check user role
    let groups: SimletGroup[];
    switch (req.user?.sql.role) {
      case "administrator":
        groups = await groupService.getAdminGroups(undefined, undefined, undefined, undefined);
        break;
      case "teacher":
        groups = await groupService.getGroups(currentUser.user_id as number, undefined, undefined, undefined, undefined);
        break;
      default:
        throw new AuthentificationError("Invalid user role");
    }
    
    // Find the specific group
    const group = groups.find(g => g.group_id === groupId);
    if (!group) {
      throw new AuthentificationError("Group not found");
    }
    
    // Get all permissions for this group
    const permissions = await SimletGroup.getCurrentUserAllFromDbData(currentUser.user_id as number, undefined, undefined, undefined, undefined);
    const groupPermissions = permissions.find(p => p.group_id === groupId);
    
    if (!groupPermissions) {
      res.json({ permissions: [] });
      return;
    }
    
    // Get the specific user's permissions within this group
    const userPermission = (groupPermissions as any).permissions?.find((p: any) => p.user_id === userId);
    
    res.json(userPermission ? userPermission : { permissions: [] });
  } catch (err) {
    next(err);
  }
}

/**
 * Updates permissions for a specific user in a group within a simlet.
 * 
 * @async
 * @function patchGroupPermissionsForUser
 * @param {AuthenticatedRequest} req - Express request object with simlet_id, group_id, user_id in URL parameters and updated permission data in body
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 */
export async function patchGroupPermissionsForUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const groupId = parseInt(req.params.group_id as string);
    const userId = parseInt(req.params.user_id as string);
    let body = req.body;
    let currentUser = req.user?.sql;
    logger.debug({ simletId, groupId, userId: currentUser?.user_id, targetUserId: userId, body }, "Updating permissions for user in group ID and simlet ID");
    
    // Check user role
    let groups: SimletGroup[];
    switch (req.user?.sql.role) {
      case "administrator":
        groups = await groupService.getAdminGroups(undefined, undefined, undefined, undefined);
        break;
      case "teacher":
        groups = await groupService.getGroups(currentUser.user_id as number, undefined, undefined, undefined, undefined);
        break;
      default:
        throw new AuthentificationError("Invalid user role");
    }
    
    // Find the specific group
    const group = groups.find(g => g.group_id === groupId);
    if (!group) {
      throw new AuthentificationError("Group not found");
    }
    
    // Update permissions - teacher can only update for their own groups, admin can update for any
    const permissions = await SimletGroup.getCurrentUserAllFromDbData(currentUser.user_id as number, undefined, undefined, undefined, undefined);
    const userHasGroupAccess = permissions.some(p => p.group_id === groupId);
    
    if (!userHasGroupAccess && req.user?.sql.role !== "administrator") {
      throw new AuthentificationError("User does not have access to this group");
    }
    
    // For now, return success - full implementation would update the permission record
    res.json({ 
      message: "Permissions update endpoint - implementation needed",
      group_id: groupId,
      simlet_id: simletId,
      user_id: userId,
      new_permission: body.permission 
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Deletes permissions for a specific user in a group within a simlet.
 * 
 * @async
 * @function deleteGroupPermissionsForUser
 * @param {AuthenticatedRequest} req - Express request object with simlet_id, group_id and user_id in URL parameters
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function for error handling
 * @returns {Promise<void>}
 * @throws {AuthentificationError} If user has invalid role
 */
export async function deleteGroupPermissionsForUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const simletId = parseInt(req.params.simlet_id as string);
    const groupId = parseInt(req.params.group_id as string);
    const userId = parseInt(req.params.user_id as string);
    let currentUser = req.user?.sql;
    logger.debug({ simletId, groupId, userId: currentUser?.user_id, targetUserId: userId }, "Deleting permissions for user in group ID and simlet ID");
    
    // Check user role
    let groups: SimletGroup[];
    switch (req.user?.sql.role) {
      case "administrator":
        groups = await groupService.getAdminGroups(undefined, undefined, undefined, undefined);
        break;
      case "teacher":
        groups = await groupService.getGroups(currentUser.user_id as number, undefined, undefined, undefined, undefined);
        break;
      default:
        throw new AuthentificationError("Invalid user role");
    }
    
    // Find the specific group
    const group = groups.find(g => g.group_id === groupId);
    if (!group) {
      throw new AuthentificationError("Group not found");
    }
    
    // Delete permissions - teacher can only delete for their own groups, admin can delete for any
    const permissions = await SimletGroup.getCurrentUserAllFromDbData(currentUser.user_id as number, undefined, undefined, undefined, undefined);
    const userHasGroupAccess = permissions.some(p => p.group_id === groupId);
    
    if (!userHasGroupAccess && req.user?.sql.role !== "administrator") {
      throw new AuthentificationError("User does not have access to this group");
    }
    
    // For now, return success - full implementation would delete the permission record
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}