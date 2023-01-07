import { AfterResponseFunc, BeforeOpenFunc, BeforeSendFunc, XHRInterceptor } from './xhr-interceptor'

const XHRSymbol = Symbol.for('AJAX_INTERCEPTOR_XML_HTTP_REQUEST');

export type InterceptorConfig = {
    xhr?: {
        beforeOpenFuncs?: BeforeOpenFunc[],
        beforeSendFuncs?: BeforeSendFunc[],
        afterResponseFuncs?: AfterResponseFunc[]
    },
    fetch: {

    }
}

const intercept = (config: InterceptorConfig, win?: typeof window) => {
    XHRInterceptor.beforeOpenFuncs.push(...(config.xhr?.beforeOpenFuncs || []));
    XHRInterceptor.beforeSendFuncs.push(...(config.xhr?.beforeSendFuncs || []));
    XHRInterceptor.afterResponseFuncs.push(...(config.xhr?.afterResponseFuncs || []));
    const global = win || window;
    // @ts-ignore
    global[XHRSymbol] = global.XMLHttpRequest;
    global.XMLHttpRequest = XHRInterceptor;

    
    
}

export {
    intercept
}