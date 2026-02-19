import * as Minio from 'minio';
import { logger } from '@/lib/logger';

interface MinioOpts {
    api_host: string;
    useSSL?: boolean;
    port?: number;
    access_key: string;
    secret_key: string;
    bucket: string;
    topics_dir: string;
    traces_topic: string;
    outputs_dir: string;
    traces_file: string;
}

class MinioClient {
    #opts: MinioOpts;
    #minio: Minio.Client;

    constructor(opts: MinioOpts) {
        this.#opts = opts;
        logger.info("MinioClient")
        this.#minio = new Minio.Client({
            endPoint: opts.api_host,
            port: opts.port,
            useSSL: opts.useSSL,
            accessKey: opts.access_key,
            secretKey: opts.secret_key
        });
        logger.info("MinioClient connected")
    }

    async getFile(file: string): Promise<string> {
        let objectStream = (await this.#minio.getObject(this.#opts.bucket, file)).setEncoding('utf-8');
        let content = '';
        for await(const chunk of objectStream) {
            content += chunk;
        }
        return content;
    }

    /**
     * 
     * @param {string} path
     * @returns {Promise<boolean>}
     */
    async fileExists(path: string): Promise<boolean> {
        logger.debug("Minio : fileExists")
        const objectsStream = await this.#minio.listObjectsV2(this.#opts.bucket, path);
        const iterator = objectsStream[Symbol.asyncIterator]();
        const nextValue = await iterator.next();
        return ! nextValue.done;
    }
    
        /**
     * 
     * @param {string} studyId
     * @param {string} activtityId
     * @returns {Promise<string>}
     */
        async getPresignedFileUrl(activityId: string): Promise<string> {
            logger.info("Minio : getPresignedFileUrl")
            const path=`${this.#opts.outputs_dir}/${activityId}/${this.#opts.traces_file}`;
            logger.info(path)
            let presignedUrl = ""
            if(await this.fileExists(path)) {
               presignedUrl = await this.getPresignedUrl(path)
            }
            return presignedUrl;
        }

    async getPresignedUrl(path: string): Promise<string> {
        logger.info("Minio : getPresignedUrl")
        const presignedUrl = await this.#minio.presignedGetObject(this.#opts.bucket, path, 60*60);
        logger.info(presignedUrl)
        return presignedUrl;
    }

    async getMinioObjects(bucket: string, prefix: string): Promise<string> {
		const objectsList = await this.listMinioObjects(bucket, prefix);
		const objectPromises: Promise<string>[] = [];
		for(const obj of objectsList){
			if (obj.name) {
				objectPromises.push(this.getObject(bucket, obj.name));
			}
		}

		return Promise.all(objectPromises)
			.then(contents => {
				return "[" + contents.join(",") + "]";
			})
	}

async getObject(bucket: string, name: string): Promise<string> {
		return new Promise((resolve, reject) => {
			const chunks: Buffer[] = [];
			this.#minio.getObject(bucket, name)
				.then((stream: any) => {
					stream.on('data', function(chunk: Buffer) {
						chunks.push(chunk);
					});
					
					stream.on('error', function(err: any) {
						reject(err);
					});
					
					stream.on('end', function() {
						const buffer = Buffer.concat(chunks);
						const string = buffer.toString('utf8');
						resolve(string);
					});
				})
				.catch(reject);
		});
	}

	async listMinioObjects(bucket: string, prefix: string): Promise<any[]> {
		return new Promise((resolve, reject) => {
			const objectsList: any[] = [];
			const stream =  this.#minio.listObjects(bucket, prefix);
	  
			stream.on('data', function(obj: any) {
				objectsList.push(obj);
			});
	  
			stream.on('error', function(err: any) {
				reject(err);
			});
	  
			stream.on('end', function() {
				resolve(objectsList);
		    });
		});
	}
}

export default MinioClient;