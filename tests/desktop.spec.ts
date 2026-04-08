import { test, expect } from '@playwright/test';

test.describe('Десктопная версия (Firefox): Фильтры и сортировка', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForSelector('div[class*="cards"]', { state: 'visible' });
        // Дожидаемся, пока завершится самая первая загрузка при открытии страницы
        await expect(page.getByText('Обновление данных...')).toBeHidden();
    });

    test('TC-01: Проверка фильтра "Диапазон цен"', async ({ page }) => {
        const minPrice = 10000;
        const maxPrice = 50000;

        await page.getByPlaceholder('От').fill(minPrice.toString());
        await page.getByPlaceholder('От').press('Enter');

        await page.getByPlaceholder('До').fill(maxPrice.toString());
        await page.getByPlaceholder('До').press('Enter');

        // ПРАВИЛЬНОЕ ОЖИДАНИЕ: Ждем, пока исчезнет надпись о загрузке
        await expect(page.getByText('Обновление данных...')).toBeHidden();

        const priceElements = page.locator('text=/\\d+\\s?\\d*\\s?₽/');
        const count = await priceElements.count();

        expect(count).toBeGreaterThan(0);

        for (let i = 0; i < count; i++) {
            const priceText = await priceElements.nth(i).innerText();
            const price = parseInt(priceText.replace(/\D/g, ''), 10);

            expect(price).toBeGreaterThanOrEqual(minPrice);
            expect(price).toBeLessThanOrEqual(maxPrice);
        }
    });

    test('TC-02: Проверка сортировки "По цене"', async ({ page }) => {
        const sortSelect = page.locator('select').filter({ has: page.locator('option', { hasText: 'Цене' }) });
        await sortSelect.selectOption({ label: 'Цене' });

        const orderSelect = page.locator('select').filter({ has: page.locator('option', { hasText: 'По убыванию' }) });
        await orderSelect.selectOption({ label: 'По возрастанию' });

        // ПРАВИЛЬНОЕ ОЖИДАНИЕ
        await expect(page.getByText('Обновление данных...')).toBeHidden();

        const priceElements = page.locator('text=/\\d+\\s?\\d*\\s?₽/');
        const count = await priceElements.count();

        expect(count).toBeGreaterThan(1);

        let previousPrice = -1;
        for (let i = 0; i < count; i++) {
            const priceText = await priceElements.nth(i).innerText();
            const currentPrice = parseInt(priceText.replace(/\D/g, ''), 10);

            expect(currentPrice).toBeGreaterThanOrEqual(previousPrice);
            previousPrice = currentPrice;
        }
    });

    test('TC-03: Проверка фильтра "Категория"', async ({ page }) => {
        const categorySelect = page.locator('select').filter({ has: page.locator('option', { hasText: 'Детское' }) });
        const targetCategory = 'Детское';

        await categorySelect.selectOption({ label: targetCategory });

        // ПРАВИЛЬНОЕ ОЖИДАНИЕ
        await expect(page.getByText('Обновление данных...')).toBeHidden();

        const titleElements = page.locator('main').getByRole('heading', { level: 3 });
        const count = await titleElements.count();

        expect(count).toBeGreaterThan(0);

        for (let i = 0; i < count; i++) {
            const titleText = await titleElements.nth(i).innerText();
            expect(titleText.toLowerCase()).toContain(targetCategory.toLowerCase());
        }
    });

    test('TC-04: Проверка тогла "Только срочные"', async ({ page }) => {
        // Находим именно тег <label>, внутри которого есть нужный текст
        const urgentLabel = page.locator('label').filter({ hasText: 'Только срочные' });

        // Кликаем по лейблу принудительно (force: true пробивает невидимые CSS-слои кастомного тогла)
        await urgentLabel.click({ force: true });

        // ПРАВИЛЬНОЕ ОЖИДАНИЕ
        await expect(page.getByText('Обновление данных...')).toBeHidden();

        const cards = page.locator('div[class*="cards"] > div');
        const count = await cards.count();

        expect(count).toBeGreaterThan(0);

        for (let i = 0; i < count; i++) {
            const urgentBadge = cards.nth(i).getByText('Срочно');
            // Тест должен будет упасть ИМЕННО ЗДЕСЬ, доказав баг приложения
            await expect(urgentBadge).toBeVisible();
        }
    });
});

test.describe('Десктопная версия: Страница статистики', () => {

    test.beforeEach(async ({ page }) => {
        // 1. Заходим на главную (так как прямой переход по URL сломан на сервере)
        await page.goto('/');

        // 2. Обязательно ждем исчезновения лоадера на главной
        await expect(page.getByText('Обновление данных...')).toBeHidden();

        // 3. Кликаем по ссылке "Статистика" в верхнем меню (используем Regex, чтобы игнорировать эмодзи 📊)
        await page.getByRole('link', { name: /Статистика/ }).click();

        // 4. Ждем появления заголовка "Статистика модератора" для уверенности, что переход удался
        await expect(page.getByRole('heading', { name: 'Статистика модератора' })).toBeVisible();
    });

    test('TC-05: Контейнер управления таймером обновления статистики', async ({ page }) => {
        // Локаторы кнопок (getByRole - это золотой стандарт доступности и надежности)
        const btnRefresh = page.getByRole('button', { name: 'Обновить сейчас' });
        const btnPause = page.getByRole('button', { name: 'Отключить автообновление' });
        const btnPlay = page.getByRole('button', { name: 'Включить автообновление' });

        // Локаторы текста
        const activeTimerText = page.getByText('Обновление через:');
        const disabledTimerText = page.getByText('Автообновление выключено');

        // Локатор самих цифр таймера (ищем строго формат "цифры:цифры")
        const timeValueLocator = page.getByText(/^\d+:\d{2}$/);

        // --- ШАГ 1: Проверка остановки таймера ---
        await expect(activeTimerText).toBeVisible();
        await btnPause.click();

        await expect(disabledTimerText).toBeVisible();
        await expect(activeTimerText).toBeHidden();

        // --- ШАГ 2: Проверка запуска таймера ---
        await btnPlay.click();

        await expect(activeTimerText).toBeVisible();

        // --- ШАГ 3: Проверка хода времени и кнопки "Обновить" ---
        const timeWhenPlaying = await timeValueLocator.innerText();

        await page.waitForTimeout(2000);

        const timeAfterWait = await timeValueLocator.innerText();
        expect(timeAfterWait).not.toEqual(timeWhenPlaying);

        await btnRefresh.click();
        await page.waitForTimeout(500);

        const timeAfterRefresh = await timeValueLocator.innerText();
        expect(timeAfterRefresh).not.toEqual(timeAfterWait);
    });
});