"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeccionValidator = void 0;
const SeccionYaExisteError_1 = require("../../errors/Secciones/SeccionYaExisteError");
class SeccionValidator {
    constructor(seccionesRepository, distritosRepository, municipiosRepository) {
        this.seccionesRepository = seccionesRepository;
        this.distritosRepository = distritosRepository;
        this.municipiosRepository = municipiosRepository;
    }
    async validar(nombre, distritoMunicipalId) {
        // Validar nombre
        if (!nombre || nombre.trim().length === 0) {
            throw new Error('El nombre de la sección es requerido');
        }
        // Validar distrito municipal solo si se proporciona
        if (distritoMunicipalId && distritoMunicipalId > 0) {
            const distrito = await this.distritosRepository.buscarPorId(distritoMunicipalId);
            if (!distrito) {
                throw new Error(`El distrito municipal con ID ${distritoMunicipalId} no existe`);
            }
            // Validar que el nombre no exista en el mismo distrito
            const seccionesEnDistritoMunicipal = await this.seccionesRepository.obtenerPorDistrito(distritoMunicipalId);
            const seccionExistente = seccionesEnDistritoMunicipal.some(s => s.nombre.toLowerCase().trim() === nombre.toLowerCase().trim());
            if (seccionExistente) {
                throw new SeccionYaExisteError_1.SeccionYaExisteError(nombre, distritoMunicipalId);
            }
        }
    }
    async validarActualizacionDistrito(distritoMunicipalId, seccionId) {
        // Validar que el ID de la sección sea válido
        if (!seccionId || seccionId <= 0) {
            throw new Error('El ID de la sección es requerido y debe ser válido');
        }
        // Verificar que la sección exista
        const seccion = await this.seccionesRepository.obtenerPorId(seccionId);
        if (!seccion) {
            throw new Error(`La sección con ID ${seccionId} no existe`);
        }
        // Validar distrito municipal
        if (distritoMunicipalId && distritoMunicipalId > 0) {
            const distrito = await this.distritosRepository.buscarPorId(distritoMunicipalId);
            if (!distrito) {
                throw new Error(`El distrito municipal con ID ${distritoMunicipalId} no existe`);
            }
            // Validar que no exista otra sección con el mismo nombre en el nuevo distrito
            const seccionesEnDistritoMunicipal = await this.seccionesRepository.obtenerPorDistrito(distritoMunicipalId);
            const seccionExistente = seccionesEnDistritoMunicipal.some(s => s.nombre.toLowerCase().trim() === seccion.nombre.toLowerCase().trim() && s.id !== seccionId);
            if (seccionExistente) {
                throw new SeccionYaExisteError_1.SeccionYaExisteError(seccion.nombre, distritoMunicipalId);
            }
        }
    }
}
exports.SeccionValidator = SeccionValidator;
