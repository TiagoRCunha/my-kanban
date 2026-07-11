import { expect, test } from '@playwright/test';

test.describe('Board page', () => {
  test('adds and renames a column', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/board$/);

    const addColumnButton = page.getByRole('button', { name: 'Add a new column' });
    await addColumnButton.click();

    const newColumnTitleButton = page.getByRole('button', { name: 'New Column 4' });
    await expect(newColumnTitleButton).toBeVisible();
    await newColumnTitleButton.click();

    const renameInput = page.locator('.column__rename-input').last();
    await renameInput.fill('Review');
    await renameInput.press('Enter');

    await expect(page.getByRole('button', { name: 'Review' })).toBeVisible();
  });
});
