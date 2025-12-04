# 階段上下文管理規格

**檔案位置**: `tests/helpers/stage-context.ts`
**優先級**: 🔴 必做
**預估行數**: ~150 行

---

## 1. 目的

解決「共用狀態脆弱性」問題，提供：
- 階段間狀態追蹤
- 失敗時自動恢復
- 前置條件驗證

---

## 2. 介面定義

```typescript
// ============================================================================
// 型別定義
// ============================================================================

export interface StageState {
  raceIndex: number;
  pigeonIndex: number;
  currentMode: '2D' | '3D' | null;
  subMode: 'static' | 'dynamic' | null;
  trajectory2DLoaded: boolean;
  trajectory3DLoaded: boolean;
}

export interface StageContext {
  page: Page;
  state: StageState;
  completedStages: Set<number>;
  screenshots: Map<string, Buffer>;
}

export interface StageResult {
  status: 'COMPLETE' | 'FAILED' | 'SKIPPED';
  checkpoints: CheckpointResult[];
  error?: Error;
  duration: number;
}

export interface CheckpointResult {
  id: string;
  name: string;
  passed: boolean;
  retries: number;
  error?: string;
}

// ============================================================================
// 依賴規則
// ============================================================================

export interface StageDependency {
  stage: number;
  requires: number[];              // 必須完成的前置階段
  blockingCheckpoints: string[];   // 哪些檢查點失敗會阻斷
  fallbackStages: number[];        // 失敗時可跳到的階段
  requiresReset: boolean;          // 是否需要頁面重置
}

export const DEPENDENCY_MAP: StageDependency[] = [
  { stage: 1, requires: [], blockingCheckpoints: ['1.1'], fallbackStages: [], requiresReset: false },
  { stage: 2, requires: [1], blockingCheckpoints: ['2.1', '2.2'], fallbackStages: [], requiresReset: false },
  { stage: 3, requires: [2], blockingCheckpoints: ['3.1'], fallbackStages: [6], requiresReset: true },
  { stage: 4, requires: [3], blockingCheckpoints: [], fallbackStages: [5, 6], requiresReset: false },
  { stage: 5, requires: [3], blockingCheckpoints: [], fallbackStages: [6], requiresReset: false },
  { stage: 6, requires: [2], blockingCheckpoints: [], fallbackStages: [7], requiresReset: true },
  { stage: 7, requires: [], blockingCheckpoints: [], fallbackStages: [], requiresReset: false },
];
```

---

## 3. 核心類別

```typescript
export class StageExecutor {
  private context: StageContext;
  private currentStage: number = 0;

  constructor(page: Page) {
    this.context = {
      page,
      state: this.getInitialState(),
      completedStages: new Set(),
      screenshots: new Map(),
    };
  }

  // ========================================
  // 主要執行方法
  // ========================================

  async executeStage(stage: Stage): Promise<StageResult> {
    const startTime = Date.now();
    this.currentStage = stage.id;

    // 1. 驗證前置條件
    const preconditionResult = await this.validatePreconditions(stage);
    if (!preconditionResult.valid) {
      return {
        status: 'SKIPPED',
        checkpoints: [],
        error: new Error(preconditionResult.reason),
        duration: Date.now() - startTime,
      };
    }

    // 2. 備份狀態
    const snapshot = await this.captureSnapshot();

    try {
      // 3. 執行檢查點
      const checkpoints = await this.runCheckpoints(stage);

      // 4. 更新狀態
      this.updateState(stage, checkpoints);
      this.context.completedStages.add(stage.id);

      return {
        status: checkpoints.every(c => c.passed) ? 'COMPLETE' : 'FAILED',
        checkpoints,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      // 5. 嘗試恢復
      if (await this.canRecover(error as Error)) {
        await this.recover(snapshot);
        return await this.executeStage(stage); // 重試一次
      }

      return {
        status: 'FAILED',
        checkpoints: [],
        error: error as Error,
        duration: Date.now() - startTime,
      };
    }
  }

  // ========================================
  // 前置條件驗證
  // ========================================

  private async validatePreconditions(stage: Stage): Promise<{ valid: boolean; reason?: string }> {
    const deps = DEPENDENCY_MAP.find(d => d.stage === stage.id);
    if (!deps) return { valid: true };

    for (const reqStage of deps.requires) {
      if (!this.context.completedStages.has(reqStage)) {
        return {
          valid: false,
          reason: `前置階段 ${reqStage} 未完成`,
        };
      }
    }

    // 驗證頁面仍可用
    if (!await this.isPageValid()) {
      return {
        valid: false,
        reason: 'Page 已失效',
      };
    }

    return { valid: true };
  }

  // ========================================
  // 狀態管理
  // ========================================

  private async isPageValid(): Promise<boolean> {
    try {
      await this.context.page.evaluate(() => document.readyState);
      return true;
    } catch {
      return false;
    }
  }

  private async captureSnapshot(): Promise<StateSnapshot> {
    return {
      url: this.context.page.url(),
      state: { ...this.context.state },
      screenshot: await this.context.page.screenshot(),
    };
  }

  private async recover(snapshot: StateSnapshot): Promise<void> {
    console.log('🔄 嘗試恢復狀態...');
    await this.context.page.goto(snapshot.url, { waitUntil: 'domcontentloaded' });
    this.context.state = snapshot.state;
  }

  private async canRecover(error: Error): Promise<boolean> {
    const recoverablePatterns = [
      /timeout/i,
      /navigation/i,
      /detached/i,
    ];
    return recoverablePatterns.some(p => p.test(error.message));
  }
}
```

---

## 4. 使用範例

```typescript
// user-journey.spec.ts
import { StageExecutor } from '../helpers/stage-context';

test.describe('使用者旅程', () => {
  let executor: StageExecutor;

  test.beforeAll(async ({ page }) => {
    executor = new StageExecutor(page);
  });

  test('階段 1: 首頁探索', async () => {
    const result = await executor.executeStage(STAGES[1]);
    expect(result.status).toBe('COMPLETE');
  });

  test('階段 2: 進入賽事', async () => {
    const result = await executor.executeStage(STAGES[2]);
    expect(result.status).toBe('COMPLETE');
  });

  // ... 其他階段
});
```

---

## 5. 驗收標準

- [ ] 前置條件驗證正確阻斷依賴階段
- [ ] 狀態備份和恢復機制有效
- [ ] 頁面失效時能正確檢測
- [ ] 單元測試覆蓋率 > 80%
