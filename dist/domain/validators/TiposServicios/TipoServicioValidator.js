"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TipoServicioValidator = void 0;
const TipoServicioYaExisteError_1 = require("../../errors/TiposServicios/TipoServicioYaExisteError");
class TipoServicioValidator {
    constructor(tipoServicioRepository) {
        this.tipoServicioRepository = tipoServicioRepository;
    }
    async validarCreacion(nombre) {
        if (!nombre || nombre.trim().length === 0) {
            throw new Error('El nombre de tipo de servicio es requerido');
        }
        const existe = await this.tipoServicioRepository.existeNombre(nombre);
        if (existe) {
            throw new TipoServicioYaExisteError_1.TipoServicioYaExisteError(nombre);
        }
    }
    async validarActualizacion(id, nombre) {
        if (nombre) {
            if (nombre.trim().length === 0) {
                throw new Error('El nombre de tipo de servicio no puede estar vacío');
            }
            const existe = await this.tipoServicioRepository.existeNombre(nombre, id);
            if (existe) {
                throw new TipoServicioYaExisteError_1.TipoServicioYaExisteError(nombre);
            }
        }
    }
}
exports.TipoServicioValidator = TipoServicioValidator;
