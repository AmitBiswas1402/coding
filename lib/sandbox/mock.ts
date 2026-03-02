export type RunResult = {
  passed: number;
  total: number;
  runtime: number;
  memory: number;
  outputs?: string[];
  passedTests?: number[];
  results?: Array<{
    input: string;
    expected: string;
    actual: string;
    passed: boolean;
    runtime?: number;
  }>;
  complexity?: {
    time: string;
    space: string;
  };
};

// Re-export from executor for backward compatibility
export { executeCode as mockRun } from "./executor";
