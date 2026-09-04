import { db } from '@/lib/db';
import { SessionTag } from './SessionTagsElement';
import { NotFoundError, ValidationError } from '@/lib/errors/appErrors';
import { Op } from 'sequelize';

export class SessionTagList {
    session_id: number;
    tag_id: number;
    current_user_id: number;

    constructor(session_id: number, tag_id: number, current_user_id: number) {
        this.session_id = session_id;
        this.tag_id = tag_id;
        this.current_user_id = current_user_id;
    }

    static async getSessionsTags(sessions_id: number[], current_user_id?: number): Promise<SessionTag[]> {
        if(!Array.isArray(sessions_id) || sessions_id.length === 0) {
            return [];
        }

        const tags = await db.Tables.SessionTagsList.findAll({ where: { session_id: { [Op.in]: sessions_id } } });
        let tagsId = tags
            .map((row: any) => Number(row.tag_id))
            .filter((tagId: number) => Number.isFinite(tagId));

        tagsId = [...new Set(tagsId)];
        if(tagsId.length === 0) {
            return [];
        }

        return await SessionTag.getTags(tagsId);
    }

    static async getSessionTags(session_id: number, current_user_id?: number): Promise<SessionTag[]> {
        const tags = await db.Tables.SessionTagsList.findAll({ where: { session_id } });
        let tagsId = tags
            .map((row: any) => Number(row.tag_id))
            .filter((tagId: number) => Number.isFinite(tagId));

        tagsId = [...new Set(tagsId)];
        if(tagsId.length === 0) {
            return [];
        }

        return await SessionTag.getTags(tagsId);
    }

    static async getSessionTagFromList(session_id: number, tag_id: number, current_user_id: number): Promise<SessionTag> {
        const tag = await db.Tables.SessionTagsList.findOne({ where: { session_id, tag_id } });
        if(!tag) {
            throw new NotFoundError(`Tag with id ${tag_id} not found in session ${session_id} tags list`);
        }
        return await SessionTag.getTag(tag.tag_id, current_user_id);
    }

    static async addTag(session_id: number, tag_id: number, current_user_id: number): Promise<SessionTag> {
        let existingTag = await SessionTag.getTag(tag_id, current_user_id);

        const currentRelation = await db.Tables.SessionTagsList.findOne({
            where: { session_id, tag_id: existingTag.tag_id }
        });
        if(!currentRelation) {
            await db.Tables.SessionTagsList.create({ session_id, tag_id: existingTag.tag_id });
        }

        return existingTag;
    }

    async deleteTag(): Promise<void> {
        let tag = await SessionTag.getTag(this.tag_id, this.current_user_id);
        await db.Tables.SessionTagsList.destroy({ where: { session_id: this.session_id, tag_id: tag.tag_id } });
    }

    static async isTagStillInUse(tag_id: number): Promise<void> {
        const count = await db.Tables.SessionTagsList.count({ where: { tag_id } });
        if (count > 0) {
            throw new ValidationError(`Tag with ID ${tag_id} is still in use.`);
        }
    }
}