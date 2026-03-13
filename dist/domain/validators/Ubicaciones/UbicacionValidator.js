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
exports.UbicacionValidator = void 0;
const tsyringe_1 = require("tsyringe");
let UbicacionValidator = class UbicacionValidator {
    constructor(barriosRepository) {
        this.barriosRepository = barriosRepository;
    }
    /**
     * Valida si una Ubicacion puede ser creada
     * @param barrioId - ID del barrio
     * @param direccion - Dirección de la ubicación
     * @throws Error si la dirección está vacía o el barrio no existe
     */
    async validarCreacion(barrioId, direccion) {
        if (!direccion || direccion.trim().length === 0) {
            throw new Error('La dirección es requerida');
        }
        if (direccion.trim().length > 255) {
            throw new Error('La dirección no puede exceder 255 caracteres');
        }
        const barrio = await this.barriosRepository.buscarPorId(barrioId);
        if (!barrio) {
            throw new Error(`El barrio con ID ${barrioId} no existe`);
        }
    }
    /**
     * Valida si una Ubicacion puede cambiar de barrio
     * @param barrioId - ID del nuevo barrio
     * @param ubicacionId - ID de la Ubicacion a actualizar
     * @throws Error si el barrio no existe
     */
    async validarActualizacionUbicacion(barrioId, subBarrioId, // mantenido por compatibilidad, ignorado
    ubicacionId) {
        if (!ubicacionId || ubicacionId <= 0) {
            throw new Error('El ID de la ubicación es requerido y debe ser válido');
        }
        const barrio = await this.barriosRepository.buscarPorId(barrioId);
        if (!barrio) {
            throw new Error(`El barrio con ID ${barrioId} no existe`);
        }
    }
    validarCodigoPostal(codigoPostal) {
        if (codigoPostal && codigoPostal.trim().length > 10) {
            throw new Error('El código postal no puede exceder 10 caracteres');
        }
    }
    validarPuntoGeografico(puntoGeografico) {
        if (!puntoGeografico)
            return;
        try {
            const geoJson = JSON.parse(puntoGeografico);
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
            if (error instanceof Error)
                throw error;
            throw new Error('El formato del punto geográfico debe ser GeoJSON válido');
        }
    }
};
exports.UbicacionValidator = UbicacionValidator;
exports.UbicacionValidator = UbicacionValidator = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IBarriosRepository')),
    __metadata("design:paramtypes", [Object])
], UbicacionValidator);
