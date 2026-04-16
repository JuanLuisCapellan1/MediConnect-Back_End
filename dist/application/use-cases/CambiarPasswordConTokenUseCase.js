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
exports.CambiarPasswordConTokenUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const AuthService_1 = require("../../infrastructure/external-services/AuthService");
const PasswordPolicy_1 = require("../../shared/utils/PasswordPolicy");
let CambiarPasswordConTokenUseCase = class CambiarPasswordConTokenUseCase {
    constructor(usuarioRepository, passwordHasher, authService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordHasher = passwordHasher;
        this.authService = authService;
    }
    async execute(token, nuevaPassword, confirmarPassword) {
        if (nuevaPassword !== confirmarPassword) {
            throw new Error('Las contraseñas no coinciden.');
        }
        (0, PasswordPolicy_1.validarPasswordSegura)(nuevaPassword);
        const email = this.authService.validatePasswordResetToken(token);
        if (!email) {
            throw new Error('Token de cambio de contraseña inválido o expirado.');
        }
        const usuario = await this.usuarioRepository.buscarPorEmail(email);
        if (!usuario) {
            throw new Error('Usuario no encontrado.');
        }
        const hashedPassword = await this.passwordHasher.hash(nuevaPassword);
        await this.usuarioRepository.actualizar(usuario.id, { password: hashedPassword });
    }
};
exports.CambiarPasswordConTokenUseCase = CambiarPasswordConTokenUseCase;
exports.CambiarPasswordConTokenUseCase = CambiarPasswordConTokenUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('UsuarioRepository')),
    __param(1, (0, tsyringe_1.inject)('PasswordHasher')),
    __param(2, (0, tsyringe_1.inject)(AuthService_1.AuthService)),
    __metadata("design:paramtypes", [Object, Object, AuthService_1.AuthService])
], CambiarPasswordConTokenUseCase);
