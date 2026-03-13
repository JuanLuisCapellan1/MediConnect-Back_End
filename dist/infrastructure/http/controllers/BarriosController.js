"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BarriosController = void 0;
const tsyringe_1 = require("tsyringe");
const GestionarBarriosUseCase_1 = require("../../../application/use-cases/GestionarBarriosUseCase");
const BarrioYaExisteError_1 = require("../../../domain/errors/Barrios/BarrioYaExisteError");
const VerificarValor_1 = require("../../../domain/errors/Estados/VerificarValor");
class BarriosController {
    constructor() {
        this.gestionarBarriosUseCase = tsyringe_1.container.resolve(GestionarBarriosUseCase_1.GestionarBarriosUseCase);
    }
    /**
     * GET /barrios
     * Lista todos los barrios activos
     */
    async listarTodos(req, res) {
        try {
            const barrios = await this.gestionarBarriosUseCase.listar();
            res.status(200).json({
                success: true,
                data: barrios,
                count: barrios.length,
                message: 'Barrios obtenidos exitosamente'
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * GET /barrios/:id
     * Obtiene un barrio por ID
     */
    async buscarPorId(req, res) {
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
            const barrio = await this.gestionarBarriosUseCase.buscarPorId(id);
            if (!barrio) {
                res.status(404).json({
                    success: false,
                    message: `Barrio con ID ${id} no encontrado`
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: barrio,
                message: 'Barrio obtenido exitosamente'
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * GET /barrios/seccion/:seccionId
     * Obtiene todos los barrios de una sección
     */
    async buscarPorSeccion(req, res) {
        try {
            const seccionId = parseInt(Array.isArray(req.params.seccionId) ? req.params.seccionId[0] : req.params.seccionId);
            if (isNaN(seccionId) || seccionId <= 0) {
                res.status(400).json({
                    success: false,
                    message: 'El ID de la sección debe ser un número positivo'
                });
                return;
            }
            const barrios = await this.gestionarBarriosUseCase.listarPorSeccion(seccionId);
            res.status(200).json({
                success: true,
                data: barrios,
                count: barrios.length,
                message: 'Barrios de la sección obtenidos exitosamente'
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * GET /barrios/nombre/:nombre/:seccionId/:estado
     * Obtiene un barrio por nombre en una sección
     */
    async buscarPorNombre(req, res) {
        try {
            const nombre = (Array.isArray(req.params.nombre) ? req.params.nombre[0] : req.params.nombre)?.trim();
            const seccionId = parseInt(Array.isArray(req.params.seccionId) ? req.params.seccionId[0] : req.params.seccionId);
            const estado = (Array.isArray(req.params.estado) ? req.params.estado[0] : req.params.estado).trim();
            if (!nombre || nombre.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'El nombre del barrio es requerido'
                });
                return;
            }
            if (isNaN(seccionId) || seccionId <= 0) {
                res.status(400).json({
                    success: false,
                    message: 'El ID de la sección debe ser un número positivo'
                });
                return;
            }
            if (!estado || estado.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'El estado es requerido'
                });
                return;
            }
            const barrios = await this.gestionarBarriosUseCase.buscarPorNombre(nombre, seccionId, estado);
            res.status(200).json({
                success: true,
                data: barrios,
                count: barrios.length,
                message: 'Barrios encontrados exitosamente'
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * GET /barrios/estado/:estado
     * Obtiene barrios por estado
     */
    async buscarPorEstado(req, res) {
        try {
            const estado = (Array.isArray(req.params.estado) ? req.params.estado[0] : req.params.estado).trim();
            if (!estado || estado.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'El estado es requerido'
                });
                return;
            }
            const barrios = await this.gestionarBarriosUseCase.buscarPorEstado(estado);
            res.status(200).json({
                success: true,
                data: barrios,
                count: barrios.length,
                message: 'Barrios por estado obtenidos exitosamente'
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * POST /barrios
     * Crea un nuevo barrio
     */
    async crear(req, res) {
        try {
            const dto = req.body;
            // Validar que los campos requeridos estén presentes
            if (!dto.seccionId || !dto.nombre) {
                res.status(400).json({
                    success: false,
                    message: 'Los campos seccionId y nombre son requeridos'
                });
                return;
            }
            const nuevoBarrio = await this.gestionarBarriosUseCase.crear(dto);
            res.status(201).json({
                success: true,
                data: nuevoBarrio,
                message: 'Barrio creado exitosamente'
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * PUT /barrios/:id
     * Actualiza un barrio existente
     */
    async actualizar(req, res) {
        try {
            const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
            if (isNaN(id) || id <= 0) {
                res.status(400).json({
                    success: false,
                    message: 'El ID debe ser un número positivo'
                });
                return;
            }
            const dto = {
                id,
                ...req.body
            };
            const barrioActualizado = await this.gestionarBarriosUseCase.actualizar(dto);
            res.status(200).json({
                success: true,
                data: barrioActualizado,
                message: 'Barrio actualizado exitosamente'
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * DELETE /barrios/:id
     * Elimina (marca como eliminado) un barrio
     */
    async eliminar(req, res) {
        try {
            const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
            if (isNaN(id) || id <= 0) {
                res.status(400).json({
                    success: false,
                    message: 'El ID debe ser un número positivo'
                });
                return;
            }
            const barrioEliminado = await this.gestionarBarriosUseCase.eliminar(id);
            res.status(200).json({
                success: true,
                data: barrioEliminado,
                message: 'Barrio eliminado exitosamente'
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * GET /barrios/geo/punto?longitud=X&latitud=Y
     * Devuelve el barrio cuyo polígono contiene el punto dado.
     */
    async buscarPorCoordenadas(req, res) {
        try {
            const longRaw = req.query.longitud;
            const latRaw = req.query.latitud;
            if (!longRaw || !latRaw) {
                res.status(400).json({
                    success: false,
                    message: 'Los parámetros longitud y latitud son requeridos'
                });
                return;
            }
            const longitud = parseFloat(longRaw);
            const latitud = parseFloat(latRaw);
            if (isNaN(longitud) || isNaN(latitud)) {
                res.status(400).json({
                    success: false,
                    message: 'Los parámetros longitud y latitud deben ser números válidos'
                });
                return;
            }
            if (longitud < -180 || longitud > 180) {
                res.status(400).json({
                    success: false,
                    message: 'La longitud debe estar entre -180 y 180'
                });
                return;
            }
            if (latitud < -90 || latitud > 90) {
                res.status(400).json({
                    success: false,
                    message: 'La latitud debe estar entre -90 y 90'
                });
                return;
            }
            const barrio = await this.gestionarBarriosUseCase.buscarPorCoordenadas(longitud, latitud);
            if (!barrio) {
                res.status(404).json({
                    success: false,
                    message: `No se encontró ningún barrio que contenga el punto (longitud: ${longitud}, latitud: ${latitud})`
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: barrio,
                message: 'Barrio encontrado exitosamente para las coordenadas dadas'
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * GET /barrios/geo/:id
     * Devuelve un barrio con su geometría completa (campo geom en GeoJSON).
     */
    async obtenerGeometria(req, res) {
        try {
            const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
            if (isNaN(id) || id <= 0) {
                res.status(400).json({
                    success: false,
                    message: 'El ID debe ser un número positivo'
                });
                return;
            }
            const barrio = await this.gestionarBarriosUseCase.obtenerGeometria(id);
            if (!barrio) {
                res.status(404).json({
                    success: false,
                    message: `Barrio con ID ${id} no encontrado`
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: barrio,
                message: 'Geometría del barrio obtenida exitosamente'
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
        if (error instanceof BarrioYaExisteError_1.BarrioYaExisteError) {
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
exports.BarriosController = BarriosController;
