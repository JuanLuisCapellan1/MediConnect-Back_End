"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvinciasController = void 0;
const tsyringe_1 = require("tsyringe");
const GestionarProvinciasUseCase_1 = require("../../../application/use-cases/GestionarProvinciasUseCase");
const ProvinciaYaExisteError_1 = require("../../../domain/errors/Provincias/ProvinciaYaExisteError");
const VerificarValor_1 = require("../../../domain/errors/Estados/VerificarValor");
class ProvinciasController {
    constructor() {
        this.gestionarProvinciasUseCase = tsyringe_1.container.resolve(GestionarProvinciasUseCase_1.GestionarProvinciasUseCase);
    }
    /**
     * GET /provincias
     * Lista todas las provincias activas
     */
    async listarTodas(req, res) {
        try {
            const provincias = await this.gestionarProvinciasUseCase.listar();
            res.status(200).json({
                success: true,
                data: provincias,
                count: provincias.length,
                message: 'Provincias obtenidas exitosamente'
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * GET /provincias/:id
     * Obtiene una provincia por ID
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
            const provincia = await this.gestionarProvinciasUseCase.buscarPorId(id);
            if (!provincia) {
                res.status(404).json({
                    success: false,
                    message: `Provincia con ID ${id} no encontrada`
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: provincia,
                message: 'Provincia obtenida exitosamente'
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * GET /provincias/nombre/:nombre
     * Obtiene una provincia por nombre
     */
    async buscarPorNombre(req, res) {
        try {
            const nombre = (Array.isArray(req.params.nombre) ? req.params.nombre[0] : req.params.nombre)?.trim();
            const estadoParam = (Array.isArray(req.params.estado) ? req.params.estado[0] : req.params.estado).trim();
            const estadosValidos = ['Activo', 'Inactivo', 'Eliminado'];
            if (!estadoParam) {
                res.status(400).json({
                    success: false,
                    message: 'El estado es requerido'
                });
                return;
            }
            if (!estadosValidos.includes(estadoParam)) {
                res.status(400).json({
                    success: false,
                    message: `Estado inválido. Estados válidos: ${estadosValidos.join(', ')}`
                });
                return;
            }
            const estado = estadoParam;
            if (!nombre || nombre.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'El nombre de la provincia es requerido'
                });
                return;
            }
            const provincia = await this.gestionarProvinciasUseCase.buscarPorNombre(nombre, estado);
            if (!provincia) {
                res.status(404).json({
                    success: false,
                    message: `Provincias "${nombre}" no encontrada`
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: provincia,
                message: 'Provincias obtenida exitosamente'
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * GET /provincias/estado/:estado
     * Obtiene todas las provincias por estado
     */
    async buscarPorEstado(req, res) {
        try {
            const estadoParam = (Array.isArray(req.params.estado) ? req.params.estado[0] : req.params.estado).trim();
            const estadosValidos = ['Activo', 'Inactivo', 'Eliminado'];
            if (!estadoParam) {
                res.status(400).json({
                    success: false,
                    message: 'El estado es requerido'
                });
                return;
            }
            if (!estadosValidos.includes(estadoParam)) {
                res.status(400).json({
                    success: false,
                    message: `Estado inválido. Estados válidos: ${estadosValidos.join(', ')}`
                });
                return;
            }
            const estado = estadoParam;
            const provincias = await this.gestionarProvinciasUseCase.buscarPorEstado(estado);
            res.status(200).json({
                success: true,
                data: provincias,
                count: provincias.length,
                message: `Provincias con estado "${estado}" obtenidas exitosamente`
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * POST /provincias
     * Crea una nueva provincia
     */
    async crear(req, res) {
        try {
            const { nombre } = req.body;
            // Validación básica
            if (!nombre || typeof nombre !== 'string') {
                res.status(400).json({
                    success: false,
                    message: 'El nombre de la provincia es requerido y debe ser un texto'
                });
                return;
            }
            if (nombre.trim().length < 3) {
                res.status(400).json({
                    success: false,
                    message: 'El nombre de la provincia debe tener al menos 3 caracteres'
                });
                return;
            }
            const dto = {
                nombre: nombre.trim()
            };
            const provincia = await this.gestionarProvinciasUseCase.crear(dto);
            res.status(201).json({
                success: true,
                data: provincia,
                message: 'Provincia creada exitosamente'
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * PUT /provincias/:id
     * Actualiza una provincia existente
     */
    async actualizar(req, res) {
        try {
            const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
            const { nombre, estado } = req.body;
            // Validar ID
            if (isNaN(id) || id <= 0) {
                res.status(400).json({
                    success: false,
                    message: 'El ID debe ser un número positivo'
                });
                return;
            }
            if (!nombre && !estado) {
                res.status(400).json({
                    success: false,
                    message: 'El nombre o estado de la provincia son requeridos'
                });
                return;
            }
            if (nombre) {
                // Validar nombre
                if (!nombre || typeof nombre !== 'string') {
                    res.status(400).json({
                        success: false,
                        message: 'El nombre de la provincia es requerido y debe ser un texto'
                    });
                    return;
                }
                if (nombre.trim().length < 3) {
                    res.status(400).json({
                        success: false,
                        message: 'El nombre de la provincia debe tener al menos 3 caracteres'
                    });
                    return;
                }
            }
            if (estado) {
                // Validar estado
                if (!estado || typeof estado !== 'string') {
                    res.status(400).json({
                        success: false,
                        message: 'El estado es requerido y debe ser un texto'
                    });
                    return;
                }
                const estadosValidos = ['Activo', 'Inactivo', 'Eliminado'];
                if (!estadosValidos.includes(estado)) {
                    res.status(400).json({
                        success: false,
                        message: `Estado inválido. Estados válidos: ${estadosValidos.join(', ')}`
                    });
                    return;
                }
            }
            // Verificar que la provincia existe
            const provinciaExistente = await this.gestionarProvinciasUseCase.buscarPorId(id);
            if (!provinciaExistente) {
                res.status(404).json({
                    success: false,
                    message: `Provincia con ID ${id} no encontrada`
                });
                return;
            }
            // Construir DTO solo con los campos proporcionados
            const dto = {
                id,
                ...(nombre && { nombre: nombre.trim() }),
                ...(estado && { estado })
            };
            const provinciaActualizada = await this.gestionarProvinciasUseCase.actualizar(dto);
            res.status(200).json({
                success: true,
                data: provinciaActualizada,
                message: 'Provincia actualizada exitosamente'
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * DELETE /provincias/:id
     * Elimina (soft delete) una provincia
     */
    async eliminar(req, res) {
        try {
            const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
            // Validar ID
            if (isNaN(id) || id <= 0) {
                res.status(400).json({
                    success: false,
                    message: 'El ID debe ser un número positivo'
                });
                return;
            }
            // Verificar que la provincia existe
            const provinciaExistente = await this.gestionarProvinciasUseCase.buscarPorId(id);
            if (!provinciaExistente) {
                res.status(404).json({
                    success: false,
                    message: `Provincia con ID ${id} no encontrada`
                });
                return;
            }
            const provinciaEliminada = await this.gestionarProvinciasUseCase.eliminar(id);
            res.status(200).json({
                success: true,
                data: provinciaEliminada,
                message: 'Provincia eliminada exitosamente'
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * Maneja errores de forma centralizada
     */
    manejarError(error, res) {
        // Error: Provincia ya existe
        if (error instanceof ProvinciaYaExisteError_1.ProvinciaYaExisteError) {
            res.status(409).json({
                success: false,
                message: error.message
            });
            return;
        }
        // Error: Estado inválido
        if (error instanceof VerificarValor_1.VerificarValor) {
            res.status(400).json({
                success: false,
                message: error.message
            });
            return;
        }
        // Error genérico
        console.error('Error en ProvinciasController:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
}
exports.ProvinciasController = ProvinciasController;
