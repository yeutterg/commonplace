import { expect, test } from "@playwright/test";

test.describe("Pencil visual capture", () => {
  async function openFirstNote(
    page: import("@playwright/test").Page,
    request: import("@playwright/test").APIRequestContext,
  ) {
    const notesRes = await request.get("http://localhost:4000/api/notes");
    const notesData = (await notesRes.json()) as {
      notes: Array<{ slug: string }>;
    };
    const slug = notesData.notes[0]?.slug;
    if (!slug) {
      throw new Error("No notes returned by API for visual capture");
    }
    await page.goto(`/${slug}`);
    await page.waitForLoadState("networkidle");
  }

  test("directory desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1512, height: 982 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("directory-desktop.png", { fullPage: true });
  });

  test("directory mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("directory-mobile.png", { fullPage: true });
  });

  test("note desktop with comments open", async ({ page, request }) => {
    await page.setViewportSize({ width: 1512, height: 982 });
    await openFirstNote(page, request);
    await page.locator("button.icon-button.with-badge").first().click();
    await expect(page).toHaveScreenshot("note-desktop-comments-open.png", { fullPage: true });
  });

  test("note mobile", async ({ page, request }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openFirstNote(page, request);
    await expect(page).toHaveScreenshot("note-mobile.png", { fullPage: true });
  });
});
