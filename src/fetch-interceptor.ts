import {isHTTPResponse, afterResponseFuncs, beforeRequestFuncs, defineResponse, HTTPError, HTTPResponse, InterceptorRequestInit, receiveErrorFuncs } from "./interceptor";


export const originFetch = window.fetch;

export const FetchInterceptor = (input: RequestInfo | URL, init?: RequestInit) => {
    let requestInit: InterceptorRequestInit = {
        url: input.toString(),
        method: init?.method,
        credentials: init?.credentials,
        body: init?.body as any,
        type: 'RequestInit',
        headers: parseHeaders(init?.headers),
    };

    let globalPromise = Promise.resolve<any>(undefined);

    for(let i = 0; i < beforeRequestFuncs.length; i++) {
        globalPromise = globalPromise.then((prev) => {
            if(isHTTPResponse(prev)) {
                throw prev;
            }

            requestInit = prev || requestInit;

            return beforeRequestFuncs[i](requestInit);
        })
    }

    const getInitValue = (key: keyof Omit<InterceptorRequestInit, 'url' | 'type' | 'originConfig'>) => {
        return key in requestInit ? requestInit[key] : (init?.[key]) as any
    }

    globalPromise = globalPromise.then((prev) => {
        if(isHTTPResponse(prev)) {
            throw prev;
        }

        requestInit = prev || requestInit;
    }).catch((err) => {
        if(isHTTPResponse(err)) {
            return err;
        }
        // other err, caused by interceptor, swallow it
        console.error('Interceptor cause some err: ', err);
        return undefined;
    }).then((prevResponse) => {
        if(isHTTPResponse(prevResponse)) {
            // Don't send request, use interceptor return as response directly.
            return new Response(prevResponse.response, {
                headers: prevResponse.headers,
                status: prevResponse.status,
                statusText: prevResponse.statusText
            });
        }

        return originFetch(requestInit.url!, {
            ...init,
            method: getInitValue('method'),
            body: getInitValue('body'),
            credentials: getInitValue('credentials'),
            headers: getInitValue('headers')
        })
    })
    .then((res: Response) => {
        // after response interceptors
        const resClone = res.clone();
        return resClone.blob().then((data) => {
            let interceptorResponse: HTTPResponse = defineResponse({
                response: data,
                headers: parseHeaders(resClone.headers),
                status: resClone.status,
                statusText: resClone.statusText,
            });

            let globalPromise = Promise.resolve<void | undefined | HTTPResponse>(undefined);
            for(let i = 0; i < afterResponseFuncs.length; i++) {
                globalPromise = globalPromise.then((prevResp) => {
                    interceptorResponse = prevResp || interceptorResponse;
                    return afterResponseFuncs[i](interceptorResponse, requestInit);
                });
            }
            globalPromise = globalPromise.then((prevResp) => {
                interceptorResponse = prevResp || interceptorResponse;
                return interceptorResponse;
            });

            return globalPromise.then(prevResponse => {
                return new Response(prevResponse!.response, {
                    headers: prevResponse!.headers,
                    status: prevResponse!.status,
                    statusText: prevResponse!.statusText
                    })
            });

        })
    }).catch(err => {
        let errorOrResponse: HTTPError | HTTPResponse = {
            type: 'fetch',
            cause: err
          }
          let globalPromise = Promise.resolve<void | undefined | HTTPError | HTTPResponse>(undefined);
          for(let i = 0; i < receiveErrorFuncs.length; i++) {
            globalPromise = globalPromise.then((prevResponse) => {
              errorOrResponse = prevResponse || errorOrResponse;
              if(isHTTPResponse(errorOrResponse)) {
                throw errorOrResponse;
              }
              return receiveErrorFuncs[i](errorOrResponse, requestInit);
            });
          }
    
          globalPromise.then((prevResponse) => {
            errorOrResponse = prevResponse || errorOrResponse;
            if(isHTTPResponse(errorOrResponse)) {
              return new Response(errorOrResponse.response, {
                headers: errorOrResponse.headers,
                status: errorOrResponse.status,
                statusText: errorOrResponse.statusText
              });
            }

            throw errorOrResponse;
          })

        return globalPromise;
    })

    return globalPromise;

}

const parseHeaders = (headers: [string, string][] | Headers | undefined | Record<string, string>) => {
    if(headers === undefined || !('forEach' in headers) || typeof headers['forEach'] !== 'function') return (headers as undefined | Record<string, string>);
    const ans: Record<string, string> = {};
    headers.forEach(header => {
        ans[header[0]] = header[1];
    });

    return ans;
}