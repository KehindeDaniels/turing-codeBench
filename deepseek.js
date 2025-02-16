const { PopulationConsensus } = require("./PopulationConsensus");

describe("PopulationConsensus", () => {
  let populationData;

  beforeEach(() => {
    populationData = [
      { id: 1, opinion: 0.8, weight: 0.7 },
      { id: 2, opinion: 0.4, weight: 0.3 },
      { id: 3, opinion: 0.9, weight: 0.5 },
    ];
  });

  describe("validatePopulationData", () => {
    it("should return true for valid population data", () => {
      expect(PopulationConsensus.validatePopulationData(populationData)).toBe(
        true
      );
    });

    it("should return false for empty dataset", () => {
      expect(PopulationConsensus.validatePopulationData([])).toBe(false);
    });

    it("should return false for dataset with less than 3 participants", () => {
      const smallDataset = [
        { id: 1, opinion: 0.8, weight: 0.7 },
        { id: 2, opinion: 0.4, weight: 0.3 },
      ];
      expect(PopulationConsensus.validatePopulationData(smallDataset)).toBe(
        false
      );
    });

    it("should return false for dataset with invalid opinion values", () => {
      const invalidData = [
        { id: 1, opinion: 1.5, weight: 0.7 },
        { id: 2, opinion: -0.5, weight: 0.3 },
        { id: 3, opinion: 0.9, weight: 0.5 },
      ];
      expect(PopulationConsensus.validatePopulationData(invalidData)).toBe(
        false
      );
    });

    it("should return false for dataset with invalid weight values", () => {
      const invalidData = [
        { id: 1, opinion: 0.8, weight: -0.7 },
        { id: 2, opinion: 0.4, weight: 0.3 },
        { id: 3, opinion: 0.9, weight: 1.2 },
      ];
      expect(PopulationConsensus.validatePopulationData(invalidData)).toBe(
        false
      );
    });

    it("should return false for dataset with duplicate ids", () => {
      const duplicateData = [
        { id: 1, opinion: 0.8, weight: 0.7 },
        { id: 1, opinion: 0.4, weight: 0.3 },
        { id: 3, opinion: 0.9, weight: 0.5 },
      ];
      expect(PopulationConsensus.validatePopulationData(duplicateData)).toBe(
        false
      );
    });
  });

  describe("calculateDataConsensus", () => {
    it("should return true if consensus is reached with default threshold", () => {
      expect(
        PopulationConsensus.calculateDataConsensus(0.6, populationData)
      ).toBe(true);
    });

    it("should return false if consensus is not reached with default threshold", () => {
      const lowOpinionData = [
        { id: 1, opinion: 0.5, weight: 0.7 },
        { id: 2, opinion: 0.4, weight: 0.3 },
        { id: 3, opinion: 0.5, weight: 0.5 },
      ];
      expect(
        PopulationConsensus.calculateDataConsensus(0.6, lowOpinionData)
      ).toBe(false);
    });

    it("should use 80% threshold for 5 or fewer participants", () => {
      const smallDataset = [
        { id: 1, opinion: 0.85, weight: 0.7 },
        { id: 2, opinion: 0.8, weight: 0.3 },
        { id: 3, opinion: 0.9, weight: 0.5 },
      ];
      expect(
        PopulationConsensus.calculateDataConsensus(0.6, smallDataset)
      ).toBe(true);
    });

    it("should use 60% threshold for more than 5 participants", () => {
      const largeDataset = [
        { id: 1, opinion: 0.8, weight: 0.7 },
        { id: 2, opinion: 0.4, weight: 0.3 },
        { id: 3, opinion: 0.9, weight: 0.5 },
        { id: 4, opinion: 0.7, weight: 0.6 },
        { id: 5, opinion: 0.6, weight: 0.4 },
        { id: 6, opinion: 0.8, weight: 0.5 },
      ];
      expect(
        PopulationConsensus.calculateDataConsensus(0.6, largeDataset)
      ).toBe(true);
    });
  });

  describe("normalizeOpinions", () => {
    it("should normalize opinion values between 0 and 1", () => {
      const sampleData = [
        { id: 1, opinion: 5, weight: 0.7 },
        { id: 2, opinion: 10, weight: 0.3 },
        { id: 3, opinion: 15, weight: 0.5 },
        { id: 4, opinion: 20, weight: 0.6 },
        { id: 5, opinion: 100, weight: 0.4 },
      ];
      const normalizedData = PopulationConsensus.normalizeOpinions(sampleData);
      expect(normalizedData[0].opinion).toBeCloseTo(0.05, 2);
      expect(normalizedData[1].opinion).toBeCloseTo(0.1, 2);
      expect(normalizedData[2].opinion).toBeCloseTo(0.15, 2);
      expect(normalizedData[3].opinion).toBeCloseTo(0.2, 2);
      expect(normalizedData[4].opinion).toBeCloseTo(1.0, 2);
    });

    it("should normalize weights so that their sum is 1", () => {
      const sampleData = [
        { id: 1, opinion: 0.8, weight: 0.7 },
        { id: 2, opinion: 0.4, weight: 0.3 },
        { id: 3, opinion: 0.9, weight: 0.5 },
      ];
      const normalizedData = PopulationConsensus.normalizeOpinions(sampleData);
      const totalWeight = normalizedData.reduce(
        (sum, entry) => sum + entry.weight,
        0
      );
      expect(totalWeight).toBeCloseTo(1, 2);
    });

    it("should discard weights less than 0.1", () => {
      const sampleData = [
        { id: 1, opinion: 0.8, weight: 0.05 },
        { id: 2, opinion: 0.4, weight: 0.3 },
        { id: 3, opinion: 0.9, weight: 0.5 },
      ];
      const normalizedData = PopulationConsensus.normalizeOpinions(sampleData);
      expect(normalizedData.length).toBe(2);
    });

    it("should return 0 for empty dataset", () => {
      expect(PopulationConsensus.normalizeOpinions([])).toBe(0);
    });
  });

  describe("calculateFinalConsensus", () => {
    it("should return true for majority consensus", () => {
      const results = [true, false, true, true];
      expect(
        PopulationConsensus.calculateFinalConsensus(results, "majority")
      ).toBe(true);
    });

    it("should return false for majority consensus if not met", () => {
      const results = [true, false, false, false];
      expect(
        PopulationConsensus.calculateFinalConsensus(results, "majority")
      ).toBe(false);
    });

    it("should return true for strict consensus if above threshold", () => {
      const results = [true, true, true, false];
      expect(
        PopulationConsensus.calculateFinalConsensus(results, "strict")
      ).toBe(true);
    });

    it("should return false for strict consensus if not above threshold", () => {
      const results = [true, false, false, false];
      expect(
        PopulationConsensus.calculateFinalConsensus(results, "strict")
      ).toBe(false);
    });

    it("should return true for unanimous consensus if all agree", () => {
      const results = [true, true, true, true];
      expect(
        PopulationConsensus.calculateFinalConsensus(results, "unanimous")
      ).toBe(true);
    });

    it("should return false for unanimous consensus if not all agree", () => {
      const results = [true, true, false, true];
      expect(
        PopulationConsensus.calculateFinalConsensus(results, "unanimous")
      ).toBe(false);
    });

    it("should handle evenly split results", () => {
      const results = [true, false, true, false];
      expect(
        PopulationConsensus.calculateFinalConsensus(results, "majority")
      ).toBe(false);
    });
  });

  describe("getConsensusSummary", () => {
    it("should return correct summary for valid data", () => {
      const consensusCalculator = new PopulationConsensus(populationData);
      const summary = consensusCalculator.getConsensusSummary();
      expect(summary.totalParticipants).toBe(3);
      expect(summary.percentageAgreement).toBeCloseTo(66.67, 2);
      expect(summary.conflictResolution).toBe("majority");
    });

    it("should return 0 for empty dataset", () => {
      const emptyData = [];
      const consensusCalculator = new PopulationConsensus(emptyData);
      const summary = consensusCalculator.getConsensusSummary();
      expect(summary.totalParticipants).toBe(0);
      expect(summary.percentageAgreement).toBe(0);
    });
  });

  describe("filterConsensusByThreshold", () => {
    it("should filter participants based on threshold", () => {
      const populationData3 = [
        { id: 1, opinion: 0.8, weight: 0.7 },
        { id: 2, opinion: 0.4, weight: 0.3 },
        { id: 3, opinion: 0.9, weight: 0.5 },
        { id: 4, opinion: 0.2, weight: 0.4 },
        { id: 5, opinion: 0.75, weight: 0.6 },
      ];
      const filteredData = PopulationConsensus.filterConsensusByThreshold(
        populationData3,
        0.7
      );
      expect(filteredData.length).toBe(3);
      expect(filteredData[0].id).toBe(1);
      expect(filteredData[1].id).toBe(3);
      expect(filteredData[2].id).toBe(5);
    });

    it("should return empty array if no participants meet the threshold", () => {
      const populationData3 = [
        { id: 1, opinion: 0.8, weight: 0.7 },
        { id: 2, opinion: 0.4, weight: 0.3 },
        { id: 3, opinion: 0.9, weight: 0.5 },
        { id: 4, opinion: 0.2, weight: 0.4 },
        { id: 5, opinion: 0.75, weight: 0.6 },
      ];
      const filteredData = PopulationConsensus.filterConsensusByThreshold(
        populationData3,
        1.0
      );
      expect(filteredData.length).toBe(0);
    });
  });
});
