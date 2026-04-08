import { test, expect } from '@playwright/test';

test.describe('Мобильная версия (Android): Переключение темы', () => {

    test('TC-06: Переключение между тёмной и светлой темой', async ({ page }) => {
        await page.goto('/');

        await expect(page.getByText('Обновление данных...')).toBeHidden();

        // Главный тег html, где хранится тема
        const htmlTag = page.locator('html');

        // Узнаем текущую тему до клика (light или dark)
        const initialTheme = await htmlTag.getAttribute('data-theme');
        // Убеждаемся, что атрибут вообще существует
        expect(['light', 'dark']).toContain(initialTheme);

        // Ищем кнопку по этому title (это надежнее, чем классы)
        const themeToggleBtn = page.locator('button[title*="Switch to"]');

        // Кликаем по кнопке смены темы
        await themeToggleBtn.click();

        // Вычисляем, какой тема должна стать теперь
        const expectedNewTheme = initialTheme === 'dark' ? 'light' : 'dark';

        // Эта строчка сама дождется (до 5 секунд), пока атрибут data-theme не поменяется на новый
        await expect(htmlTag).toHaveAttribute('data-theme', expectedNewTheme);
    });
});