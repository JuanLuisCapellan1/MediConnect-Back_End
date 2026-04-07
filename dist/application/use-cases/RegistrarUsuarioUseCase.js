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
exports.RegistrarUsuarioUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const Usuario_1 = require("../../domain/entities/Usuario");
let RegistrarUsuarioUseCase = class RegistrarUsuarioUseCase {
    constructor(usuarioRepository, passwordHasher) {
        this.usuarioRepository = usuarioRepository;
        this.passwordHasher = passwordHasher;
    }
    async execute(dto) {
        // 1. Validar Regla de Negocio: ¿El usuario ya existe?
        const usuarioExistente = await this.usuarioRepository.buscarPorEmail(dto.email);
        if (usuarioExistente) {
            throw new Error('El correo electrónico ya está registrado.');
            // Nota: En un proyecto real, usarías una clase personalizada 'UserAlreadyExistsError'
        }
        // 2. Encriptar la contraseña (si existe)
        let passwordHashed = '';
        if (dto.password) {
            passwordHashed = await this.passwordHasher.hash(dto.password);
        }
        // 3. Crear la Entidad de Dominio
        // Nota: El ID es 0 o undefined porque la DB lo generará.
        const nuevoUsuario = new Usuario_1.Usuario(0, // ID temporal
        dto.email, dto.rol, 'Activo', // Estado inicial
        passwordHashed);
        // 4. Guardar en Base de Datos
        const usuarioCreado = await this.usuarioRepository.crear(nuevoUsuario);
        // 5. Retornar (Sin la contraseña por seguridad, aunque la entidad la tenga)
        // Aquí podrías retornar un UserResponseDto si quieres ser más estricto
        return usuarioCreado;
    }
};
exports.RegistrarUsuarioUseCase = RegistrarUsuarioUseCase;
exports.RegistrarUsuarioUseCase = RegistrarUsuarioUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('UsuarioRepository')),
    __param(1, (0, tsyringe_1.inject)('PasswordHasher')),
    __metadata("design:paramtypes", [Object, Object])
], RegistrarUsuarioUseCase);
