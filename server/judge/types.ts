export type TestCaseResult = {
  index: number;
  passed: boolean;
  input?: string;
  expected?: string;
  actual?: string;
  runtimeMs?: number;
};

export type JudgeResult = {
  status:
    | "accepted"
    | "wrong_answer"
    | "compilation_error"
    | "runtime_error"
    | "time_limit"
    | "memory_limit";

  passed: number;
  total: number;

  tests: TestCaseResult[];

  stdout?: string;
  stderr?: string;

  compileOutput?: string;
  runtimeMs?: number;
};