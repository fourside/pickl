import { expect, test } from "./fixtures";

test.describe("lists", () => {
  test("displays the seeded test list", async ({ authenticatedPage: page }) => {
    await expect(page.getByText("E2E Test List")).toBeVisible();
  });

  test("creates a new list", async ({ authenticatedPage: page }) => {
    const listName = `Test List ${Date.now()}`;
    await page.getByPlaceholder("New list...").fill(listName);
    await page.getByPlaceholder("New list...").press("Enter");
    await expect(page.getByText(listName)).toBeVisible();
  });
});

test.describe("items", () => {
  test("adds an item to the list", async ({ authenticatedPage: page }) => {
    await page.getByText("E2E Test List").click();
    await expect(page).toHaveURL(/\/lists\//);

    await page.getByPlaceholder("Add item...").fill("Buy milk");
    await page.getByPlaceholder("Add item...").press("Enter");
    await expect(page.getByText("Buy milk")).toBeVisible();
  });

  test("checks and unchecks an item", async ({ authenticatedPage: page }) => {
    await page.getByText("E2E Test List").click();
    await expect(page).toHaveURL(/\/lists\//);

    // Add item
    await page.getByPlaceholder("Add item...").fill("Buy eggs");
    await page.getByPlaceholder("Add item...").press("Enter");
    await expect(page.getByText("Buy eggs")).toBeVisible();

    // Check item -> moves to Done section
    await page.getByLabel("Check Buy eggs").click();
    await expect(page.getByText("Done")).toBeVisible();

    // Uncheck item -> moves back
    await page.getByLabel("Uncheck Buy eggs").click();
    await expect(page.getByText("Buy eggs")).toBeVisible();
  });
});
