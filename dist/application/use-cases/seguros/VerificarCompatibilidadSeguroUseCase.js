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
exports.VerificarCompatibilidadSeguroUseCase = void 0;
const tsyringe_1 = require("tsyringe");
let VerificarCompatibilidadSeguroUseCase = class VerificarCompatibilidadSeguroUseCase {
    constructor(seguroRepo) {
        this.seguroRepo = seguroRepo;
    }
    /**
     * Verifica si un seguro específico (seguroId + tipoSeguroId) es aceptado por
     * el doctor Y está registrado activo en el paciente autenticado.
     *
     * @param seguroId      - ID del seguro médico (ej: ARS Humano)
     * @param tipoSeguroId  - ID del tipo/plan de seguro (ej: Plan Familiar)
     * @param doctorId      - usuarioId del doctor a consultar
     * @param pacienteId    - usuarioId del paciente autenticado
     */
    async execute(seguroId, tipoSeguroId, doctorId, pacienteId) {
        return await this.seguroRepo.verificarCompatibilidadSeguro(seguroId, tipoSeguroId, doctorId, pacienteId);
    }
};
exports.VerificarCompatibilidadSeguroUseCase = VerificarCompatibilidadSeguroUseCase;
exports.VerificarCompatibilidadSeguroUseCase = VerificarCompatibilidadSeguroUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('SeguroMedicoRepository')),
    __metadata("design:paramtypes", [Object])
], VerificarCompatibilidadSeguroUseCase);
