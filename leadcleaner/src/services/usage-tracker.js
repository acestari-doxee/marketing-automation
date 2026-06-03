'use strict';

const fs = require('fs');

class QuotaExceededError extends Error {
  constructor({ used, limit }) {
    super(`Monthly quota exhausted: ${used}/${limit}`);
    this.used  = used;
    this.limit = limit;
  }
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function readFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    return { month: '', calls: 0 };
  }
}

function writeFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function createUsageTracker({ monthlyLimit, usageFile }) {
  function load() {
    const data = readFile(usageFile);
    const month = currentMonth();
    if (data.month !== month) return { month, calls: 0 };
    return data;
  }

  return {
    getSummary() {
      const data = load();
      return {
        month:           data.month,
        calls_used:      data.calls,
        calls_remaining: Math.max(0, monthlyLimit - data.calls),
        monthly_limit:   monthlyLimit,
      };
    },

    assertCanCall() {
      const data = load();
      if (data.calls >= monthlyLimit) {
        throw new QuotaExceededError({ used: data.calls, limit: monthlyLimit });
      }
    },

    recordCall() {
      const data = load();
      data.calls += 1;
      writeFile(usageFile, data);
    },
  };
}

module.exports = { createUsageTracker, QuotaExceededError };
