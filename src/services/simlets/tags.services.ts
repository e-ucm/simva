import { SessionTag } from "@/lib/mappers/session/SessionTagsElement";
import { SessionTagList } from "@/lib/mappers/session/SessionTagsList";
import { Simlet } from "@/lib/mappers/simlet/Simlet";

export async function getSimletTagsForUser(current_user_id: number): Promise<SessionTag[]> {
    let simlets = await Simlet.getAllFromDbData(current_user_id, false);
    let sessionsIds = simlets.map(simlet => simlet.sessions).flat();
    const tags = await SessionTagList.getSessionsTags(sessionsIds, current_user_id);
    tags.push(...await SessionTag.getTagsForUser(current_user_id));
    return tags;
}

export async function createTagElement(tag: SessionTag, current_user_id: number): Promise<SessionTag> {
    return await SessionTag.create(tag, current_user_id);
}

export async function updateTagElement(tag_id: number, tag: Partial<SessionTag>, current_user_id: number): Promise<SessionTag> {
    let existingTag = await SessionTag.getTag(tag_id, current_user_id);
    await existingTag.update(tag);
    return existingTag;
}

export async function deleteTagElement(tag_id: number, current_user_id: number): Promise<void> {
    await SessionTagList.isTagStillInUse(tag_id);
    let existingTag = await SessionTag.getTag(tag_id, current_user_id);
    await existingTag.delete();
}