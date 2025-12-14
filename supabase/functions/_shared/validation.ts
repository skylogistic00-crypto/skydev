export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  return { valid: true };
};

export const validateRequiredFields = (data: Record<string, any>, fields: string[]): { valid: boolean; missing?: string[] } => {
  const missing = fields.filter(field => {
    const value = data[field];
    // Check for null, undefined, or empty string
    return value === null || value === undefined || value === "" || (typeof value === "string" && value.trim() === "");
  });
  if (missing.length > 0) {
    return { valid: false, missing };
  }
  return { valid: true };
};
