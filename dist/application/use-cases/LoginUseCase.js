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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const AuthService_1 = require("../../infrastructure/external-services/AuthService");
const CREDENCIALES_INVALIDAS = 'Credenciales inválidas';
const USUARIO_INACTIVO = 'Usuario inactivo o bloqueado';
let LoginUseCase = class LoginUseCase {
    constructor(usuarioRepository, passwordHasher, authService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordHasher = passwordHasher;
        this.authService = authService;
    }
    async execute(dto) {
        const usuario = await this.usuarioRepository.buscarPorEmail(dto.email);
        if (!usuario) {
            throw new Error(CREDENCIALES_INVALIDAS);
        }
        const hashedPassword = usuario.password ?? usuario.password;
        if (!hashedPassword) {
            throw new Error(CREDENCIALES_INVALIDAS);
        }
        const passwordCorrecta = await this.passwordHasher.compare(dto.password, hashedPassword);
        if (!passwordCorrecta) {
            throw new Error(CREDENCIALES_INVALIDAS);
        }
        const estado = usuario.estado ?? usuario.estado;
        if (estado !== 'Activo') {
            throw new Error(USUARIO_INACTIVO);
        }
        // Cargar perfil detallado (paciente/doctor/centro, etc.)
        const usuarioDetallado = await this.usuarioRepository.buscarPerfilDetalladoPorId(usuario.id);
        const base = usuarioDetallado ?? usuario;
        const { accessToken, refreshToken } = this.authService.generarTokensSesion(base.id, base.email, base.rol);
        const fotoPerfil = base.fotoPerfil ?? base.foto_perfil ?? undefined;
        return {
            accessToken,
            refreshToken,
            usuario: {
                id: base.id,
                email: base.email,
                rol: base.rol,
                fotoPerfil: fotoPerfil ?? null,
                paciente: base.paciente ?? null,
                doctor: base.doctor ?? null,
                centroSalud: base.centroSalud ?? null,
            },
        };
    }
};
exports.LoginUseCase = LoginUseCase;
exports.LoginUseCase = LoginUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __metadata("design:paramtypes", [Object, Object, AuthService_1.AuthService])
], LoginUseCase);
