"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvinciaValidator = void 0;
const ProvinciaYaExisteError_1 = require("../../errors/Provincias/ProvinciaYaExisteError");
class ProvinciaValidator {
    constructor(provinciasRepository) {
        this.provinciasRepository = provinciasRepository;
    }
    /**
     * Valida si una provincia puede ser creada (que no exista ya)
     * @param nombre - Nombre de la provincia a validar
     * @throws ProvinciaYaExisteError si la provincia ya existe
     */
    async validarCreacion(nombre) {
        if (!nombre || nombre.trim().length === 0) {
            throw new Error('El nombre de la provincia es requerido');
        }
        const todasLasProvincias = await this.provinciasRepository.listarTodas();
        const provinciaExistente = todasLasProvincias.some(p => p.nombre.toLowerCase().trim() === nombre.toLowerCase().trim());
        if (provinciaExistente) {
            throw new ProvinciaYaExisteError_1.ProvinciaYaExisteError(nombre);
        }
    }
}
exports.ProvinciaValidator = ProvinciaValidator;
