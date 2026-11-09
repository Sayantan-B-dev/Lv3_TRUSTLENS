import { describe, expect, it } from "vitest";
import { formatPct, groupChecks, highestSeverity, truncate } from "../lib/format";
import type { CheckResult } from "../lib/types";

function check(partial: Partial<CheckResult>): CheckResult {
  return {
    id: 1,
    check_id: "url.structure",
    category: "url",
    status: "completed",
    severity: "info",
    title: "URL normalised",
    summary: "",
    evidence: {},
    findings: [],
    source: "TrustLens",
    source_timestamp: null,
    limitations: [],
    impact: null,
    remediation: null,
    duration_ms: 4,
    ...partial,
  };
}

describe("groupChecks", () => {
  it("orders categories and hides risk/AI from the evidence list", () => {
    const groups = groupChecks([
      check({ id: 5, category: "tls", check_id: "tls" }),
      check({ id: 1, category: "url" }),
      check({ id: 9, category: "ai", check_id: "ai.explanation" }),
      check({ id: 8, category: "risk", check_id: "risk.assessment" }),
      check({ id: 2, category: "domain", check_id: "domain.heuristics" }),
    ]);
    expect(groups.map((group) => group.category)).toEqual(["url", "domain", "tls"]);
  });

  it("keeps checks inside a category in insertion order", () => {
    const groups = groupChecks([
      check({ id: 4, category: "intel", check_id: "threat_intel" }),
      check({ id: 3, category: "intel", check_id: "ct" }),
    ]);
    expect(groups[0].checks.map((item) => item.id)).toEqual([3, 4]);
  });
});

describe("formatting", () => {
  it("formats coverage percentages", () => {
    expect(formatPct(0.571)).toBe("57%");
    expect(formatPct(null)).toBe("—");
  });

  it("truncates long values with an ellipsis", () => {
    expect(truncate("abcdef", 4)).toBe("abc…");
    expect(truncate("abc", 6)).toBe("abc");
  });

  it("picks the highest finding severity", () => {
    expect(
      highestSeverity([
        check({ findings: [{ rule_id: "a", severity: "low", title: "a", summary: "" }] }),
        check({ findings: [{ rule_id: "b", severity: "high", title: "b", summary: "" }] }),
      ]),
    ).toBe("high");
  });
});
