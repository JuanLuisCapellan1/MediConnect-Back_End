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
exports.AttachPasswordToGoogleAccountUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const AuthService_1 = require("../../infrastructure/external-services/AuthService");
let AttachPasswordToGoogleAccountUseCase = class AttachPasswordToGoogleAccountUseCase {
    constructor(authService, usuarioRepository, passwordHasher) {
        this.authService = authService;
        this.usuarioRepository = usuarioRepository;
        this.passwordHasher = passwordHasher;
    }
    /**
     * Verifica el id_token de Google, busca el usuario por email y establece una contraseña local.
     * - Si el usuario no existe, lanza error.
     * - Si el usuario ya tiene contraseña, lanza error.
     * - Vincula la cuenta social si aún no está vinculada.
     */
    async execute(idToken, newPassword) {
        const google = await this.authService.verificarGoogleToken(idToken);
        const email = google.email;
        const usuario = await this.usuarioRepository.buscarPorEmail(email);
        if (!usuario) {
            throw new Error('Usuario no encontrado para el email del id_token');
        }
        // Si el usuario ya tiene contraseña local, no permitimos sobrescribir sin flow adicional
        if (usuario.password) {
            throw new Error('El usuario ya tiene contraseña local. Use login con email y contraseña.');
        }
        // Hashear y actualizar contraseña
        const hashed = await this.passwordHasher.hash(newPassword);
        await this.usuarioRepository.actualizar(usuario.id, { password: hashed });
        // Vincular cuenta social si no existe
        const cuentaSocial = await this.usuarioRepository.buscarPorCuentaSocial('Google', google.googleId);
        if (!cuentaSocial) {
            await this.usuarioRepository.vincularCuentaSocial(usuario.id, 'Google', google.googleId);
        }
    }
};
exports.AttachPasswordToGoogleAccountUseCase = AttachPasswordToGoogleAccountUseCase;
exports.AttachPasswordToGoogleAccountUseCase = AttachPasswordToGoogleAccountUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(AuthService_1.AuthService)),
    __param(1, (0, tsyringe_1.inject)('UsuarioRepository')),
    __param(2, (0, tsyringe_1.inject)('PasswordHasher')),
    __metadata("design:paramtypes", [AuthService_1.AuthService, Object, Object])
], AttachPasswordToGoogleAccountUseCase);
