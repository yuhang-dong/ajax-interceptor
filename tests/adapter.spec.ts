import { test, expect } from "@playwright/test";
import {
  installHelper,
  unInstallHelper,
  getRecentRequest,
  parseUrl,
} from "@helper/index";
test.describe("adapter", () => {
  test.beforeEach(async ({ page }) => {
    await installHelper(page);
  });

  test.afterEach(async ({ page }) => {
    await unInstallHelper(page);
  });

  test("should support custom adapter", async ({ page }) => {
    await page.evaluate(() => {
      return axios("/foo", {
        adapter: function barAdapter(config) {
          return new Promise(function dispatchXhrRequest(resolve) {
            const request = new XMLHttpRequest();
            request.open("GET", "/bar");

            request.onreadystatechange = function () {
              resolve({
                config: config,
                request: request,
              } as any);
            };

            request.send(null);
          });
        },
      });
    });

    expect(parseUrl((await getRecentRequest()).url()).pathname).toEqual("/bar");
  });

  test("should execute adapter code synchronously", async ({ page }) => {
    await page.evaluate(() => {
      let asyncFlag = false;
      const promise = axios("/foo", {
        adapter: function barAdapter(config) {
          return new Promise(function dispatchXhrRequest(resolve) {
            const request = new XMLHttpRequest();
            request.open("GET", "/bar");

            request.onreadystatechange = function () {
              resolve({
                config: config,
                request: request,
              } as any);
            };

            if (asyncFlag) throw "asyncFlag should be false";
            request.send(null);
          });
        },
      });

      asyncFlag = true;
      return promise;
    });

    expect(await getRecentRequest()).not.toBeFalsy();
  });

  test("should execute adapter code asynchronously when interceptor is present", async ({page}) => {
    await page.evaluate(() => {
      let asyncFlag = false;

      axios.interceptors.request.use(function (config) {
        // @ts-ignore
        config.headers.async = 'async it!';
        return config;
      });

      const promise = axios('/foo', {
        adapter: function barAdapter(config) {
          return new Promise(function dispatchXhrRequest(resolve) {
            const request = new XMLHttpRequest();
            request.open('GET', '/bar');
  
            request.onreadystatechange = function () {
              resolve({
                config: config,
                request: request
              } as any);
            };
  
            if(!asyncFlag) throw 'asyncFlag should be true'
            request.send(null);
          });
        }
      });
      asyncFlag = true;
      return promise;
    });

    expect(await getRecentRequest()).not.toBeFalsy();
  })
});
