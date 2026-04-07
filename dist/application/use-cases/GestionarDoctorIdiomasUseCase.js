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
exports.GestionarDoctorIdiomasUseCase = void 0;
const tsyringe_1 = require("tsyringe");
let GestionarDoctorIdiomasUseCase = class GestionarDoctorIdiomasUseCase {
    constructor(doctorIdiomaRepository) {
        this.doctorIdiomaRepository = doctorIdiomaRepository;
    }
    async agregar(doctorId, dto) {
        return await this.doctorIdiomaRepository.agregar(doctorId, dto);
    }
    async obtenerPorDoctorId(doctorId) {
        return await this.doctorIdiomaRepository.obtenerPorDoctorId(doctorId);
    }
    async obtenerPorId(id) {
        return await this.doctorIdiomaRepository.obtenerPorId(id);
    }
    async actualizar(id, dto) {
        return await this.doctorIdiomaRepository.actualizar(id, dto);
    }
    async eliminar(id) {
        await this.doctorIdiomaRepository.eliminar(id);
    }
};
exports.GestionarDoctorIdiomasUseCase = GestionarDoctorIdiomasUseCase;
exports.GestionarDoctorIdiomasUseCase = GestionarDoctorIdiomasUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('DoctorIdiomaRepository')),
    __metadata("design:paramtypes", [Object])
], GestionarDoctorIdiomasUseCase);
