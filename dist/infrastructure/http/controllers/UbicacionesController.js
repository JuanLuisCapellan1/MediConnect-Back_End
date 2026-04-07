"use strict";
/**
 * UbicacionesController.ts
 * Controlador HTTP para Ubicaciones
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UbicacionesController = void 0;
const tsyringe_1 = require("tsyringe");
const GestionarUbicacionesUseCase_1 = require("../../../application/use-cases/GestionarUbicacionesUseCase");
const UbicacionFueraDeRangoError_1 = require("../../../domain/errors/UbicacionFueraDeRangoError");
class UbicacionesController {
    constructor() {
        this.gestionarUbicacionesUseCase = tsyringe_1.container.resolve(GestionarUbicacionesUseCase_1.GestionarUbicacionesUseCase);
    }
    /**
     * POST /ubicaciones - Crear una nueva Ubicacion
     */
    async crear(req, res) {
        try {
            const { barrioId, direccion, subBarrioId, codigoPostal, puntoGeografico, nombre } = req.body;
            // Validación de entrada
            if (barrioId === undefined || barrioId === null) {
                res.status(400).json({
                    success: false,
                    error: 'El campo barrioId es requerido'
                });
                return;
            }
            if (isNaN(barrioId)) {
                res.status(400).json({
                    success: false,
                    error: 'El campo barrioId debe ser un número'
                });
                return;
            }
            if (!direccion || typeof direccion !== 'string') {
                res.status(400).json({
                    success: false,
                    error: 'El campo direccion es requerido y debe ser string'
                });
                return;
            }
            if (nombre !== undefined && typeof nombre !== 'string') {
                res.status(400).json({ success: false, error: 'El campo nombre debe ser string' });
                return;
            }
            if (codigoPostal !== undefined && typeof codigoPostal !== 'string') {
                res.status(400).json({
                    success: false,
                    error: 'El campo codigoPostal debe ser string'
                });
                return;
            }
            if (puntoGeografico === undefined || puntoGeografico === null) {
                res.status(400).json({
                    success: false,
                    error: 'El campo puntoGeografico es requerido'
                });
                return;
            }
            if (typeof puntoGeografico !== 'object' || Array.isArray(puntoGeografico)) {
                res.status(400).json({
                    success: false,
                    error: 'El campo puntoGeografico debe ser un objeto GeoJSON Point: {"type":"Point","coordinates":[lon,lat]}'
                });
                return;
            }
            const dto = {
                barrioId,
                direccion,
                nombre: nombre || undefined,
                codigoPostal: codigoPostal || undefined,
                puntoGeografico: JSON.stringify(puntoGeografico),
            };
            const ubicacion = await this.gestionarUbicacionesUseCase.crear(dto);
            res.status(201).json({
                success: true,
                data: ubicacion,
                message: 'Ubicación creada exitosamente'
            });
        }
        catch (error) {
            // Capturar errores de validación geográfica del trigger
            if (error instanceof UbicacionFueraDeRangoError_1.UbicacionFueraDeRangoError) {
                res.status(400).json({
                    success: false,
                    error: error.message,
                });
                return;
            }
            res
                .status(400)
                .json({
                success: false,
                error: error instanceof Error ? error.message : 'Error al crear la ubicación',
            });
        }
    }
    /**
     * GET /ubicaciones - Listar todas las Ubicaciones
     */
    async listarTodas(req, res) {
        try {
            const ubicaciones = await this.gestionarUbicacionesUseCase.listarTodas();
            res.status(200).json({
                success: true,
                count: ubicaciones.length,
                data: ubicaciones
            });
        }
        catch (error) {
            res
                .status(500)
                .json({
                success: false,
                error: error instanceof Error ? error.message : 'Error al listar ubicaciones',
            });
        }
    }
    /**
     * GET /ubicaciones/barrio/:barrioId - Listar Ubicaciones por barrio
     */
    async listarPorBarrio(req, res) {
        try {
            const barrioId = parseInt(String(req.params.barrioId), 10);
            if (isNaN(barrioId)) {
                res.status(400).json({
                    success: false,
                    error: 'El parámetro barrioId debe ser un número válido'
                });
                return;
            }
            const ubicaciones = await this.gestionarUbicacionesUseCase.listarPorBarrio(barrioId);
            res.status(200).json({
                success: true,
                count: ubicaciones.length,
                data: ubicaciones
            });
        }
        catch (error) {
            res
                .status(500)
                .json({
                success: false,
                error: error instanceof Error ? error.message : 'Error al listar ubicaciones por barrio',
            });
        }
    }
    /**
     * GET /ubicaciones/:id - Buscar Ubicacion por ID
     */
    async buscarPorId(req, res) {
        try {
            const id = parseInt(String(req.params.id), 10);
            if (isNaN(id)) {
                res.status(400).json({
                    success: false,
                    error: 'El parámetro id debe ser un número válido'
                });
                return;
            }
            const ubicacion = await this.gestionarUbicacionesUseCase.buscarPorId(id);
            if (!ubicacion) {
                res.status(404).json({
                    success: false,
                    error: 'Ubicación no encontrada'
                });
                return;
            }
            res.status(200).json(ubicacion);
        }
        catch (error) {
            res
                .status(500)
                .json({
                success: false,
                error: error instanceof Error ? error.message : 'Error al buscar ubicación',
            });
        }
    }
    /**
     * GET /ubicaciones/buscar/direccion/:direccion - Buscar Ubicaciones por dirección
     */
    async buscarPorDireccion(req, res) {
        try {
            const direccion = req.params.direccion;
            if (!direccion || typeof direccion !== 'string') {
                res.status(400).json({
                    success: false,
                    error: 'El parámetro direccion es requerido'
                });
                return;
            }
            const ubicaciones = await this.gestionarUbicacionesUseCase.buscarPorDireccion(direccion);
            res.status(200).json({
                success: true,
                count: ubicaciones.length,
                data: ubicaciones
            });
        }
        catch (error) {
            res
                .status(500)
                .json({
                success: false,
                error: error instanceof Error ? error.message : 'Error al buscar por dirección',
            });
        }
    }
    /**
     * GET /ubicaciones/buscar/codigopostal/:codigoPostal - Buscar Ubicaciones por código postal
     */
    async buscarPorCodigoPostal(req, res) {
        try {
            const codigoPostal = req.params.codigoPostal;
            if (!codigoPostal || typeof codigoPostal !== 'string') {
                res.status(400).json({
                    success: false,
                    error: 'El parámetro codigoPostal es requerido'
                });
                return;
            }
            const ubicaciones = await this.gestionarUbicacionesUseCase.buscarPorCodigoPostal(codigoPostal);
            res.status(200).json({
                success: true,
                count: ubicaciones.length,
                data: ubicaciones
            });
        }
        catch (error) {
            res
                .status(500)
                .json({
                success: false,
                error: error instanceof Error ? error.message : 'Error al buscar por código postal',
            });
        }
    }
    /**
     * GET /ubicaciones/buscar/estado/:estado - Buscar Ubicaciones por estado
     */
    async buscarPorEstado(req, res) {
        try {
            const estado = req.params.estado;
            if (!estado || typeof estado !== 'string') {
                res.status(400).json({
                    success: false,
                    error: 'El parámetro estado es requerido'
                });
                return;
            }
            const ubicaciones = await this.gestionarUbicacionesUseCase.buscarPorEstado(estado);
            res.status(200).json({
                success: true,
                count: ubicaciones.length,
                data: ubicaciones
            });
        }
        catch (error) {
            res
                .status(500)
                .json({
                success: false,
                error: error instanceof Error ? error.message : 'Error al buscar por estado',
            });
        }
    }
    /**
     * PUT /ubicaciones/:id - Actualizar una Ubicacion
     */
    async actualizar(req, res) {
        try {
            const id = parseInt(String(req.params.id), 10);
            if (isNaN(id)) {
                res.status(400).json({
                    success: false,
                    error: 'El parámetro id debe ser un número válido'
                });
                return;
            }
            const { barrioId, subBarrioId, direccion, codigoPostal, estado, puntoGeografico, nombre } = req.body;
            // Validación de entrada
            if (barrioId !== undefined &&
                (barrioId === null || isNaN(barrioId))) {
                res.status(400).json({
                    success: false,
                    error: 'El campo barrioId debe ser un número válido'
                });
                return;
            }
            if (direccion !== undefined && typeof direccion !== 'string') {
                res.status(400).json({
                    success: false,
                    error: 'El campo direccion debe ser string'
                });
                return;
            }
            if (nombre !== undefined && typeof nombre !== 'string') {
                res.status(400).json({ success: false, error: 'El campo nombre debe ser string' });
                return;
            }
            if (codigoPostal !== undefined && typeof codigoPostal !== 'string') {
                res.status(400).json({
                    success: false,
                    error: 'El campo codigoPostal debe ser string'
                });
                return;
            }
            if (estado !== undefined && typeof estado !== 'string') {
                res.status(400).json({
                    success: false,
                    error: 'El campo estado debe ser string'
                });
                return;
            }
            if (puntoGeografico !== undefined) {
                if (typeof puntoGeografico !== 'object' || Array.isArray(puntoGeografico) || puntoGeografico === null) {
                    res.status(400).json({
                        success: false,
                        error: 'El campo puntoGeografico debe ser un objeto GeoJSON Point: {"type":"Point","coordinates":[lon,lat]}'
                    });
                    return;
                }
            }
            const dto = {
                id,
                barrioId: barrioId || undefined,
                direccion: direccion || undefined,
                nombre: nombre !== undefined ? nombre : undefined,
                codigoPostal: codigoPostal || undefined,
                estado: estado || undefined,
                puntoGeografico: puntoGeografico ? JSON.stringify(puntoGeografico) : undefined,
            };
            const ubicacion = await this.gestionarUbicacionesUseCase.actualizar(dto);
            res.status(200).json({
                success: true,
                data: ubicacion,
                message: 'Ubicación actualizada exitosamente'
            });
        }
        catch (error) {
            // Capturar errores de validación geográfica del trigger
            if (error instanceof UbicacionFueraDeRangoError_1.UbicacionFueraDeRangoError) {
                res.status(400).json({
                    success: false,
                    error: error.message,
                });
                return;
            }
            res
                .status(400)
                .json({
                success: false,
                error: error instanceof Error ? error.message : 'Error al actualizar la ubicación',
            });
        }
    }
    /**
     * DELETE /ubicaciones/:id - Eliminar una Ubicacion
     */
    async eliminar(req, res) {
        try {
            const id = parseInt(String(req.params.id), 10);
            if (isNaN(id)) {
                res.status(400).json({
                    success: false,
                    error: 'El parámetro id debe ser un número válido'
                });
                return;
            }
            const ubicacion = await this.gestionarUbicacionesUseCase.eliminar(id);
            res.status(200).json({
                success: true,
                message: 'Ubicación eliminada correctamente',
                data: ubicacion,
            });
        }
        catch (error) {
            res
                .status(400)
                .json({
                success: false,
                error: error instanceof Error ? error.message : 'Error al eliminar la ubicación',
            });
        }
    }
    /**
     * GET /ubicaciones/mis-ubicaciones - Listar ubicaciones del doctor autenticado
     */
    async listarMisUbicaciones(req, res) {
        try {
            const doctorId = req.usuarioId;
            if (!doctorId) {
                res.status(401).json({
                    success: false,
                    error: 'No se pudo identificar al doctor autenticado',
                });
                return;
            }
            const ubicaciones = await this.gestionarUbicacionesUseCase.listarPorDoctor(doctorId);
            res.status(200).json({
                success: true,
                count: ubicaciones.length,
                data: ubicaciones,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Error al listar ubicaciones del doctor',
            });
        }
    }
    /**
     * POST /ubicaciones/mis-ubicaciones - Crear ubicación para el doctor autenticado
     */
    async crearMiUbicacion(req, res) {
        try {
            const doctorId = req.usuarioId;
            if (!doctorId) {
                res.status(401).json({
                    success: false,
                    error: 'No se pudo identificar al doctor autenticado',
                });
                return;
            }
            const { barrioId, codigoPostal, puntoGeografico, direccion, nombre } = req.body;
            if (barrioId === undefined || barrioId === null) {
                res.status(400).json({ success: false, error: 'El campo barrioId es requerido' });
                return;
            }
            if (isNaN(Number(barrioId))) {
                res.status(400).json({ success: false, error: 'El campo barrioId debe ser un número' });
                return;
            }
            if (!direccion || typeof direccion !== 'string') {
                res.status(400).json({ success: false, error: 'El campo direccion es requerido y debe ser string' });
                return;
            }
            if (nombre !== undefined && typeof nombre !== 'string') {
                res.status(400).json({ success: false, error: 'El campo nombre debe ser string' });
                return;
            }
            if (codigoPostal !== undefined && typeof codigoPostal !== 'string') {
                res.status(400).json({ success: false, error: 'El campo codigoPostal debe ser string' });
                return;
            }
            if (puntoGeografico === undefined || puntoGeografico === null) {
                res.status(400).json({ success: false, error: 'El campo puntoGeografico es requerido' });
                return;
            }
            if (typeof puntoGeografico !== 'object' || Array.isArray(puntoGeografico)) {
                res.status(400).json({ success: false, error: 'El campo puntoGeografico debe ser un objeto GeoJSON Point: {"type":"Point","coordinates":[lon,lat]}' });
                return;
            }
            const dto = {
                barrioId: Number(barrioId),
                direccion,
                nombre: nombre || undefined,
                codigoPostal: codigoPostal || undefined,
                puntoGeografico: JSON.stringify(puntoGeografico),
            };
            const ubicacion = await this.gestionarUbicacionesUseCase.crearParaDoctor(doctorId, dto);
            res.status(201).json({
                success: true,
                data: ubicacion,
                message: 'Ubicación creada y asignada al doctor exitosamente',
            });
        }
        catch (error) {
            if (error instanceof UbicacionFueraDeRangoError_1.UbicacionFueraDeRangoError) {
                res.status(400).json({ success: false, error: error.message });
                return;
            }
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Error al crear la ubicación',
            });
        }
    }
}
exports.UbicacionesController = UbicacionesController;
