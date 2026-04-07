"use strict";
/**
 * UbicacionFueraDeRangoError.ts
 * Error lanzado cuando la ubicación está fuera del rango operativo
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UbicacionFueraDeRangoError = void 0;
class UbicacionFueraDeRangoError extends Error {
    constructor(message = 'La ubicación especificada está fuera de la zona operativa permitida') {
        super(message);
        this.name = 'UbicacionFueraDeRangoError';
    }
}
exports.UbicacionFueraDeRangoError = UbicacionFueraDeRangoError;
