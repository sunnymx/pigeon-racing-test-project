import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 配置檔 - 鴿子競賽GPS追蹤系統自動化測試
 *
 * 關鍵配置：
 * - 基礎 URL: https://hungdev.skyracing.com.cn
 * - 超時時間：因需等待地圖瓦片/Cesium 載入，設定較長超時
 * - 截圖策略：失敗時自動截圖
 */
export default defineConfig({
  testDir: './tests/e2e',

  // 測試超時設定（因地圖渲染需時較長）
  // CI 環境網路較慢，需要更長的超時時間
  timeout: process.env.CI ? 180 * 1000 : 60 * 1000,  // CI 3分鐘, 本地 1分鐘
  expect: {
    timeout: process.env.CI ? 20 * 1000 : 10 * 1000,  // CI 20秒, 本地 10秒
  },

  // 失敗處理
  fullyParallel: false,          // 不完全平行執行（避免網路請求衝突）
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,  // CI 環境重試 2 次，本地重試 1 次
  workers: process.env.CI ? 1 : 2,  // CI 環境使用 1 個 worker，本地使用 2 個

  // 報告設定
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'test-results.json' }]
  ],

  // 全域設定
  use: {
    baseURL: 'https://hungdev.skyracing.com.cn',

    // 截圖設定（解決 canvas 驗證問題）
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // 追蹤設定
    trace: 'retain-on-failure',

    // 導航超時（地圖瓦片載入需時）
    // CI 環境網路較慢，需要更長的超時時間
    navigationTimeout: process.env.CI ? 60 * 1000 : 30 * 1000,  // CI 60秒, 本地 30秒
    actionTimeout: process.env.CI ? 20 * 1000 : 10 * 1000,      // CI 20秒, 本地 10秒

    // 視窗大小（確保地圖有足夠空間渲染）
    viewport: { width: 1920, height: 1080 },

    // 本地使用系統 Chrome，CI 使用 Playwright 內建 Chromium
    ...(process.env.CI ? {} : { channel: 'chrome' }),

    // 關閉 crashpad 相關行為，避免 macOS 權限阻擋造成瀏覽器啟動失敗
    launchOptions: {
      chromiumSandbox: false,
      args: ['--no-sandbox', '--no-crashpad', '--disable-crash-reporter'],
    },
  },

  // 測試專案配置
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // 給予 Canvas/WebGL 較多權限
        permissions: ['geolocation'],
      },
    },

    // 可選：其他瀏覽器測試
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // 本地開發伺服器設定（如果需要）
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
