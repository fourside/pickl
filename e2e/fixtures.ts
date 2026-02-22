import { test as base, expect, type Page } from "@playwright/test";
import { TEST_USER } from "./global-setup";

type Fixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<Fixtures>({
  authenticatedPage: async ({ page }, use) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(TEST_USER.email);
    await page.getByLabel("Password").fill(TEST_USER.password);
    await page.getByRole("button", { name: "Login" }).click();
    await page.waitForURL("/");
    await use(page);
  },
});

export { expect };
