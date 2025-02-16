const { PopulationConsensus } = require("./PopulationConsensus");

describe("PopulationConsensus Class Tests", () => {
  let validPopulationData;
  let consensusCalculator;

  beforeEach(() => {
    validPopulationData = [
      { id: 1, opinion: 0.8, weight: 0.7 },
      { id: 2, opinion: 0.4, weight: 0.3 },
      { id: 3, opinion: 0.9, weight: 0.5 },
    ];
    consensusCalculator = new PopulationConsensus(validPopulationData);
  });

  describe("validatePopulationData", () => {
    test("Validates correct data", () => {
      expect(
        PopulationConsensus.validatePopulationData(validPopulationData)
      ).toBe(true);
    });

    test("Rejects empty dataset", () => {
      expect(PopulationConsensus.validatePopulationData([])).toBe(false);
    });

    test("Rejects invalid entries", () => {
      const invalidData = [
        { id: 1, opinion: 1.5, weight: 0.7 }, // opinion > 1
        { id: 2, weight: 0.3 }, // missing opinion
        { id: 3, opinion: -0.5, weight: 0.5 }, // opinion < 0
        { id: 4, opinion: 0.9, weight: 0.05 }, // weight < 0.1
      ];
      expect(PopulationConsensus.validatePopulationData(invalidData)).toBe(
        false
      );
    });
  });

  describe("calculateDataConsensus", () => {
    test("Reaches consensus when more than 60% agree", () => {
      expect(
        PopulationConsensus.calculateDataConsensus(0.6, validPopulationData)
      ).toBe(true);
    });

    test("Fails to reach consensus if threshold is not met", () => {
      const lowConsensusData = [
        { id: 1, opinion: 0.3, weight: 0.5 },
        { id: 2, opinion: 0.2, weight: 0.5 },
        { id: 3, opinion: 0.1, weight: 0.3 },
      ];
      expect(
        PopulationConsensus.calculateDataConsensus(0.6, lowConsensusData)
      ).toBe(false);
    });
  });

  describe("normalizeOpinions", () => {
    test("Normalizes opinions and weights correctly", () => {
      let sampleData = [5, 10, 15, 20, 100];
      expect(PopulationConsensus.normalizeOpinions(sampleData)).toEqual([
        0, 0.05, 0.11, 0.16, 1.0,
      ]);
    });
  });

  describe("calculateFinalConsensus", () => {
    test("Returns majority consensus", () => {
      let consensusResults = [true, false, true, true];
      expect(
        PopulationConsensus.calculateFinalConsensus(
          consensusResults,
          "majority"
        )
      ).toBe(true);
    });

    test("Handles strict and unanimous consensus", () => {
      let unanimousResults = [true, true, true];
      let mixedResults = [true, false, true, false];
      expect(
        PopulationConsensus.calculateFinalConsensus(
          unanimousResults,
          "unanimous"
        )
      ).toBe(true);
      expect(
        PopulationConsensus.calculateFinalConsensus(mixedResults, "strict")
      ).toBe(false);
    });
  });

  describe("getConsensusSummary", () => {
    test("Returns correct summary", () => {
      const summary = consensusCalculator.getConsensusSummary();
      expect(summary).toHaveProperty("totalParticipants", 3);
      expect(summary.percentageAgreement).toBeCloseTo(66.67, 2);
    });
  });

  describe("filterConsensusByThreshold", () => {
    test("Filters opinions by threshold", () => {
      const filtered = PopulationConsensus.filterConsensusByThreshold(
        validPopulationData,
        0.7
      );
      expect(filtered).toEqual([
        { id: 1, opinion: 0.8, weight: 0.7 },
        { id: 3, opinion: 0.9, weight: 0.5 },
      ]);
    });

    test("Returns empty array if no opinions meet threshold", () => {
      expect(
        PopulationConsensus.filterConsensusByThreshold(validPopulationData, 1.0)
      ).toEqual([]);
    });
  });
});
