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
exports.EliminarCuentaUseCase = void 0;
const tsyringe_1 = require("tsyringe");
let EliminarCuentaUseCase = class EliminarCuentaUseCase {
    constructor(usuarioRepository, passwordHasher) {
        this.usuarioRepository = usuarioRepository;
        this.passwordHasher = passwordHasher;
    }
    async execute(usuarioId, dto) {
        // 1. Obtener el usuario
        const usuario = await this.usuarioRepository.buscarPorId(usuarioId);
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }
        // 2. Verificar que la confirmación sea correcta
        if (!dto.validarConfirmacion()) {
            throw new Error('La confirmación debe ser exactamente "ELIMINAR CUENTA"');
        }
        // 3. Verificar password (solo si el usuario tiene password)
        if (usuario.password) {
            const passwordValido = await this.passwordHasher.compare(dto.password, usuario.password);
            if (!passwordValido) {
                throw new Error('Contraseña incorrecta');
            }
        }
        else {
            // Usuario de Google sin password
            throw new Error('Debes establecer una contraseña antes de eliminar tu cuenta. ' +
                'Usa el endpoint de "Establecer contraseña para cuenta de Google"');
        }
        // 4. Realizar soft delete en cascada
        await this.usuarioRepository.eliminarCuenta(usuarioId);
    }
};
exports.EliminarCuentaUseCase = EliminarCuentaUseCase;
exports.EliminarCuentaUseCase = EliminarCuentaUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('UsuarioRepository')),
    __param(1, (0, tsyringe_1.inject)('PasswordHasher')),
    __metadata("design:paramtypes", [Object, Object])
], EliminarCuentaUseCase);
