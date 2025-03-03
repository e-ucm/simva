const Client =require('minio');
const logger=require('../logger.js');

/**
 * @typedef MinioOpts
 * @property {string} api_host
 * @property {boolean} [useSSL]
 * @property {number} [port]
 * @property {string} access_key
 * @property {string} secret_key
 * @property {string} bucket
 * @property {string} topics_dir
 * @property {string} traces_topic
 * @property {string} outputs_dir
 * @property {string} traces_file
 */

class MinioClient {

    /**
     * @param {MinioOpts} opts
     */
    constructor(opts) {
        this.#opts = opts;
        logger.info("MinioClient")
        this.#minio = new Client({
            endPoint: opts.api_host,
            port: opts.port,
            useSSL: opts.useSSL,
            accessKey: opts.access_key,
            secretKey: opts.secret_key
        });
        logger.info("MinioClient connected")
    }
    /** @type {MinioOpts} */
    #opts;

    /** @type {Client} */
    #minio;

    /**
     * 
     * @param {string} file 
     * @returns {Promise<string>}
     */
    async getFile(file){
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
    async fileExists(path) {
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
        async getPresignedFileUrl(activityId) {
            logger.info("Minio : getPresignedFileUrl")
            const path=`${this.#opts.outputs_dir}/${activityId}/${this.#opts.traces_file}`;
            logger.info(path)
            const presignedUrl = ""
            if(this.fileExists(path)) {
               presignedUrl = await this.getPresignedUrl(path)
            }
            return presignedUrl;
        }

    /**
     * 
     * @param {string} path
     * @returns {Promise<string>}
     */
    async getPresignedUrl(path) {
        logger.info("Minio : getPresignedUrl")
        const presignedUrl = await this.#minio.presignedGetObject(this.#opts.bucket, path, 60*60);
        logger.info(presignedUrl)
        return presignedUrl;
    }

    async getMinioObjects(bucket, prefix){
		var objectsList = await this.listMinioObjects(bucket, prefix);
		var objectPromises = [];
		for(var obj in objectsList){
			objectPromises.push(this.getObject(bucket, obj.name));
		}

		return Promise.all(objectPromises)
			.then(contents => {
				return "[" + contents.concat(",") + "]";
			})
	}

	async getObject(bucket, name){
		return new Promise((resolve, reject) => {
			var chunks = [];
			const stream = this.#minio.getObject(bucket, name, function (e, dataStream) {
				stream.on('data', function(chunk) {
					chunks.push(chunk);
				});
		
				stream.on('error', function(err) {
					reject(err);
				});
		
				stream.on('end', function() {
					const buffer = Buffer.concat(chunks);
					const string = buffer.toString('utf8');
					resolve(string);
				});
			});
		});
	}

	async listMinioObjects(bucket, prefix){
		return new Promise((resolve, reject) => {
			const objectsList = [];
			const stream =  this.#minio.listObjects(bucket, prefix);
	  
			stream.on('data', function(obj) {
				objectsList.push(obj);
			});
	  
			stream.on('error', function(err) {
				reject(err);
			});
	  
			stream.on('end', function() {
				resolve(objectsList);
		    });
		});
	}
}

module.exports = MinioClient;