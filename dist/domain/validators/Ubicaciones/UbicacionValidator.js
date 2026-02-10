"use strict";
/**
 * UbicacionValidator.ts
 * Validador de reglas de negocio para Ubicaciones
 * Valida la creación y actualización de Ubicaciones
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
exports.UbicacionValidator = void 0;
const tsyringe_1 = require("tsyringe");
let UbicacionValidator = class UbicacionValidator {
    constructor(barriosRepository, subBarriosRepository) {
        this.barriosRepository = barriosRepository;
        this.subBarriosRepository = subBarriosRepository;
    }
    /**
     * Valida si una Ubicacion puede ser creada
     * @param barrioId - ID del barrio
     * @param subBarrioId - ID del SubBarrio (opcional)
     * @param direccion - Dirección de la ubicación
     * @throws Error si la dirección está vacía, barrio no existe o SubBarrio no existe
     */
    async validarCreacion(barrioId, direccion, subBarrioId) {
        // Validar que la dirección no esté vacía
        if (!direccion || direccion.trim().length === 0) {
            throw new Error('La dirección es requerida');
        }
        // Validar que la dirección no sea demasiado larga
        if (direccion.trim().length > 255) {
            throw new Error('La dirección no puede exceder 255 caracteres');
        }
        // Validar que el barrio exista
        const barrio = await this.barriosRepository.buscarPorId(barrioId);
        if (!barrio) {
            throw new Error(`El barrio con ID ${barrioId} no existe`);
        }
        // Si se proporciona subBarrioId, validar que existe y pertenece al barrio
        if (subBarrioId !== undefined && subBarrioId !== null && subBarrioId > 0) {
            const subBarrio = await this.subBarriosRepository.buscarPorId(subBarrioId);
            if (!subBarrio) {
                throw new Error(`El SubBarrio con ID ${subBarrioId} no existe`);
            }
            // Verificar que el SubBarrio pertenece al barrio especificado
            if (subBarrio.barrioId !== barrioId) {
                throw new Error(`El SubBarrio con ID ${subBarrioId} no pertenece al barrio con ID ${barrioId}`);
            }
        }
    }
    /**
     * Valida si una Ubicacion puede cambiar de barrio o SubBarrio
     * @param barrioId - ID del nuevo barrio
     * @param subBarrioId - ID del nuevo SubBarrio (opcional)
     * @param ubicacionId - ID de la Ubicacion a actualizar
     * @throws Error si el barrio o SubBarrio no existen
     */
    async validarActualizacionUbicacion(barrioId, subBarrioId, ubicacionId) {
        // Validar que el ID de la ubicación sea válido
        if (!ubicacionId || ubicacionId <= 0) {
            throw new Error('El ID de la ubicación es requerido y debe ser válido');
        }
        // Validar que el barrio exista
        const barrio = await this.barriosRepository.buscarPorId(barrioId);
        if (!barrio) {
            throw new Error(`El barrio con ID ${barrioId} no existe`);
        }
        // Si se proporciona subBarrioId, validar que existe y pertenece al barrio
        if (subBarrioId !== undefined && subBarrioId !== null && subBarrioId > 0) {
            const subBarrio = await this.subBarriosRepository.buscarPorId(subBarrioId);
            if (!subBarrio) {
                throw new Error(`El SubBarrio con ID ${subBarrioId} no existe`);
            }
            // Verificar que el SubBarrio pertenece al barrio especificado
            if (subBarrio.barrioId !== barrioId) {
                throw new Error(`El SubBarrio con ID ${subBarrioId} no pertenece al barrio con ID ${barrioId}`);
            }
        }
    }
    /**
     * Valida que un código postal sea válido (si se proporciona)
     * @param codigoPostal - Código postal a validar
     * @throws Error si el código postal excede 10 caracteres
     */
    validarCodigoPostal(codigoPostal) {
        if (codigoPostal && codigoPostal.trim().length > 10) {
            throw new Error('El código postal no puede exceder 10 caracteres');
        }
    }
    /**
     * Valida que un punto geográfico sea válido en formato GeoJSON (si se proporciona)
     * @param puntoGeografico - Punto geográfico en formato GeoJSON
     * @throws Error si el formato GeoJSON es inválido
     */
    validarPuntoGeografico(puntoGeografico) {
        if (!puntoGeografico) {
            return; // Optional field
        }
        try {
            const geoJson = JSON.parse(puntoGeografico);
            // Validar estructura GeoJSON básica
            if (!geoJson.type || geoJson.type !== 'Point') {
                throw new Error('El punto geográfico debe ser de tipo Point');
            }
            if (!geoJson.coordinates || !Array.isArray(geoJson.coordinates)) {
                throw new Error('Las coordenadas del punto geográfico son requeridas');
            }
            if (geoJson.coordinates.length !== 2) {
                throw new Error('Las coordenadas deben contener [longitude, latitude]');
            }
            const [longitude, latitude] = geoJson.coordinates;
            // Validar rangos de coordenadas
            if (typeof longitude !== 'number' || typeof latitude !== 'number') {
                throw new Error('Las coordenadas deben ser números');
            }
            if (longitude < -180 || longitude > 180) {
                throw new Error('La longitud debe estar entre -180 y 180');
            }
            if (latitude < -90 || latitude > 90) {
                throw new Error('La latitud debe estar entre -90 y 90');
            }
        }
        catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('El formato del punto geográfico debe ser GeoJSON válido');
        }
    }
};
exports.UbicacionValidator = UbicacionValidator;
exports.UbicacionValidator = UbicacionValidator = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IBarriosRepository')),
    __param(1, (0, tsyringe_1.inject)('ISubBarriosRepository')),
    __metadata("design:paramtypes", [Object, Object])
], UbicacionValidator);
