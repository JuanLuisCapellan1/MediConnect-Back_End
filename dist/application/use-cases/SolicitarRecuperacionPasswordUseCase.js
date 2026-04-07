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
exports.SolicitarRecuperacionPasswordUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const RedisCacheService_1 = require("../../infrastructure/external-services/RedisCacheService");
let SolicitarRecuperacionPasswordUseCase = class SolicitarRecuperacionPasswordUseCase {
    constructor(usuarioRepository, emailService, redisService) {
        this.usuarioRepository = usuarioRepository;
        this.emailService = emailService;
        this.redisService = redisService;
        this.OTP_TTL = 900; // 15 minutos
    }
    async execute(email) {
        const usuario = await this.usuarioRepository.buscarPorEmail(email);
        if (!usuario) {
            throw new Error('No existe un usuario registrado con este correo.');
        }
        const codigoOTP = Math.floor(100000 + Math.random() * 900000).toString();
        const redisKey = `otp_recuperacion:${email}`;
        await this.redisService.set(redisKey, codigoOTP, this.OTP_TTL);
        await this.emailService.enviarCorreo(email, 'Recuperación de contraseña - MediConnect', `Tu código para cambiar la contraseña es: ${codigoOTP}. Este código es válido por 15 minutos.`);
    }
};
exports.SolicitarRecuperacionPasswordUseCase = SolicitarRecuperacionPasswordUseCase;
exports.SolicitarRecuperacionPasswordUseCase = SolicitarRecuperacionPasswordUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('UsuarioRepository')),
    __param(1, (0, tsyringe_1.inject)('EmailService')),
    __param(2, (0, tsyringe_1.inject)(RedisCacheService_1.RedisCacheService)),
    __metadata("design:paramtypes", [Object, Object, RedisCacheService_1.RedisCacheService])
], SolicitarRecuperacionPasswordUseCase);
