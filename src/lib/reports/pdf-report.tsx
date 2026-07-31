import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";

import { productConfig } from "@/config/product";
import type { AnalysisResult } from "@/types/domain";

const styles = StyleSheet.create({
  page: {
    paddingTop: 46,
    paddingRight: 48,
    paddingBottom: 54,
    paddingLeft: 48,
    color: "#17231d",
    fontFamily: "Helvetica",
    fontSize: 9.5,
    lineHeight: 1.45,
  },
  eyebrow: {
    color: "#084d36",
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 1.2,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 23,
    fontWeight: 700,
    lineHeight: 1.15,
    marginBottom: 6,
  },
  subtitle: {
    color: "#52635a",
    fontSize: 10,
    marginBottom: 20,
  },
  scoreRow: {
    borderBottomColor: "#dce5df",
    borderBottomWidth: 1,
    borderTopColor: "#dce5df",
    borderTopWidth: 1,
    display: "flex",
    flexDirection: "row",
    marginBottom: 22,
    paddingBottom: 13,
    paddingTop: 13,
  },
  score: {
    flexGrow: 1,
  },
  scoreLabel: {
    color: "#52635a",
    fontSize: 7.5,
    marginBottom: 3,
    textTransform: "uppercase",
  },
  scoreValue: {
    fontSize: 17,
    fontWeight: 700,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 8,
  },
  card: {
    borderBottomColor: "#dce5df",
    borderBottomWidth: 0.7,
    paddingBottom: 8,
    paddingTop: 8,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 3,
  },
  meta: {
    color: "#52635a",
    fontSize: 8,
    marginBottom: 3,
  },
  body: {
    fontSize: 9,
  },
  warning: {
    backgroundColor: "#fff7e4",
    borderLeftColor: "#8c5a0d",
    borderLeftWidth: 2,
    marginTop: 5,
    padding: 7,
  },
  footer: {
    bottom: 24,
    color: "#5f6f66",
    fontSize: 7.5,
    left: 48,
    position: "absolute",
    right: 48,
    textAlign: "center",
  },
  methodology: {
    backgroundColor: "#f1f5f1",
    marginBottom: 20,
    padding: 10,
  },
});

function modeLabel(mode: AnalysisResult["mode"]) {
  if (mode === "demo") return "Demo analysis";
  if (mode === "hybrid") return "Hybrid deterministic + semantic analysis";
  return "Deterministic analysis";
}

function empty(value: string | null | undefined, fallback = "Not available") {
  return value?.trim() ? value : fallback;
}

function AnalysisReportDocument({ result }: { result: AnalysisResult }) {
  const openFindings = result.findings.filter(
    (finding) => finding.status === "open",
  );

  return (
    <Document
      author={productConfig.name}
      creator={productConfig.name}
      keywords="resume analysis, evidence report, job match, parseability"
      language="en-US"
      subject="Transparent resume analysis report"
      title={`${productConfig.name} resume analysis report`}
    >
      <Page size="LETTER" style={styles.page} wrap>
        <Text style={styles.eyebrow}>{productConfig.name} evidence report</Text>
        <Text style={styles.title}>Resume analysis</Text>
        <Text style={styles.subtitle}>
          Transparent product heuristics linked to the supplied resume evidence
        </Text>

        <View style={styles.scoreRow}>
          <View style={styles.score}>
            <Text style={styles.scoreLabel}>Overall</Text>
            <Text style={styles.scoreValue}>{result.overallScore}/100</Text>
          </View>
          <View style={styles.score}>
            <Text style={styles.scoreLabel}>ATS parse</Text>
            <Text style={styles.scoreValue}>
              {result.componentScores.atsParse}/100
            </Text>
          </View>
          <View style={styles.score}>
            <Text style={styles.scoreLabel}>Recruiter clarity</Text>
            <Text style={styles.scoreValue}>
              {result.componentScores.recruiterClarity}/100
            </Text>
          </View>
          <View style={styles.score}>
            <Text style={styles.scoreLabel}>Role match</Text>
            <Text style={styles.scoreValue}>
              {result.componentScores.roleMatch === null
                ? "Not scored"
                : `${result.componentScores.roleMatch}/100`}
            </Text>
          </View>
        </View>

        <View style={styles.methodology}>
          <Text style={styles.cardTitle}>How to read this report</Text>
          <Text style={styles.body}>
            {modeLabel(result.mode)} · analyzer {result.analyzerVersion} ·
            schema v{result.schemaVersion} · confidence{" "}
            {Math.round(result.confidence * 100)}%
          </Text>
          <Text style={[styles.body, { marginTop: 4 }]}>
            Scores are product heuristics. They cannot guarantee ATS acceptance,
            interviews, or employment. Potential gains are estimates from
            unresolved finding impacts.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Score dimensions</Text>
          {result.dimensionScores.map((dimension) => (
            <View key={dimension.key} style={styles.card} wrap={false}>
              <Text style={styles.cardTitle}>
                {dimension.label}: {dimension.score}/100
              </Text>
              <Text style={styles.body}>{dimension.explanation}</Text>
              <Text style={styles.meta}>
                Weight:{" "}
                {Math.round((result.weightSnapshot[dimension.key] ?? 0) * 100)}%
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Findings ({openFindings.length} unresolved)
          </Text>
          {result.findings.map((finding) => (
            <View key={finding.id} style={styles.card}>
              <Text style={styles.cardTitle}>{finding.title}</Text>
              <Text style={styles.meta}>
                {finding.severity.toUpperCase()} · {finding.status} · estimated
                impact {finding.scoreImpact} point
                {finding.scoreImpact === 1 ? "" : "s"}
              </Text>
              <Text style={styles.body}>{finding.description}</Text>
              <Text style={[styles.body, { marginTop: 3 }]}>
                Why it matters: {finding.whyItMatters}
              </Text>
              <Text style={[styles.body, { marginTop: 3 }]}>
                Action: {finding.recommendation}
              </Text>
              {finding.sourceText ? (
                <Text style={styles.meta}>
                  Evidence: “{finding.sourceText}”
                </Text>
              ) : null}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Section detection</Text>
          {result.sections.map((section) => (
            <View key={section.name} style={styles.card} wrap={false}>
              <Text style={styles.cardTitle}>
                {section.name}: {section.status}
              </Text>
              <Text style={styles.body}>
                {empty(section.issue, "No blocking issue detected.")}
              </Text>
              <Text style={styles.meta}>{empty(section.action)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Keyword analysis</Text>
          {result.keywords.length ? (
            result.keywords.map((keyword) => (
              <View key={`${keyword.group}-${keyword.keyword}`} style={styles.card} wrap={false}>
                <Text style={styles.cardTitle}>
                  {keyword.keyword}: {keyword.status}
                </Text>
                <Text style={styles.meta}>
                  {keyword.group} · {keyword.requirementType} · resume{" "}
                  {keyword.resumeFrequency} / role {keyword.jobFrequency}
                </Text>
                {keyword.evidence ? (
                  <Text style={styles.body}>{keyword.evidence}</Text>
                ) : null}
              </View>
            ))
          ) : (
            <Text style={styles.body}>
              Not scored because no job description was supplied.
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Role requirements</Text>
          {result.requirements.length ? (
            result.requirements.map((requirement) => (
              <View key={requirement.requirement} style={styles.card}>
                <Text style={styles.cardTitle}>
                  {requirement.requirement}: {requirement.status}
                </Text>
                <Text style={styles.meta}>
                  {requirement.type} · score {requirement.score}/100
                </Text>
                <Text style={styles.body}>{requirement.explanation}</Text>
                <Text style={[styles.body, { marginTop: 3 }]}>
                  Action: {requirement.action}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.body}>
              Not available because no job description was supplied.
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rewrite recommendations</Text>
          {result.recommendations.length ? (
            result.recommendations.map((recommendation) => (
              <View key={recommendation.id} style={styles.card}>
                <Text style={styles.cardTitle}>{recommendation.title}</Text>
                <Text style={styles.meta}>
                  Status: {recommendation.status}
                </Text>
                <Text style={styles.body}>
                  Original: {recommendation.originalText}
                </Text>
                <Text style={[styles.body, { marginTop: 3 }]}>
                  Proposed: {recommendation.suggestedText}
                </Text>
                <Text style={[styles.body, { marginTop: 3 }]}>
                  Rationale: {recommendation.rationale}
                </Text>
                {recommendation.requiresVerification ? (
                  <Text style={styles.warning}>
                    Factuality warning: verify every employer, metric, tool,
                    credential, responsibility, and outcome before applying.
                  </Text>
                ) : null}
              </View>
            ))
          ) : (
            <Text style={styles.body}>
              No rewrite recommendation was generated for this report.
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Benchmark context</Text>
          <Text style={styles.body}>
            {result.benchmark.label}: {result.benchmark.score}/100.{" "}
            {result.benchmark.explanation}
          </Text>
        </View>

        <Text
          fixed
          render={({ pageNumber, totalPages }) =>
            `${productConfig.name} · resume analysis · page ${pageNumber} of ${totalPages}`
          }
          style={styles.footer}
        />
      </Page>
    </Document>
  );
}

export async function renderAnalysisReportPdf(
  result: AnalysisResult,
): Promise<Uint8Array> {
  const buffer = await renderToBuffer(
    <AnalysisReportDocument result={result} />,
  );
  return Uint8Array.from(buffer);
}
