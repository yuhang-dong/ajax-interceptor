export type XHROpenConfig = {
    async?: boolean;
    username?: string | null;
    password?: string | null;
  };

export type InterceptorRequestInit = {
    method?: string, // default: GET
    url?: string,
    body?: XMLHttpRequestBodyInit | null | Document,
    credentials?: RequestCredentials,
    headers?: Record<string, string>;
    originConfig?: XHROpenConfig;
    type: 'RequestInit'
}

export type HTTPResponse = {
    headers?: Record<string, string>;
    status?: number;
    statusText?: string;
    response?: Blob;
    type: 'HTTPResponse'
}
export type HTTPErrorType = 'error' | 'timeout' | 'abort' | 'fetch'

export type HTTPError = {
    type: HTTPErrorType,
    cause?: Error
}

export type BeforeRequest = (requestInit: InterceptorRequestInit) => Promise<void | undefined | InterceptorRequestInit | HTTPResponse>;
export type AfterResponse = (response: HTTPResponse, requestInit: InterceptorRequestInit) => Promise<void | undefined | HTTPResponse>;
export type ReceiveError = (err: HTTPError, requestInit: InterceptorRequestInit) => Promise<void | undefined | HTTPError | HTTPResponse>;

export const beforeRequestFuncs: BeforeRequest[] = [];
export const afterResponseFuncs: AfterResponse[] = [];
export const receiveErrorFuncs: ReceiveError[] = [];

export const defineResponse = (response: Omit<HTTPResponse, 'type'>): HTTPResponse => {
    return {
        ...response,
        type: 'HTTPResponse'
    }
}

export const defineRequestInit = (requestInit: Omit<InterceptorRequestInit, 'type'>): InterceptorRequestInit => {
    return {
        ...requestInit,
        type: 'RequestInit'
    }
}

export const addBeforeRequestInterceptor = (beforeRequest: BeforeRequest) => {
    beforeRequestFuncs.push(beforeRequest);
}

export const addAfterResponseInterceptor = (afterResponse: AfterResponse) => {
    afterResponseFuncs.push(afterResponse);
}

export const addReceiveErrorInterceptor = (receiveError: ReceiveError) => {
    receiveErrorFuncs.push(receiveError);
}

export const isHTTPResponse = (obj: any): obj is HTTPResponse => {
    return obj && obj.type === 'HTTPResponse'
}
