<p align="center"><img src='./docs/icon.svg' width="474px" height="98px"/></p>

---

[![npm version](https://img.shields.io/npm/v/@elliotdong/ajax-interceptor?color=blue)](https://www.npmjs.org/package/@elliotdong/ajax-interceptor) [![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://opensource.org/licenses/mit-license.php) ![](https://img.shields.io/badge/TypeScript-support-orange.svg)   [![](https://img.shields.io/bundlephobia/minzip/@elliotdong/ajax-interceptor/latest)](https://unpkg.com/ajax-hook@2.0.0/dist/ajaxhook.core.min.js)

---

`ajax-interceptor` is a library to intercept `XMLHttpRequest` and `Fetch`. We can use it to change request header, method, even destination. It has the below props:

* 🍃 **No Inject**. It doesn't change any business code, we can provide external script to intercept request.

<img src='./docs/process.svg'/>

## Usage
You can see the examples from [examples](./examples/)
### Install

* CDN Import
    ```html
    <script src="https://unpkg.com/@elliotdong/ajax-interceptor@latest/dist/index.umd.cjs"></script>
    ```
    This will import a global object - interceptor.
 * NPM Install
    ```
    npm install @elliotdong/ajax-interceptor

    // or

    yarn add @elliotdong/ajax-interceptor

    // or
    pnpm install @elliotdong/ajax-interceptor
    ```
### API

#### Start Intercept

```js
// CDN import
interceptor.intercept();

```

```js
// npm install
import { intercept } from '@elliotdong/ajax-interceptor';

intercept()
```
#### Stop Intercept
```js
// CDN import
interceptor.unIntercept();
```

```js
// npm install
import { unIntercept } from '@elliotdong/ajax-interceptor';
unIntercept();
```
#### Use BeforeRequest Interceptor
```ts
import { addBeforeRequestInterceptor, defineRequestInit } from '@elliotdong/ajax-interceptor';

addBeforeRequestInterceptor(async (requestInit: {
    method?: string, // default: GET
    url?: string,
    body?: XMLHttpRequestBodyInit | null | Document,
    credentials?: "include" | "omit" | "same-origin",
    headers?: Record<string, string>;
}) => {
    console.log({requestInit});

    if(requestInit.method === 'get') {
        // if you want to change request, use `defineRequestInit`
        return defineRequestInit({
            method?: string,
            url?: string,
            body?: XMLHttpRequestBodyInit | null | Document,
            credentials?: RequestCredentials,
            headers?: Record<string, string>;
        })
    }
    // or not, return void
})
```

#### Use AfterResponse Interceptor
```ts
import { addAfterResponseInterceptor, defineResponse } from '@elliotdong/ajax-interceptor';

addAfterResponseInterceptor(async (response: {
    headers?: Record<string, string>;
    status?: number;
    statusText?: string;
    response?: Blob;
}, requestInit) => {
    console.log({response});

    // if you want to change request, use `defineResponse`
    return defineResponse({
        method?: string,
        url?: string,
        body?: XMLHttpRequestBodyInit | null | Document,
        credentials?: RequestCredentials,
        headers?: Record<string, string>;
    })

})
```
#### Use ReceiveError Interceptor
```ts
import { addReceiveErrorInterceptor, defineResponse } from '@elliotdong/ajax-interceptor';

addReceiveErrorInterceptor(async (error: {
    type: 'error' | 'timeout' | 'abort' | 'fetch',
    cause?: Error
}, requestInit) => {
    console.log({response});

    if(requestInit.url.startWith('www.baidu.com')) {
        // if you want to change err to response, use `defineResponse`
        return defineResponse({
            method?: string,
            url?: string,
            body?: XMLHttpRequestBodyInit | null | Document,
            credentials?: RequestCredentials,
            headers?: Record<string, string>;
        })
    }
    

})
```

