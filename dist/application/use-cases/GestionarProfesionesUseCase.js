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
exports.GestionarProfesionesUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const ProfesionValidator_1 = require("../../domain/validators/Profesiones/ProfesionValidator");
const ProfesionNoEncontradaError_1 = require("../../domain/errors/Profesiones/ProfesionNoEncontradaError");
let GestionarProfesionesUseCase = class GestionarProfesionesUseCase {
    constructor(profesionesRepository, profesionValidator) {
        this.profesionesRepository = profesionesRepository;
        this.profesionValidator = profesionValidator;
    }
    async crear(dto) {
        // Validar que el nombre sea requerido
        this.profesionValidator.validarNombreRequerido(dto.nombre);
        // Normalizar nombre
        const nombreNormalizado = dto.nombre.trim();
        // Validar que no exista otra profesión con el mismo nombre
        await this.profesionValidator.validarNombreUnico(nombreNormalizado);
        // Normalizar estado (capitalizar primera letra)
        const estado = dto.estado
            ? dto.estado.charAt(0).toUpperCase() + dto.estado.slice(1).toLowerCase()
            : 'Activo';
        // Validar estado
        this.profesionValidator.validarEstadoValido(estado);
        //Normalizar descripción
        const descripcion = dto.descripcion ? dto.descripcion.trim() : undefined;
        // Crear profesión
        return await this.profesionesRepository.crear(nombreNormalizado, estado, descripcion);
    }
    async obtenerPorId(id) {
        const profesion = await this.profesionesRepository.obtenerPorId(id);
        if (!profesion) {
            throw new ProfesionNoEncontradaError_1.ProfesionNoEncontradaError(id);
        }
        return profesion;
    }
    async obtenerTodos(filtro) {
        const pagina = filtro.pagina && filtro.pagina > 0 ? filtro.pagina : 1;
        const limite = filtro.limite && filtro.limite > 0 ? filtro.limite : 10;
        // Normalizar estado si se proporciona
        let estadoNormalizado;
        if (filtro.estado) {
            estadoNormalizado = filtro.estado.charAt(0).toUpperCase() + filtro.estado.slice(1).toLowerCase();
            this.profesionValidator.validarEstadoValido(estadoNormalizado);
        }
        return await this.profesionesRepository.obtenerTodos(estadoNormalizado, filtro.busqueda, pagina, limite);
    }
    async actualizar(id, dto) {
        // Verificar que la profesión existe
        const profesionExistente = await this.profesionesRepository.obtenerPorId(id);
        if (!profesionExistente) {
            throw new ProfesionNoEncontradaError_1.ProfesionNoEncontradaError(id);
        }
        let nombreNormalizado;
        if (dto.nombre !== undefined) {
            this.profesionValidator.validarNombreRequerido(dto.nombre);
            nombreNormalizado = dto.nombre.trim();
            // Validar que no exista otra profesión con el mismo nombre
            await this.profesionValidator.validarNombreUnico(nombreNormalizado, id);
        }
        let estadoNormalizado;
        if (dto.estado !== undefined) {
            estadoNormalizado = dto.estado.charAt(0).toUpperCase() + dto.estado.slice(1).toLowerCase();
            this.profesionValidator.validarEstadoValido(estadoNormalizado);
        }
        let descripcionNormalizada;
        if (dto.descripcion !== undefined) {
            descripcionNormalizada = dto.descripcion.trim();
        }
        return await this.profesionesRepository.actualizar(id, nombreNormalizado, estadoNormalizado, descripcionNormalizada);
    }
    async eliminar(id) {
        // Verificar que la profesión existe
        const profesion = await this.profesionesRepository.obtenerPorId(id);
        if (!profesion) {
            throw new ProfesionNoEncontradaError_1.ProfesionNoEncontradaError(id);
        }
        await this.profesionesRepository.eliminar(id);
    }
};
exports.GestionarProfesionesUseCase = GestionarProfesionesUseCase;
exports.GestionarProfesionesUseCase = GestionarProfesionesUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IProfesionesRepository')),
    __param(1, (0, tsyringe_1.inject)('ProfesionValidator')),
    __metadata("design:paramtypes", [Object, ProfesionValidator_1.ProfesionValidator])
], GestionarProfesionesUseCase);
