"use strict";
/**
 * GestionarSubBarriosUseCase.ts
 * Casos de uso para operaciones con SubBarrios
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
exports.GestionarSubBarriosUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const SubBarrioValidator_1 = require("../../domain/validators/SubBarrios/SubBarrioValidator");
const EstadoValidator_1 = require("../../domain/validators/Estados/EstadoValidator");
let GestionarSubBarriosUseCase = class GestionarSubBarriosUseCase {
    constructor(subBarrioRepo, validator, estadoValidator) {
        this.subBarrioRepo = subBarrioRepo;
        this.validator = validator;
        this.estadoValidator = estadoValidator;
    }
    /**
     * Lista todos los SubBarrios
     */
    async listar() {
        return await this.subBarrioRepo.listarTodos();
    }
    /**
     * Crea un nuevo SubBarrio
     * @param dto - Contiene barrioId y nombre
     */
    async crear(dto) {
        // Validar que el nombre no esté vacío y que no exista otro SubBarrio con el mismo nombre en el barrio
        await this.validator.validarCreacion(dto.nombre, dto.barrioId);
        return await this.subBarrioRepo.crear(dto.barrioId, dto.nombre);
    }
    /**
     * Obtiene un SubBarrio por ID
     * @param id - ID del SubBarrio
     */
    async buscarPorId(id) {
        return await this.subBarrioRepo.buscarPorId(id);
    }
    /**
     * Lista todos los SubBarrios de un barrio específico
     * @param barrioId - ID del barrio
     */
    async listarPorBarrio(barrioId) {
        return await this.subBarrioRepo.listarPorBarrio(barrioId);
    }
    /**
     * Busca SubBarrios por nombre
     * @param nombre - Nombre del SubBarrio a buscar
     */
    async buscarPorNombre(nombre) {
        return await this.subBarrioRepo.buscarPorNombre(nombre);
    }
    /**
     * Busca SubBarrios por estado
     * @param estado - Estado del SubBarrio (Activo, Inactivo, Eliminado)
     */
    async buscarPorEstado(estado) {
        return await this.subBarrioRepo.buscarPorEstado(estado);
    }
    /**
     * Actualiza un SubBarrio existente
     * @param dto - Contiene id y los campos a actualizar
     */
    async actualizar(dto) {
        // Validar nombre y barrio solo si se proporcionan
        if (dto.nombre && dto.barrioId) {
            await this.validator.validarCreacion(dto.nombre, dto.barrioId);
        }
        // Validar cambio de barrio solo si se proporciona
        if (dto.barrioId) {
            await this.validator.validarActualizacionBarrio(dto.barrioId, dto.id);
        }
        // Validar estado solo si se proporciona
        if (dto.estado) {
            await this.estadoValidator.validarEstado(dto.estado, ['Activo', 'Inactivo', 'Eliminado']);
        }
        return await this.subBarrioRepo.actualizar(dto.id, dto.barrioId, dto.nombre, dto.estado);
    }
    /**
     * Elimina un SubBarrio (eliminación lógica)
     * @param id - ID del SubBarrio a eliminar
     */
    async eliminar(id) {
        return await this.subBarrioRepo.eliminar(id);
    }
};
exports.GestionarSubBarriosUseCase = GestionarSubBarriosUseCase;
exports.GestionarSubBarriosUseCase = GestionarSubBarriosUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('ISubBarriosRepository')),
    __param(1, (0, tsyringe_1.inject)(SubBarrioValidator_1.SubBarrioValidator)),
    __param(2, (0, tsyringe_1.inject)(EstadoValidator_1.EstadoValidator)),
    __metadata("design:paramtypes", [Object, SubBarrioValidator_1.SubBarrioValidator,
        EstadoValidator_1.EstadoValidator])
], GestionarSubBarriosUseCase);
