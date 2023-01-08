<center><img src='./docs/icon.svg' /></center>

# Ajax Interceptor

`ajax-interceptor` is a library to intercept `XMLHttpRequest` and `Fetch`. We can use it to change request header, method, even destination. It has the below props:

* 🍃 **No Inject**. It doesn't change any business code, we can provide external script to intercept request.


## Usage

### Install

* CDN Import
    ```
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


#### Use AfterResponse Interceptor

#### Use ReceiveError Interceptor


## Examples
 1. log 所有 请求、响应和接收到的信息 ✅
 2. 更改请求的方法或者URL或者body
 3. 假如远端报错（无法发出请求的错误），假扮成正常请求
