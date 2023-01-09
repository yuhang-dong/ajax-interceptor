import { beforeRequestFuncs, HTTPResponse, afterResponseFuncs, receiveErrorFuncs, HTTPError, HTTPErrorType, isHTTPResponse } from "./interceptor";
import type {InterceptorRequestInit} from './interceptor'

export const XHRResponseKeys = [
  "status",
  "statusText",
  "response",
] as const;

export class XHRInterceptor extends XMLHttpRequest {

  private openConfig: InterceptorRequestInit = {type: 'RequestInit'};
  private returnCustomResponse: boolean = false;
  private customResponse: HTTPResponse = {type: 'HTTPResponse'};
  private globalPromise = Promise.resolve<any>({});
  private customReadyState = 0;

  constructor() {
    super();

    const xhr = this;
    let isIntercept = false;
    xhr.addEventListener(
      "readystatechange",
      function(event) {
        if (xhr.readyState === 4) {
          // 需要注意支持async状态
          if (isIntercept) return;
          isIntercept = !isIntercept;
          event.stopImmediatePropagation();
          // read xhr response as blob
          let response: HTTPResponse = {
            response: xhr.response,
            headers: XHRInterceptor.parseAllHeaders(xhr.getAllResponseHeaders()),
            status: xhr.status,
            statusText: xhr.statusText,
            type: 'HTTPResponse'
          };
          xhr.globalPromise = xhr.globalPromise.then<HTTPResponse | undefined>(() => undefined);
          for (let i = 0; i < afterResponseFuncs.length; i++) {
            xhr.globalPromise = xhr.globalPromise.then((prevResponse) => {
              response = prevResponse || response;
              return afterResponseFuncs[i](
                response,
                xhr.openConfig
              );
            });
          }

          xhr.globalPromise.then(() => {
            if(xhr.returnCustomResponse) {
                xhr.customResponse = response;
            }
            if(xhr.status === 0) {
              // 失败，控制权交给onerror
              return;
            }
            // 直到所有的interceptor执行完毕 再进行触发
            xhr.dispatchEvent(new Event("readystatechange", {bubbles: false}));
          });
        }
      }
    );

    // change the priority of onXXXX and addEventListener
    let onreadystatechangeFunc: Function = () => {};
    Object.defineProperty(xhr, 'onreadystatechange', {
        set: (newFunc) => {
            onreadystatechangeFunc = newFunc
        },
        get: () => {
            return onreadystatechangeFunc;
        },
        configurable: true,
        enumerable: true
    });

    xhr.addEventListener('readystatechange', function(...args) {
        onreadystatechangeFunc.call(this, ...args);
    });

    let errHasCatched = false;
    xhr.addEventListener('error', function(event) {
      if(errHasCatched) return;
      errHasCatched = true;
      event.stopImmediatePropagation();
      let errorOrResponse: HTTPError | HTTPResponse = {
        type: event.type as HTTPErrorType,
      }
      xhr.globalPromise = xhr.globalPromise.then<void | undefined | HTTPError | HTTPResponse>(() => undefined);
      for(let i = 0; i < receiveErrorFuncs.length; i++) {
        xhr.globalPromise = xhr.globalPromise.then((prevResponse) => {
          errorOrResponse = prevResponse || errorOrResponse;
          if(isHTTPResponse(errorOrResponse)) {
            throw errorOrResponse;
          }
          return receiveErrorFuncs[i](errorOrResponse, xhr.openConfig);
        });
      }

      xhr.globalPromise.then((prevResponse) => {
        errorOrResponse = prevResponse || errorOrResponse;
        if(isHTTPResponse(errorOrResponse)) {
          throw errorOrResponse;
        }
        // touch error or abort or timeout
        xhr.dispatchEvent(new Event(errorOrResponse.type, {bubbles: false}));
      }).catch((response) => {
        xhr.customResponse = response;
        xhr.returnCustomResponse = true;
        xhr.dispatchEvent(new Event("readystatechange", {bubbles: false}));
      })
    })

    let onerrorFunc: Function = () => {};
    Object.defineProperty(xhr, 'onerror', {
      set: (newFunc) => {
        onerrorFunc = newFunc
      },
      get: () => {
          return onerrorFunc;
      },
      configurable: true,
      enumerable: true
    });
    xhr.addEventListener('error', function(...args) {
      onerrorFunc.call(xhr, ...args);
    });

    // 拦截数据获取
    XHRResponseKeys.forEach((key) => {
      // maybe is any typescript magic? https://github.com/microsoft/TypeScript/issues/4465#issuecomment-360256835
      const getOrigin = () => super[key]
      Object.defineProperty(xhr, key, {
        get: () => {
          if (xhr.returnCustomResponse && key in xhr.customResponse) {
            return xhr.customResponse[key];
          }
          if(key === 'response') {
            const originXHRResponseType = super['responseType'];
            super['responseType'] = 'blob';
            const response = getOrigin();
            super['responseType'] = originXHRResponseType;
            return response;
          }
          return getOrigin();
        },
        configurable: true,
        enumerable: true,
      });
    });
  }

  open(method: string, url: string | URL): void;
  open(
    method: string,
    url: string | URL,
    async: boolean,
    username?: string | null,
    password?: string | null
  ): void;
  open(
    method: string,
    url: string | URL,
    async?: boolean,
    username?: string | null,
    password?: string | null
  ): void {
    this.openConfig = {
      ...this.openConfig,
      method,
      url: url.toString(),
      originConfig: {
        async,
        username,
        password
      }
    };
    
  }

  send(body?: Document | XMLHttpRequestBodyInit | null | undefined): void {
    this.globalPromise = this.globalPromise.then<
      Document | XMLHttpRequestBodyInit | null | undefined | InterceptorRequestInit
    >(() => this.openConfig);
    this.openConfig.body = body;
    for (let i = 0; i < beforeRequestFuncs.length; i++) {
      this.globalPromise = this.globalPromise.then((prevReturn) => {
        if (prevReturn && prevReturn['type'] === 'HTTPResponse') {
          // 不send， 直接设置为已经send 完毕
          throw prevReturn;
        }
        if(prevReturn && prevReturn?.['type'] === 'RequestInit') {
          this.openConfig = prevReturn
        }
        return beforeRequestFuncs[i](
          this.openConfig
        );
      });
    }
    const xhr = this;
    this.globalPromise
      .then((prevReturn) => {
        if(prevReturn && prevReturn['type'] === 'RequestInit') {
          this.openConfig = prevReturn
        }

        if(this.openConfig.credentials === 'include') {
          super.withCredentials = true;
        } else {
          super.withCredentials = false;
        }

        if(this.openConfig.headers) {
          for(const headerKey in this.openConfig.headers) {
            super.setRequestHeader(headerKey, this.openConfig.headers[headerKey])
          }
        }

        // open
        if (this.openConfig.originConfig!.async === undefined) {
          super.open(this.openConfig.method!, this.openConfig.url!);
        } else {
          super.open(
            this.openConfig.method!,
            this.openConfig.url!,
            this.openConfig.originConfig!.async,
            this.openConfig.originConfig!.username,
            this.openConfig.originConfig!.password
          );
        }
        

        if (prevReturn && prevReturn['type'] === 'HTTPResponse') {
          // 不send， 直接设置为已经send 完毕
          throw prevReturn;
        }
        return prevReturn;
      })
      .then(() => {
        // send
        super.send(this.openConfig.body);
        
      })
      .catch((customRes) => {
        // 不send 直接触发事件，返回
        xhr.returnCustomResponse = true;
        xhr.customResponse = customRes;

        xhr.customReadyState = 4;
        Object.defineProperty(xhr, 'readyState', {
          get: () => xhr.customReadyState,
          configurable: true,
          enumerable: true,
        })
        // TODO 没有完成readyState 2，3，4的步骤
        xhr.dispatchEvent(new Event("readystatechange", {bubbles: false}));
      });
  }

  getAllResponseHeaders(): string {
    if(this.returnCustomResponse && 'headers' in this.customResponse) {
      const headers = this.customResponse.headers;
      if(headers === undefined) {
        return '';
      }
      return Object.entries(headers).map((headerEntry) => `${headerEntry[0]}: ${headerEntry[1]}`).join('\n');
    }

    return super.getAllResponseHeaders();
  }
  getResponseHeader(name: string): string | null {
    if(this.returnCustomResponse && 'headers' in this.customResponse) {
      const headers = this.customResponse.headers;
      if(headers === undefined) {
        return null;
      }
      return headers[name] || null;
    }

    return super.getResponseHeader(name);
  }

  static parseAllHeaders(headers: string): Record<string, string> {
    const record: Record<string, string> = {};
    headers.split('\n').forEach(header => {
      const [key, value] = header.split(':');
      record[key] = value;
    });

    return record;
  }
}
