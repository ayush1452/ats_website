import type { AnalysisInput, CanonicalResumeDocument } from "@/types/domain";
import { z } from "zod";

import {
  analysisInputSchema,
  makeTextDocument,
  scanJsonRequestSchema,
} from "@/lib/analysis";
import { extractResumeFile, sanitizeFilename } from "@/lib/extractors";

function formString(form: FormData, key: string): string | undefined {
  const value = form.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export interface ParsedScanRequest {
  input: AnalysisInput;
  sourceFile?: File;
  resumeId?: string;
}

export async function parseScanRequest(request: Request): Promise<ParsedScanRequest> {
  const contentType = request.headers.get("content-type") ?? "";
  let document: CanonicalResumeDocument;
  let values: Record<string, unknown>;
  let sourceFile: File | undefined;
  let resumeId: string | undefined;

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if (file instanceof File && file.size > 0) {
      document = await extractResumeFile(file);
      sourceFile = file;
    } else {
      const resumeText = formString(form, "resumeText");
      const validatedResumeText = z.string()
        .min(40, "Paste at least 40 characters of resume text or upload a file.")
        .max(1_500_000)
        .parse(resumeText);
      const filename = sanitizeFilename(
        formString(form, "filename") ?? "pasted-resume.txt",
      );
      document = makeTextDocument({
        text: validatedResumeText,
        filename,
        fileType: "pasted",
      });
    }
    values = {
      jobDescription: formString(form, "jobDescription"),
      jobTitle: formString(form, "jobTitle"),
      company: formString(form, "company"),
      targetRole: formString(form, "targetRole") ?? "Target role",
      seniority: formString(form, "seniority") ?? "Not specified",
      industry: formString(form, "industry") ?? "Not specified",
      market: formString(form, "market") ?? "Not specified",
      goal: formString(form, "goal") ?? "general",
    };
    resumeId = z.string().uuid().optional().parse(formString(form, "resumeId"));
  } else {
    const parsed = scanJsonRequestSchema.parse(await request.json());
    resumeId = parsed.resumeId;
    document = makeTextDocument({
      text: parsed.resumeText,
      filename: sanitizeFilename(parsed.filename),
      fileType: "pasted",
    });
    values = parsed;
  }

  return {
    input: analysisInputSchema.parse({
      document,
      jobDescription: values.jobDescription,
      jobTitle: values.jobTitle,
      company: values.company,
      targetRole: values.targetRole,
      seniority: values.seniority,
      industry: values.industry,
      market: values.market,
      goal: values.goal,
    }) as AnalysisInput,
    sourceFile,
    resumeId,
  };
}
