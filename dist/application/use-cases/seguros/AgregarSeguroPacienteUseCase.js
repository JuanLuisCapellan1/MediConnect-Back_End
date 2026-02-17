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
exports.AgregarSeguroPacienteUseCase = void 0;
const tsyringe_1 = require("tsyringe");
let AgregarSeguroPacienteUseCase = class AgregarSeguroPacienteUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute(pacienteId, dto) {
        // Validar que el seguro existe
        const seguro = await this.repository.obtenerPorId(dto.idSeguro);
        if (!seguro) {
            throw new Error(`El seguro con ID ${dto.idSeguro} no existe`);
        }
        // Validar que el seguro esté activo
        if (seguro.estado !== 'Activo') {
            throw new Error('El seguro seleccionado no está disponible');
        }
        // Validar que el paciente no tenga ya este seguro
        const yaExiste = await this.repository.verificarSeguroExistentePaciente(pacienteId, dto.idSeguro);
        if (yaExiste) {
            throw new Error('Ya tienes este seguro registrado');
        }
        // Validar que el paciente no tenga más de 3 seguros activos
        const conteoActual = await this.repository.contarSegurosActivosPaciente(pacienteId);
        if (conteoActual >= 3) {
            throw new Error('Ya tienes el máximo de 3 seguros registrados. Elimina uno para agregar otro.');
        }
        return await this.repository.agregarSeguroPaciente(pacienteId, dto);
    }
};
exports.AgregarSeguroPacienteUseCase = AgregarSeguroPacienteUseCase;
exports.AgregarSeguroPacienteUseCase = AgregarSeguroPacienteUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('SeguroMedicoRepository')),
    __metadata("design:paramtypes", [Object])
], AgregarSeguroPacienteUseCase);
