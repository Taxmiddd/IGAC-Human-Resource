/**
 * Validation utilities for common data types
 */

export const Validators = {
  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate phone number (basic - allows various formats)
   */
  isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\d\s\-\(\)\+]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 10;
  },

  /**
   * Validate Bangladeshi phone number
   */
  isValidBDPhone(phone: string): boolean {
    // Accept +880 or 880 or 0 format
    const bdRegex = /^(\+880|880|0)?1[356789]\d{8}$/;
    return bdRegex.test(phone.replace(/\s/g, ""));
  },

  /**
   * Validate password strength
   */
  isValidPassword(password: string): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    if (password.length < 8) errors.push("Password must be at least 8 characters");
    if (!/[a-z]/.test(password)) errors.push("Password must contain lowercase letters");
    if (!/[A-Z]/.test(password)) errors.push("Password must contain uppercase letters");
    if (!/\d/.test(password)) errors.push("Password must contain numbers");
    if (!/[!@#$%^&*]/.test(password)) errors.push("Password must contain special characters (!@#$%^&*)");
    return { valid: errors.length === 0, errors };
  },

  /**
   * Validate date is in future
   */
  isFutureDate(date: Date): boolean {
    return date > new Date();
  },

  /**
   * Validate date range (start < end)
   */
  isValidDateRange(startDate: Date, endDate: Date): boolean {
    return startDate < endDate;
  },

  /**
   * Validate employee ID format (IGAC-XXXX)
   */
  isValidEmployeeId(id: string): boolean {
    return /^IGAC-\d{4}$/.test(id);
  },

  /**
   * Validate names (no special chars except "-" and "'")
   */
  isValidName(name: string): boolean {
    return /^[a-zA-Z\s\-']+$/.test(name) && name.length >= 2 && name.length <= 100;
  },

  /**
   * Validate URL format
   */
  isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Validate positive number
   */
  isPositiveNumber(n: number): boolean {
    return typeof n === "number" && n > 0 && isFinite(n);
  },

  /**
   * Validate percentage (0-100)
   */
  isValidPercentage(n: number): boolean {
    return typeof n === "number" && n >= 0 && n <= 100;
  },

  /**
   * Validate enum value
   */
  isValidEnum<T extends string | number>(value: T, allowedValues: T[]): boolean {
    return allowedValues.includes(value);
  },

  /**
   * Validate required fields in object
   */
  hasRequiredFields<T extends object>(obj: T, requiredFields: (keyof T)[]): {
    valid: boolean;
    missingFields: (keyof T)[];
  } {
    const missingFields = requiredFields.filter(field => !obj[field]);
    return { valid: missingFields.length === 0, missingFields };
  },

  /**
   * Sanitize HTML (basic)
   */
  sanitizeHTML(html: string): string {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return html.replace(/[&<>"']/g, char => map[char]);
  },

  /**
   * Validate file size (in bytes)
   */
  isValidFileSize(bytes: number, maxMB: number): boolean {
    return bytes <= maxMB * 1024 * 1024;
  },

  /**
   * Get file extension
   */
  getFileExtension(filename: string): string {
    return filename.split(".").pop()?.toLowerCase() || "";
  },

  /**
   * Validate file type against allowed extensions
   */
  isValidFileType(filename: string, allowedExtensions: string[]): boolean {
    const ext = this.getFileExtension(filename);
    return allowedExtensions.includes(ext);
  },
};
