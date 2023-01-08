export type XHROpenConfig = {
    async?: boolean;
    username?: string | null;
    password?: string | null;
  };

export type RequestInit = {
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
    response?: any;
    type: 'HTTPResponse'
}
export type HTTPErrorType = 'error' | 'timeout' | 'abort'

export type HTTPError = {
    type: HTTPErrorType
}

export type BeforeRequest = (requestInit: RequestInit) => Promise<void | undefined | RequestInit | HTTPResponse>;
export type AfterResponse = (response: HTTPResponse) => Promise<void | undefined | HTTPResponse>;
export type ReceiveError = (err: HTTPError) => Promise<void | undefined | HTTPError | HTTPResponse>;

export const beforeRequestFuncs: BeforeRequest[] = [];
export const afterResponseFuncs: AfterResponse[] = [];
export const receiveErrorFuncs: ReceiveError[] = [];
export const defineResponse = (response: Omit<HTTPResponse, 'type'>): HTTPResponse => {
    return {
        ...response,
        type: 'HTTPResponse'
    }
}

export const defineRequestInit = (requestInit: Omit<RequestInit, 'type'>): RequestInit => {
    return {
        ...requestInit,
        type: 'RequestInit'
    }
}