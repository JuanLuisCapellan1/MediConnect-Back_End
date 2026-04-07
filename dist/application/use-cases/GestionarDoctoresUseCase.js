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
exports.GestionarDoctoresUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const DoctorValidator_1 = require("../../domain/validators/Doctores/DoctorValidator");
const EstadoValidator_1 = require("../../domain/validators/Estados/EstadoValidator");
const DoctorNoEncontradoError_1 = require("../../domain/errors/Doctores/DoctorNoEncontradoError");
let GestionarDoctoresUseCase = class GestionarDoctoresUseCase {
    constructor(doctorRepository, citaRepository, validator, estadoValidator) {
        this.doctorRepository = doctorRepository;
        this.citaRepository = citaRepository;
        this.validator = validator;
        this.estadoValidator = estadoValidator;
    }
    async obtenerPorId(id) {
        const doctor = await this.doctorRepository.obtenerPorId(id);
        if (!doctor) {
            throw new DoctorNoEncontradoError_1.DoctorNoEncontradoError(id);
        }
        return doctor;
    }
    async obtenerPorUsuarioId(usuarioId) {
        const doctor = await this.doctorRepository.obtenerPorUsuarioId(usuarioId);
        if (!doctor) {
            throw new DoctorNoEncontradoError_1.DoctorNoEncontradoError(usuarioId);
        }
        return doctor;
    }
    async listar(filtros) {
        // Normalizar estado si existe
        if (filtros.estado) {
            filtros.estado = this.normalizarEstado(filtros.estado);
        }
        // Normalizar estadoVerificacion si existe
        if (filtros.estadoVerificacion) {
            filtros.estadoVerificacion = this.normalizarEstado(filtros.estadoVerificacion);
        }
        return await this.doctorRepository.obtenerTodos(filtros);
    }
    async actualizar(usuarioId, dto) {
        // Verificar que el doctor existe
        await this.obtenerPorUsuarioId(usuarioId);
        // Normalizar estado si existe
        if (dto.estado) {
            dto.estado = this.normalizarEstado(dto.estado);
        }
        // Validar campos únicos si se están actualizando
        // Nota: exequatur y numero_documento_identificacion NO deberían ser editables, pero validamos por seguridad
        await this.validator.validarActualizacion(usuarioId);
        return await this.doctorRepository.actualizar(usuarioId, dto);
    }
    async eliminar(usuarioId) {
        // Verificar que el doctor existe
        await this.obtenerPorUsuarioId(usuarioId);
        await this.doctorRepository.eliminar(usuarioId);
    }
    async compararDoctores(ids) {
        if (!ids || ids.length === 0) {
            throw new Error('Debe proporcionar al menos un ID de doctor.');
        }
        if (ids.length > 4) {
            throw new Error('Solo se pueden comparar hasta 4 doctores a la vez.');
        }
        return await this.doctorRepository.compararDoctores(ids);
    }
    normalizarEstado(estado) {
        if (!estado)
            return estado;
        return estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase();
    }
    // ─── ESTADÍSTICAS DE DOCTOR ──────────────────────────────────────────────
    async resumenDoctor(doctorId) {
        return await this.citaRepository.resumenDoctor(doctorId);
    }
    async estadisticasServiciosDoctor(doctorId) {
        return await this.citaRepository.estadisticasServicios(doctorId);
    }
    async productividadDoctor(doctorId, periodo) {
        const periodosValidos = ['semana', 'mes', '3meses', 'año', 'todo'];
        const p = periodosValidos.includes(periodo) ? periodo : 'mes';
        return await this.citaRepository.productividadDoctor(doctorId, p);
    }
    async serviciosMasUtilizados(doctorId) {
        return await this.citaRepository.serviciosMasUtilizados(doctorId);
    }
};
exports.GestionarDoctoresUseCase = GestionarDoctoresUseCase;
exports.GestionarDoctoresUseCase = GestionarDoctoresUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('DoctorRepository')),
    __param(1, (0, tsyringe_1.inject)('CitaRepository')),
    __param(2, (0, tsyringe_1.inject)(DoctorValidator_1.DoctorValidator)),
    __param(3, (0, tsyringe_1.inject)(EstadoValidator_1.EstadoValidator)),
    __metadata("design:paramtypes", [Object, Object, DoctorValidator_1.DoctorValidator,
        EstadoValidator_1.EstadoValidator])
], GestionarDoctoresUseCase);
