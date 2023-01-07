export type OpenConfig = {
  method: string;
  url: string | URL;
  async?: boolean;
  username?: string | null | undefined;
  password?: string | null | undefined;
};

export const XHRResponseKeys = [
  "response",
  "responseText",
  "status",
  "responseType",
] as const;
export type XHRResponse = Partial<
  Pick<XMLHttpRequest, "response" | "responseText" | "status" | "responseType">
>;

export const isXHRResponse = (obj: any): obj is XHRResponse => {
  if (Object.prototype.toString.call(obj) !== "[object Object]") return false;

  // Obj is XHRResponse if contains any valid key
  for (const key of XHRResponseKeys) {
    if (key in obj) return true;
  }
  return false;
};

export type BeforeOpenFunc = (
  openConfig: OpenConfig,
  xhr: XHRInterceptor
) => Promise<OpenConfig | undefined>;
export type BeforeSendFunc = (
  body: Document | XMLHttpRequestBodyInit | null | undefined,
  openConfig: OpenConfig,
  xhr: XHRInterceptor
) => Promise<
  Document | XMLHttpRequestBodyInit | null | undefined | XHRResponse
>;
export type AfterResponseFunc = (
  response: XHRResponse,
  openConfig: OpenConfig,
  body: Document | XMLHttpRequestBodyInit | null | undefined,
  xhr: XHRInterceptor
) => Promise<undefined | XHRResponse>;

export class XHRInterceptor extends XMLHttpRequest {
  static beforeOpenFuncs: BeforeOpenFunc[] = [];
  static beforeSendFuncs: BeforeSendFunc[] = [];
  static afterResponseFuncs: AfterResponseFunc[] = [];

  static addBeforeOpenFunc(newFunc: BeforeOpenFunc) {
    XHRInterceptor.beforeOpenFuncs.push(newFunc);
  }

  static addBeforeSendFunc(newFunc: BeforeSendFunc) {
    XHRInterceptor.beforeSendFuncs.push(newFunc);
  }

  static addAfterResponseFunc(newFunc: AfterResponseFunc) {
    XHRInterceptor.afterResponseFuncs.push(newFunc)
  }

  private openConfig: OpenConfig = { method: "GET", url: "" };
  private returnCustomResponse: boolean = false;
  private requestBody: Document | XMLHttpRequestBodyInit | null | undefined;
  private customResponse: XHRResponse = {};
  private globalPromise = Promise.resolve<any>({});

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
          let response: XHRResponse = {
            response: xhr.response,
            responseText: xhr.responseText,
            status: xhr.status,
            responseType: xhr.responseType,
          };

          xhr.globalPromise = xhr.globalPromise.then<XHRResponse | undefined>(() => undefined);
          for (let i = 0; i < XHRInterceptor.afterResponseFuncs.length; i++) {
            xhr.globalPromise = xhr.globalPromise.then((prevResponse) => {
              response = prevResponse || response;
              return XHRInterceptor.afterResponseFuncs[i](
                response,
                xhr.openConfig,
                xhr.requestBody,
                xhr
              );
            });
          }

          xhr.globalPromise.then(() => {
            if(xhr.returnCustomResponse) {
                xhr.customResponse = response;
            }
            // 直到所有的interceptor执行完毕 再进行触发
            xhr.dispatchEvent(new Event("readystatechange", {bubbles: false}));
          });
        }
      }
    );

    let onreadystatechangeFunc: Function = () => {};
    Object.defineProperty(xhr, 'onreadystatechange', {
        set: (newFunc) => {
            onreadystatechangeFunc = newFunc
        },
        get: () => {
            return () => {}
        },
        configurable: true,
        enumerable: true
    });

    xhr.addEventListener('readystatechange', function(...args) {
        onreadystatechangeFunc.call(this, ...args);
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
      method,
      url,
      async,
      username,
      password,
    };

    console.log("STUB OPEN");
    this.globalPromise = this.globalPromise.then<OpenConfig | void>(() => this.openConfig);
    for (let i = 0; i < XHRInterceptor.beforeOpenFuncs.length; i++) {
      this.globalPromise = this.globalPromise.then((prevConfig) => {
        this.openConfig = prevConfig || this.openConfig;
        return XHRInterceptor.beforeOpenFuncs[i](this.openConfig, this);
      });
    }

    this.globalPromise.then(() => {
      console.log('Open')
      if (this.openConfig.async === undefined) {
        super.open(this.openConfig.method, this.openConfig.url);
      } else {
        super.open(
          this.openConfig.method,
          this.openConfig.url,
          this.openConfig.async,
          this.openConfig.username,
          this.openConfig.password
        );
      }
    });

    const xhr = this;
    XHRResponseKeys.forEach((key) => {
      const originValue = xhr[key];
      Object.defineProperty(xhr, key, {
        get: () => {
          if (xhr.returnCustomResponse && key in xhr.customResponse) {
            return xhr.customResponse[key];
          }

          return originValue;
        },
        configurable: true,
        enumerable: true,
      });
    });


    
  }
  send(body?: Document | XMLHttpRequestBodyInit | null | undefined): void {
    this.globalPromise = this.globalPromise.then<
      Document | XMLHttpRequestBodyInit | null | undefined | XHRResponse
    >(undefined);
    for (let i = 0; i < XHRInterceptor.beforeSendFuncs.length; i++) {
      this.globalPromise = this.globalPromise.then((prevBody) => {
        if (isXHRResponse(prevBody)) {
          // 不send， 直接设置为已经send 完毕
          throw prevBody;
        }
        body = prevBody || body;
        return XHRInterceptor.beforeSendFuncs[i](
          prevBody,
          this.openConfig,
          this
        );
      });
    }
    const xhr = this;
    this.globalPromise
      .then((prev) => {
        xhr.requestBody = body;
        if (isXHRResponse(prev)) {
          // 不send， 直接设置为已经send 完毕
          throw prev;
        }
        return prev;
      })
      .then((prevBody) => {
        // send
        body = prevBody || body;
        super.send(body);
      })
      .catch((customRes) => {
        // 不send 直接触发事件，返回
        console.log('has custom res', customRes)
        xhr.returnCustomResponse = true;
        xhr.customResponse = customRes;
        Object.defineProperty(xhr, 'readyState', {
            get: () => 4,
            configurable: true,
            enumerable: true,
        })
        xhr.dispatchEvent(new Event("readystatechange", {bubbles: true}));
      });
  }
}
