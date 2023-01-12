import { test, expect } from "@playwright/test";
import {
  installHelper,
  unInstallHelper,
  getRecentRequest,
} from "@helper/index";

test.describe("basicAuth", () => {
  test.beforeEach(async ({ page, context }) => {
    await installHelper(page);
    // await context.route(/foo/, route => route.fulfill());
  });

  test.afterEach(async ({ page }) => {
    await unInstallHelper(page);
  });

  test("should accept HTTP Basic auth with username/password", async ({ page }) => {
    await page.evaluate(() => {
      return axios('/foo', {
        auth: {
          username: 'Aladdin',
          password: 'open sesame'
        }
      }).catch(err => {
        console.log(JSON.stringify(err))
      });
    });

    expect(await (await getRecentRequest()).headerValue('Authorization')).toEqual("Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==");
  });

  test("should accept HTTP Basic auth credentials without the password parameter", async({page}) => {
    await page.evaluate(() => {
      return axios('/foo', {
        // @ts-ignore
        auth: {
          username: 'Aladdin'
        }
      });
    });

    expect(await (await getRecentRequest()).headerValue('Authorization')).toEqual("Basic QWxhZGRpbjo=");
  });

  test("should accept HTTP Basic auth credentials with non-Latin1 characters in password", async ({page}) => {
    await page.evaluate(() => {
      return axios('/foo', {
        auth: {
          username: 'Aladdin',
          password: 'open ßç£☃sesame'
        }
      });
    });

    expect(await (await getRecentRequest()).headerValue('Authorization')).toEqual("Basic QWxhZGRpbjpvcGVuIMOfw6fCo+KYg3Nlc2FtZQ==");
  
  });

  test("should fail to encode HTTP Basic auth credentials with non-Latin1 characters in username", async({page}) => {
    const errorMsg = await page.evaluate(() => {
      return axios('/foo', {
        auth: {
          username: 'Aladßç£☃din',
          password: 'open sesame'
        }
      }).then(() => {
        throw 'Should Fail but success'
      }).catch(err => {
        return err.message;
      });
    });

    expect(/character/i.test(errorMsg)).toEqual(true);
  })

  
});
