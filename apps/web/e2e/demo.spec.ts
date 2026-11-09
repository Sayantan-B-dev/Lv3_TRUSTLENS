import { expect, test } from "@playwright/test";

test("investigates a scam message and verifies a report digest", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Look closer before you trust." }),
  ).toBeVisible();

  await page.getByRole("tab", { name: "Message" }).click();
  await page
    .getByRole("textbox", { name: "Message or email to analyse" })
    .fill("URGENT: share your OTP now or your account will be closed.");

  await page.locator('form button[type="submit"]').click();

  await expect(
    page.getByRole("heading", { name: /Suspicious|High Risk|Confirmed Malicious/ }),
  ).toBeVisible({ timeout: 90_000 });

  await page.getByRole("button", { name: "Create integrity report" }).first().click();
  await expect(page.getByText("SHA-256 digest")).toBeVisible();

  await page.getByRole("button", { name: "Verify independently" }).click();
  await expect(
    page.getByText(/Local digest verified|Digest matches the on-chain commitment/),
  ).toBeVisible();

  await expect(page.getByText(/digest consistent: true/i)).toBeVisible();
});
