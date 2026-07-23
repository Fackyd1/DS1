import { test, expect } from "@playwright/test";

test("home renders hero and CTA", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "PLAY THE REALM" }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "GASPAR DOVAL" })).toBeVisible();
});
