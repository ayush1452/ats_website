// @vitest-environment node

import {
  Document,
  Page,
  Text,
  renderToBuffer,
} from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/scans/route";

describe("PDF scan route", () => {
  it("accepts a valid PDF and streams the extracted canonical document", async () => {
    const pdf = await renderToBuffer(
      <Document>
        <Page size="LETTER">
          <Text>ALEX EXAMPLE</Text>
          <Text>alex@example.test · +1 555 010 1234</Text>
          <Text>SUMMARY</Text>
          <Text>Product manager focused on accessible B2B software.</Text>
          <Text>EXPERIENCE</Text>
          <Text>Led onboarding for 2,000 users and improved activation by 18%.</Text>
          <Text>SKILLS</Text>
          <Text>Product strategy, SQL, customer research</Text>
          <Text>EDUCATION</Text>
          <Text>B.S. Business Analytics</Text>
        </Page>
      </Document>,
    );
    const body = new FormData();
    const pdfArrayBuffer = Uint8Array.from(pdf).buffer;
    body.set(
      "file",
      new File([pdfArrayBuffer], "alex-example.pdf", {
        type: "application/pdf",
      }),
    );
    body.set("targetRole", "Product Manager");
    body.set("seniority", "mid");
    body.set("industry", "B2B SaaS");
    body.set("market", "United States");
    body.set("goal", "general");

    const response = await POST(
      new Request("http://localhost:3000/api/scans", {
        method: "POST",
        body,
        headers: {
          Origin: "http://localhost:3000",
          "Idempotency-Key": crypto.randomUUID(),
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain(
      "application/x-ndjson",
    );
    const records = (await response.text())
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Record<string, unknown>);
    const result = records.find((record) => record.type === "result");
    expect(result).toBeTruthy();
    expect(result?.document).toMatchObject({
      fileType: "pdf",
      filename: "alex-example.pdf",
      pageCount: 1,
    });
  });
});
