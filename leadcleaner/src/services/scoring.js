'use strict';

const TARGET_TITLES = new Set([
  'CEO', 'CTO', 'CIO', 'COO', 'CFO', 'CMO', 'HEAD OF IT',
  'ARCHITECTURE INTEGRATION MANAGER', 'IT MANAGER', 'IT DIRECTOR',
  'ENTERPRISE ARCHITECT', 'VP DIGITAL TRANSFORMATION', 'HEAD OF CX',
  'AMMINISTRATORE DELEGATO', 'PRESIDENT', 'CHIEF OPERATION OFFICER',
  'CHIEF FINANCIAL OFFICER', 'CHIEF TECHNOLOGY', 'CHIEF MARKETING OFFICER',
  'CHIEF INFORMATION OFFICER', 'CUSTOMER EXPERIENCE MANAGER',
  'BILLING MANAGER', 'HEAD OF CUSTOMER VALUE', 'PRODUCT OWNER',
  'CUSTOMER EXPERIENCE DIRECTOR', 'HEAD OF DATA GOVERNANCE',
  'DIGITAL CUSTOMER SERVICE MANAGER', 'DISTRIBUTION IT MANAGER',
  'CLAIM MANAGER', 'HEAD OF SOLUTION', 'IT TECHNICAL ARCHITECT',
  'HEAD OF OPERATIONS', 'HEAD OF FINANCE', 'HEAD INNOVATION OFFICER',
  'CHIEF INNOVATION OFFICER', 'DIGITAL INNOVATION OFFICER',
]);

const NEGATIVE_TITLES = new Set(['STUDENT', 'HR']);

const TARGET_INDUSTRIES = new Set([
  'MANAGED PRINT SERVICES', 'HOSPITAL & HEALTH CARE',
  'HOSPITAL & HEATH CARE', 'BROADCAST MEDIA', 'ENTERTAINMENT',
  'GOVERNMENT RELATIONS', 'RETAIL', 'PUBLIC SECTOR1', 'UTILITIES1',
  'PUBLIC SECTOR', 'TELCO', 'INSURANCE', 'INVESTMENT MANAGEMENT',
  'INVESTMENT BANKING', 'TELECOMMUNICATIONS',
  'GOVERNMENT ADMINISTRATION', 'GOVERNEMNT ADMINISTRATION',
  'BANKING', 'UTILITIES', 'FINANCIAL SERVICES', 'MEDIA',
  'IT SERVICES', 'IT SERVICES1',
]);

function computeScore({ jobTitle, industry, companySize }) {
  let score = 0;

  const title = (jobTitle || '').toUpperCase().trim();
  const ind   = (industry  || '').toUpperCase().trim();
  const size  = parseInt(companySize, 10) || 0;

  if (title) {
    if (TARGET_TITLES.has(title)) {
      score += 5;
    } else {
      for (const t of TARGET_TITLES) {
        if (title.includes(t) || t.includes(title)) { score += 5; break; }
      }
    }
    for (const neg of NEGATIVE_TITLES) {
      if (title.includes(neg)) { score -= 15; break; }
    }
  }

  if (ind) {
    if (TARGET_INDUSTRIES.has(ind)) {
      score += 10;
    } else {
      for (const target of TARGET_INDUSTRIES) {
        if (ind.includes(target) || target.includes(ind)) { score += 10; break; }
      }
    }
  }

  if (size >= 500) score += 5;

  return score;
}

module.exports = { computeScore };
