"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MunicipiosController = void 0;
const tsyringe_1 = require("tsyringe");
const GestionarMunicipiosUseCase_1 = require("../../../application/use-cases/GestionarMunicipiosUseCase");
const MunicipioYaExisteError_1 = require("../../../domain/errors/Municipios/MunicipioYaExisteError");
const VerificarValor_1 = require("../../../domain/errors/Estados/VerificarValor");
class MunicipiosController {
    constructor() {
        this.gestionarMunicipiosUseCase = tsyringe_1.container.resolve(GestionarMunicipiosUseCase_1.GestionarMunicipiosUseCase);
    }
    /**
     * GET /municipios
     * Lista todos los municipios activos
     */
    async listarTodas(req, res) {
        try {
            const municipios = await this.gestionarMunicipiosUseCase.listar();
            res.status(200).json({
                success: true,
                data: municipios,
                count: municipios.length,
                message: 'Municipios obtenidos exitosamente'
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * GET /municipios/:id
     * Obtiene un municipio por ID
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
            const municipio = await this.gestionarMunicipiosUseCase.buscarPorId(id);
            if (!municipio) {
                res.status(404).json({
                    success: false,
                    message: `Municipio con ID ${id} no encontrado`
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: municipio,
                message: 'Municipio obtenido exitosamente'
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * GET /municipios/provincia/:provinciaId
     * Obtiene todos los municipios de una provincia
     */
    async buscarPorProvincia(req, res) {
        try {
            const provinciaId = parseInt(Array.isArray(req.params.provinciaId) ? req.params.provinciaId[0] : req.params.provinciaId);
            if (isNaN(provinciaId) || provinciaId <= 0) {
                res.status(400).json({
                    success: false,
                    message: 'El ID de la provincia debe ser un número positivo'
                });
                return;
            }
            const municipios = await this.gestionarMunicipiosUseCase.listarPorProvincia(provinciaId);
            res.status(200).json({
                success: true,
                data: municipios,
                count: municipios.length,
                message: 'Municipios de la provincia obtenidos exitosamente'
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * GET /municipios/nombre/:nombre/:provinciaId/:estado
     * Obtiene un municipio por nombre en una provincia
     */
    async buscarPorNombre(req, res) {
        try {
            const nombre = (Array.isArray(req.params.nombre) ? req.params.nombre[0] : req.params.nombre)?.trim();
            const provinciaId = parseInt(Array.isArray(req.params.provinciaId) ? req.params.provinciaId[0] : req.params.provinciaId);
            const estado = (Array.isArray(req.params.estado) ? req.params.estado[0] : req.params.estado).trim();
            if (!nombre || nombre.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'El nombre del municipio es requerido'
                });
                return;
            }
            if (isNaN(provinciaId) || provinciaId <= 0) {
                res.status(400).json({
                    success: false,
                    message: 'El ID de la provincia debe ser un número positivo'
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
            const municipios = await this.gestionarMunicipiosUseCase.buscarPorNombre(nombre, provinciaId, estado);
            res.status(200).json({
                success: true,
                data: municipios,
                count: municipios.length,
                message: 'Municipios encontrados exitosamente'
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * GET /municipios/estado/:estado
     * Obtiene municipios por estado
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
            const municipios = await this.gestionarMunicipiosUseCase.buscarPorEstado(estado);
            res.status(200).json({
                success: true,
                data: municipios,
                count: municipios.length,
                message: 'Municipios por estado obtenidos exitosamente'
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * POST /municipios
     * Crea un nuevo municipio
     */
    async crear(req, res) {
        try {
            const dto = req.body;
            // Validar que los campos requeridos estén presentes
            if (!dto.provinciaId || !dto.nombre) {
                res.status(400).json({
                    success: false,
                    message: 'Los campos provinciaId y nombre son requeridos'
                });
                return;
            }
            const nuevoMunicipio = await this.gestionarMunicipiosUseCase.crear(dto);
            res.status(201).json({
                success: true,
                data: nuevoMunicipio,
                message: 'Municipio creado exitosamente'
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * PUT /municipios/:id
     * Actualiza un municipio existente
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
            const municipioActualizado = await this.gestionarMunicipiosUseCase.actualizar(dto);
            res.status(200).json({
                success: true,
                data: municipioActualizado,
                message: 'Municipio actualizado exitosamente'
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * DELETE /municipios/:id
     * Elimina (marca como eliminado) un municipio
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
            const municipioEliminado = await this.gestionarMunicipiosUseCase.eliminar(id);
            res.status(200).json({
                success: true,
                data: municipioEliminado,
                message: 'Municipio eliminado exitosamente'
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
        if (error instanceof MunicipioYaExisteError_1.MunicipioYaExisteError) {
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
exports.MunicipiosController = MunicipiosController;
