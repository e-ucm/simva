import { db } from '@/lib/db';
import { AuthentificationError, NotFoundError } from '@/lib/errors/appErrors';
import { Op } from 'sequelize';

export class SessionTag {
    tag_id: number;
    tag_name: string;
    tag_color: string;
    tag_user_id: number;
    is_current_user: boolean;
    createdAt: Date;
    updatedAt: Date;

    constructor(tag: any, current_user_id?: number) {
        this.tag_id = tag.tag_id;
        this.tag_name = tag.tag_name;
        this.tag_color = tag.tag_color;
        this.tag_user_id = tag.user_id;
        this.is_current_user = current_user_id !== undefined && tag.user_id === current_user_id;
        this.createdAt = tag.createdAt;
        this.updatedAt = tag.updatedAt;
    }

    static async getTags(tagsId: number[], current_user_id?: number): Promise<SessionTag[]> {
        const where: any = { tag_id: { [Op.in]: tagsId } };
        if (current_user_id !== undefined) {
            where.user_id = current_user_id;
        }
        const tags = await db.Tables.SessionTagsElement.findAll({ where });
        return tags.map((tag: any) => new SessionTag(tag, current_user_id));
    }

    static async getTagsForUser(current_user_id: number): Promise<SessionTag[]> {
        const tags = await db.Tables.SessionTagsElement.findAll({
            where: { user_id: current_user_id },
            order: [['tag_id', 'ASC']]
        });
        return tags.map((tag: any) => new SessionTag(tag, current_user_id));
    }

    static async getTag(tag_id: number, current_user_id: number): Promise<SessionTag> {
        const tag = await db.Tables.SessionTagsElement.findOne({ where: { tag_id, user_id: current_user_id } });
        if(!tag) {
            throw new NotFoundError(`Tag with id ${tag_id} not found`);
        }
        return new SessionTag(tag, current_user_id);
    }

    static async create(tag: SessionTag, current_user_id: number): Promise<SessionTag> {
        const newTag = await db.Tables.SessionTagsElement.create({ tag_name: tag.tag_name, tag_color: tag.tag_color, user_id: current_user_id });
        return new SessionTag(newTag, current_user_id);
    }

    isCurrentUser(): void {
        if (!this.is_current_user) { 
            throw new AuthentificationError("Current user is not the owner of this tag.");
        }
    }

    async update(tag: Partial<SessionTag>): Promise<SessionTag> {
        this.isCurrentUser();
        let updatedTag = await db.Tables.SessionTagsElement.findOne({ where: { tag_id: this.tag_id } });
        await updatedTag!.update(tag);
        this.updatedAt = updatedTag!.updatedAt;
        return this;
    }

    async delete(): Promise<void> {
        this.isCurrentUser();
        await db.Tables.SessionTagsElement.destroy({ where: { tag_id: this.tag_id } });
    }

    toJSON() {
        return {
            tag_id: this.tag_id,
            tag_name: this.tag_name,
            tag_color: this.tag_color,
            tag_right: this.is_current_user ? "WRITE" : "READ",
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}