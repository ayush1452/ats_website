import { NextResponse } from "next/server";
import { z } from "zod";

import { productConfig } from "@/config/product";
import { DEMO_SCAN_ID, demoResult, demoScans } from "@/data/demo";
import { analysisResultSchema } from "@/lib/analysis";
import { SupabaseRepository } from "@/lib/repositories";
import { renderAnalysisReportPdf } from "@/lib/reports/pdf-report";
import {
  createServerSupabaseClient,
  isSupabaseServerConfigured,
} from "@/lib/supabase/server";
import type { AnalysisResult } from "@/types/domain";

import { assertSameOrigin, errorResponse } from "../../_lib/security";

const requestSchema = z.object({ scanId: z.string().min(1).max(128) }).strict();
const postRequestSchema = requestSchema
  .extend({ result: analysisResultSchema.optional() })
  .strict();

async function loadResult(scanId: string): Promise<AnalysisResult | null> {
  const seededScan = demoScans.find((scan) => scan.id === scanId);
  if (scanId === DEMO_SCAN_ID || seededScan) {
    return {
      ...structuredClone(demoResult),
      overallScore: seededScan?.overallScore ?? demoResult.overallScore,
      componentScores: {
        ...structuredClone(demoResult.componentScores),
        atsParse: seededScan?.atsParse ?? demoResult.componentScores.atsParse,
        roleMatch:
          seededScan?.roleMatch ?? demoResult.componentScores.roleMatch,
      },
    };
  }
  const client = await createServerSupabaseClient();
  if (!client) return null;
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return null;
  return new SupabaseRepository(client).getScan(scanId);
}

async function reportResponse(
  scanId: string,
  result: AnalysisResult | null,
): Promise<Response> {
  if (!result) {
    return NextResponse.json(
      { error: "Report not found.", code: "NOT_FOUND" },
      { status: 404 },
    );
  }
  const pdf = await renderAnalysisReportPdf(result);
  const body = pdf.buffer.slice(
    pdf.byteOffset,
    pdf.byteOffset + pdf.byteLength,
  ) as ArrayBuffer;
  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${productConfig.slug}-report-${scanId.replace(/[^a-zA-Z0-9-]/g, "")}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function respond(scanId: string): Promise<Response> {
  return reportResponse(scanId, await loadResult(scanId));
}

export async function GET(request: Request): Promise<Response> {
  try {
    const scanId = new URL(request.url).searchParams.get("scanId");
    return respond(requestSchema.parse({ scanId }).scanId);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    const input = postRequestSchema.parse(await request.json());
    if (!isSupabaseServerConfigured() && input.result) {
      if (input.result.mode !== "demo") {
        return NextResponse.json(
          {
            error: "Only validated demo reports can be exported locally.",
            code: "INVALID_DEMO_RESULT",
          },
          { status: 400 },
        );
      }
      return await reportResponse(
        input.scanId,
        input.result as AnalysisResult,
      );
    }
    return respond(input.scanId);
  } catch (error) {
    return errorResponse(error);
  }
}
