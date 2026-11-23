import { RequestInit } from 'undici';
export { Models } from './models.mjs';
export { Query, QueryBuilder, QueryInput, QueryTypes, QueryTypesList, flattenParam } from './query.mjs';
import './enums/database-type.mjs';
import './enums/attribute-status.mjs';
import './enums/column-status.mjs';
import './enums/index-status.mjs';
import './enums/deployment-status.mjs';
import './enums/execution-resource-type.mjs';
import './enums/execution-trigger.mjs';
import './enums/execution-status.mjs';
import './enums/project-auth-method-id.mjs';
import './enums/project-service-id.mjs';
import './enums/project-protocol-id.mjs';
import './enums/o-auth-2-github-prompt.mjs';
import './enums/o-auth-2-discord-prompt.mjs';
import './enums/o-auth-2-google-prompt.mjs';
import './enums/o-auth-2-zoho-prompt.mjs';
import './enums/o-auth-2-salesforce-prompt.mjs';
import './enums/o-auth-2-auth-0-prompt.mjs';
import './enums/o-auth-2-oidc-prompt.mjs';
import './enums/o-auth-2-okta-prompt.mjs';
import './enums/o-auth-2-microsoft-prompt.mjs';
import './enums/o-auth-2-kakao-prompt.mjs';
import './enums/platform-type.mjs';
import './enums/proxy-rule-deployment-resource-type.mjs';
import './enums/proxy-rule-status.mjs';
import './enums/proxy-rule-protocol.mjs';
import './enums/message-status.mjs';
import './enums/billing-plan-group.mjs';
import './enums/domain-transfer-status-enum.mjs';
import './enums/waf-rule-action.mjs';

type DefaultsShape = string | {
    items: DefaultsShape;
};
type DefaultsModel = {
    defaults?: Record<string, unknown>;
    properties?: Record<string, DefaultsShape>;
};
type Defaults = {
    root: DefaultsShape;
    models: Record<string, DefaultsModel>;
};
declare function applyDefaults<T>(value: T, tree: Defaults): T;
type Payload = {
    [key: string]: any;
};
type UploadProgress = {
    $id: string;
    progress: number;
    sizeUploaded: number;
    chunksTotal: number;
    chunksUploaded: number;
};
type Headers = {
    [key: string]: string;
};
declare class AppwriteException extends Error {
    code: number;
    response: string;
    type: string;
    constructor(message: string, code?: number, type?: string, response?: string);
}
declare function encodePath(value: unknown): string;
declare class Client {
    static CHUNK_SIZE: number;
    private selfSignedAgent?;
    config: {
        endpoint: string;
        selfSigned: boolean;
        project: string;
        key: string;
        organization: string;
        jwt: string;
        bearer: string;
        locale: string;
        environment: string;
        session: string;
        forwardeduseragent: string;
        cookie: string;
        impersonateuserid: string;
        impersonateuseremail: string;
        impersonateuserphone: string;
    };
    headers: Headers;
    /**
     * Set Endpoint
     *
     * Your project endpoint
     *
     * @param {string} endpoint
     *
     * @returns {this}
     */
    setEndpoint(endpoint: string): this;
    /**
     * Set self-signed
     *
     * @param {boolean} selfSigned
     *
     * @returns {this}
     */
    setSelfSigned(selfSigned: boolean): this;
    /**
     * Add header
     *
     * @param {string} header
     * @param {string} value
     *
     * @returns {this}
     */
    addHeader(header: string, value: string): this;
    /**
     * Get Headers
     *
     * Returns a copy of the current request headers, including any
     * authentication headers. Handle with care.
     *
     * @returns {Headers}
     */
    getHeaders(): Headers;
    /**
     * Set Project
     *
     * Your project ID
     *
     * @param value string
     *
     * @return {this}
     */
    setProject(value: string): this;
    /**
     * Set Key
     *
     * Your secret API key
     *
     * @param value string
     *
     * @return {this}
     */
    setKey(value: string): this;
    /**
     * Set Organization
     *
     * Your organization ID
     *
     * @param value string
     *
     * @return {this}
     */
    setOrganization(value: string): this;
    /**
     * Set JWT
     *
     * Your secret JSON Web Token
     *
     * @param value string
     *
     * @return {this}
     */
    setJWT(value: string): this;
    /**
     * Set Bearer
     *
     * The OAuth access token to authenticate with
     *
     * @param value string
     *
     * @return {this}
     */
    setBearer(value: string): this;
    /**
     * Set Locale
     *
     * @param value string
     *
     * @return {this}
     */
    setLocale(value: string): this;
    /**
     * Set Environment
     *
     * The ID of the project environment to act in, alongside the project ID. Used with Appwrite Cloud projects that have environments.
     *
     * @param value string
     *
     * @return {this}
     */
    setEnvironment(value: string): this;
    /**
     * Set Session
     *
     * The user session to authenticate with
     *
     * @param value string
     *
     * @return {this}
     */
    setSession(value: string): this;
    /**
     * Set ForwardedUserAgent
     *
     * The user agent string of the client that made the request
     *
     * @param value string
     *
     * @return {this}
     */
    setForwardedUserAgent(value: string): this;
    /**
     * Set Cookie
     *
     * The user cookie to authenticate with. Used by SDKs that forward an incoming Cookie header in server-side runtimes.
     *
     * @param value string
     *
     * @return {this}
     */
    setCookie(value: string): this;
    /**
     * Set ImpersonateUserId
     *
     * Impersonate a user by ID
     *
     * @param value string
     *
     * @return {this}
     */
    setImpersonateUserId(value: string): this;
    /**
     * Set ImpersonateUserEmail
     *
     * Impersonate a user by email
     *
     * @param value string
     *
     * @return {this}
     */
    setImpersonateUserEmail(value: string): this;
    /**
     * Set ImpersonateUserPhone
     *
     * Impersonate a user by phone
     *
     * @param value string
     *
     * @return {this}
     */
    setImpersonateUserPhone(value: string): this;
    prepareRequest(method: string, url: URL, headers?: Headers, params?: Payload): {
        uri: string;
        options: RequestInit;
    };
    chunkedUpload(method: string, url: URL, headers: Headers | undefined, originalPayload: Payload | undefined, onProgress: (progress: UploadProgress) => void, responseType?: string): Promise<any>;
    ping(): Promise<unknown>;
    redirect(method: string, url: URL, headers?: Headers, params?: Payload): Promise<string>;
    call(method: string, url: URL, headers?: Headers, params?: Payload, responseType?: string): Promise<any>;
    static flatten(data: Payload, prefix?: string): Payload;
}

export { AppwriteException, Client, type Payload, type UploadProgress, applyDefaults, encodePath };
