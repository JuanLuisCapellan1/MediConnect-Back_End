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
exports.GestionarExperienciasLaboralesUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const ExperienciaLaboralValidator_1 = require("../../domain/validators/ExperienciasLaborales/ExperienciaLaboralValidator");
const ExperienciaLaboral_1 = require("../../domain/entities/ExperienciaLaboral");
const ExperienciaLaboralNoEncontradaError_1 = require("../../domain/errors/ExperienciasLaborales/ExperienciaLaboralNoEncontradaError");
let GestionarExperienciasLaboralesUseCase = class GestionarExperienciasLaboralesUseCase {
    constructor(experienciaLaboralRepository, validator) {
        this.experienciaLaboralRepository = experienciaLaboralRepository;
        this.validator = validator;
    }
    async crear(dto) {
        // Validar que doctorId esté presente (viene del JWT en el controller)
        if (!dto.doctorId) {
            throw new Error('El ID del doctor es requerido');
        }
        // Convertir fechas de string a Date
        const fechaInicio = new Date(dto.fechaInicio);
        const fechaFinalizacion = dto.fechaFinalizacion ? new Date(dto.fechaFinalizacion) : undefined;
        // Validar campos requeridos
        this.validator.validarCamposRequeridos(dto.doctorId, dto.institucion, dto.posicion, fechaInicio);
        // Validar institución
        this.validator.validarInstitucion(dto.institucion);
        // Validar posición
        this.validator.validarPosicion(dto.posicion);
        // Validar fechas
        this.validator.validarFechas(fechaInicio, fechaFinalizacion, dto.trabajaActualmente);
        // Verificar que el doctor existe
        const doctorExiste = await this.experienciaLaboralRepository.verificarDoctorExiste(dto.doctorId);
        if (!doctorExiste) {
            throw new Error(`No se encontró el doctor con ID: ${dto.doctorId}`);
        }
        // Crear la entidad
        const experiencia = new ExperienciaLaboral_1.ExperienciaLaboral(0, // El ID se asigna en la base de datos
        dto.doctorId, dto.institucion, dto.posicion, fechaInicio, dto.estado || 'Activo', new Date(), fechaFinalizacion, dto.trabajaActualmente || false);
        return await this.experienciaLaboralRepository.crear(experiencia);
    }
    async obtenerPorId(id) {
        const experiencia = await this.experienciaLaboralRepository.obtenerPorId(id);
        if (!experiencia) {
            throw new ExperienciaLaboralNoEncontradaError_1.ExperienciaLaboralNoEncontradaError(id);
        }
        return experiencia;
    }
    async obtenerTodos(filtro) {
        return await this.experienciaLaboralRepository.obtenerTodos(filtro.doctorId, filtro.estado, filtro.busqueda, filtro.pagina, filtro.limite);
    }
    async actualizar(id, dto) {
        // Verificar que la experiencia existe
        const experienciaExistente = await this.experienciaLaboralRepository.obtenerPorId(id);
        if (!experienciaExistente) {
            throw new ExperienciaLaboralNoEncontradaError_1.ExperienciaLaboralNoEncontradaError(id);
        }
        // Validar fechas si se están actualizando
        if (dto.fechaInicio || dto.fechaFinalizacion || dto.trabajaActualmente !== undefined) {
            const fechaInicio = dto.fechaInicio ? new Date(dto.fechaInicio) : experienciaExistente.fechaInicio;
            const fechaFinalizacion = dto.fechaFinalizacion
                ? new Date(dto.fechaFinalizacion)
                : experienciaExistente.fechaFinalizacion;
            const trabajaActualmente = dto.trabajaActualmente !== undefined
                ? dto.trabajaActualmente
                : experienciaExistente.trabajaActualmente;
            this.validator.validarFechas(fechaInicio, fechaFinalizacion, trabajaActualmente);
        }
        // Validar institución si se está actualizando
        if (dto.institucion) {
            this.validator.validarInstitucion(dto.institucion);
        }
        // Validar posición si se está actualizando
        if (dto.posicion) {
            this.validator.validarPosicion(dto.posicion);
        }
        // Validar estado si se está actualizando
        if (dto.estado) {
            this.validator.validarEstadoValido(dto.estado);
        }
        // Preparar datos para actualizar
        const datosActualizacion = {
            ...dto,
            fechaInicio: dto.fechaInicio ? new Date(dto.fechaInicio) : undefined,
            fechaFinalizacion: dto.fechaFinalizacion ? new Date(dto.fechaFinalizacion) : undefined,
            actualizadoEn: new Date(),
        };
        return await this.experienciaLaboralRepository.actualizar(id, datosActualizacion);
    }
    async eliminar(id) {
        // Verificar que la experiencia existe
        const experiencia = await this.experienciaLaboralRepository.obtenerPorId(id);
        if (!experiencia) {
            throw new ExperienciaLaboralNoEncontradaError_1.ExperienciaLaboralNoEncontradaError(id);
        }
        await this.experienciaLaboralRepository.eliminar(id);
    }
};
exports.GestionarExperienciasLaboralesUseCase = GestionarExperienciasLaboralesUseCase;
exports.GestionarExperienciasLaboralesUseCase = GestionarExperienciasLaboralesUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IExperienciaLaboralRepository')),
    __param(1, (0, tsyringe_1.inject)(ExperienciaLaboralValidator_1.ExperienciaLaboralValidator)),
    __metadata("design:paramtypes", [Object, ExperienciaLaboralValidator_1.ExperienciaLaboralValidator])
], GestionarExperienciasLaboralesUseCase);
