// ============================================================
// India-specific document and field validation
// ============================================================

// ─────────────────────────────────────────────────────────────
// PAN — Permanent Account Number
// Format: AAAAA9999A (5 alpha, 4 numeric, 1 alpha)
// ─────────────────────────────────────────────────────────────
export function isValidPAN(pan: string): boolean {
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.trim().toUpperCase());
}

// ─────────────────────────────────────────────────────────────
// Aadhaar — 12-digit number with Verhoeff checksum
// ─────────────────────────────────────────────────────────────
export function isValidAadhaar(aadhaar: string): boolean {
  const clean = aadhaar.replace(/[\s-]/g, '');
  if (!/^[2-9]\d{11}$/.test(clean)) return false;
  return verhoeffValidate(clean);
}

// ─────────────────────────────────────────────────────────────
// IFSC — Indian Financial System Code
// Format: AAAA0999999 (4 alpha, 0, 6 alphanumeric)
// ─────────────────────────────────────────────────────────────
export function isValidIFSC(ifsc: string): boolean {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.trim().toUpperCase());
}

// ─────────────────────────────────────────────────────────────
// GSTIN — Goods and Services Tax Identification Number
// ─────────────────────────────────────────────────────────────
export function isValidGSTIN(gstin: string): boolean {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
    gstin.trim().toUpperCase(),
  );
}

// ─────────────────────────────────────────────────────────────
// Indian Mobile Number
// ─────────────────────────────────────────────────────────────
export function isValidIndianMobile(phone: string): boolean {
  const clean = phone.replace(/[\s\-+]/g, '');
  // 10-digit starting with 6-9
  if (/^[6-9]\d{9}$/.test(clean)) return true;
  // With country code: 91 prefix
  if (/^91[6-9]\d{9}$/.test(clean)) return true;
  return false;
}

// ─────────────────────────────────────────────────────────────
// Indian Pincode — 6 digits, first digit non-zero
// ─────────────────────────────────────────────────────────────
export function isValidPincode(pincode: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pincode.trim());
}

// ─────────────────────────────────────────────────────────────
// Email
// ─────────────────────────────────────────────────────────────
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

// ─────────────────────────────────────────────────────────────
// Password strength (HRMS min requirements)
// ─────────────────────────────────────────────────────────────
export interface PasswordStrength {
  isValid: boolean;
  score: number; // 0-4
  feedback: string[];
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else feedback.push('At least 8 characters required');

  if (password.length >= 12) score++;

  if (/[A-Z]/.test(password)) score++;
  else feedback.push('Add uppercase letter');

  if (/[0-9]/.test(password)) score++;
  else feedback.push('Add a number');

  if (/[^A-Za-z0-9]/.test(password)) score++;
  else feedback.push('Add special character (!@#$%...)');

  return {
    isValid: score >= 3 && password.length >= 8,
    score: Math.min(4, score),
    feedback,
  };
}

// ─────────────────────────────────────────────────────────────
// Verhoeff Algorithm — Aadhaar checksum validation
// https://en.wikipedia.org/wiki/Verhoeff_algorithm
// ─────────────────────────────────────────────────────────────
function verhoeffValidate(num: string): boolean {
  const d = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
  ] as const;

  const p = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
  ] as const;

  const inv = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9] as const;

  let c = 0;
  const digits = num.split('').reverse().map(Number);

  for (let i = 0; i < digits.length; i++) {
    const digit = digits[i];
    const permRow = p[i % 8];
    if (digit === undefined || permRow === undefined) return false;
    const permuted = permRow[digit];
    if (permuted === undefined) return false;
    const dRow = d[c];
    if (dRow === undefined) return false;
    const next = dRow[permuted];
    if (next === undefined) return false;
    c = next;
  }

  return inv[c] === 0;
}
