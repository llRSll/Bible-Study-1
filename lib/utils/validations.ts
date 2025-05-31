// Common validation types
export type ValidationError = {
  email?: string;
  password?: string;
};

// Email validation
export function validateEmail(email: string): string | undefined {
  if (!email) {
    return "Email is required";
  }

  if (!/\S+@\S+\.\S+/.test(email)) {
    return "Email is invalid";
  }

  return undefined;
}

// Password validation for login (basic)
export function validateLoginPassword(password: string): string | undefined {
  if (!password) {
    return "Password is required";
  }

  if (password.length < 6) {
    return "Password must be at least 6 characters long";
  }

  return undefined;
}

// Password validation for signup (strong)
export function validateSignupPassword(password: string): string | undefined {
  if (!password) {
    return "Password is required";
  }

  if (password.length < 6) {
    return "Password must be at least 6 characters long";
  }

  // Strong password validation
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!(hasUpperCase && hasLowerCase && hasNumbers)) {
    return "Password must contain uppercase, lowercase letters and numbers";
  }

  if (!hasSpecialChar) {
    return "Password should include at least one special character";
  }

  return undefined;
}

// Complete form validation for login
export function validateLoginForm(
  email: string,
  password: string
): ValidationError {
  const errors: ValidationError = {};

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  const passwordError = validateLoginPassword(password);
  if (passwordError) errors.password = passwordError;

  return errors;
}

// Complete form validation for signup
export function validateSignupForm(
  email: string,
  password: string
): ValidationError {
  const errors: ValidationError = {};

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  const passwordError = validateSignupPassword(password);
  if (passwordError) errors.password = passwordError;

  return errors;
}
