"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DistritosMunicipalesController = void 0;
const tsyringe_1 = require("tsyringe");
const GestionarDistritosMunicipalesUseCase_1 = require("../../../application/use-cases/GestionarDistritosMunicipalesUseCase");
const DistritoMunicipalYaExisteError_1 = require("../../../domain/errors/DistritosMunicipales/DistritoMunicipalYaExisteError");
const VerificarValor_1 = require("../../../domain/errors/Estados/VerificarValor");
class DistritosMunicipalesController {
    constructor() {
        this.gestionarDistritosUseCase = tsyringe_1.container.resolve(GestionarDistritosMunicipalesUseCase_1.GestionarDistritosMunicipalesUseCase);
    }
    /**
     * GET /distritos
     * Lista todos los distritos municipales activos
     */
    async listarTodas(req, res) {
        try {
            const distritos = await this.gestionarDistritosUseCase.listar();
            res.status(200).json({
                success: true,
                data: distritos,
                count: distritos.length,
                message: 'Distritos municipales obtenidos exitosamente'
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * GET /distritos/:id
     * Obtiene un distrito por ID
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
            const distrito = await this.gestionarDistritosUseCase.buscarPorId(id);
            if (!distrito) {
                res.status(404).json({
                    success: false,
                    message: `Distrito municipal con ID ${id} no encontrado`
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: distrito,
                message: 'Distrito municipal obtenido exitosamente'
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * GET /distritos/municipio/:municipioId
     * Obtiene todos los distritos de un municipio
     */
    async buscarPorMunicipio(req, res) {
        try {
            const municipioId = parseInt(Array.isArray(req.params.municipioId) ? req.params.municipioId[0] : req.params.municipioId);
            if (isNaN(municipioId) || municipioId <= 0) {
                res.status(400).json({
                    success: false,
                    message: 'El ID del municipio debe ser un número positivo'
                });
                return;
            }
            const distritos = await this.gestionarDistritosUseCase.listarPorMunicipio(municipioId);
            res.status(200).json({
                success: true,
                data: distritos,
                count: distritos.length,
                message: 'Distritos municipales del municipio obtenidos exitosamente'
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * GET /distritos/nombre/:nombre/:municipioId/:estado
     * Obtiene un distrito por nombre en un municipio
     */
    async buscarPorNombre(req, res) {
        try {
            const nombre = (Array.isArray(req.params.nombre) ? req.params.nombre[0] : req.params.nombre)?.trim();
            const municipioId = parseInt(Array.isArray(req.params.municipioId) ? req.params.municipioId[0] : req.params.municipioId);
            const estado = (Array.isArray(req.params.estado) ? req.params.estado[0] : req.params.estado).trim();
            if (!nombre || nombre.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'El nombre del distrito municipal es requerido'
                });
                return;
            }
            if (isNaN(municipioId) || municipioId <= 0) {
                res.status(400).json({
                    success: false,
                    message: 'El ID del municipio debe ser un número positivo'
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
            const distritos = await this.gestionarDistritosUseCase.buscarPorNombre(nombre, municipioId, estado);
            res.status(200).json({
                success: true,
                data: distritos,
                count: distritos.length,
                message: 'Distritos municipales encontrados exitosamente'
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * GET /distritos/estado/:estado
     * Obtiene distritos por estado
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
            const distritos = await this.gestionarDistritosUseCase.buscarPorEstado(estado);
            res.status(200).json({
                success: true,
                data: distritos,
                count: distritos.length,
                message: 'Distritos municipales por estado obtenidos exitosamente'
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * POST /distritos
     * Crea un nuevo distrito municipal
     */
    async crear(req, res) {
        try {
            const dto = req.body;
            // Validar que los campos requeridos estén presentes
            if (!dto.municipioId || !dto.nombre) {
                res.status(400).json({
                    success: false,
                    message: 'Los campos municipioId y nombre son requeridos'
                });
                return;
            }
            const nuevoDistrito = await this.gestionarDistritosUseCase.crear(dto);
            res.status(201).json({
                success: true,
                data: nuevoDistrito,
                message: 'Distrito municipal creado exitosamente'
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * PUT /distritos/:id
     * Actualiza un distrito municipal existente
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
            const distritoActualizado = await this.gestionarDistritosUseCase.actualizar(dto);
            res.status(200).json({
                success: true,
                data: distritoActualizado,
                message: 'Distrito municipal actualizado exitosamente'
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * DELETE /distritos/:id
     * Elimina (marca como eliminado) un distrito municipal
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
            const distritoEliminado = await this.gestionarDistritosUseCase.eliminar(id);
            res.status(200).json({
                success: true,
                data: distritoEliminado,
                message: 'Distrito municipal eliminado exitosamente'
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
        if (error instanceof DistritoMunicipalYaExisteError_1.DistritoMunicipalYaExisteError) {
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
exports.DistritosMunicipalesController = DistritosMunicipalesController;
