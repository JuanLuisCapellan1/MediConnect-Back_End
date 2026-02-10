"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeccionesController = void 0;
const tsyringe_1 = require("tsyringe");
const GestionarSeccionesUseCase_1 = require("../../../application/use-cases/GestionarSeccionesUseCase");
const SeccionYaExisteError_1 = require("../../../domain/errors/Secciones/SeccionYaExisteError");
const VerificarValor_1 = require("../../../domain/errors/Estados/VerificarValor");
class SeccionesController {
    constructor() {
        this.gestionarSeccionesUseCase = tsyringe_1.container.resolve(GestionarSeccionesUseCase_1.GestionarSeccionesUseCase);
    }
    async obtenerTodas(req, res) {
        try {
            const { estado } = req.params;
            const secciones = await this.gestionarSeccionesUseCase.obtenerTodas(typeof estado === 'string' ? estado : undefined);
            res.status(200).json({
                success: true,
                data: secciones,
                count: secciones.length,
                message: 'Secciones obtenidas exitosamente'
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    async obtenerPorId(req, res) {
        try {
            const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
            // Validar que el ID sea un número válido
            if (isNaN(id) || id <= 0) {
                res.status(400).json({
                    success: false,
                    message: 'El ID debe ser un número positivo'
                });
                return;
            }
            const seccion = await this.gestionarSeccionesUseCase.obtenerPorId(id);
            if (!seccion) {
                res.status(404).json({
                    success: false,
                    message: `Sección con ID ${id} no encontrada`
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: seccion,
                message: 'Sección obtenida exitosamente'
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    async obtenerPorDistrito(req, res) {
        try {
            const { distritoMunicipalId } = req.params;
            const { estado } = req.params;
            const secciones = await this.gestionarSeccionesUseCase.obtenerPorDistrito(parseInt(distritoMunicipalId), typeof estado === 'string' ? estado : undefined);
            res.status(200).json({
                success: true,
                data: secciones,
                count: secciones.length,
                message: 'Secciones del distrito municipal obtenidas exitosamente'
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    async buscarPorNombre(req, res) {
        try {
            const { nombre, distritoMunicipalId } = req.query;
            const { estado } = req.query;
            if (!nombre) {
                res.status(400).json({
                    success: false,
                    message: 'El parámetro nombre es requerido'
                });
                return;
            }
            if (distritoMunicipalId && (isNaN(parseInt(distritoMunicipalId)) || parseInt(distritoMunicipalId) <= 0)) {
                res.status(400).json({
                    success: false,
                    message: 'El parámetro distritoMunicipalId debe ser un número positivo'
                });
                return;
            }
            if (!estado || (typeof estado === 'string' && estado.trim().length === 0)) {
                res.status(400).json({
                    success: false,
                    message: 'El parámetro estado es requerido'
                });
                return;
            }
            const seccion = await this.gestionarSeccionesUseCase.buscarPorNombre(nombre, distritoMunicipalId ? parseInt(distritoMunicipalId) : undefined, typeof estado === 'string' ? estado : undefined);
            res.status(200).json({
                success: true,
                data: seccion,
                count: seccion.length,
                message: 'Secciones encontradas exitosamente'
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    async buscarPorEstado(req, res) {
        try {
            const { estado } = req.query;
            if (!estado || (typeof estado === 'string' && estado.trim().length === 0)) {
                res.status(400).json({
                    success: false,
                    message: 'El parámetro estado es requerido'
                });
                return;
            }
            const secciones = await this.gestionarSeccionesUseCase.obtenerTodas(estado);
            res.status(200).json({
                success: true,
                data: secciones,
                count: secciones.length,
                message: 'Secciones por estado obtenidas exitosamente'
            });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    async crear(req, res) {
        try {
            const dto = req.body;
            if (!dto.nombre) {
                res.status(400).json({
                    success: false,
                    message: 'El campo nombre es requerido'
                });
                return;
            }
            if (dto.distritoMunicipalId && (isNaN(dto.distritoMunicipalId) || dto.distritoMunicipalId <= 0)) {
                res.status(400).json({
                    success: false,
                    message: 'El parámetro distritoMunicipalId debe ser un número positivo'
                });
                return;
            }
            const seccion = await this.gestionarSeccionesUseCase.crear(dto);
            res.status(201).json({
                success: true,
                data: seccion,
                message: 'Sección creada exitosamente'
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    async actualizar(req, res) {
        try {
            const { id } = req.params;
            const dto = req.body;
            if (isNaN(parseInt(id)) || parseInt(id) <= 0) {
                res.status(400).json({
                    success: false,
                    message: 'El ID debe ser un número positivo'
                });
                return;
            }
            if (dto.distritoMunicipalId && (isNaN(dto.distritoMunicipalId) || dto.distritoMunicipalId <= 0)) {
                res.status(400).json({
                    success: false,
                    message: 'El parámetro distritoMunicipalId debe ser un número positivo'
                });
                return;
            }
            const seccion = await this.gestionarSeccionesUseCase.actualizar(parseInt(id), dto);
            res.status(200).json({
                success: true,
                data: seccion,
                message: 'Sección actualizada exitosamente'
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    async eliminar(req, res) {
        try {
            const { id } = req.params;
            if (isNaN(parseInt(id)) || parseInt(id) <= 0) {
                res.status(400).json({
                    success: false,
                    message: 'El ID debe ser un número positivo'
                });
                return;
            }
            const seccionEliminada = await this.gestionarSeccionesUseCase.eliminar(parseInt(id));
            res.status(200).json({
                success: true,
                data: seccionEliminada,
                message: 'Sección eliminada exitosamente'
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
       * Maneja los errores que se lanzan en los métodos del controlador
       * @param error - El error lanzado
       * @param res - Response de Express
       */
    manejarError(error, res) {
        if (error instanceof SeccionYaExisteError_1.SeccionYaExisteError) {
            res.status(409).json({
                success: false,
                message: error.message
            });
        }
        else if (error instanceof VerificarValor_1.VerificarValor) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
        else {
            res.status(500).json({
                success: false,
                message: error.message || 'Error interno del servidor'
            });
        }
    }
}
exports.SeccionesController = SeccionesController;
