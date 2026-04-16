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
exports.VerificarIdentidadUseCase = void 0;
const tsyringe_1 = require("tsyringe");
/**
 * VerificarIdentidadUseCase
 *
 * Confirms the currently authenticated user's identity by validating their password.
 * Used before sensitive operations (e.g. change email, delete account, export data).
 *
 * Does NOT issue any token — it only returns a boolean confirmation.
 */
let VerificarIdentidadUseCase = class VerificarIdentidadUseCase {
    constructor(usuarioRepository, passwordHasher) {
        this.usuarioRepository = usuarioRepository;
        this.passwordHasher = passwordHasher;
    }
    async execute(usuarioId, password) {
        const usuario = await this.usuarioRepository.buscarPorId(usuarioId);
        if (!usuario) {
            // Do not reveal whether the user exists — uniform error
            throw new Error('Credenciales inválidas.');
        }
        if (!usuario.password) {
            throw new Error('Esta cuenta no tiene contraseña local. Inicia sesión con Google.');
        }
        const esValida = await this.passwordHasher.compare(password, usuario.password);
        if (!esValida) {
            throw new Error('Credenciales inválidas.');
        }
    }
};
exports.VerificarIdentidadUseCase = VerificarIdentidadUseCase;
exports.VerificarIdentidadUseCase = VerificarIdentidadUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('UsuarioRepository')),
    __param(1, (0, tsyringe_1.inject)('PasswordHasher')),
    __metadata("design:paramtypes", [Object, Object])
], VerificarIdentidadUseCase);
