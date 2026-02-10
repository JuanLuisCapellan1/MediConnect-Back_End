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
const ExperienciaLaboralNoEncontradaError_1 = require("../../domain/errors/ExperienciasLaborales/ExperienciaLaboralNoEncontradaError");
const DoctorNoEncontradoError_1 = require("../../domain/errors/ExperienciasLaborales/DoctorNoEncontradoError");
let GestionarExperienciasLaboralesUseCase = class GestionarExperienciasLaboralesUseCase {
    constructor(experienciasLaboralesRepository, experienciaLaboralValidator) {
        this.experienciasLaboralesRepository = experienciasLaboralesRepository;
        this.experienciaLaboralValidator = experienciaLaboralValidator;
    }
    async crear(dto) {
        // Convertir fechas de string a Date
        const fechaInicio = new Date(dto.fechaInicio);
        const fechaFinalizacion = dto.fechaFinalizacion ? new Date(dto.fechaFinalizacion) : undefined;
        // Validar campos requeridos
        this.experienciaLaboralValidator.validarCamposRequeridos(dto.doctorId, dto.profesionId, dto.descripcionCargo, fechaInicio);
        // Validar que el doctor existe
        const doctorExiste = await this.experienciasLaboralesRepository.verificarDoctorExiste(dto.doctorId);
        if (!doctorExiste) {
            throw new DoctorNoEncontradoError_1.DoctorNoEncontradoError(dto.doctorId);
        }
        // Validar que la profesión existe
        const profesionExiste = await this.experienciasLaboralesRepository.verificarProfesionExiste(dto.profesionId);
        if (!profesionExiste) {
            throw new Error(`No se encontró la profesión con ID: ${dto.profesionId}`);
        }
        // Normalizar y validar institución
        const institucionExternaNormalizada = dto.institucionExterna?.trim();
        this.experienciaLaboralValidator.validarInstitucion(dto.centroSaludId, institucionExternaNormalizada);
        // Si se especifica un centro de salud, validar que existe
        if (dto.centroSaludId) {
            const centroSaludExiste = await this.experienciasLaboralesRepository.verificarCentroSaludExiste(dto.centroSaludId);
            if (!centroSaludExiste) {
                throw new Error(`No se encontró el centro de salud con ID: ${dto.centroSaludId}`);
            }
        }
        // Validar longitud de institución externa
        if (institucionExternaNormalizada) {
            this.experienciaLaboralValidator.validarInstitucionExterna(institucionExternaNormalizada);
        }
        // Normalizar y validar descripción del cargo
        const descripcionCargoNormalizada = dto.descripcionCargo.trim();
        this.experienciaLaboralValidator.validarDescripcionCargo(descripcionCargoNormalizada);
        // Determinar si trabaja actualmente
        const trabajaActualmente = dto.trabajaActualmente ?? false;
        // Validar fechas
        this.experienciaLaboralValidator.validarFechas(fechaInicio, fechaFinalizacion, trabajaActualmente);
        // Normalizar estado
        const estado = dto.estado
            ? dto.estado.charAt(0).toUpperCase() + dto.estado.slice(1).toLowerCase()
            : 'Activo';
        // Validar estado
        this.experienciaLaboralValidator.validarEstadoValido(estado);
        // Crear experiencia laboral
        return await this.experienciasLaboralesRepository.crear(dto.doctorId, dto.profesionId, descripcionCargoNormalizada, fechaInicio, trabajaActualmente, estado, dto.centroSaludId, institucionExternaNormalizada, fechaFinalizacion);
    }
    async obtenerPorId(id) {
        const experiencia = await this.experienciasLaboralesRepository.obtenerPorId(id);
        if (!experiencia) {
            throw new ExperienciaLaboralNoEncontradaError_1.ExperienciaLaboralNoEncontradaError(id);
        }
        return experiencia;
    }
    async obtenerTodos(filtro) {
        const pagina = filtro.pagina && filtro.pagina > 0 ? filtro.pagina : 1;
        const limite = filtro.limite && filtro.limite > 0 ? filtro.limite : 10;
        // Normalizar estado si se proporciona
        let estadoNormalizado;
        if (filtro.estado) {
            estadoNormalizado =
                filtro.estado.charAt(0).toUpperCase() + filtro.estado.slice(1).toLowerCase();
            this.experienciaLaboralValidator.validarEstadoValido(estadoNormalizado);
        }
        return await this.experienciasLaboralesRepository.obtenerTodos(filtro.doctorId, filtro.centroSaludId, filtro.profesionId, filtro.trabajaActualmente, estadoNormalizado, filtro.busqueda, pagina, limite);
    }
    async obtenerPorDoctor(doctorId, pagina, limite) {
        // Validar que el doctor existe
        const doctorExiste = await this.experienciasLaboralesRepository.verificarDoctorExiste(doctorId);
        if (!doctorExiste) {
            throw new DoctorNoEncontradoError_1.DoctorNoEncontradoError(doctorId);
        }
        const paginaFinal = pagina && pagina > 0 ? pagina : 1;
        const limiteFinal = limite && limite > 0 ? limite : 20;
        return await this.experienciasLaboralesRepository.obtenerPorDoctor(doctorId, paginaFinal, limiteFinal);
    }
    async actualizar(id, dto) {
        // Verificar que la experiencia laboral existe
        const experienciaExistente = await this.experienciasLaboralesRepository.obtenerPorId(id);
        if (!experienciaExistente) {
            throw new ExperienciaLaboralNoEncontradaError_1.ExperienciaLaboralNoEncontradaError(id);
        }
        // Convertir fechas si se proporcionan
        const fechaInicio = dto.fechaInicio ? new Date(dto.fechaInicio) : undefined;
        const fechaFinalizacion = dto.fechaFinalizacion ? new Date(dto.fechaFinalizacion) : undefined;
        // Validar profesión si se proporciona
        if (dto.profesionId !== undefined) {
            if (dto.profesionId <= 0) {
                throw new Error('El ID de la profesión debe ser válido');
            }
            const profesionExiste = await this.experienciasLaboralesRepository.verificarProfesionExiste(dto.profesionId);
            if (!profesionExiste) {
                throw new Error(`No se encontró la profesión con ID: ${dto.profesionId}`);
            }
        }
        // Normalizar y validar institución si se proporciona
        let institucionExternaNormalizada;
        let centroSaludIdFinal;
        if (dto.institucionExterna !== undefined || dto.centroSaludId !== undefined) {
            institucionExternaNormalizada = dto.institucionExterna?.trim();
            centroSaludIdFinal = dto.centroSaludId;
            // Si ambos son undefined, usar los valores existentes
            if (institucionExternaNormalizada === undefined && centroSaludIdFinal === undefined) {
                institucionExternaNormalizada = experienciaExistente.institucionExterna;
                centroSaludIdFinal = experienciaExistente.centroSaludId;
            }
            this.experienciaLaboralValidator.validarInstitucion(centroSaludIdFinal, institucionExternaNormalizada);
            // Si se especifica un centro de salud, validar que existe
            if (centroSaludIdFinal) {
                const centroSaludExiste = await this.experienciasLaboralesRepository.verificarCentroSaludExiste(centroSaludIdFinal);
                if (!centroSaludExiste) {
                    throw new Error(`No se encontró el centro de salud con ID: ${centroSaludIdFinal}`);
                }
            }
            // Validar longitud de institución externa
            if (institucionExternaNormalizada) {
                this.experienciaLaboralValidator.validarInstitucionExterna(institucionExternaNormalizada);
            }
        }
        // Normalizar y validar descripción del cargo si se proporciona
        let descripcionCargoNormalizada;
        if (dto.descripcionCargo !== undefined) {
            descripcionCargoNormalizada = dto.descripcionCargo.trim();
            this.experienciaLaboralValidator.validarDescripcionCargo(descripcionCargoNormalizada);
        }
        // Validar fechas si se están actualizando
        if (fechaInicio !== undefined || fechaFinalizacion !== undefined || dto.trabajaActualmente !== undefined) {
            const fechaInicioFinal = fechaInicio ?? experienciaExistente.fechaInicio;
            const fechaFinalizacionFinal = fechaFinalizacion ?? experienciaExistente.fechaFinalizacion;
            const trabajaActualmenteFinal = dto.trabajaActualmente ?? experienciaExistente.trabajaActualmente;
            this.experienciaLaboralValidator.validarFechas(fechaInicioFinal, fechaFinalizacionFinal, trabajaActualmenteFinal);
        }
        // Normalizar estado si se proporciona
        let estadoNormalizado;
        if (dto.estado !== undefined) {
            estadoNormalizado = dto.estado.charAt(0).toUpperCase() + dto.estado.slice(1).toLowerCase();
            this.experienciaLaboralValidator.validarEstadoValido(estadoNormalizado);
        }
        return await this.experienciasLaboralesRepository.actualizar(id, centroSaludIdFinal, institucionExternaNormalizada, dto.profesionId, descripcionCargoNormalizada, fechaInicio, fechaFinalizacion, dto.trabajaActualmente, estadoNormalizado);
    }
    async eliminar(id) {
        // Verificar que la experiencia laboral existe
        const experienciaExistente = await this.experienciasLaboralesRepository.obtenerPorId(id);
        if (!experienciaExistente) {
            throw new ExperienciaLaboralNoEncontradaError_1.ExperienciaLaboralNoEncontradaError(id);
        }
        await this.experienciasLaboralesRepository.eliminar(id);
    }
};
exports.GestionarExperienciasLaboralesUseCase = GestionarExperienciasLaboralesUseCase;
exports.GestionarExperienciasLaboralesUseCase = GestionarExperienciasLaboralesUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IExperienciasLaboralesRepository')),
    __param(1, (0, tsyringe_1.inject)('ExperienciaLaboralValidator')),
    __metadata("design:paramtypes", [Object, ExperienciaLaboralValidator_1.ExperienciaLaboralValidator])
], GestionarExperienciasLaboralesUseCase);
