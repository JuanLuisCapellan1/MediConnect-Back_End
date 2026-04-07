"use strict";
/**
 * GestionarServicioHorariosUseCase.ts
 * Casos de uso para operaciones con ServicioHorarios
 * Orquesta la lógica de negocio y coordina entre validadores y repositorio
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
exports.GestionarServicioHorariosUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const ValidadorServicioHorario_1 = require("../../domain/validators/ServiciosHorarios/ValidadorServicioHorario");
let GestionarServicioHorariosUseCase = class GestionarServicioHorariosUseCase {
    constructor(servicioHorarioRepository) {
        this.servicioHorarioRepository = servicioHorarioRepository;
    }
    /**
     * Lista todos los ServiciosHorarios con paginación y filtros
     * @param filtros - Contiene parámetros de filtrado y paginación
     */
    async listar(filtros) {
        // Validar paginación
        const pagina = filtros.pagina || 1;
        const limite = filtros.limite || 10;
        if (pagina < 1) {
            throw new Error('La página debe ser mayor a 0');
        }
        if (limite < 1 || limite > 1000) {
            throw new Error('El límite debe estar entre 1 y 1000');
        }
        return await this.servicioHorarioRepository.obtenerTodas(filtros);
    }
    /**
     * Crea una nueva relación ServicioHorario
     * @param dto - Contiene servicioId, horarioId y estado (opcional)
     */
    async crear(dto) {
        // Validar datos de entrada
        ValidadorServicioHorario_1.ValidadorServicioHorario.validarCreacion(dto.servicioId, dto.horarioId);
        if (dto.estado) {
            ValidadorServicioHorario_1.ValidadorServicioHorario.validarEstado(dto.estado);
        }
        // Validar que el servicio y horario existan
        await this.validarServicioYHorario(dto.servicioId, dto.horarioId);
        return await this.servicioHorarioRepository.crear(dto);
    }
    /**
     * Obtiene una relación ServicioHorario específica
     * @param servicioId - ID del servicio
     * @param horarioId - ID del horario
     */
    async obtener(servicioId, horarioId) {
        // Validar IDs
        ValidadorServicioHorario_1.ValidadorServicioHorario.validarIds(servicioId, horarioId);
        // Obtener la relación
        const servicioHorario = await this.servicioHorarioRepository.obtenerPorIds(servicioId, horarioId);
        if (!servicioHorario) {
            throw new Error(`No se encontró la relación entre el servicio ${servicioId} y el horario ${horarioId}`);
        }
        return servicioHorario;
    }
    /**
     * Obtiene todos los horarios de un servicio específico
     * @param servicioId - ID del servicio
     */
    async obtenerPorServicio(servicioId) {
        // Validar ID
        if (!Number.isInteger(servicioId) || servicioId <= 0) {
            throw new Error('El servicioId debe ser un número entero mayor a 0');
        }
        return await this.servicioHorarioRepository.obtenerPorServicio(servicioId);
    }
    /**
     * Obtiene todos los servicios de un horario específico
     * @param horarioId - ID del horario
     */
    async obtenerPorHorario(horarioId) {
        // Validar ID
        if (!Number.isInteger(horarioId) || horarioId <= 0) {
            throw new Error('El horarioId debe ser un número entero mayor a 0');
        }
        return await this.servicioHorarioRepository.obtenerPorHorario(horarioId);
    }
    /**
     * Actualiza una relación ServicioHorario existente
     * Puede cambiar los IDs de la combinación (servicioId y/o horarioId)
     * @param servicioId - ID del servicio actual
     * @param horarioId - ID del horario actual
     * @param dto - Contiene los campos a actualizar (nuevos IDs y/o estado)
     */
    async actualizar(servicioId, horarioId, dto) {
        // Validar IDs de la relación actual
        ValidadorServicioHorario_1.ValidadorServicioHorario.validarIds(servicioId, horarioId);
        // Validar datos de actualización (incluyendo nuevos IDs si se proporcionan)
        ValidadorServicioHorario_1.ValidadorServicioHorario.validarActualizacion(dto.servicioId, dto.horarioId, dto.estado);
        return await this.servicioHorarioRepository.actualizar(servicioId, horarioId, dto);
    }
    /**
     * Elimina una relación ServicioHorario
     * @param servicioId - ID del servicio
     * @param horarioId - ID del horario
     */
    async eliminar(servicioId, horarioId) {
        // Validar IDs
        ValidadorServicioHorario_1.ValidadorServicioHorario.validarIds(servicioId, horarioId);
        await this.servicioHorarioRepository.eliminar(servicioId, horarioId);
    }
    /**
     * Valida que tanto el servicio como el horario existan
     * @param servicioId - ID del servicio a validar
     * @param horarioId - ID del horario a validar
     */
    async validarServicioYHorario(servicioId, horarioId) {
        // Validar que el servicio existe
        const servicioExiste = await this.servicioHorarioRepository.servicioExiste(servicioId);
        if (!servicioExiste) {
            throw new Error(`El servicio con ID ${servicioId} no existe en la base de datos o está inactivo`);
        }
        // Validar que el horario existe
        const horarioExiste = await this.servicioHorarioRepository.horarioExiste(horarioId);
        if (!horarioExiste) {
            throw new Error(`El horario con ID ${horarioId} no existe en la base de datos o está inactivo`);
        }
        // Validar que la relación no existe ya
        const existe = await this.servicioHorarioRepository.existe(servicioId, horarioId);
        if (existe) {
            throw new Error(`La relación entre servicio ${servicioId} y horario ${horarioId} ya existe`);
        }
    }
};
exports.GestionarServicioHorariosUseCase = GestionarServicioHorariosUseCase;
exports.GestionarServicioHorariosUseCase = GestionarServicioHorariosUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('ServicioHorarioRepository')),
    __metadata("design:paramtypes", [Object])
], GestionarServicioHorariosUseCase);
