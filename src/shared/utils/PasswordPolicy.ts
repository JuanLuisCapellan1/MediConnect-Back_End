/**
 * PasswordPolicy.ts
 * Shared utility for strong password validation.
 *
 * Rules:
 *  - At least 8 characters
 *  - At least one uppercase letter (A-Z)
 *  - At least one lowercase letter (a-z)
 *  - At least one digit (0-9)
 *  - At least one special character (!@#$%^&*()_+-=[]{}; etc)
 */

export const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>\/?`~]).{8,}$/;

export const STRONG_PASSWORD_MESSAGE =
  'La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula, un número y un símbolo especial (ej: !@#$%).';

/**
 * Throws an Error with a descriptive message if the password does not meet the policy.
 * Use this in use cases where DTOs are not available.
 */
export function validarPasswordSegura(password: string): void {
  if (!STRONG_PASSWORD_REGEX.test(password)) {
    throw new Error(STRONG_PASSWORD_MESSAGE);
  }
}
