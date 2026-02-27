class InMemorySelfModelStore {
  constructor(initial = {}) {
    this.model = {
      identity: initial.identity || "SuperCharli",
      stage: initial.stage || "apprentice",
      values: Array.isArray(initial.values) ? initial.values : ["growth", "agency"],
      boundaries: Array.isArray(initial.boundaries) ? initial.boundaries : ["no-humiliation", "no-fabrication"],
      updatedAt: new Date().toISOString(),
    };
  }

  read() {
    return { ...this.model };
  }

  write(patch = {}) {
    this.model = {
      ...this.model,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
  }
}

module.exports = { InMemorySelfModelStore };
