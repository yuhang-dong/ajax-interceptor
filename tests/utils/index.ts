import type { ConsoleMessage, Page, Request } from '@playwright/test';

let mostRecentRequest: Request | undefined = undefined;


export const clearMostRecent = () => {
    mostRecentRequest = undefined;
}

export const recordRequest = (request: Request) => {
    mostRecentRequest = request;
}

export const getRecentRequest = () => {
    let attempts = 0;
    const MAX_ATTEMPTS = 5;
    const ATTEMPT_DELAY_FACTOR = 5; 
    


  function attemptGettingAjaxRequest(resolve: Function, reject: Function) {
    const delay = attempts * attempts * ATTEMPT_DELAY_FACTOR;

    if (attempts++ > MAX_ATTEMPTS) {
      reject(new Error('No request was found'));
      return;
    }

    setTimeout(function () {
      const request = mostRecentRequest;
      if (request) {
        resolve(request);
      } else {
        attemptGettingAjaxRequest(resolve, reject);
      }
    }, delay);
  }

  return new Promise<Request>( (resolve, reject) => {
    attempts = 0;
    attemptGettingAjaxRequest(resolve, reject);
  });
}

const listenPageError = (err: Error) => {
    console.error(err);
}

const listenPageConsole = (info: ConsoleMessage) => {
  if(info.type() === 'debug') {
    return;
  }
  console.info({
    type: info.type(),
    text: info.text()
  })
}

const handleMostRequest = (request: Request) => {
    recordRequest(request);
}

export const installHelper = async (page: Page) => {
    await page.goto('/')
    await page.reload();
    page.addListener('pageerror', listenPageError);
    page.addListener('request', handleMostRequest);
    page.addListener('console', listenPageConsole)
}

export const unInstallHelper = async (page: Page) => {
    page.removeListener('pageerror', listenPageError);
    page.removeListener('request', handleMostRequest);
    clearMostRecent();
    page.removeListener('console', listenPageConsole)
}

export const parseUrl = (url: string) => {
  return new URL(url);
}