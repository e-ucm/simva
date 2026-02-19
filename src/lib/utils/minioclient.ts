import { Client as Minio, BucketItem } from 'minio';
import { Readable } from 'stream';
import { logger } from '@/lib/logger';
import { config } from '@/lib/config';

/**
 * Configuration options for MinioClient
 */
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
    presignedUrlFileExpirationTime: number;
}

/**
 * MinioClient - Optimized client for Minio object storage operations
 * 
 * Features:
 * - Unified stream reading for consistency
 * - Proper error handling with initialization checks
 * - Type-safe operations with BucketItem types
 * - Efficient parallel object fetching
 */
class MinioClient {
    readonly #opts: MinioOpts;
    readonly #minio: Minio | null;
    readonly #initialized: boolean;

    constructor(opts: MinioOpts) {
        try {
            this.#opts = opts;
            this.#minio = new Minio({
                endPoint: opts.api_host,
                port: opts.port,
                useSSL: opts.useSSL,
                accessKey: opts.access_key,
                secretKey: opts.secret_key
            });
            this.#initialized = true;
            logger.info('MinioClient initialized successfully');
        } catch (err) {
            logger.error({ err }, 'Failed to initialize MinioClient');
            this.#opts = opts;
            this.#minio = null;
            this.#initialized = false;
        }
    }

    /**
     * Check if client is properly initialized
     */
    get isInitialized(): boolean {
        return this.#initialized;
    }

    /**
     * Get the default bucket name
     */
    get defaultBucket(): string {
        return this.#opts.bucket;
    }

    /**
     * Ensure client is initialized before operations
     * @throws Error if client is not initialized
     */
    private ensureInitialized(): asserts this is { '#minio': Minio } {
        if (!this.#initialized || !this.#minio) {
            throw new Error('MinioClient is not initialized');
        }
    }

    /**
     * Convert a readable stream to string (unified stream reading)
     * @param stream - The readable stream to convert
     * @returns Promise resolving to the string content
     */
    private async streamToString(stream: Readable): Promise<string> {
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        return Buffer.concat(chunks).toString('utf8');
    }

    /**
     * Convert a readable stream to an array of items
     * @param stream - The readable stream
     * @returns Promise resolving to array of items
     */
    private async streamToArray<T>(stream: Readable): Promise<T[]> {
        const items: T[] = [];
        for await (const item of stream) {
            items.push(item as T);
        }
        return items;
    }

    /**
     * Get file content from the default bucket
     * @param file - Path to the file
     * @returns Promise resolving to file content as string
     */
    async getFile(file: string): Promise<string> {
        this.ensureInitialized();
        logger.debug({ file }, 'Minio: getFile');
        
        const stream = await this.#minio!.getObject(this.#opts.bucket, file);
        return this.streamToString(stream);
    }

    /**
     * Check if a file exists in the default bucket
     * @param path - Path to check
     * @returns Promise resolving to true if file exists
     */
    async fileExists(path: string): Promise<boolean> {
        this.ensureInitialized();
        logger.debug({ path }, 'Minio: fileExists');
        
        const stream = this.#minio!.listObjectsV2(this.#opts.bucket, path);
        const iterator = stream[Symbol.asyncIterator]();
        const { done } = await iterator.next();
        return !done;
    }

    /**
     * Get presigned URL for activity traces file
     * @param activityId - The activity ID
     * @returns Promise resolving to presigned URL or empty string if file doesn't exist
     */
    async getPresignedFileUrl(activityId: string): Promise<string> {
        this.ensureInitialized();
        
        const path = `${this.#opts.outputs_dir}/${activityId}/${this.#opts.traces_file}`;
        logger.info({ activityId, path }, 'Minio: getPresignedFileUrl');
        
        if (await this.fileExists(path)) {
            return this.getPresignedUrl(path);
        }
        return '';
    }

    /**
     * Generate a presigned URL for an object
     * @param path - Object path
     * @param expirySeconds - Optional custom expiry time in seconds
     * @returns Promise resolving to presigned URL
     */
    async getPresignedUrl(path: string, expirySeconds?: number): Promise<string> {
        this.ensureInitialized();
        
        const expiry = expirySeconds ?? this.#opts.presignedUrlFileExpirationTime;
        logger.debug({ path, expiry }, 'Minio: getPresignedUrl');
        
        const url = await this.#minio!.presignedGetObject(this.#opts.bucket, path, expiry);
        logger.info({ path, url }, 'Minio: presigned URL generated');
        return url;
    }

    /**
     * Get object content from a specific bucket
     * @param bucket - Bucket name
     * @param name - Object name/path
     * @returns Promise resolving to object content as string
     */
    async getObject(bucket: string, name: string): Promise<string> {
        this.ensureInitialized();
        logger.debug({ bucket, name }, 'Minio: getObject');
        
        const stream = await this.#minio!.getObject(bucket, name);
        return this.streamToString(stream);
    }

    /**
     * List objects in a bucket with a prefix
     * @param bucket - Bucket name
     * @param prefix - Object prefix filter
     * @returns Promise resolving to array of bucket items
     */
    async listMinioObjects(bucket: string, prefix: string): Promise<BucketItem[]> {
        this.ensureInitialized();
        logger.debug({ bucket, prefix }, 'Minio: listMinioObjects');
        
        const stream = this.#minio!.listObjects(bucket, prefix);
        return this.streamToArray<BucketItem>(stream);
    }

    /**
     * Get all objects with a prefix and return as JSON array string
     * @param bucket - Bucket name
     * @param prefix - Object prefix filter
     * @returns Promise resolving to JSON array string of all object contents
     */
    async getMinioObjects(bucket: string, prefix: string): Promise<string> {
        this.ensureInitialized();
        logger.debug({ bucket, prefix }, 'Minio: getMinioObjects');
        
        const objectsList = await this.listMinioObjects(bucket, prefix);
        
        // Filter objects with names and fetch in parallel
        const contents = await Promise.all(
            objectsList
                .filter((obj): obj is BucketItem & { name: string } => !!obj.name)
                .map(obj => this.getObject(bucket, obj.name))
        );
        
        return `[${contents.join(',')}]`;
    }

    /**
     * Get multiple files from the default bucket in parallel
     * @param paths - Array of file paths
     * @returns Promise resolving to array of file contents
     */
    async getFiles(paths: string[]): Promise<string[]> {
        this.ensureInitialized();
        logger.debug({ count: paths.length }, 'Minio: getFiles');
        
        return Promise.all(paths.map(path => this.getFile(path)));
    }

    /**
     * Check if multiple files exist
     * @param paths - Array of file paths
     * @returns Promise resolving to map of path -> exists
     */
    async filesExist(paths: string[]): Promise<Map<string, boolean>> {
        this.ensureInitialized();
        logger.debug({ count: paths.length }, 'Minio: filesExist');
        
        const results = await Promise.all(
            paths.map(async path => ({ path, exists: await this.fileExists(path) }))
        );
        
        return new Map(results.map(r => [r.path, r.exists]));
    }
}

// Singleton instance with default config
const minioClient = new MinioClient(config.minio);

export { minioClient };
export type { MinioOpts };
export default MinioClient;