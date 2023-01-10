import { FetchInterceptor, originFetch } from './fetch-interceptor';
import { XHRInterceptor } from './xhr-interceptor'

export * from './xhr-interceptor'
export * from './interceptor'
export * from './fetch-interceptor'

export let originXHR: null | typeof XMLHttpRequest = null;

export const intercept = ( win?: typeof window) => {
    const global = win || window;
    if(!originXHR) {
        originXHR = global.XMLHttpRequest;
    }
    global.XMLHttpRequest = XHRInterceptor;
    global.fetch = FetchInterceptor;
}

export const unIntercept = (win?: typeof window) => {
    const global = win || window;
    if(originXHR) {
        global.XMLHttpRequest = originXHR;
        originXHR = null;
    }
    global.fetch = originFetch;
    
}