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
exports.CambiarEmailUseCase = void 0;
const tsyringe_1 = require("tsyringe");
let CambiarEmailUseCase = class CambiarEmailUseCase {
    constructor(usuarioRepo, passwordHasher) {
        this.usuarioRepo = usuarioRepo;
        this.passwordHasher = passwordHasher;
    }
    async execute(usuarioId, dto) {
        // 1. Buscar usuario actual
        const usuario = await this.usuarioRepo.buscarPorId(usuarioId);
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }
        // 2. Verificar que tiene contraseña (no solo Google sin password)
        if (!usuario.password) {
            throw new Error('Debes establecer una contraseña antes de cambiar el email');
        }
        // 3. Verificar contraseña actual
        const passwordValida = await this.passwordHasher.compare(dto.password, usuario.password);
        if (!passwordValida) {
            throw new Error('Contraseña incorrecta');
        }
        // 4. Verificar que el nuevo email no sea igual al actual
        if (dto.nuevoEmail.toLowerCase() === usuario.email.toLowerCase()) {
            throw new Error('El nuevo email es igual al actual');
        }
        // 5. Verificar que el nuevo email no esté registrado
        const emailExiste = await this.usuarioRepo.buscarPorEmail(dto.nuevoEmail);
        if (emailExiste) {
            throw new Error('El email ya está registrado');
        }
        // 6. Actualizar email
        await this.usuarioRepo.actualizar(usuarioId, {
            email: dto.nuevoEmail
        });
    }
};
exports.CambiarEmailUseCase = CambiarEmailUseCase;
exports.CambiarEmailUseCase = CambiarEmailUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('UsuarioRepository')),
    __param(1, (0, tsyringe_1.inject)('PasswordHasher')),
    __metadata("design:paramtypes", [Object, Object])
], CambiarEmailUseCase);
