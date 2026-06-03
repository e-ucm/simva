
import { Simlet } from "@/lib/mappers/simlet/Simlet";
import { SimletShlink } from "@/lib/mappers/simlet/SimletShlink";

export async function createShlinkURL(simletId: number, is_admin: boolean, current_user_id: number, shlink: any): Promise<SimletShlink> {
    let simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
    return await simlet.createShlinkURL(shlink);
}

export async function getShlinkURL(simletId: number, is_admin: boolean, current_user_id: number): Promise<SimletShlink> {
    let simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
    return await simlet.getShlinkURL();
}

export async function updateShlinkURL(simletId: number, is_admin: boolean, current_user_id: number, shlink: any): Promise<SimletShlink> {
    let simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
    return await simlet.updateShlinkURL(shlink);
}

export async function deleteShlinkURL(simletId: number, is_admin: boolean, current_user_id: number): Promise<void> {
    let simlet = await Simlet.getFromDbData(simletId, is_admin, current_user_id);
    await simlet.deleteShlinkURL();
}