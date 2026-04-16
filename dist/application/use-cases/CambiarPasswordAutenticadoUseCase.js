"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CambiarPasswordAutenticadoUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const PasswordPolicy_1 = require("../../shared/utils/PasswordPolicy");
/**
 * CambiarPasswordAutenticadoUseCase
 *
 * Permite a un usuario ya autenticado (JWT) cambiar su contraseña.
 * Requiere la contraseña actual como verificación de identidad.
 *
 * Diferencias con CambiarPasswordConTokenUseCase:
 * - Este opera con el userId del JWT (sin token de recuperación)
 * - Requiere contraseñaActual para prevenir cambios no autorizados si el JWT sigue activo
 * - Ideal para el perfil de usuario (Settings > Cambiar contraseña)
 */
let CambiarPasswordAutenticadoUseCase = class CambiarPasswordAutenticadoUseCase {
    constructor(usuarioRepository, passwordHasher) {
        this.usuarioRepository = usuarioRepository;
        this.passwordHasher = passwordHasher;
    }
    async execute(usuarioId, passwordActual, nuevaPassword, confirmarPassword) {
        // 1. Validar que las contraseñas nuevas coincidan
        if (nuevaPassword !== confirmarPassword) {
            throw new Error('Las contraseñas no coinciden.');
        }
        // 2. Validar política de contraseña segura
        (0, PasswordPolicy_1.validarPasswordSegura)(nuevaPassword);
        // 3. Buscar el usuario
        const usuario = await this.usuarioRepository.buscarPorId(usuarioId);
        if (!usuario) {
            throw new Error('Usuario no encontrado.');
        }
        // 4. Verificar que el usuario tiene contraseña local (no solo Google)
        if (!usuario.password) {
            throw new Error('Esta cuenta no tiene contraseña local. Usa "Olvidé mi contraseña" para establecer una.');
        }
        // 5. Verificar contraseña actual
        const esValida = await this.passwordHasher.compare(passwordActual, usuario.password);
        if (!esValida) {
            throw new Error('La contraseña actual es incorrecta.');
        }
        // 6. Prevenir reutilización de la misma contraseña
        const esMismaPassword = await this.passwordHasher.compare(nuevaPassword, usuario.password);
        if (esMismaPassword) {
            throw new Error('La nueva contraseña no puede ser igual a la contraseña actual.');
        }
        // 7. Hashear y actualizar
        const hashedPassword = await this.passwordHasher.hash(nuevaPassword);
        await this.usuarioRepository.actualizar(usuarioId, { password: hashedPassword });
    }
};
exports.CambiarPasswordAutenticadoUseCase = CambiarPasswordAutenticadoUseCase;
exports.CambiarPasswordAutenticadoUseCase = CambiarPasswordAutenticadoUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('UsuarioRepository')),
    __param(1, (0, tsyringe_1.inject)('PasswordHasher')),
    __metadata("design:paramtypes", [Object, Object])
], CambiarPasswordAutenticadoUseCase);
