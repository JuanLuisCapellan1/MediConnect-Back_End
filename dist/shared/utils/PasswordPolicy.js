"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.STRONG_PASSWORD_MESSAGE = exports.STRONG_PASSWORD_REGEX = void 0;
exports.validarPasswordSegura = validarPasswordSegura;
exports.STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>\/?`~]).{8,}$/;
exports.STRONG_PASSWORD_MESSAGE = 'La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula, un número y un símbolo especial (ej: !@#$%).';
/**
 * Throws an Error with a descriptive message if the password does not meet the policy.
 * Use this in use cases where DTOs are not available.
 */
function validarPasswordSegura(password) {
    if (!exports.STRONG_PASSWORD_REGEX.test(password)) {
        throw new Error(exports.STRONG_PASSWORD_MESSAGE);
    }
}
