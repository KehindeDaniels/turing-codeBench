const { PopulationConsensus } = require("./solution");

describe("PopulationConsensus - Comprehensive Tests", () => {
  // Validate Population Data Tests
  test("validatePopulationData should return true for valid data", () => {
    const validData = [
      { id: 1, opinion: 0.8, weight: 0.7 },
      { id: 2, opinion: 0.4, weight: 0.3 },
      { id: 3, opinion: 0.9, weight: 0.5 },
    ];
    expect(PopulationConsensus.validatePopulationData(validData)).toBe(true);
  });

  test("validatePopulationData should return false for empty data", () => {
    expect(PopulationConsensus.validatePopulationData([])).toBe(false);
  });

  test("validatePopulationData should return false for invalid data", () => {
    const invalidData = [
      { id: 1, opinion: 1.5, weight: 0.7 }, // Opinion out of range
      { id: 2, weight: 0.3 }, // Missing opinion
      { id: 3, opinion: -0.5, weight: 0.5 }, // Negative opinion
      { id: 4, opinion: 0.9, weight: 1.2 }, // Weight out of range
    ];
    expect(PopulationConsensus.validatePopulationData(invalidData)).toBe(false);
  });

  test("validatePopulationData should remove duplicate IDs", () => {
    const duplicateData = [
      { id: 1, opinion: 0.8, weight: 0.7 },
      { id: 1, opinion: 0.4, weight: 0.3 },
      { id: 2, opinion: 0.6, weight: 0.4 },
    ];
    expect(PopulationConsensus.validatePopulationData(duplicateData)).toBe(
      true
    );
  });

  // Calculate Data Consensus Tests
  test("calculateDataConsensus should return true when consensus threshold is met", () => {
    const opinions = [
      { id: 1, opinion: 0.8, weight: 0.7 },
      { id: 2, opinion: 0.6, weight: 0.3 },
    ];
    expect(PopulationConsensus.calculateDataConsensus(0.6, opinions)).toBe(
      true
    );
  });

  test("normalizeOpinions should return values scaled between 0 and 1, rounded to 2 decimals", () => {
    const sampleData = [5, 10, 15, 20, 100];
    expect(PopulationConsensus.normalizeOpinions(sampleData)).toEqual([
      0.0, 0.05, 0.11, 0.16, 1.0,
    ]);
  });

  test("normalizeOpinions should return all zeros if all values are equal", () => {
    const sampleData = [10, 10, 10, 10];
    expect(PopulationConsensus.normalizeOpinions(sampleData)).toEqual([
      0.0, 0.0, 0.0, 0.0,
    ]);
  });

  test("normalizeOpinions should return original values if already normalized", () => {
    const alreadyNormalized = [0.1, 0.5, 0.9];
    expect(PopulationConsensus.normalizeOpinions(alreadyNormalized)).toEqual([
      0.1, 0.5, 0.9,
    ]);
  });

  test("calculateFinalConsensus should return true when majority agrees", () => {
    const consensusResults = [true, false, true, true];
    expect(
      PopulationConsensus.calculateFinalConsensus(consensusResults, "majority")
    ).toBe(true);
  });

  test("calculateFinalConsensus should return false for unanimous when there is disagreement", () => {
    const mixedResults = [true, false, true, true];
    expect(
      PopulationConsensus.calculateFinalConsensus(mixedResults, "unanimous")
    ).toBe(false);
  });

  test("getConsensusSummary should return correct summary with 2 decimal places", () => {
    const consensusCalculator = new PopulationConsensus([
      { id: 1, opinion: 0.8, weight: 0.7 },
      { id: 2, opinion: 0.4, weight: 0.3 },
      { id: 3, opinion: 0.9, weight: 0.5 },
    ]);
    expect(consensusCalculator.getConsensusSummary()).toEqual({
      totalParticipants: 3,
      percentageAgreement: 66.67,
      conflictResolution: "majority",
    });
  });

  test("filterConsensusByThreshold should return entries with opinions >= threshold", () => {
    const data = [
      { id: 1, opinion: 0.8, weight: 0.7 },
      { id: 2, opinion: 0.4, weight: 0.3 },
      { id: 3, opinion: 0.9, weight: 0.5 },
      { id: 4, opinion: 0.2, weight: 0.4 },
      { id: 5, opinion: 0.75, weight: 0.6 },
    ];
    expect(PopulationConsensus.filterConsensusByThreshold(data, 0.7)).toEqual([
      { id: 1, opinion: 0.8, weight: 0.7 },
      { id: 3, opinion: 0.9, weight: 0.5 },
      { id: 5, opinion: 0.75, weight: 0.6 },
    ]);
  });

  test("filterConsensusByThreshold should return empty array if no opinions meet threshold", () => {
    const data = [
      { id: 1, opinion: 0.5, weight: 0.7 },
      { id: 2, opinion: 0.4, weight: 0.3 },
      { id: 3, opinion: 0.6, weight: 0.5 },
    ];
    expect(PopulationConsensus.filterConsensusByThreshold(data, 0.7)).toEqual(
      []
    );
  });
});
