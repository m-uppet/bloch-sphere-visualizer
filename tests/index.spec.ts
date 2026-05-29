import { expect, test } from "@playwright/test";

test("page loads with canvas and controls", async ({ page }) => {
	await page.goto("/bloch.html");
	await expect(page.locator("canvas")).toBeVisible();
	await expect(page.getByTestId("bloch-output")).toBeVisible();
	await expect(page.getByTestId("gate-X")).toBeVisible();
	await expect(page.getByTestId("snap-0")).toBeVisible();
});
