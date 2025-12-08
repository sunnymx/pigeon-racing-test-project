/**
 * stage-context.ts - 階段上下文管理
 *
 * 規格來源: dev/active/test-flow-refactor/specs/stage-context.spec.md
 * 優先級: 🔴 必做
 *
 * 功能：階段間狀態追蹤、失敗時自動恢復、前置條件驗證
 */

import { Page } from '@playwright/test';

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

export interface CheckpointResult {
  id: string;
  name: string;
  passed: boolean;
  retries: number;
  error?: string;
}

export interface StageResult {
  status: 'COMPLETE' | 'FAILED' | 'SKIPPED';
  checkpoints: CheckpointResult[];
  error?: Error;
  duration: number;
}

export interface Stage {
  id: number;
  name: string;
  checkpoints: Array<{ id: string; name: string; fn: (ctx: StageContext) => Promise<boolean> }>;
}

export interface StageDependency {
  stage: number;
  requires: number[];
  blockingCheckpoints: string[];
  fallbackStages: number[];
  requiresReset: boolean;
}

interface StateSnapshot {
  url: string;
  state: StageState;
  screenshot: Buffer;
}

// ============================================================================
// 依賴規則
// ============================================================================

export const DEPENDENCY_MAP: StageDependency[] = [
  { stage: 1, requires: [], blockingCheckpoints: ['1.1'], fallbackStages: [], requiresReset: false },
  { stage: 2, requires: [1], blockingCheckpoints: ['2.1', '2.2'], fallbackStages: [], requiresReset: false },
  { stage: 3, requires: [2], blockingCheckpoints: ['3.1'], fallbackStages: [6], requiresReset: true },
  { stage: 4, requires: [3], blockingCheckpoints: [], fallbackStages: [5, 6], requiresReset: false },
  { stage: 5, requires: [3], blockingCheckpoints: [], fallbackStages: [6], requiresReset: false },
  { stage: 6, requires: [2], blockingCheckpoints: [], fallbackStages: [7], requiresReset: true },
  { stage: 7, requires: [], blockingCheckpoints: [], fallbackStages: [], requiresReset: false },
];

// ============================================================================
// 核心類別
// ============================================================================

export class StageExecutor {
  private context: StageContext;
  private currentStage: number = 0;
  private retryAttempted: boolean = false;

  constructor(page: Page) {
    this.context = {
      page,
      state: this.getInitialState(),
      completedStages: new Set(),
      screenshots: new Map(),
    };
  }

  private getInitialState(): StageState {
    return {
      raceIndex: 0,
      pigeonIndex: 0,
      currentMode: null,
      subMode: null,
      trajectory2DLoaded: false,
      trajectory3DLoaded: false,
    };
  }

  async executeStage(stage: Stage): Promise<StageResult> {
    const startTime = Date.now();
    this.currentStage = stage.id;
    this.retryAttempted = false;

    const precondition = await this.validatePreconditions(stage);
    if (!precondition.valid) {
      return { status: 'SKIPPED', checkpoints: [], error: new Error(precondition.reason), duration: Date.now() - startTime };
    }

    const snapshot = await this.captureSnapshot();

    try {
      const checkpoints = await this.runCheckpoints(stage);
      this.updateState(stage, checkpoints);
      this.context.completedStages.add(stage.id);

      return {
        status: checkpoints.every((c) => c.passed) ? 'COMPLETE' : 'FAILED',
        checkpoints,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      if (!this.retryAttempted && (await this.canRecover(error as Error))) {
        this.retryAttempted = true;
        await this.recover(snapshot);
        return await this.executeStage(stage);
      }
      return { status: 'FAILED', checkpoints: [], error: error as Error, duration: Date.now() - startTime };
    }
  }

  private async validatePreconditions(stage: Stage): Promise<{ valid: boolean; reason?: string }> {
    const deps = DEPENDENCY_MAP.find((d) => d.stage === stage.id);
    if (!deps) return { valid: true };

    for (const req of deps.requires) {
      if (!this.context.completedStages.has(req)) {
        return { valid: false, reason: `前置階段 ${req} 未完成` };
      }
    }

    if (!(await this.isPageValid())) {
      return { valid: false, reason: 'Page 已失效' };
    }

    return { valid: true };
  }

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
    return [/timeout/i, /navigation/i, /detached/i].some((p) => p.test(error.message));
  }

  private async runCheckpoints(stage: Stage): Promise<CheckpointResult[]> {
    const results: CheckpointResult[] = [];
    for (const cp of stage.checkpoints) {
      let passed = false;
      let retries = 0;
      let errorMsg: string | undefined;

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          passed = await cp.fn(this.context);
          if (passed) break;
          retries++;
        } catch (e) {
          errorMsg = (e as Error).message;
          retries++;
        }
      }
      results.push({ id: cp.id, name: cp.name, passed, retries, error: errorMsg });
    }
    return results;
  }

  private updateState(stage: Stage, checkpoints: CheckpointResult[]): void {
    if (stage.id === 3 && checkpoints.every((c) => c.passed)) {
      this.context.state.trajectory2DLoaded = true;
      this.context.state.currentMode = '2D';
    }
    if (stage.id === 5 && checkpoints.every((c) => c.passed)) {
      this.context.state.trajectory3DLoaded = true;
      this.context.state.currentMode = '3D';
    }
  }

  getContext(): StageContext {
    return this.context;
  }

  getCompletedStages(): number[] {
    return Array.from(this.context.completedStages);
  }
}
