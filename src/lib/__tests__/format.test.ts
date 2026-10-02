import { describe, expect, it } from "vitest";
import { formatChips, formatNumber, formatPercent, formatStackPercent } from "../format";

describe("format helpers", () => {
  it("formats chips with thin space thousands", () => {
    expect(formatChips(1064)).toBe("1\u202f064");
  });

  it("drops trailing decimals", () => {
    expect(formatNumber(66.0, 1)).toBe("66");
    expect(formatNumber(66.5, 1)).toBe("66,5");
  });

  it("formats percent without forced decimals", () => {
    expect(formatPercent(0.66, 0)).toBe("66 %");
    expect(formatPercent(0.004, 0)).toBe("< 1 %");
  });

  it("formats stack percent", () => {
    expect(formatStackPercent(40, 1000)).toBe("4 %");
    expect(formatStackPercent(5, 1000)).toBe("< 1 %");
  });
});
