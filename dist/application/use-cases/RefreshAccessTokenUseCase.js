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
exports.RefreshAccessTokenUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const AuthService_1 = require("../../infrastructure/external-services/AuthService");
let RefreshAccessTokenUseCase = class RefreshAccessTokenUseCase {
    constructor(authService, usuarioRepository) {
        this.authService = authService;
        this.usuarioRepository = usuarioRepository;
    }
    /**
     * Recibe un refreshToken y devuelve un nuevo par de tokens (access + refresh)
     * Validaciones:
     * - El refreshToken debe ser válido y del tipo 'refresh'
     * - El usuario debe existir y estar activo
     */
    async execute(refreshToken) {
        const payload = this.authService.verificarRefreshToken(refreshToken);
        if (!payload) {
            throw new Error('Refresh token inválido o expirado');
        }
        const usuario = await this.usuarioRepository.buscarPorId(payload.userId);
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }
        if (usuario.estado !== 'Activo') {
            throw new Error('Usuario inactivo o bloqueado');
        }
        return this.authService.generarTokensSesion(usuario.id, usuario.email, usuario.rol);
    }
};
exports.RefreshAccessTokenUseCase = RefreshAccessTokenUseCase;
exports.RefreshAccessTokenUseCase = RefreshAccessTokenUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(AuthService_1.AuthService)),
    __param(1, (0, tsyringe_1.inject)('UsuarioRepository')),
    __metadata("design:paramtypes", [AuthService_1.AuthService, Object])
], RefreshAccessTokenUseCase);
