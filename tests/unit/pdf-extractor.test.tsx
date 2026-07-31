import {
  Document,
  Page,
  Text,
  renderToBuffer,
} from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";

import { extractPdfResume } from "@/lib/extractors";

describe("PDF resume extraction", () => {
  it("extracts text and stable source spans from a valid generated PDF", async () => {
    const buffer = await renderToBuffer(
      <Document>
        <Page size="LETTER">
          <Text>ALEX EXAMPLE</Text>
          <Text>SUMMARY</Text>
          <Text>Product manager with evidence-led delivery experience.</Text>
          <Text>EXPERIENCE</Text>
          <Text>Led a launch for 2,000 users and improved activation by 18%.</Text>
          <Text>SKILLS</Text>
          <Text>Product strategy, SQL, customer research</Text>
          <Text>EDUCATION</Text>
          <Text>B.S. Business Analytics</Text>
        </Page>
      </Document>,
    );

    const result = await extractPdfResume(
      new Uint8Array(buffer),
      "valid-resume.pdf",
    );

    expect(result.fileType).toBe("pdf");
    expect(result.pageCount).toBe(1);
    expect(result.normalizedText).toContain("ALEX EXAMPLE");
    expect(result.normalizedText).toContain("improved activation by 18%");
    expect(result.spans.length).toBeGreaterThan(4);
    for (const span of result.spans) {
      expect(result.normalizedText.slice(span.start, span.end)).toBe(span.text);
    }
  });
});
