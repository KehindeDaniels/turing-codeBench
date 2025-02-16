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
      { id: 1, opinion: 1.5, weight: 0.7 },
      { id: 2, weight: 0.3 },
      { id: 3, opinion: -0.5, weight: 0.5 },
      { id: 4, opinion: 0.9, weight: 1.2 },
    ];
    expect(PopulationConsensus.validatePopulationData(invalidData)).toBe(false);
  });

  test("validatePopulationData should return false for duplicate IDs", () => {
    const duplicateData = [
      { id: 1, opinion: 0.8, weight: 0.7 },
      { id: 1, opinion: 0.4, weight: 0.3 },
      { id: 2, opinion: 0.6, weight: 0.4 },
    ];
    expect(PopulationConsensus.validatePopulationData(duplicateData)).toBe(
      false
    );
  });

  test("validatePopulationData should return false for less than 3 participants", () => {
    const smallDataset = [
      { id: 1, opinion: 0.8, weight: 0.7 },
      { id: 2, opinion: 0.4, weight: 0.3 },
    ];
    expect(PopulationConsensus.validatePopulationData(smallDataset)).toBe(
      false
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

  test("calculateDataConsensus should use 80% threshold for 5 or fewer participants", () => {
    const smallDataset = [
      { id: 1, opinion: 0.85, weight: 0.7 },
      { id: 2, opinion: 0.8, weight: 0.3 },
      { id: 3, opinion: 0.9, weight: 0.5 },
    ];
    expect(PopulationConsensus.calculateDataConsensus(0.6, smallDataset)).toBe(
      true
    );
  });

  test("calculateDataConsensus should use 60% threshold for more than 5 participants", () => {
    const largeDataset = [
      { id: 1, opinion: 0.8, weight: 0.7 },
      { id: 2, opinion: 0.4, weight: 0.3 },
      { id: 3, opinion: 0.9, weight: 0.5 },
      { id: 4, opinion: 0.7, weight: 0.6 },
      { id: 5, opinion: 0.6, weight: 0.4 },
      { id: 6, opinion: 0.8, weight: 0.5 },
    ];
    expect(PopulationConsensus.calculateDataConsensus(0.6, largeDataset)).toBe(
      true
    );
  });

  // Normalize the Opinions Tests
  test("normalizeOpinions should return values scaled between 0 and 1, rounded to 2 decimals", () => {
    const sampleData = [5, 10, 15, 20, 100];
    expect(PopulationConsensus.normalizeOpinions(sampleData)).toEqual([
      0.0, 0.05, 0.11, 0.16, 1.0,
    ]);
  });

  test("normalizeOpinions should return an array for all the zeros if all values are equal", () => {
    const sampleData = [10, 10, 10, 10];
    expect(PopulationConsensus.normalizeOpinions(sampleData)).toEqual([
      0.0, 0.0, 0.0, 0.0,
    ]);
  });

  test("normalizeOpinions should normalize weights so their sum is 1", () => {
    const data = [
      { id: 1, opinion: 0.8, weight: 0.7 },
      { id: 2, opinion: 0.4, weight: 0.3 },
      { id: 3, opinion: 0.9, weight: 0.5 },
    ];
    const normalizedData = PopulationConsensus.normalizeOpinions(data);
    const totalWeight = normalizedData.reduce(
      (sum, entry) => sum + entry.weight,
      0
    );
    expect(totalWeight).toBeCloseTo(1, 2);
  });

  test("normalizeOpinions should discard weights less than 0.1", () => {
    const data = [
      { id: 1, opinion: 0.8, weight: 0.05 }, // This should be discarded
      { id: 2, opinion: 0.4, weight: 0.3 },
      { id: 3, opinion: 0.9, weight: 0.5 },
    ];
    const normalizedData = PopulationConsensus.normalizeOpinions(data);
    expect(normalizedData.length).toBe(2);
  });

  test("normalizeOpinions should return 0 for empty dataset", () => {
    expect(PopulationConsensus.normalizeOpinions([])).toBe(0);
  });

  // Calculate the final Consensus Tests
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

  test("calculateFinalConsensus should return true for strict consensus if above threshold", () => {
    const results = [true, true, true, false];
    expect(PopulationConsensus.calculateFinalConsensus(results, "strict")).toBe(
      true
    );
  });

  test("calculateFinalConsensus should return false for evenly split results", () => {
    const results = [true, false, true, false];
    expect(
      PopulationConsensus.calculateFinalConsensus(results, "majority")
    ).toBe(false);
  });

  //Consensus Summary Tests
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

  test("getConsensusSummary should return 0 for empty dataset", () => {
    const consensusCalculator = new PopulationConsensus([]);
    expect(consensusCalculator.getConsensusSummary()).toEqual({
      totalParticipants: 0,
      percentageAgreement: 0,
      conflictResolution: "majority",
    });
  });

  // Filtering the consensus by the threshold
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

  test("filterConsensusByThreshold should include opinions equal to the threshold", () => {
    const data = [
      { id: 1, opinion: 0.7, weight: 0.7 },
      { id: 2, opinion: 0.4, weight: 0.3 },
      { id: 3, opinion: 0.9, weight: 0.5 },
    ];
    expect(PopulationConsensus.filterConsensusByThreshold(data, 0.7)).toEqual([
      { id: 1, opinion: 0.7, weight: 0.7 },
      { id: 3, opinion: 0.9, weight: 0.5 },
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
