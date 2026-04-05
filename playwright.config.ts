import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    retries: 1,
    workers: 2,
    reporter: 'html',

    // ВОТ ЗДЕСЬ ПОДКЛЮЧАЕТСЯ ТВОЙ САЙТ:
    use: {
        baseURL: 'https://cerulean-praline-8e5aa6.netlify.app',
        trace: 'on-first-retry',
    },

    projects: [
        {
            name: 'Desktop Firefox',
            use: { ...devices['Desktop Firefox'] },
            testMatch: /desktop.spec.ts/,
        },
        {
            name: 'Mobile Android (Pixel 5)',
            use: { ...devices['Pixel 5'] },
            testMatch: /mobile.spec.ts/,
        },
    ],
});