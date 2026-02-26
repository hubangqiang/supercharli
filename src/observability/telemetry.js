class Telemetry {
  constructor(options = {}) {
    this.events = [];
    this.counters = new Map();
    this.echo = Boolean(options.echo);
  }

  log(event) {
    const enriched = {
      ts: new Date().toISOString(),
      ...event,
    };
    this.events.push(enriched);
    if (this.echo) {
      console.log(JSON.stringify(enriched));
    }
  }

  inc(metric, value = 1) {
    const current = this.counters.get(metric) || 0;
    this.counters.set(metric, current + value);
  }

  getCount(metric) {
    return this.counters.get(metric) || 0;
  }

  getEvents(filterFn = null) {
    if (!filterFn) return [...this.events];
    return this.events.filter(filterFn);
  }
}

module.exports = { Telemetry };
