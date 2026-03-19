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
import { UserFactory } from "@/lib/models/users/user.model";
import { GroupFactory } from "@/lib/models/groups/group.model";
import { GroupParticipantsFactory } from "@/lib/models/groups/groupParticipants.model";
import { GroupPermissionsFactory } from "@/lib/models/groups/groupPermissions.model";
import { ActivityFactory } from "@/lib/models/activities/activity.model";
import { ActivityCompletionFactory } from "@/lib/models/activities/activityCompletion.model";
import { ManualActivityFactory } from "@/lib/models/activities/manualActivity.model";
import { GameplayActivityFactory } from "@/lib/models/activities/gameplayActivity.model";
import { LimesurveyActivityFactory } from "@/lib/models/activities/limesurveyActivity.model";
import { SimletFactory } from "@/lib/models/simlets/simlet.model";
import { SimletShlinksFactory } from "@/lib/models/simlets/simletShlinks.model";
import { SimletPermissionsFactory } from "@/lib/models/simlets/simletPermissions.model";
import { SessionFactory } from "@/lib/models/sessions/session.model";
import { SessionDatesFactory } from "@/lib/models/sessions/sessionDates.model";
import { SessionPermissionsFactory } from "@/lib/models/sessions/sessionPermissions.model";
import { SessionTagsFactory } from "@/lib/models/sessions/sessionTags.model";
import { AllocatorFactory } from "@/lib/models/allocators/allocator.model";
import { ExperimentalParticipantsFactory } from "@/lib/models/allocators/experimentalParticipants.model";
import { RandomAllocatorsFactory } from "@/lib/models/allocators/randomAllocators.model";
import { ActivityTemplateFactory } from "@/lib/models/templates/activityTemplate.model";
import { ActivityTemplatePermissionsFactory } from "@/lib/models/templates/activityTemplatePermissions.model";
import { ManualTemplateActivityFactory } from "@/lib/models/templates/manualTemplateActivity.model";
import { GameplayActivitiesTemplateFactory } from "@/lib/models/templates/gameplayActivitiesTemplate.model";
import { LimesurveyActivitiesTemplateFactory } from "@/lib/models/templates/limesurveyActivitiesTemplate.model";
import { ActivityTemplateTagsFactory } from "@/lib/models/templates/activityTemplateTags.model";
import { ActivityTemplateTagsListFactory } from "@/lib/models/templates/activityTemplateTagsList.model";
import { SessionTagsListFactory } from "@/lib/models/tags/sessionTagsList.model";

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
 * - SIMLETs: Simlets, SimletGroups, SimletShlinks, SimletPermissions
 * - Sessions: Sessions, SessionPermissions, SessionTags
 * - Allocators: Allocators, ExperimentalParticipants, RandomAllocators
 * - Templates: ActivityTemplates, ActivityTemplatePermissions, ManualTemplateActivities, GameplayActivitiesTemplates, LimesurveyActivitiesTemplates
 * - Tags: SessionTagsList
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
    SimletShlinks: SimletShlinksFactory(sequelize, DataTypes),
    SimletPermissions: SimletPermissionsFactory(sequelize, DataTypes),
    Sessions: SessionFactory(sequelize, DataTypes),
    SessionDates: SessionDatesFactory(sequelize, DataTypes),
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
    ActivityTemplateTags: ActivityTemplateTagsFactory(sequelize, DataTypes),
    ActivityTemplateTagsList: ActivityTemplateTagsListFactory(sequelize, DataTypes),
    SessionTagsList: SessionTagsListFactory(sequelize, DataTypes),
  };
}