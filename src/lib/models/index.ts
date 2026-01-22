/**
 * @fileoverview Model initialization and factory aggregation for SIMVA API.
 * Centralizes all Sequelize model factories and provides unified initialization.
 * 
 * This module:
 * - Imports all model factories from different domains (users, activities, sessions, etc.)
 * - Provides a single function to initialize all models with a Sequelize instance
 * - Returns a structured object with all initialized models
 * - Maintains consistent naming and organization across model types
 * 
 * @module models/index
 * @requires sequelize
 */

import { Sequelize } from "sequelize";
import { UserFactory } from "./users/user.model";
import { GroupFactory } from "./groups/group.model";
import { GroupParticipantsFactory } from "./groups/groupParticipants.model";
import { GroupPermissionsFactory } from "./groups/groupPermissions.model";
import { ActivityFactory } from "./activities/activity.model";
import { ActivityCompletionFactory } from "./activities/activityCompletion.model";
import { ManualActivityFactory } from "./activities/manualActivity.model";
import { GameplayActivityFactory } from "./activities/gameplayActivity.model";
import { LimesurveyActivityFactory } from "./activities/limesurveyActivity.model";
import { SimletFactory } from "./simlets/simlet.model";
import { SimletGroupsFactory } from "./simlets/simletGroups.model";
import { SimletShlinksFactory } from "./simlets/simletShlinks.model";
import { SimletPermissionsFactory } from "./simlets/simletPermissions.model";
import { SimletTagsFactory } from "./simlets/simletTags.model";
import { SessionFactory } from "./sessions/session.model";
import { SessionPermissionsFactory } from "./sessions/sessionPermissions.model";
import { SessionTagsFactory } from "./sessions/sessionTags.model";
import { AllocatorFactory } from "./allocators/allocator.model";
import { ExperimentalParticipantsFactory } from "./allocators/experimentalParticipants.model";
import { RandomAllocatorsFactory } from "./allocators/randomAllocators.model";
import { ActivityTemplateFactory } from "./templates/activityTemplate.model";
import { ActivityTemplatePermissionsFactory } from "./templates/activityTemplatePermissions.model";
import { ManualTemplateActivityFactory } from "./templates/manualTemplateActivity.model";
import { GameplayActivitiesTemplateFactory } from "./templates/gameplayActivitiesTemplate.model";
import { LimesurveyActivitiesTemplateFactory } from "./templates/limesurveyActivitiesTemplate.model";
import { SimletTagsListFactory } from "./tags/simletTagsList.model";
import { SessionTagsListFactory } from "./tags/sessionTagsList.model";
import { SubjectAreaListFactory } from "./tags/subjectAreaList.model";
import { CategoryListFactory } from "./tags/categoryList.model";

/**
 * Initialize all SIMVA models with the provided Sequelize instance.
 * Creates and configures all database models for the application.
 * 
 * @function initializeModels
 * @param {Sequelize} sequelize - The Sequelize instance to initialize models with
 * @param {typeof import("sequelize").DataTypes} DataTypes - Sequelize data types
 * @returns {Object} Object containing all initialized models organized by domain
 * 
 * Model Categories:
 * - User Management: User, Group, GroupParticipants, GroupPermissions
 * - Activities: Activities, ActivityCompletion, ManualActivities, GamePlayActivities, LimesurveyActivities
 * - SIMLETs: Simlets, SimletGroups, SimletShlinks, SimletPermissions, SimletTags
 * - Sessions: Sessions, SessionPermissions, SessionTags
 * - Allocators: Allocators, ExperimentalParticipants, RandomAllocators
 * - Templates: ActivityTemplates, ActivityTemplatePermissions, ManualTemplateActivities, GameplayActivitiesTemplates, LimesurveyActivitiesTemplates
 * - Tags: SimletTagsList, SessionTagsList, SubjectAreaList, CategoryList
 * 
 * @example
 * ```typescript
 * import { initializeModels } from '@/lib/models';
 * import { Sequelize, DataTypes } from 'sequelize';
 * 
 * const sequelize = new Sequelize(...);
 * const models = initializeModels(sequelize, DataTypes);
 * 
 * // Access models
 * const users = await models.User.findAll();
 * const simlets = await models.Simlets.findAll();
 * ```
 */
export function initializeModels(
  sequelize: Sequelize,
  DataTypes: typeof import("sequelize").DataTypes
) {
  return {
    User: UserFactory(sequelize, DataTypes),
    Group: GroupFactory(sequelize, DataTypes),
    GroupParticipants: GroupParticipantsFactory(sequelize, DataTypes),
    GroupPermissions: GroupPermissionsFactory(sequelize, DataTypes),
    Activities: ActivityFactory(sequelize, DataTypes),
    ActivityCompletion: ActivityCompletionFactory(sequelize, DataTypes),
    ManualActivities: ManualActivityFactory(sequelize, DataTypes),
    GamePlayActivities: GameplayActivityFactory(sequelize, DataTypes),
    LimesurveyActivities: LimesurveyActivityFactory(sequelize, DataTypes),
    Simlets: SimletFactory(sequelize, DataTypes),
    SimletGroups: SimletGroupsFactory(sequelize, DataTypes),
    SimletShlinks: SimletShlinksFactory(sequelize, DataTypes),
    SimletPermissions: SimletPermissionsFactory(sequelize, DataTypes),
    SimletTags: SimletTagsFactory(sequelize, DataTypes),
    Sessions: SessionFactory(sequelize, DataTypes),
    SessionPermissions: SessionPermissionsFactory(sequelize, DataTypes),
    SessionTags: SessionTagsFactory(sequelize, DataTypes),
    Allocators: AllocatorFactory(sequelize, DataTypes),
    ExperimentalParticipants: ExperimentalParticipantsFactory(sequelize, DataTypes),
    RandomAllocators: RandomAllocatorsFactory(sequelize, DataTypes),
    ActivityTemplates: ActivityTemplateFactory(sequelize, DataTypes),
    ActivityTemplatePermissions: ActivityTemplatePermissionsFactory(sequelize, DataTypes),
    ManualActivitiesTemplates: ManualTemplateActivityFactory(sequelize, DataTypes),
    GameplayActivitiesTemplates: GameplayActivitiesTemplateFactory(sequelize, DataTypes),
    LimesurveyActivitiesTemplates: LimesurveyActivitiesTemplateFactory(sequelize, DataTypes),
    SimletTagsList: SimletTagsListFactory(sequelize, DataTypes),
    SessionTagsList: SessionTagsListFactory(sequelize, DataTypes),
    SubjectAreaList: SubjectAreaListFactory(sequelize, DataTypes),
    CategoryList: CategoryListFactory(sequelize, DataTypes),
  };
}