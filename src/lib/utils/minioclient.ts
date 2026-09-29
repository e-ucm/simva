/**
 * @fileoverview S3 client for MinIO / RustFS object storage.
 *
 * Wraps the AWS SDK v3 S3 client exposing a small object storage API
 * (get/put/remove/exists/list/presign) over an S3 compatible service.
 *
 * @module utils/minioclient
 * @requires @aws-sdk/client-s3
 * @requires @aws-sdk/s3-request-presigner
 */

import {
    S3Client,
    CreateBucketCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    HeadBucketCommand,
    HeadObjectCommand,
    ListObjectsV2Command,
    PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { logger } from '@/lib/logger';
import { config } from '@/lib/config';
import { NotFoundError } from "../errors/appErrors";

/**
 * Object metadata returned by the listing operations
 */
export interface BucketItem {
    name: string;
    size: number;
    lastModified?: Date;
    etag?: string;
}

/**
 * Configuration options for MinioClient
 */
export interface MinioOpts {
    region: string;
    /**
     * Endpoint used by the server to reach the object storage service.
     * Inside the container network the external hostnames do not resolve, so this points
     * to the internal service endpoint (i.e. http://rustfs.internal.test:9000)
     */
    endpoint: string;
    /**
     * Public endpoint used only to sign the urls handed to the clients.
     * Falls back to {@link endpoint} when not provided
     */
    publicEndpoint?: string;
    accessKey: string;
    secretKey: string;
    // RustFS uses path-style URLs by default; virtual-host style requires RUSTFS_SERVER_DOMAINS
    forcePathStyle: boolean;
    bucket: string;
    presignedUrlFileExpirationTime: number;
}

/**
 * MinioClient - S3 client for MinIO / RustFS object storage operations
 *
 * Features:
 * - Command based calls through the AWS SDK v3
 * - Internal endpoint for the server side calls, public endpoint to sign the presigned urls
 * - Missing buckets are created on demand
 * - Proper error handling with initialization checks
 * - Type-safe operations with BucketItem types
 * - Efficient parallel object fetching
 */
class MinioClient {
    readonly #opts: MinioOpts;
    readonly #s3Client: S3Client | null;
    readonly #presignClient: S3Client | null;
    readonly #initialized: boolean;

    constructor(opts: MinioOpts) {
        try {
            this.#opts = opts;
            logger.info({ endpoint: opts.endpoint, publicEndpoint: opts.publicEndpoint, bucket: opts.bucket }, 'S3 OPTS');
            const credentials = {
                accessKeyId: opts.accessKey,
                secretAccessKey: opts.secretKey,
            };
            this.#s3Client = new S3Client({
                region: opts.region,
                endpoint: opts.endpoint,
                credentials,
                // RustFS uses path-style URLs by default; virtual-host style requires RUSTFS_SERVER_DOMAINS
                forcePathStyle: opts.forcePathStyle,
            });
            // Only used to sign the presigned urls, no request is ever sent through it
            this.#presignClient = new S3Client({
                region: opts.region,
                endpoint: opts.publicEndpoint ?? opts.endpoint,
                credentials,
                forcePathStyle: opts.forcePathStyle,
            });
            this.#initialized = true;
            logger.info('MinioClient initialized successfully');
        } catch (err) {
            logger.error({ err }, 'Failed to initialize MinioClient');
            this.#opts = opts;
            this.#s3Client = null;
            this.#presignClient = null;
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
     * Ensure client is initialized and return it
     * @throws Error if client is not initialized
     */
    private client(): S3Client {
        if (!this.#initialized || !this.#s3Client) {
            throw new Error('MinioClient is not initialized');
        }
        return this.#s3Client;
    }

    /**
     * Ensure client is initialized and return the client used to sign the presigned urls
     * @throws Error if client is not initialized
     */
    private presigner(): S3Client {
        if (!this.#initialized || !this.#presignClient) {
            throw new Error('MinioClient is not initialized');
        }
        return this.#presignClient;
    }

    /**
     * Check if an error means that the object does not exist
     * @param err - The error thrown by the S3 client
     */
    private isNotFound(err: any): boolean {
        return err?.name === 'NoSuchKey' || err?.name === 'NotFound' || err?.$metadata?.httpStatusCode === 404;
    }

    /**
     * Check if an error means that the bucket does not exist
     * @param err - The error thrown by the S3 client
     */
    private isNoSuchBucket(err: any): boolean {
        return err?.name === 'NoSuchBucket' || err?.$metadata?.httpStatusCode === 404 && err?.name !== 'NoSuchKey';
    }

    /**
     * Check if a bucket exists
     * @param bucket - Bucket name, defaults to the configured one
     * @returns Promise resolving to true if the bucket exists
     */
    async bucketExists(bucket?: string): Promise<boolean> {
        const client = this.client();
        const name = bucket ?? this.#opts.bucket;
        try {
            await client.send(new HeadBucketCommand({ Bucket: name }));
            return true;
        } catch (err) {
            logger.debug({ bucket: name, err }, 'S3: bucket not found');
            return false;
        }
    }

    /**
     * Create a bucket if it does not exist yet
     * @param bucket - Bucket name, defaults to the configured one
     */
    async ensureBucket(bucket?: string): Promise<void> {
        const client = this.client();
        const name = bucket ?? this.#opts.bucket;
        if (await this.bucketExists(name)) {
            return;
        }
        logger.info({ bucket: name }, 'S3: creating bucket');
        await client.send(new CreateBucketCommand({ Bucket: name }));
    }

    /**
     * Run an operation, creating the target bucket and retrying once if it is missing
     * @param bucket - Bucket used by the operation
     * @param operation - Operation to run
     */
    private async withBucket<T>(bucket: string, operation: () => Promise<T>): Promise<T> {
        try {
            return await operation();
        } catch (err) {
            if (this.isNoSuchBucket(err)) {
                logger.warn({ bucket }, 'S3: bucket missing, creating it and retrying');
                await this.ensureBucket(bucket);
                return await operation();
            }
            throw err;
        }
    }

    /**
     * Get file content from the default bucket
     * @param file - Path to the file
     * @returns Promise resolving to file content as string
     * @throws {NotFoundError} if the file does not exist
     */
    async getFile(file: string): Promise<string> {
        const client = this.client();
        logger.debug({ file }, 'S3: getFile');
        try {
            return await this.withBucket(this.#opts.bucket, async () => {
                const response = await client.send(new GetObjectCommand({
                    Bucket: this.#opts.bucket,
                    Key: file,
                }));
                if (!response?.Body) {
                    throw new NotFoundError(`file ${file} is empty`);
                }
                return await response.Body.transformToString('utf-8');
            });
        } catch (err) {
            if (err instanceof NotFoundError || this.isNotFound(err)) {
                throw new NotFoundError(`file ${file} not found`);
            }
            logger.error({ err, file }, 'S3: getFile failed');
            throw err;
        }
    }

    /**
     * Check if a file exists in the default bucket
     * @param path - Path to check
     * @returns Promise resolving to true if file exists
     */
    async fileExists(path: string): Promise<boolean> {
        const client = this.client();
        logger.debug({ path }, 'S3: fileExists');
        try {
            await client.send(new HeadObjectCommand({
                Bucket: this.#opts.bucket,
                Key: path,
            }));
            logger.debug({ path }, 'S3: file exists');
            return true;
        } catch (err) {
            if (this.isNotFound(err) || this.isNoSuchBucket(err)) {
                logger.debug({ path }, 'S3: file not found');
                return false;
            }
            logger.error({ err, path }, 'S3: fileExists failed');
            return false;
        }
    }

    /**
     * Generate a presigned URL for an object in the default bucket
     * @param path - Object path
     * @param expirySeconds - Optional custom expiry time in seconds
     * @returns Promise resolving to presigned URL
     */
    async getPresignedUrl(path: string, expirySeconds?: number): Promise<string> {
        const expiresIn = expirySeconds ?? this.#opts.presignedUrlFileExpirationTime;
        logger.debug({ path, expiresIn }, 'S3: getPresignedUrl');
        // Signed with the public endpoint, the url is consumed outside the internal network
        const url = await getSignedUrl(
            this.presigner(),
            new GetObjectCommand({
                Bucket: this.#opts.bucket,
                Key: path,
            }),
            { expiresIn }
        );
        logger.info({ path }, 'S3: presigned URL generated');
        return url;
    }

    /**
     * Get object content from a specific bucket
     * @param bucket - Bucket name
     * @param name - Object name/path
     * @returns Promise resolving to object content as string
     */
    async getObject(bucket: string, name: string): Promise<string> {
        const client = this.client();
        logger.debug({ bucket, name }, 'S3: getObject');
        const response = await this.withBucket(bucket, () => client.send(new GetObjectCommand({
            Bucket: bucket,
            Key: name,
        })));
        if (!response?.Body) {
            throw new NotFoundError(`object ${name} is empty`);
        }
        return await response.Body.transformToString('utf-8');
    }

    /**
     * List objects in a bucket with a prefix
     * @param bucket - Bucket name
     * @param prefix - Object prefix filter
     * @returns Promise resolving to array of bucket items
     */
    async listMinioObjects(bucket: string, prefix: string): Promise<BucketItem[]> {
        const client = this.client();
        logger.debug({ bucket, prefix }, 'S3: listMinioObjects');
        const items: BucketItem[] = [];
        let continuationToken: string | undefined = undefined;
        do {
            const response: any = await this.withBucket(bucket, () => client.send(new ListObjectsV2Command({
                Bucket: bucket,
                Prefix: prefix,
                ContinuationToken: continuationToken,
            })));
            for (const object of response?.Contents ?? []) {
                items.push({
                    name: object.Key,
                    size: object.Size ?? 0,
                    lastModified: object.LastModified,
                    etag: object.ETag,
                });
            }
            continuationToken = response?.IsTruncated ? response?.NextContinuationToken : undefined;
        } while (continuationToken);
        return items;
    }

    /**
     * Get all objects with a prefix and return as JSON array string
     * @param bucket - Bucket name
     * @param prefix - Object prefix filter
     * @returns Promise resolving to JSON array string of all object contents
     */
    async getMinioObjects(bucket: string, prefix: string): Promise<string> {
        logger.debug({ bucket, prefix }, 'S3: getMinioObjects');
        const objectsList = await this.listMinioObjects(bucket, prefix);
        // Fetch contents in parallel
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
        this.client();
        logger.debug({ count: paths.length }, 'S3: getFiles');
        return Promise.all(paths.map(path => this.getFile(path)));
    }

    /**
     * Check if multiple files exist
     * @param paths - Array of file paths
     * @returns Promise resolving to map of path -> exists
     */
    async filesExist(paths: string[]): Promise<Map<string, boolean>> {
        this.client();
        logger.debug({ count: paths.length }, 'S3: filesExist');
        const results = await Promise.all(
            paths.map(async path => ({ path, exists: await this.fileExists(path) }))
        );
        return new Map(results.map(r => [r.path, r.exists]));
    }

    /**
     * Remove a file from the default bucket
     * @param file - Path to the file
     */
    async removeFile(file: string): Promise<void> {
        const client = this.client();
        logger.debug({ file }, 'S3: removeFile');
        await this.withBucket(this.#opts.bucket, () => client.send(new DeleteObjectCommand({
            Bucket: this.#opts.bucket,
            Key: file,
        })));
    }

    /**
     * Store a file in the default bucket
     * @param file - Path to the file
     * @param content - Content to store
     */
    async putFile(file: string, content: string): Promise<void> {
        const client = this.client();
        logger.debug({ file }, 'S3: putFile');
        await this.withBucket(this.#opts.bucket, () => client.send(new PutObjectCommand({
            Bucket: this.#opts.bucket,
            Key: file,
            Body: content,
        })));
    }

    /**
     * Copy a file of the default bucket to another path, removing the original one
     * @param oldPath - Current path of the file
     * @param newPath - New path of the file
     */
    async renameFile(oldPath: string, newPath: string): Promise<void> {
        this.client();
        if (await this.fileExists(oldPath)) {
            logger.debug({ oldPath, newPath }, 'S3: renameFile');
            const content = await this.getFile(oldPath);
            await this.putFile(newPath, content);
            await this.removeFile(oldPath);
        }
    }
}

/**
 * Build the S3 endpoint from the configured url and port
 * @param url - Url of the object storage service, with or without protocol
 * @param port - Port of the object storage service
 * @param ssl - Whether to use https when the url has no protocol
 * @returns The endpoint to be used by the S3 client
 */
function buildEndpoint(url: string, port?: number, ssl = true): string {
    const endpoint = new URL(url.match(/^https?:\/\//) ? url : `${ssl ? 'https' : 'http'}://${url}`);
    if (port && !endpoint.port && [80, 443].indexOf(port) === -1) {
        endpoint.port = `${port}`;
    }
    // Keep any path prefix (deployments served under a subpath), drop the root one
    logger.info({url, port}, "S3 Object")
    return endpoint.pathname === '/' ? endpoint.origin : endpoint.href.replace(/\/+$/, '');
}

// Singleton instance with default config
const minioClient = new MinioClient({
    region: process.env.RUSTFS_REGION || process.env.AWS_REGION || 'us-east-1',
    // Server side calls use the internal endpoint, presigned urls are signed with the public one
    endpoint: buildEndpoint(config.minio.internalUrl),
    publicEndpoint: buildEndpoint(config.minio.apiUrl, config.minio.port, config.minio.ssl),
    accessKey: config.minio.accessKey,
    secretKey: config.minio.secretKey,
    forcePathStyle: true,
    bucket: config.minio.bucket,
    presignedUrlFileExpirationTime: config.minio.presignedUrlFileExpirationTime,
});

export { minioClient, MinioClient };
export default MinioClient;
