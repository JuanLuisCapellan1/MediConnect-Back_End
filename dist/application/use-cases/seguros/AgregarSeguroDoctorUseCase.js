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
exports.AgregarSeguroDoctorUseCase = void 0;
const tsyringe_1 = require("tsyringe");
let AgregarSeguroDoctorUseCase = class AgregarSeguroDoctorUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute(doctorId, dto) {
        // Validar que el seguro existe
        const seguro = await this.repository.obtenerPorId(dto.idSeguro);
        if (!seguro) {
            throw new Error(`El seguro con ID ${dto.idSeguro} no existe`);
        }
        // Validar que el seguro esté activo
        if (seguro.estado !== 'Activo') {
            throw new Error('El seguro seleccionado no está disponible');
        }
        // Validar que el tipo de seguro pertenece a esta aseguradora
        const tipoValido = await this.repository.tipoPertenecEAlSeguro(dto.idSeguro, dto.idTipoSeguro);
        if (!tipoValido) {
            throw new Error('El tipo de seguro seleccionado no pertenece a esta aseguradora');
        }
        // Validar que el doctor no tenga ya este seguro con este tipo
        const yaExiste = await this.repository.verificarSeguroExistenteDoctor(doctorId, dto.idSeguro, dto.idTipoSeguro);
        if (yaExiste) {
            throw new Error('Ya tienes este seguro y tipo de seguro registrado');
        }
        return await this.repository.agregarSeguroDoctor(doctorId, dto);
    }
};
exports.AgregarSeguroDoctorUseCase = AgregarSeguroDoctorUseCase;
exports.AgregarSeguroDoctorUseCase = AgregarSeguroDoctorUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('SeguroMedicoRepository')),
    __metadata("design:paramtypes", [Object])
], AgregarSeguroDoctorUseCase);
