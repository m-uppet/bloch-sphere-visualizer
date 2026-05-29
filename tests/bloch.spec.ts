import { expect, test } from "@playwright/test";

test("gate buttons update bloch-output", async ({ page }) => {
	await page.goto("/bloch.html");

	// Snap to |+⟩, apply H — just verifies the UI→math wiring works end-to-end
	await page.getByTestId("snap-plus").click();
	await page.getByTestId("gate-H").click();
	await expect(page.getByTestId("bloch-output")).toHaveText(
		"0.000,0.000,1.000",
		{ timeout: 2000 },
	);
});
