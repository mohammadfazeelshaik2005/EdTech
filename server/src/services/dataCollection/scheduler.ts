import { executeDataCollectionPipeline } from './pipeline';
import { PipelineExecutionReport } from '@/types/dataCollection';

export interface SchedulerConfig {
  enabled: boolean;
  intervalMinutes: number;
  targetSourceId: string; // 'ALL' or specific source ID
  lastRunAt?: string;
  nextRunAt?: string;
}

export interface SchedulerRunHistory {
  runId: string;
  timestamp: string;
  sourceId: string;
  totalCollected: number;
  totalVerified: number;
  totalRejected: number;
  totalDuplicates: number;
  status: 'SUCCESS' | 'PARTIAL' | 'ERROR';
}

const STORAGE_CONFIG_KEY = 'pathsync_scraper_scheduler_config';
const STORAGE_HISTORY_KEY = 'pathsync_scraper_scheduler_history';

// Default configuration: 12-hour collection cycle (720 minutes)
const DEFAULT_CONFIG: SchedulerConfig = {
  enabled: false,
  intervalMinutes: 720,
  targetSourceId: 'ALL',
};

let timerId: any = null;
let listeners: Array<(config: SchedulerConfig, lastReport?: PipelineExecutionReport) => void> = [];
let memoryConfig: SchedulerConfig = { ...DEFAULT_CONFIG };
let memoryHistory: SchedulerRunHistory[] = [];

/**
 * Loads scheduler configuration from storage or memory
 */
export function getSchedulerConfig(): SchedulerConfig {
  if (typeof localStorage === 'undefined') return memoryConfig;
  try {
    const raw = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (raw) {
      memoryConfig = { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
      return memoryConfig;
    }
  } catch (e) {
    console.error('Error loading scheduler config:', e);
  }
  return memoryConfig;
}

/**
 * Persists scheduler configuration
 */
export function saveSchedulerConfig(config: SchedulerConfig): void {
  memoryConfig = config;
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(config));
    } catch (e) {
      console.error('Error saving scheduler config:', e);
    }
  }
}

/**
 * Loads run history
 */
export function getSchedulerHistory(): SchedulerRunHistory[] {
  if (typeof localStorage === 'undefined') return memoryHistory;
  try {
    const raw = localStorage.getItem(STORAGE_HISTORY_KEY);
    if (raw) {
      memoryHistory = JSON.parse(raw);
      return memoryHistory;
    }
  } catch (e) {
    console.error('Error loading scheduler history:', e);
  }
  return memoryHistory;
}

/**
 * Appends to run history
 */
export function appendSchedulerHistory(entry: SchedulerRunHistory): void {
  const current = getSchedulerHistory();
  const updated = [entry, ...current].slice(0, 30); // Keep last 30 runs
  memoryHistory = updated;
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving scheduler history:', e);
    }
  }
}

/**
 * Subscribes to scheduler updates
 */
export function subscribeToScheduler(
  callback: (config: SchedulerConfig, lastReport?: PipelineExecutionReport) => void
): () => void {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((cb) => cb !== callback);
  };
}

function notifyListeners(config: SchedulerConfig, report?: PipelineExecutionReport): void {
  listeners.forEach((cb) => {
    try {
      cb(config, report);
    } catch (e) {
      console.error('Error in scheduler listener:', e);
    }
  });
}

/**
 * Internal worker that runs the collection pipeline on schedule
 */
async function runScheduledCycle(): Promise<PipelineExecutionReport> {
  const config = getSchedulerConfig();
  const sourceId = config.targetSourceId === 'ALL' ? undefined : config.targetSourceId;

  const now = new Date();
  const report = await executeDataCollectionPipeline({
    sourceId,
    isScheduled: true,
  });

  const nextRun = new Date(now.getTime() + config.intervalMinutes * 60 * 1000);

  const updatedConfig: SchedulerConfig = {
    ...config,
    lastRunAt: now.toISOString(),
    nextRunAt: nextRun.toISOString(),
  };
  saveSchedulerConfig(updatedConfig);

  const historyEntry: SchedulerRunHistory = {
    runId: report.executionId,
    timestamp: now.toISOString(),
    sourceId: config.targetSourceId,
    totalCollected: report.totalCollected,
    totalVerified: report.totalVerified,
    totalRejected: report.totalRejected,
    totalDuplicates: report.totalDuplicatesDetected,
    status: report.totalCollected > 0 ? 'SUCCESS' : 'PARTIAL',
  };
  appendSchedulerHistory(historyEntry);

  notifyListeners(updatedConfig, report);
  return report;
}

/**
 * Starts the automated collection scheduler
 */
export function startScheduler(options: {
  intervalMinutes?: number;
  targetSourceId?: string;
  triggerImmediately?: boolean;
} = {}): SchedulerConfig {
  const current = getSchedulerConfig();
  const intervalMinutes = options.intervalMinutes ?? current.intervalMinutes;
  const targetSourceId = options.targetSourceId ?? current.targetSourceId;

  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }

  const nextRun = new Date(Date.now() + intervalMinutes * 60 * 1000);
  const updatedConfig: SchedulerConfig = {
    enabled: true,
    intervalMinutes,
    targetSourceId,
    lastRunAt: current.lastRunAt,
    nextRunAt: nextRun.toISOString(),
  };
  saveSchedulerConfig(updatedConfig);

  // Set interval timer
  const intervalMs = Math.max(60000, intervalMinutes * 60 * 1000); // minimum 1 minute
  timerId = setInterval(() => {
    runScheduledCycle().catch((err) =>
      console.error('Error during scheduled collection cycle:', err)
    );
  }, intervalMs);

  notifyListeners(updatedConfig);

  if (options.triggerImmediately) {
    runScheduledCycle().catch((err) =>
      console.error('Error during initial scheduled run:', err)
    );
  }

  return updatedConfig;
}

/**
 * Stops the automated collection scheduler
 */
export function stopScheduler(): SchedulerConfig {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }

  const current = getSchedulerConfig();
  const updatedConfig: SchedulerConfig = {
    ...current,
    enabled: false,
    nextRunAt: undefined,
  };
  saveSchedulerConfig(updatedConfig);
  notifyListeners(updatedConfig);
  return updatedConfig;
}

/**
 * Manually triggers an immediate run of the scheduled collection cycle
 */
export async function triggerScheduledRunNow(): Promise<PipelineExecutionReport> {
  return await runScheduledCycle();
}
