import { test, expect } from '@playwright/test';

test.describe('Мобильная версия (Android): Переключение темы', () => {

    test('TC-06: Переключение между тёмной и светлой темой', async ({ page }) => {
        // Playwright сам откроет страницу с мобильным разрешением (из-за конфига Pixel 5)
        await page.goto('/');

        // Ждем исчезновения лоадера, как в прошлых тестах
        await expect(page.getByText('Обновление данных...')).toBeHidden();

        // Главный тег html, где хранится тема
        const htmlTag = page.locator('html');

        // Узнаем текущую тему до клика (light или dark)
        const initialTheme = await htmlTag.getAttribute('data-theme');
        // Убеждаемся, что атрибут вообще существует
        expect(['light', 'dark']).toContain(initialTheme);

        // На скрине 4 видно, что у кнопки есть title, начинающийся со "Switch to..."
        // Ищем кнопку по этому title (это надежнее, чем классы)
        const themeToggleBtn = page.locator('button[title*="Switch to"]');

        // Кликаем по кнопке смены темы
        await themeToggleBtn.click();

        // Вычисляем, какой тема должна стать теперь
        const expectedNewTheme = initialTheme === 'dark' ? 'light' : 'dark';

        // 🔥 Playwright Best Practice:
        // Эта строчка сама дождется (до 5 секунд), пока атрибут data-theme не поменяется на новый
        await expect(htmlTag).toHaveAttribute('data-theme', expectedNewTheme);
    });
});