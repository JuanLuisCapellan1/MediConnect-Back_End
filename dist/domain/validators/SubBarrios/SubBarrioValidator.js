"use strict";
/**
 * SubBarrioValidator.ts
 * Validador de reglas de negocio para SubBarrios
 * Valida la creación y actualización de SubBarrios
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
exports.SubBarrioValidator = void 0;
const tsyringe_1 = require("tsyringe");
const SubBarrioYaExisteError_1 = require("../../errors/SubBarrios/SubBarrioYaExisteError");
let SubBarrioValidator = class SubBarrioValidator {
    constructor(subBarriosRepository, barriosRepository) {
        this.subBarriosRepository = subBarriosRepository;
        this.barriosRepository = barriosRepository;
    }
    /**
     * Valida si un SubBarrio puede ser creado
     * @param nombre - Nombre del SubBarrio
     * @param barrioId - ID del barrio al que pertenecerá
     * @throws Error si el nombre está vacío o el barrio no existe
     * @throws SubBarrioYaExisteError si ya existe un SubBarrio con el mismo nombre en el barrio
     */
    async validarCreacion(nombre, barrioId) {
        // Validar que el nombre no esté vacío
        if (!nombre || nombre.trim().length === 0) {
            throw new Error('El nombre del SubBarrio es requerido');
        }
        // Validar que el barrio exista
        const barrio = await this.barriosRepository.buscarPorId(barrioId);
        if (!barrio) {
            throw new Error(`El barrio con ID ${barrioId} no existe`);
        }
        // Validar que no exista otro SubBarrio con el mismo nombre en este barrio
        const subBarriosEnBarrio = await this.subBarriosRepository.listarPorBarrio(barrioId);
        const subBarrioExistente = subBarriosEnBarrio.some((sb) => sb.nombre.toLowerCase().trim() === nombre.toLowerCase().trim());
        if (subBarrioExistente) {
            throw new SubBarrioYaExisteError_1.SubBarrioYaExisteError(nombre, barrioId);
        }
    }
    /**
     * Valida si un SubBarrio puede cambiar de barrio
     * @param barrioId - ID del nuevo barrio
     * @param subBarrioId - ID del SubBarrio a actualizar
     * @throws Error si el SubBarrio o el barrio no existen
     * @throws SubBarrioYaExisteError si existe otro SubBarrio con el mismo nombre en el nuevo barrio
     */
    async validarActualizacionBarrio(barrioId, subBarrioId) {
        // Validar que el ID del SubBarrio sea válido
        if (!subBarrioId || subBarrioId <= 0) {
            throw new Error('El ID del SubBarrio es requerido y debe ser válido');
        }
        // Verificar que el SubBarrio exista
        const subBarrio = await this.subBarriosRepository.buscarPorId(subBarrioId);
        if (!subBarrio) {
            throw new Error(`El SubBarrio con ID ${subBarrioId} no existe`);
        }
        // Validar que el ID del barrio sea válido
        if (!barrioId || barrioId <= 0) {
            throw new Error('El ID del barrio es requerido y debe ser válido');
        }
        // Verificar que el barrio exista
        const barrio = await this.barriosRepository.buscarPorId(barrioId);
        if (!barrio) {
            throw new Error(`El barrio con ID ${barrioId} no existe`);
        }
        // Si se está cambiando de barrio, validar que no exista otro SubBarrio con el mismo nombre
        if (subBarrio.barrioId !== barrioId) {
            const subBarriosEnNuevoBarrio = await this.subBarriosRepository.listarPorBarrio(barrioId);
            const subBarrioExistente = subBarriosEnNuevoBarrio.some((sb) => sb.nombre.toLowerCase().trim() === subBarrio.nombre.toLowerCase().trim());
            if (subBarrioExistente) {
                throw new SubBarrioYaExisteError_1.SubBarrioYaExisteError(subBarrio.nombre, barrioId);
            }
        }
    }
};
exports.SubBarrioValidator = SubBarrioValidator;
exports.SubBarrioValidator = SubBarrioValidator = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('ISubBarriosRepository')),
    __param(1, (0, tsyringe_1.inject)('IBarriosRepository')),
    __metadata("design:paramtypes", [Object, Object])
], SubBarrioValidator);
