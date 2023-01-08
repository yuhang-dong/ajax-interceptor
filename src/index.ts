import { XHRInterceptor } from './xhr-interceptor'

export * from './xhr-interceptor'
export * from './interceptor'
export * from './fetch-interceptor'

export const XHRSymbol = Symbol.for('AJAX_INTERCEPTOR_XML_HTTP_REQUEST');
export let originXHR: null | typeof XMLHttpRequest = null;

export const intercept = ( win?: typeof window) => {
    const global = win || window;
    if(!originXHR) {
        originXHR = global.XMLHttpRequest;
    }
    global.XMLHttpRequest = XHRInterceptor;
}

export const unIntercept = (win?: typeof window) => {
    const global = win || window;
    if(originXHR) {
        global.XMLHttpRequest = originXHR;
        originXHR = null;
    }
    
}