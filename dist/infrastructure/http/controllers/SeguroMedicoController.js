"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeguroMedicoController = void 0;
const tsyringe_1 = require("tsyringe");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
// Use Cases
const CrearSeguroMedicoUseCase_1 = require("../../../application/use-cases/seguros/CrearSeguroMedicoUseCase");
const ObtenerTodosSegurosUseCase_1 = require("../../../application/use-cases/seguros/ObtenerTodosSegurosUseCase");
const ActualizarSeguroMedicoUseCase_1 = require("../../../application/use-cases/seguros/ActualizarSeguroMedicoUseCase");
const EliminarSeguroMedicoUseCase_1 = require("../../../application/use-cases/seguros/EliminarSeguroMedicoUseCase");
const AgregarSeguroPacienteUseCase_1 = require("../../../application/use-cases/seguros/AgregarSeguroPacienteUseCase");
const ObtenerMisSegurosUseCase_1 = require("../../../application/use-cases/seguros/ObtenerMisSegurosUseCase");
const EliminarMiSeguroUseCase_1 = require("../../../application/use-cases/seguros/EliminarMiSeguroUseCase");
const AgregarSeguroDoctorUseCase_1 = require("../../../application/use-cases/seguros/AgregarSeguroDoctorUseCase");
const ObtenerSegurosAceptadosUseCase_1 = require("../../../application/use-cases/seguros/ObtenerSegurosAceptadosUseCase");
const EliminarSeguroAceptadoUseCase_1 = require("../../../application/use-cases/seguros/EliminarSeguroAceptadoUseCase");
// DTOs
const SeguroMedicoDtos_1 = require("../../../application/dtos/SeguroMedicoDtos");
class SeguroMedicoController {
    // ============================================
    // Admin - CRUD completo
    // ============================================
    async crear(req, res) {
        try {
            const dto = (0, class_transformer_1.plainToInstance)(SeguroMedicoDtos_1.CrearSeguroMedicoDto, req.body);
            const errors = await (0, class_validator_1.validate)(dto);
            if (errors.length > 0) {
                res.status(400).json({
                    success: false,
                    message: 'Validación fallida',
                    errors: errors.map((e) => Object.values(e.constraints || {})).flat(),
                });
                return;
            }
            const useCase = tsyringe_1.container.resolve(CrearSeguroMedicoUseCase_1.CrearSeguroMedicoUseCase);
            const seguro = await useCase.execute(dto);
            res.status(201).json({
                success: true,
                message: 'Seguro creado exitosamente',
                data: seguro,
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    async obtenerTodos(req, res) {
        try {
            const filtros = (0, class_transformer_1.plainToInstance)(SeguroMedicoDtos_1.FiltroSegurosDto, req.query);
            const useCase = tsyringe_1.container.resolve(ObtenerTodosSegurosUseCase_1.ObtenerTodosSegurosUseCase);
            const resultado = await useCase.execute(filtros);
            res.status(200).json({
                success: true,
                message: 'Seguros obtenidos exitosamente',
                data: resultado.datos,
                total: resultado.total,
                pagina: filtros.pagina || 1,
                limite: filtros.limite || 20,
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    async actualizar(req, res) {
        try {
            const id = parseInt(String(req.params.id));
            const dto = (0, class_transformer_1.plainToInstance)(SeguroMedicoDtos_1.ActualizarSeguroMedicoDto, req.body);
            const errors = await (0, class_validator_1.validate)(dto);
            if (errors.length > 0) {
                res.status(400).json({
                    success: false,
                    message: 'Validación fallida',
                    errors: errors.map((e) => Object.values(e.constraints || {})).flat(),
                });
                return;
            }
            const useCase = tsyringe_1.container.resolve(ActualizarSeguroMedicoUseCase_1.ActualizarSeguroMedicoUseCase);
            const seguro = await useCase.execute(id, dto);
            res.status(200).json({
                success: true,
                message: 'Seguro actualizado exitosamente',
                data: seguro,
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    async eliminar(req, res) {
        try {
            const id = parseInt(String(req.params.id));
            const useCase = tsyringe_1.container.resolve(EliminarSeguroMedicoUseCase_1.EliminarSeguroMedicoUseCase);
            await useCase.execute(id);
            res.status(200).json({
                success: true,
                message: 'Seguro eliminado exitosamente',
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    // ============================================
    // Paciente - Gestión de seguros (máximo 3)
    // ============================================
    async agregarMiSeguro(req, res) {
        try {
            const pacienteId = req.user?.userId;
            const dto = (0, class_transformer_1.plainToInstance)(SeguroMedicoDtos_1.AgregarSeguroPacienteDto, req.body);
            const errors = await (0, class_validator_1.validate)(dto);
            if (errors.length > 0) {
                res.status(400).json({
                    success: false,
                    message: 'Validación fallida',
                    errors: errors.map((e) => Object.values(e.constraints || {})).flat(),
                });
                return;
            }
            const useCase = tsyringe_1.container.resolve(AgregarSeguroPacienteUseCase_1.AgregarSeguroPacienteUseCase);
            const resultado = await useCase.execute(pacienteId, dto);
            res.status(201).json({
                success: true,
                message: 'Seguro agregado exitosamente a tu perfil',
                data: resultado,
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    async obtenerMisSeguros(req, res) {
        try {
            const pacienteId = req.user?.userId;
            const incluirHistorial = req.query.incluirHistorial === 'true';
            const useCase = tsyringe_1.container.resolve(ObtenerMisSegurosUseCase_1.ObtenerMisSegurosUseCase);
            const seguros = await useCase.execute(pacienteId, incluirHistorial);
            res.status(200).json({
                success: true,
                message: 'Seguros obtenidos exitosamente',
                data: seguros,
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    async eliminarMiSeguro(req, res) {
        try {
            const pacienteId = req.user?.userId;
            const seguroId = parseInt(String(req.params.id));
            const useCase = tsyringe_1.container.resolve(EliminarMiSeguroUseCase_1.EliminarMiSeguroUseCase);
            await useCase.execute(pacienteId, seguroId);
            res.status(200).json({
                success: true,
                message: 'Seguro eliminado exitosamente de tu perfil',
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    // ============================================
    // Doctor - Gestión de seguros aceptados
    // ============================================
    async agregarSeguroAceptado(req, res) {
        try {
            const doctorId = req.user?.userId;
            const dto = (0, class_transformer_1.plainToInstance)(SeguroMedicoDtos_1.AgregarSeguroDoctorDto, req.body);
            const errors = await (0, class_validator_1.validate)(dto);
            if (errors.length > 0) {
                res.status(400).json({
                    success: false,
                    message: 'Validación fallida',
                    errors: errors.map((e) => Object.values(e.constraints || {})).flat(),
                });
                return;
            }
            const useCase = tsyringe_1.container.resolve(AgregarSeguroDoctorUseCase_1.AgregarSeguroDoctorUseCase);
            const resultado = await useCase.execute(doctorId, dto);
            res.status(201).json({
                success: true,
                message: 'Seguro agregado exitosamente a tus seguros aceptados',
                data: resultado,
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    async obtenerSegurosAceptados(req, res) {
        try {
            const doctorId = req.user?.userId;
            const useCase = tsyringe_1.container.resolve(ObtenerSegurosAceptadosUseCase_1.ObtenerSegurosAceptadosUseCase);
            const seguros = await useCase.execute(doctorId);
            res.status(200).json({
                success: true,
                message: 'Seguros aceptados obtenidos exitosamente',
                data: seguros,
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    async eliminarSeguroAceptado(req, res) {
        try {
            const doctorId = req.user?.userId;
            const seguroId = parseInt(String(req.params.seguroId));
            const tipoSeguroId = parseInt(String(req.params.tipoSeguroId));
            const useCase = tsyringe_1.container.resolve(EliminarSeguroAceptadoUseCase_1.EliminarSeguroAceptadoUseCase);
            await useCase.execute(doctorId, seguroId, tipoSeguroId);
            res.status(200).json({
                success: true,
                message: 'Seguro eliminado exitosamente de tus seguros aceptados',
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    // ============================================
    // Público (autenticado) - Ver seguros disponibles
    // ============================================
    async obtenerSegurosDisponibles(req, res) {
        try {
            const filtros = (0, class_transformer_1.plainToInstance)(SeguroMedicoDtos_1.FiltroSegurosDto, {
                ...req.query,
                estado: 'Activo', // Solo mostrar seguros activos
            });
            const useCase = tsyringe_1.container.resolve(ObtenerTodosSegurosUseCase_1.ObtenerTodosSegurosUseCase);
            const resultado = await useCase.execute(filtros);
            res.status(200).json({
                success: true,
                message: 'Seguros disponibles obtenidos exitosamente',
                data: resultado.datos,
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    // ============================================
    // Manejo de errores
    // ============================================
    manejarError(error, res) {
        console.error('Error en SeguroMedicoController:', error);
        if (error.message) {
            res.status(400).json({
                success: false,
                message: error.message,
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
}
exports.SeguroMedicoController = SeguroMedicoController;
