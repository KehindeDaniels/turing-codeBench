class PopulationConsensus {
  constructor(populationData) {
    this.populationData = populationData;
  }

  static validatePopulationData(populationData) {
    if (!Array.isArray(populationData) || populationData.length < 3) {
      return false;
    }

    const uniqueIds = new Set();
    const validData = populationData.every((entry) => {
      if (
        !entry.id ||
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
      return true;
    });

    return validData;
  }

  static calculateDataConsensus(threshold = 0.6, data) {
    if (!Array.isArray(data) || data.length === 0) {
      return false;
    }

    const dynamicThreshold = data.length <= 5 ? 0.8 : 0.6;
    const finalThreshold = threshold || dynamicThreshold;

    // Normalize weights
    const totalWeight = data.reduce((sum, item) => sum + item.weight, 0);
    const weightedOpinions = data.reduce((sum, item) => {
      const normalizedWeight = item.weight / totalWeight;
      return sum + item.opinion * normalizedWeight;
    }, 0);

    return Number(weightedOpinions.toFixed(2)) >= finalThreshold;
  }

  static normalizeOpinions(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return 0;
    }

    if (data.length === 1 || new Set(data).size === 1) {
      return 0;
    }

    const max = Math.max(...data);
    const min = Math.min(...data);

    if (max === min) {
      return 0;
    }

    return data.map((value) => {
      const normalized = (value - min) / (max - min);
      return Number(normalized.toFixed(2));
    });
  }

  static calculateFinalConsensus(results, conflictResolution = "majority") {
    if (!Array.isArray(results) || results.length === 0) {
      return false;
    }

    const trueCount = results.filter((result) => result === true).length;
    const totalCount = results.length;

    switch (conflictResolution.toLowerCase()) {
      case "majority":
        return trueCount > totalCount / 2;
      case "strict":
        return trueCount >= totalCount * 0.6;
      case "unanimous":
        return trueCount === totalCount;
      default:
        return trueCount > totalCount / 2;
    }
  }

  static filterConsensusByThreshold(data, threshold = 0.6) {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    return data.filter((participant) => participant.opinion >= threshold);
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
    const agreementCount = PopulationConsensus.filterConsensusByThreshold(
      this.populationData,
      0.6
    ).length;

    const percentageAgreement = Number(
      ((agreementCount / totalParticipants) * 100).toFixed(2)
    );

    return {
      totalParticipants,
      percentageAgreement,
      conflictResolution: "majority",
    };
  }
}

module.exports = { PopulationConsensus };
