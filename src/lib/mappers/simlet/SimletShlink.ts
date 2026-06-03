import { config } from "@/lib/config";
import { db } from "@/lib/db";
import { BadRequestError, ConflictError, NotFoundError } from "@/lib/errors/appErrors";
import { logger } from "@/lib/logger";
import axios from "axios";

export class SimletShlink {
    simlet_id: number;
    short_url: string;
    short_code: string;
    short_valid_date: Date | null;
    short_expiration_date: Date | null;
    short_title: string;
    short_domain: string;
    createdAt: Date;
    updatedAt: Date;

    constructor(simlet_id: number, shlink: any) {
        this.simlet_id = simlet_id;
        this.short_url = shlink.short_url;
        this.short_code = shlink.short_code;
        this.short_valid_date = shlink.short_valid_date ? new Date(shlink.short_valid_date) : null;
        this.short_expiration_date = shlink.short_expiration_date ? new Date(shlink.short_expiration_date) : null;
        this.short_title = shlink.short_title;
        this.short_domain = shlink.short_domain;
        this.createdAt = new Date(shlink.createdAt);
        this.updatedAt = new Date(shlink.updatedAt);
    }

    static async getFromDbData(simlet_id: number) {
        let response = await db.Tables.SimletShlinks.findOne({ where: { simlet_id } });
        if (!response) {
            throw new NotFoundError(`SimletShlink with simlet_id ${simlet_id} not found`);
        }
        if(response.short_domain !== config.shlink.serverHost) {
            logger.error(`Shlink domain mismatch for simlet_id ${simlet_id}: expected ${config.shlink.serverHost}, got ${response.short_domain}`);
            db.Tables.SimletShlinks.destroy({ where: { simlet_id } });
            throw new ConflictError(`Shlink domain mismatch and removal for simlet_id ${simlet_id}: expected ${config.shlink.serverHost}, got ${response.short_domain}`);
        }
        return new SimletShlink(simlet_id, response);
    }

    //SHLINK URL
    static async createDbData(simlet_id: number, shlink: any){
        let body : any;
        const normalizedCustomSlug = typeof shlink.customSlug === "string" ? shlink.customSlug.trim() : undefined;
        body = {
            "longUrl": shlink.longUrl,
            "tags": [
              shlink.tag
            ],
            //"validSince": "string",
            //"validUntil": "string",
            //"maxvisits": 0,
            "title": shlink.title,
            "crawlable": false,
            "forwardQuery": true,
            "domain": `${config.shlink.serverHost}`,
            //"customSlug": null,
            //"shortCodeLength": 0
        };
        if(shlink.length) {
            body.findIfExists = true;
            body.shortCodeLength = shlink.length;
        }
        if(normalizedCustomSlug) {
            body.customSlug = normalizedCustomSlug;
        }
        let response;
        try {
            response = await axios.post(`${config.shlink.url}/rest/v3/short-urls`, body, { headers: { 'X-Api-Key': config.shlink.apikey } });
        } catch (error: any) {
            const status = error?.response?.status;
            const message = error?.response?.data?.detail || error?.response?.data?.message || error?.message || "Unable to create shlink URL";
            logger.error({ status, message }, `Failed to create shlink URL for simlet_id ${simlet_id}`);
            if (status === 409) {
                throw new ConflictError(message);
            }
            throw new BadRequestError(message);
        }
        if(response.status !== 200 && response.status !== 201) {
            logger.error(`Failed to create shlink URL: ${response.status} - ${response.statusText}`);
            throw new BadRequestError(`Failed to create shlink URL: ${response.status} - ${response.statusText}`);
        }
        logger.info(response, `Shlink URL created for simlet_id ${simlet_id} with short code ${response.data.shortCode}`);
        let shlinkBody : any;
        shlinkBody = { 
            simlet_id: simlet_id,
            short_url: response.data.shortUrl,
            short_code: response.data.shortCode,
            short_title: response.data.title,
            short_domain: config.shlink.serverHost
        };
        if(response.data.validSince) {
            shlinkBody.short_valid_date = new Date(response.data.validSince);
        }
        if(response.data.validUntil) {
            shlinkBody.short_expiration_date = new Date(response.data.validUntil);
        }
        let shlinkResponse;
        try {
            shlinkResponse = await db.Tables.SimletShlinks.create(shlinkBody);
        } catch (error: any) {
            if (error?.name === 'SequelizeUniqueConstraintError') {
                throw new ConflictError(`Shlink URL for simlet_id ${simlet_id} already exists. Use PATCH to update it.`);
            }
            throw error;
        }
        return new SimletShlink(simlet_id, shlinkResponse);
    }

    async updateURL(shlink: any){
        let body : any;
        const normalizedCustomSlug = typeof shlink.customSlug === "string" ? shlink.customSlug.trim() : undefined;
        if(normalizedCustomSlug) {
            body.customSlug = normalizedCustomSlug;
        } else if(shlink.length) {
            body.shortCodeLength = shlink.length;
        } else {
            throw new BadRequestError(`Either customSlug or length must be provided to update the shlink URL`);
        }
        let response;
        try {
            response = await axios.put(`${config.shlink.url}/rest/v3/short-urls/${this.short_code}?domain=${config.shlink.serverHost}`, body, { headers: { 'X-Api-Key': config.shlink.apikey } });
        } catch (error: any) {
            const status = error?.response?.status;
            const message = error?.response?.data?.detail || error?.response?.data?.message || error?.message || "Unable to update shlink URL";
            logger.error({ status, message }, `Failed to update shlink URL for simlet_id ${this.simlet_id}`);
            if (status === 409) {
                throw new ConflictError(message);
            }
            throw new BadRequestError(message);
        }
        if (response.status !== 200) {
            logger.error(`Failed to update shlink URL: ${response.status} - ${response.statusText}`);
            throw new BadRequestError(`Failed to update shlink URL: ${response.status} - ${response.statusText}`);
        }
        const updateBody: any = {
            short_url: response.data.shortUrl,
            short_code: response.data.shortCode,
            short_title: response.data.title,
            short_domain: config.shlink.serverHost,
        };
        if (response.data.validSince) {
            updateBody.short_valid_date = new Date(response.data.validSince);
        }
        if (response.data.validUntil) {
            updateBody.short_expiration_date = new Date(response.data.validUntil);
        }
        await db.Tables.SimletShlinks.update(updateBody, { where: { simlet_id: this.simlet_id } });
        const updatedShlink = await db.Tables.SimletShlinks.findOne({ where: { simlet_id: this.simlet_id } });
        if (!updatedShlink) {
            throw new NotFoundError(`SimletShlink with simlet_id ${this.simlet_id} not found after update`);
        }
        return new SimletShlink(this.simlet_id, updatedShlink);
    }

    //SHLINK URL
    async deleteShLink() {
        await axios.delete(`${config.shlink.url}/rest/v3/short-urls/${this.short_code}?domain=${config.shlink.serverHost}`, { headers: { 'X-Api-Key': config.shlink.apikey } });
        await db.Tables.SimletShlinks.destroy({ where: { simlet_id: this.simlet_id } });
    }
    
    toJSON() {
        return {
            shortUrl: this.short_url,
            shortCode: this.short_code,
            shortValidDate: this.short_valid_date,
            shortExpirationDate: this.short_expiration_date,
            shortTitle: this.short_title,
            shortDomain: this.short_domain,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}