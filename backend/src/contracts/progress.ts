import type { AnalysisResult } from "./result.js";

export type AnalysisStage = "extract" | "evidence" | "match" | "ai" | "report";

type EventBase = {
  seq: number;
  analysisId: string;
};

export type AnalysisProgressEvent =
  | (EventBase & {
      type: "analysis.accepted";
      analyzerVersion: string;
    })
  | (EventBase & {
      type: "stage.started";
      stage: AnalysisStage;
      label: string;
    })
  | (EventBase & {
      type: "stage.completed";
      stage: AnalysisStage;
      summary?: Record<string, string | number | boolean>;
    })
  | (EventBase & {
      type: "stage.skipped";
      stage: "match" | "ai";
      reason: "NO_JOB_DESCRIPTION" | "ALGORITHM_MODE" | "AI_NOT_CONFIGURED";
    })
  | (EventBase & {
      type: "analysis.completed";
      result: AnalysisResult;
    })
  | (EventBase & {
      type: "analysis.failed";
      error: {
        code: string;
        message: string;
        retryable: boolean;
      };
    });
