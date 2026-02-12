import { db } from "@/lib/db";

export class Activity {
 	session_id: number;
	activity_id: number;
	name: string;
	activity_type: string;
	createdAt: Date;
	updatedAt: Date;
	presignedURL?: string;
	generated_at?: Date;
	expires_on_seconds?: number;
	trace_storage:boolean;
	description?: string;

	constructor(data: any) {
		this.session_id = data.session_id;
		this.activity_id = data.activity_id;
		this.name = data.name;
		this.activity_type = data.activity_type;
		this.createdAt = data.createdAt;
		this.updatedAt = data.updatedAt;
		this.presignedURL = data.presignedURL;
		this.generated_at = data.generated_at;
		this.expires_on_seconds = data.expires_on_seconds;
		this.trace_storage = data.trace_storage || false; // Default to false if not provided
		this.description = data.description || ""; // Default to empty string if not provided
	}
	
	static getType(){
		return 'activity';
    }

	static getName(){
		return 'Default Activity';
	}

	static getDescription(){
		return 'A basic activity with completion state and a place to save results.';
	}

	static async getUtils(username : string){
		return {};
	}

	async getDetails(){
		return {};
	}

	async patch(data : any) {
		await db.Tables.Activities.updateActivity(this.activity_id, data);
	}

	async remove() {
		await db.Tables.Activities.deleteActivity(this.activity_id);
	}

	canBeOpened() {
		return false;
	} 

	async addParticipants(participants: number[]) {
		// Implementation for adding participants
	}
	
	async removeParticipants(participants: number[]) {
		// Implementation for removing participants
	}

	addPermission(user_id: number, permission: string) {
		// Implementation for adding permission
	}

	removePermission(user_id: number, permission: string) {
		// Implementation for removing permission
	}

	sendXAPITraceForActivity(username: string, verb: string, timestamp : string, resultScore : number, reasonExtension : string) {
	}

	setResult(participant : number, result : number) {
	}

	async saveToFile(filename: string, content: string){
	}

	async readFromFile(filename : string) {
	}

	async localFileExists(filename: string) {
	}

	async getResults(participants: number[], type: string){
	}
	
	async hasResults(participants: number[], type: string){
	}

	async getProgress(participants : number[]){
	} 
	
	async setProgress(participants: number[], progress: number){
	} 
	
	async setMultiCompletion(status : boolean){
	}

	async setCompletion(participant: number, status : boolean){
	}

	async setSuspension(participant : number, status : boolean) {
	}

	async target(participant : number){
		return false;
	}

	open(res : number, participant : number){
		return false;
	}

	initializeMinioClient() {
		//logger.info("MinioClient");
		//logger.info(`Minio Config - Host: ${config.minio.api_host}, Port: ${config.minio.port}, SSL: ${config.minio.useSSL}`);
		//try {
		//	const minioClient = new Client({
		//		endPoint: config.minio.api_host,
		//		port: Number(config.minio.port),
		//		accessKey: config.minio.access_key,
		//		secretKey: config.minio.secret_key,
		//		useSSL: config.minio.useSSL
		//	});
		//	logger.info("MinioClient connected");
		//	return minioClient;
		//} catch (error) {
		//	logger.error("Error initializing MinioClient: ");
		//	logger.error(error);
		//	throw error;
		//}
	}

	async generatePresignedFileUrl() {
		//let path = `${config.minio.outputs_dir}/${this._id}/${config.minio.traces_file}`;
		//logger.info(path);
		//let minioClient = this.initializeMinioClient();
		//if (await this.fileExists(minioClient, path)) {
		//	let presignedUrl = null;	
		//	let time_before_expiration=config.minio.presigned_url_expiration_time_in_second;
		//	presignedUrl = await this.getPresignedUrl(minioClient, path, time_before_expiration);
		//	const now=new Date().toJSON();
		//	this.extra_data.miniotrace={
		//		presignedUrl:presignedUrl,
		//		generated_at:now,
		//		expire_on_seconds:time_before_expiration
		//	};
		//} else {
		//	throw `Error the file ${path} don't exist in minio`;
		//}
	}

/**
	 * Retrieve file content from Minio
	 * @param {Object} minioClient - Minio Client object
	 * @param {string} file - File path
	 * @returns {Promise<string>}
	 */
	async getFile(minioClient : Object, file : string) {
		//try {
		//	const objectStream = await minioClient.getObject(config.minio.bucket, file);
		//	objectStream.setEncoding('utf-8');
		//	let content = '';
		//	for await (const chunk of objectStream) {
		//		content += chunk;
		//	}
		//	return content;
		//} catch (err) {
		//	logger.error(`Error fetching file: ${err.message}`);
		//	throw err;
		//}
	}
	
	/**
	 * Check if the file exists in Minio bucket
	 * @param {Object} minioClient - Minio Client object
	 * @param {string} path - File path
	 * @returns {Promise<boolean>}
	 */
	async fileExists(minioClient : Object, path : string) {
		//logger.debug("Minio : fileExists");
		//try {
		//	const objectsStream = await minioClient.listObjectsV2(config.minio.bucket, path);
		//	const iterator = objectsStream[Symbol.asyncIterator]();
		//	const nextValue = await iterator.next();
		//	return !nextValue.done;
		//} catch (err) {
		//	logger.error(`Error checking file existence: ${err.message}`);
		//	return false;
		//}
	}
	
	/**
	 * Generate a presigned URL for a file in Minio
	 * @param {Object} minioClient - Minio Client object
	 * @param {string} path - File path
	 * @returns {Promise<string>}
	 */
	async getPresignedUrl(minioClient : Object, path : string, time: string) {
		//logger.info("Minio : getPresignedUrl");
		//try {
		//	const presignedUrl = await minioClient.presignedGetObject(config.minio.bucket, path, time);
		//	logger.info(presignedUrl);
		//	return presignedUrl;
		//} catch (err) {
		//	logger.error(`Error generating presigned URL: ${err.message}`);
		//	throw err;
		//}
	}
}