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
exports.LoginGoogleUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const AuthService_1 = require("../../infrastructure/external-services/AuthService");
let LoginGoogleUseCase = class LoginGoogleUseCase {
    constructor(usuarioRepository, authService, passwordHasher) {
        this.usuarioRepository = usuarioRepository;
        this.authService = authService;
        this.passwordHasher = passwordHasher;
    }
    async execute(idToken) {
        const google = await this.authService.verificarGoogleToken(idToken);
        console.debug('[LoginGoogle] Google payload:', { email: google.email, googleId: google.googleId });
        // 1. ¿Ya tiene cuenta de Google vinculada?
        let usuario = await this.usuarioRepository.buscarPorCuentaSocial('Google', google.googleId);
        if (usuario) {
            console.debug('[LoginGoogle] Usuario encontrado por cuenta social (Google). id=', usuario.id);
            const usuarioDetallado = await this.usuarioRepository.buscarPerfilDetalladoPorId(usuario.id);
            const base = usuarioDetallado ?? usuario;
            const { accessToken, refreshToken } = this.authService.generarTokensSesion(base.id, base.email, base.rol);
            return {
                accessToken,
                refreshToken,
                user: this.toUserResponse(base),
                estado: 'login'
            };
        }
        // 2. ¿Existe por email? -> Vincular y devolver JWT
        usuario = await this.usuarioRepository.buscarPorEmail(google.email);
        if (usuario) {
            console.debug('[LoginGoogle] Usuario encontrado por email. Vinculando cuenta social. id=', usuario.id);
            await this.usuarioRepository.vincularCuentaSocial(usuario.id, 'Google', google.googleId);
            const usuarioDetallado = await this.usuarioRepository.buscarPerfilDetalladoPorId(usuario.id);
            const base = usuarioDetallado ?? usuario;
            const { accessToken, refreshToken } = this.authService.generarTokensSesion(base.id, base.email, base.rol);
            return {
                accessToken,
                refreshToken,
                user: this.toUserResponse(base),
                estado: 'login'
            };
        }
        // 3. Usuario nuevo: generar token de registro en lugar de crear usuario básico
        // El usuario deberá elegir su tipo (Paciente/Doctor) en el siguiente paso
        const registroToken = this.authService.generarTokenRegistroGoogle(google.email, google.googleId, google.nombre, google.apellido, google.foto);
        console.debug('[LoginGoogle] Usuario nuevo. Generado registroToken para email=', google.email);
        return {
            registroToken,
            email: google.email,
            estado: 'registro'
        };
    }
    toUserResponse(usuario) {
        const foto = usuario.fotoPerfil ?? usuario.foto_perfil ?? undefined;
        return {
            id: usuario.id,
            email: usuario.email,
            rol: usuario.rol,
            fotoPerfil: foto ?? undefined,
            paciente: usuario.paciente ?? null,
            doctor: usuario.doctor ?? null,
            centroSalud: usuario.centroSalud ?? null,
        };
    }
};
exports.LoginGoogleUseCase = LoginGoogleUseCase;
exports.LoginGoogleUseCase = LoginGoogleUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __metadata("design:paramtypes", [Object, AuthService_1.AuthService, Object])
], LoginGoogleUseCase);
