import { expect, test } from "@playwright/test";
import { TEST_USER } from "./global-setup";

test.describe("authentication", () => {
  test("redirects to /login when not authenticated", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("logs in with valid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(TEST_USER.email);
    await page.getByLabel("Password").fill(TEST_USER.password);
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "Pickl" })).toBeVisible();
  });

  test("stays on login page with invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("wrong@example.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Login" }).click();
    // 401 triggers page reload via apiFetch, so just verify we remain on /login
    await page.waitForURL(/\/login/);
    await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
  });
});
