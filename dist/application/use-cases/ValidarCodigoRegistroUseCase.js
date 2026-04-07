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
exports.ValidarCodigoRegistroUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const RedisCacheService_1 = require("../../infrastructure/external-services/RedisCacheService");
const AuthService_1 = require("../../infrastructure/external-services/AuthService");
let ValidarCodigoRegistroUseCase = class ValidarCodigoRegistroUseCase {
    constructor(redisService, authService) {
        this.redisService = redisService;
        this.authService = authService;
    }
    async execute(email, codigo) {
        // 1. Recuperar el código OTP de Redis
        const redisKey = `otp_registro:${email}`;
        const codigoGuardado = await this.redisService.get(redisKey);
        // 2. Validar existencia del código
        if (!codigoGuardado) {
            throw new Error('El código ha expirado o no existe.');
        }
        // 3. Validar que el código coincida
        if (codigoGuardado !== codigo) {
            throw new Error('Código inválido.');
        }
        // 4. Quemar el código (eliminar de Redis)
        await this.redisService.del(redisKey);
        // 5. Generar token de registro
        const token = this.authService.generarTokenRegistro(email);
        return token;
    }
};
exports.ValidarCodigoRegistroUseCase = ValidarCodigoRegistroUseCase;
exports.ValidarCodigoRegistroUseCase = ValidarCodigoRegistroUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(RedisCacheService_1.RedisCacheService)),
    __param(1, (0, tsyringe_1.inject)(AuthService_1.AuthService)),
    __metadata("design:paramtypes", [RedisCacheService_1.RedisCacheService,
        AuthService_1.AuthService])
], ValidarCodigoRegistroUseCase);
