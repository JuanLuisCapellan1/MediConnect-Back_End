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
exports.GestionarFormacionesAcademicasUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const FormacionAcademicaValidator_1 = require("../../domain/validators/FormacionesAcademicas/FormacionAcademicaValidator");
const FormacionAcademicaNoEncontradaError_1 = require("../../domain/errors/FormacionesAcademicas/FormacionAcademicaNoEncontradaError");
const UniversidadNoEncontradaError_1 = require("../../domain/errors/FormacionesAcademicas/UniversidadNoEncontradaError");
const FormacionDuplicadaError_1 = require("../../domain/errors/FormacionesAcademicas/FormacionDuplicadaError");
let GestionarFormacionesAcademicasUseCase = class GestionarFormacionesAcademicasUseCase {
    constructor(formacionAcademicaRepository, formacionAcademicaValidator) {
        this.formacionAcademicaRepository = formacionAcademicaRepository;
        this.formacionAcademicaValidator = formacionAcademicaValidator;
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
        this.formacionAcademicaValidator.validarCamposRequeridos(dto.doctorId, dto.universidadId, dto.especialidadId, fechaInicio);
        // Validar que el doctor existe
        const doctorExiste = await this.formacionAcademicaRepository.verificarDoctorExiste(dto.doctorId);
        if (!doctorExiste) {
            throw new Error(`No se encontró el doctor con ID: ${dto.doctorId}`);
        }
        // Validar que la universidad existe
        const universidadExiste = await this.formacionAcademicaRepository.verificarUniversidadExiste(dto.universidadId);
        if (!universidadExiste) {
            throw new UniversidadNoEncontradaError_1.UniversidadNoEncontradaError(dto.universidadId);
        }
        // Validar que la especialidad existe
        const especialidadExiste = await this.formacionAcademicaRepository.verificarEspecialidadExiste(dto.especialidadId);
        if (!especialidadExiste) {
            throw new Error(`No se encontró la especialidad con ID: ${dto.especialidadId}`);
        }
        // Validar fechas
        this.formacionAcademicaValidator.validarFechas(fechaInicio, fechaFinalizacion);
        // Validar que no exista una formación duplicada
        const esDuplicada = await this.formacionAcademicaRepository.verificarFormacionDuplicada(dto.doctorId, dto.universidadId, dto.especialidadId);
        if (esDuplicada) {
            throw new FormacionDuplicadaError_1.FormacionDuplicadaError();
        }
        // Normalizar estado
        const estado = dto.estado
            ? dto.estado.charAt(0).toUpperCase() + dto.estado.slice(1).toLowerCase()
            : 'Activo';
        // Validar estado
        this.formacionAcademicaValidator.validarEstadoValido(estado);
        // Crear formación académica
        return await this.formacionAcademicaRepository.crear(dto.doctorId, dto.universidadId, dto.especialidadId, fechaInicio, estado, fechaFinalizacion);
    }
    async obtenerPorId(id) {
        const formacion = await this.formacionAcademicaRepository.obtenerPorId(id);
        if (!formacion) {
            throw new FormacionAcademicaNoEncontradaError_1.FormacionAcademicaNoEncontradaError(id);
        }
        return formacion;
    }
    async obtenerTodos(filtro) {
        const pagina = filtro.pagina && filtro.pagina > 0 ? filtro.pagina : 1;
        const limite = filtro.limite && filtro.limite > 0 ? filtro.limite : 10;
        // Normalizar estado si se proporciona
        let estadoNormalizado;
        if (filtro.estado) {
            estadoNormalizado =
                filtro.estado.charAt(0).toUpperCase() + filtro.estado.slice(1).toLowerCase();
            this.formacionAcademicaValidator.validarEstadoValido(estadoNormalizado);
        }
        return await this.formacionAcademicaRepository.obtenerTodos(filtro.doctorId, undefined, // universidadId - no se usa en filtros públicos
        undefined, // especialidadId - no se usa en filtros públicos
        estadoNormalizado, filtro.busqueda, pagina, limite);
    }
    async obtenerPorDoctor(doctorId, pagina, limite) {
        // Validar que el doctor existe
        const doctorExiste = await this.formacionAcademicaRepository.verificarDoctorExiste(doctorId);
        if (!doctorExiste) {
            throw new Error(`No se encontró el doctor con ID: ${doctorId}`);
        }
        const paginaFinal = pagina && pagina > 0 ? pagina : 1;
        const limiteFinal = limite && limite > 0 ? limite : 20;
        return await this.formacionAcademicaRepository.obtenerPorDoctor(doctorId, paginaFinal, limiteFinal);
    }
    async actualizar(id, dto) {
        // Verificar que la formación académica existe
        const formacionExistente = await this.formacionAcademicaRepository.obtenerPorId(id);
        if (!formacionExistente) {
            throw new FormacionAcademicaNoEncontradaError_1.FormacionAcademicaNoEncontradaError(id);
        }
        // Convertir fechas si se proporcionan
        const fechaInicio = dto.fechaInicio ? new Date(dto.fechaInicio) : undefined;
        const fechaFinalizacion = dto.fechaFinalizacion ? new Date(dto.fechaFinalizacion) : undefined;
        // Validar universidad si se proporciona
        if (dto.universidadId !== undefined) {
            if (dto.universidadId <= 0) {
                throw new Error('El ID de la universidad debe ser válido');
            }
            const universidadExiste = await this.formacionAcademicaRepository.verificarUniversidadExiste(dto.universidadId);
            if (!universidadExiste) {
                throw new UniversidadNoEncontradaError_1.UniversidadNoEncontradaError(dto.universidadId);
            }
        }
        // Validar especialidad si se proporciona
        if (dto.especialidadId !== undefined) {
            if (dto.especialidadId <= 0) {
                throw new Error('El ID de la especialidad debe ser válido');
            }
            const especialidadExiste = await this.formacionAcademicaRepository.verificarEspecialidadExiste(dto.especialidadId);
            if (!especialidadExiste) {
                throw new Error(`No se encontró la especialidad con ID: ${dto.especialidadId}`);
            }
        }
        // Validar que no se cree una formación duplicada con la actualización
        const universidadIdFinal = dto.universidadId ?? formacionExistente.universidadId;
        const especialidadIdFinal = dto.especialidadId ?? formacionExistente.especialidadId;
        const esDuplicada = await this.formacionAcademicaRepository.verificarFormacionDuplicada(formacionExistente.doctorId, universidadIdFinal, especialidadIdFinal, id // Excluir el registro actual de la validación
        );
        if (esDuplicada) {
            throw new FormacionDuplicadaError_1.FormacionDuplicadaError();
        }
        // Validar fechas si se están actualizando
        if (fechaInicio !== undefined || fechaFinalizacion !== undefined) {
            const fechaInicioFinal = fechaInicio ?? formacionExistente.fechaInicio;
            const fechaFinalizacionFinal = fechaFinalizacion ?? formacionExistente.fechaFinalizacion;
            this.formacionAcademicaValidator.validarFechas(fechaInicioFinal, fechaFinalizacionFinal);
        }
        // Normalizar estado si se proporciona
        let estadoNormalizado;
        if (dto.estado !== undefined) {
            estadoNormalizado = dto.estado.charAt(0).toUpperCase() + dto.estado.slice(1).toLowerCase();
            this.formacionAcademicaValidator.validarEstadoValido(estadoNormalizado);
        }
        return await this.formacionAcademicaRepository.actualizar(id, dto.universidadId, dto.especialidadId, fechaInicio, fechaFinalizacion, estadoNormalizado);
    }
    async eliminar(id) {
        // Verificar que la formación académica existe
        const formacionExistente = await this.formacionAcademicaRepository.obtenerPorId(id);
        if (!formacionExistente) {
            throw new FormacionAcademicaNoEncontradaError_1.FormacionAcademicaNoEncontradaError(id);
        }
        await this.formacionAcademicaRepository.eliminar(id);
    }
};
exports.GestionarFormacionesAcademicasUseCase = GestionarFormacionesAcademicasUseCase;
exports.GestionarFormacionesAcademicasUseCase = GestionarFormacionesAcademicasUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IFormacionAcademicaRepository')),
    __param(1, (0, tsyringe_1.inject)('FormacionAcademicaValidator')),
    __metadata("design:paramtypes", [Object, FormacionAcademicaValidator_1.FormacionAcademicaValidator])
], GestionarFormacionesAcademicasUseCase);
