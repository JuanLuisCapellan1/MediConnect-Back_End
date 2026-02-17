"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TipoSeguroController = void 0;
const tsyringe_1 = require("tsyringe");
const class_validator_1 = require("class-validator");
// Use Cases
const CrearTipoSeguroUseCase_1 = require("../../../application/use-cases/tipos-seguros/CrearTipoSeguroUseCase");
const ObtenerTodosTiposSegurosUseCase_1 = require("../../../application/use-cases/tipos-seguros/ObtenerTodosTiposSegurosUseCase");
const ObtenerTipoSeguroPorIdUseCase_1 = require("../../../application/use-cases/tipos-seguros/ObtenerTipoSeguroPorIdUseCase");
const ActualizarTipoSeguroUseCase_1 = require("../../../application/use-cases/tipos-seguros/ActualizarTipoSeguroUseCase");
const EliminarTipoSeguroUseCase_1 = require("../../../application/use-cases/tipos-seguros/EliminarTipoSeguroUseCase");
const ObtenerTiposActivosUseCase_1 = require("../../../application/use-cases/tipos-seguros/ObtenerTiposActivosUseCase");
// DTOs
const TipoSeguroDtos_1 = require("../../../application/dtos/TipoSeguroDtos");
class TipoSeguroController {
    // ============================================
    // Admin - CRUD completo
    // ============================================
    async crear(req, res) {
        try {
            const dto = Object.assign(new TipoSeguroDtos_1.CrearTipoSeguroDto(req.body.nombre, req.body.descripcion), req.body);
            const errors = await (0, class_validator_1.validate)(dto);
            if (errors.length > 0) {
                res.status(400).json({
                    success: false,
                    message: 'Validación fallida',
                    errors: errors.map((e) => Object.values(e.constraints || {})).flat(),
                });
                return;
            }
            const useCase = tsyringe_1.container.resolve(CrearTipoSeguroUseCase_1.CrearTipoSeguroUseCase);
            const tipoSeguro = await useCase.execute(dto);
            res.status(201).json({
                success: true,
                message: 'Tipo de seguro creado exitosamente',
                data: tipoSeguro,
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    async obtenerTodos(req, res) {
        try {
            const filtros = new TipoSeguroDtos_1.FiltroTiposSegurosDto(req.query.estado, req.query.busqueda, req.query.pagina ? parseInt(req.query.pagina) : undefined, req.query.limite ? parseInt(req.query.limite) : undefined);
            const useCase = tsyringe_1.container.resolve(ObtenerTodosTiposSegurosUseCase_1.ObtenerTodosTiposSegurosUseCase);
            const resultado = await useCase.execute(filtros);
            res.status(200).json({
                success: true,
                message: 'Tipos de seguros obtenidos exitosamente',
                data: resultado.datos,
                total: resultado.total,
                pagina: filtros.pagina,
                limite: filtros.limite,
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    async obtenerPorId(req, res) {
        try {
            const id = parseInt(req.params.id);
            const useCase = tsyringe_1.container.resolve(ObtenerTipoSeguroPorIdUseCase_1.ObtenerTipoSeguroPorIdUseCase);
            const tipoSeguro = await useCase.execute(id);
            res.status(200).json({
                success: true,
                message: 'Tipo de seguro obtenido exitosamente',
                data: tipoSeguro,
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    async actualizar(req, res) {
        try {
            const id = parseInt(req.params.id);
            const dto = Object.assign(new TipoSeguroDtos_1.ActualizarTipoSeguroDto(), req.body);
            const errors = await (0, class_validator_1.validate)(dto);
            if (errors.length > 0) {
                res.status(400).json({
                    success: false,
                    message: 'Validación fallida',
                    errors: errors.map((e) => Object.values(e.constraints || {})).flat(),
                });
                return;
            }
            const useCase = tsyringe_1.container.resolve(ActualizarTipoSeguroUseCase_1.ActualizarTipoSeguroUseCase);
            const tipoSeguro = await useCase.execute(id, dto);
            res.status(200).json({
                success: true,
                message: 'Tipo de seguro actualizado exitosamente',
                data: tipoSeguro,
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    async eliminar(req, res) {
        try {
            const id = parseInt(req.params.id);
            const useCase = tsyringe_1.container.resolve(EliminarTipoSeguroUseCase_1.EliminarTipoSeguroUseCase);
            await useCase.execute(id);
            res.status(200).json({
                success: true,
                message: 'Tipo de seguro eliminado exitosamente',
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    // ============================================
    // Cliente - Solo lectura
    // ============================================
    async obtenerActivos(req, res) {
        try {
            const useCase = tsyringe_1.container.resolve(ObtenerTiposActivosUseCase_1.ObtenerTiposActivosUseCase);
            const tiposSeguros = await useCase.execute();
            res.status(200).json({
                success: true,
                message: 'Tipos de seguros activos obtenidos exitosamente',
                data: tiposSeguros,
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    // ============================================
    // Manejo de Errores
    // ============================================
    manejarError(error, res) {
        console.error('Error en TipoSeguroController:', error);
        if (error.message.includes('no fue encontrado') || error.message.includes('no existe')) {
            res.status(404).json({
                success: false,
                message: error.message,
            });
            return;
        }
        if (error.message.includes('ya existe') || error.message.includes('en uso')) {
            res.status(409).json({
                success: false,
                message: error.message,
            });
            return;
        }
        res.status(400).json({
            success: false,
            message: error.message || 'Error al procesar la solicitud',
        });
    }
}
exports.TipoSeguroController = TipoSeguroController;
