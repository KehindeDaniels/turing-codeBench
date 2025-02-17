class PopulationConsensus {
  constructor(populationData) {
    this.populationData = populationData;
  }

  static validatePopulationData(populationData) {
    if (!Array.isArray(populationData) || populationData.length < 3)
      return false;

    const uniqueIds = new Set();
    for (const entry of populationData) {
      if (
        typeof entry.id !== "number" ||
        typeof entry.opinion !== "number" ||
        typeof entry.weight !== "number"
      ) {
        return false;
      }
      if (entry.opinion < 0 || entry.opinion > 1 || entry.weight < 0.1) {
        return false;
      }
      if (uniqueIds.has(entry.id)) {
        return false;
      }
      uniqueIds.add(entry.id);
    }
    return true;
  }

  static calculateDataConsensus(threshold = 0.6, data) {
    if (!Array.isArray(data) || data.length === 0) return false;

    const adjustedThreshold = data.length <= 5 ? 0.8 : 0.6;
    threshold = threshold !== undefined ? threshold : adjustedThreshold;

    const totalWeight = data.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight === 0) return false;

    const weightedOpinions = data.reduce(
      (sum, item) => sum + item.opinion * (item.weight / totalWeight),
      0
    );

    return Number(weightedOpinions.toFixed(2)) >= threshold;
  }

  static normalizeOpinions(data) {
    if (!Array.isArray(data) || data.length === 0) return 0;

    // Check if input is an array of numbers (instead of objects with opinion/weight)
    if (typeof data[0] === "number") {
      const min = Math.min(...data);
      const max = Math.max(...data);

      // If all values are the same, return an array of zeros
      if (min === max) return new Array(data.length).fill(0.0);

      // Min-max normalization
      return data.map((value) =>
        parseFloat(((value - min) / (max - min)).toFixed(2))
      );
    }

    // Handling objects with { opinion, weight }
    data = data.filter((entry) => entry.weight >= 0.1);
    if (data.length === 0) return [];

    const minOpinion = Math.min(...data.map((entry) => entry.opinion));
    const maxOpinion = Math.max(...data.map((entry) => entry.opinion));

    // Normalize opinions using min-max scaling
    const normalizedOpinions =
      minOpinion === maxOpinion
        ? data.map(() => ({ ...data, opinion: 0.0 })) // If all opinions are the same, set all to 0
        : data.map((entry) => ({
            ...entry,
            opinion: parseFloat(
              (
                (entry.opinion - minOpinion) /
                (maxOpinion - minOpinion)
              ).toFixed(2)
            ),
          }));

    // Normalize weights to sum to 1
    const totalWeight = normalizedOpinions.reduce(
      (sum, entry) => sum + entry.weight,
      0
    );
    if (totalWeight > 0) {
      normalizedOpinions.forEach((entry) => {
        entry.weight = parseFloat((entry.weight / totalWeight).toFixed(2));
      });
    }

    return normalizedOpinions;
  }

  static calculateFinalConsensus(results, conflictResolution = "majority") {
    const trueCount = results.filter(Boolean).length;
    const totalCount = results.length;

    switch (conflictResolution) {
      case "majority":
        return trueCount > totalCount / 2;
      case "strict":
        return trueCount >= totalCount * 0.6;
      case "unanimous":
        return trueCount === totalCount;
      default:
        throw new Error(
          `Invalid conflict resolution strategy: ${conflictResolution}`
        );
    }
  }

  static filterConsensusByThreshold(data, threshold = 0.6) {
    if (!Array.isArray(data) || data.length === 0) return [];
    return data.filter((entry) => entry.opinion >= threshold);
  }

  getConsensusSummary() {
    if (
      !Array.isArray(this.populationData) ||
      this.populationData.length === 0
    ) {
      return {
        totalParticipants: 0,
        percentageAgreement: 0,
        conflictResolution: "majority",
      };
    }

    const totalParticipants = this.populationData.length;
    const agreeingParticipants = PopulationConsensus.filterConsensusByThreshold(
      this.populationData,
      0.6
    ).length;
    const percentageAgreement = parseFloat(
      ((agreeingParticipants / totalParticipants) * 100).toFixed(2)
    );

    return {
      totalParticipants,
      percentageAgreement,
      conflictResolution: "majority",
    };
  }
}

module.exports = { PopulationConsensus };
