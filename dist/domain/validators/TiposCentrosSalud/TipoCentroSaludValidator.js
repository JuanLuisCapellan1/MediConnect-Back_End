"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TipoCentroSaludValidator = void 0;
const TipoCentroSaludYaExisteError_1 = require("../../errors/TiposCentrosSalud/TipoCentroSaludYaExisteError");
class TipoCentroSaludValidator {
    constructor(tipoCentroSaludRepository) {
        this.tipoCentroSaludRepository = tipoCentroSaludRepository;
    }
    async validarCreacion(nombre) {
        if (!nombre || nombre.trim().length === 0) {
            throw new Error('El nombre del tipo de centro de salud es requerido');
        }
        const existe = await this.tipoCentroSaludRepository.existeNombre(nombre);
        if (existe) {
            throw new TipoCentroSaludYaExisteError_1.TipoCentroSaludYaExisteError(nombre);
        }
    }
    async validarActualizacion(id, nombre) {
        if (nombre) {
            if (nombre.trim().length === 0) {
                throw new Error('El nombre del tipo de centro de salud no puede estar vacío');
            }
            const existe = await this.tipoCentroSaludRepository.existeNombre(nombre, id);
            if (existe) {
                throw new TipoCentroSaludYaExisteError_1.TipoCentroSaludYaExisteError(nombre);
            }
        }
    }
}
exports.TipoCentroSaludValidator = TipoCentroSaludValidator;
