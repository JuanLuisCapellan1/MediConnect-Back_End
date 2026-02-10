"use strict";
/**
 * HorarioValidator.ts
 * Validador de reglas de negocio para Horarios
 */
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
exports.HorarioValidator = void 0;
const tsyringe_1 = require("tsyringe");
const HorarioConflictoError_1 = require("../../errors/Horarios/HorarioConflictoError");
let HorarioValidator = class HorarioValidator {
    constructor(ubicacionesRepository, usuarioRepository, horariosRepository) {
        this.ubicacionesRepository = ubicacionesRepository;
        this.usuarioRepository = usuarioRepository;
        this.horariosRepository = horariosRepository;
    }
    /**
     * Valida datos base del horario y devuelve las horas parseadas.
     */
    async validarDatosHorario(doctorId, nombre, diaSemana, horaInicio, horaFin, ubicacionId, excluirId) {
        if (!doctorId || doctorId <= 0) {
            throw new Error('El ID del doctor es requerido y debe ser válido');
        }
        if (!nombre || nombre.trim().length === 0) {
            throw new Error('El nombre del horario es requerido');
        }
        if (nombre.trim().length > 100) {
            throw new Error('El nombre del horario no puede exceder 100 caracteres');
        }
        if (diaSemana === undefined || diaSemana < 0 || diaSemana > 6) {
            throw new Error('El día de la semana debe estar entre 0 y 6');
        }
        if (!ubicacionId || ubicacionId <= 0) {
            throw new Error('El ID de la ubicación es requerido y debe ser válido');
        }
        const usuario = await this.usuarioRepository.buscarPorId(doctorId);
        if (!usuario || !usuario.esDoctor()) {
            throw new Error(`El usuario con ID ${doctorId} no es un Doctor válido`);
        }
        if (!usuario.esActivo()) {
            throw new Error(`El doctor con ID ${doctorId} no está activo`);
        }
        const ubicacion = await this.ubicacionesRepository.buscarPorId(ubicacionId);
        if (!ubicacion || ubicacion.estado !== 'Activo') {
            throw new Error(`La ubicación con ID ${ubicacionId} no es válida o está inactiva`);
        }
        const horaInicioDate = this.parseHora(horaInicio);
        const horaFinDate = this.parseHora(horaFin);
        if (horaFinDate.getTime() <= horaInicioDate.getTime()) {
            throw new Error('La hora de fin debe ser mayor a la hora de inicio');
        }
        const conflicto = await this.horariosRepository.existeConflicto(doctorId, diaSemana, horaInicioDate, horaFinDate, excluirId);
        if (conflicto) {
            throw new HorarioConflictoError_1.HorarioConflictoError();
        }
        return { horaInicioDate, horaFinDate };
    }
    parseHora(hora) {
        if (!hora || typeof hora !== 'string') {
            throw new Error('La hora debe ser un string en formato HH:mm o HH:mm:ss');
        }
        const match = hora.match(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/);
        if (!match) {
            throw new Error('La hora debe tener formato HH:mm o HH:mm:ss');
        }
        const hh = parseInt(match[1], 10);
        const mm = parseInt(match[2], 10);
        const ss = match[3] ? parseInt(match[3], 10) : 0;
        return new Date(Date.UTC(1970, 0, 1, hh, mm, ss, 0));
    }
};
exports.HorarioValidator = HorarioValidator;
exports.HorarioValidator = HorarioValidator = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('UbicacionesRepository')),
    __param(1, (0, tsyringe_1.inject)('UsuarioRepository')),
    __param(2, (0, tsyringe_1.inject)('HorariosRepository')),
    __metadata("design:paramtypes", [Object, Object, Object])
], HorarioValidator);
