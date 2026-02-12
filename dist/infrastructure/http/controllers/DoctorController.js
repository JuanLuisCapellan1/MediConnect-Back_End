"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorController = void 0;
const tsyringe_1 = require("tsyringe");
const GestionarDoctoresUseCase_1 = require("../../../application/use-cases/GestionarDoctoresUseCase");
const DoctorNoEncontradoError_1 = require("../../../domain/errors/Doctores/DoctorNoEncontradoError");
const ExequaturYaExisteError_1 = require("../../../domain/errors/Doctores/ExequaturYaExisteError");
const DocumentoDoctorYaExisteError_1 = require("../../../domain/errors/Doctores/DocumentoDoctorYaExisteError");
class DoctorController {
    async listar(req, res) {
        try {
            const useCase = tsyringe_1.container.resolve(GestionarDoctoresUseCase_1.GestionarDoctoresUseCase);
            const getString = (value) => {
                if (Array.isArray(value))
                    return value[0];
                return value;
            };
            const filtros = {
                nombre: getString(req.query.nombre),
                apellido: getString(req.query.apellido),
                estado: getString(req.query.estado),
                estadoVerificacion: getString(req.query.estadoVerificacion),
                genero: getString(req.query.genero),
                nacionalidad: getString(req.query.nacionalidad),
                especialidadId: req.query.especialidadId ? parseInt(req.query.especialidadId) : undefined,
                pagina: req.query.pagina ? parseInt(req.query.pagina) : undefined,
                limite: req.query.limite ? parseInt(req.query.limite) : undefined,
            };
            const resultado = await useCase.listar(filtros);
            return res.status(200).json({
                success: true,
                data: resultado.datos,
                paginacion: {
                    total: resultado.total,
                    pagina: filtros.pagina || 1,
                    limite: filtros.limite || 10,
                    totalPaginas: Math.ceil(resultado.total / (filtros.limite || 10)),
                },
            });
        }
        catch (error) {
            return this.manejarError(error, res);
        }
    }
    async obtenerPorId(req, res) {
        try {
            const useCase = tsyringe_1.container.resolve(GestionarDoctoresUseCase_1.GestionarDoctoresUseCase);
            const id = parseInt(req.params.id);
            const doctor = await useCase.obtenerPorId(id);
            return res.status(200).json({
                success: true,
                data: doctor,
            });
        }
        catch (error) {
            return this.manejarError(error, res);
        }
    }
    async obtenerPerfil(req, res) {
        try {
            const useCase = tsyringe_1.container.resolve(GestionarDoctoresUseCase_1.GestionarDoctoresUseCase);
            const usuarioId = req.user.userId; // Del middleware de autenticación
            const doctor = await useCase.obtenerPorUsuarioId(usuarioId);
            return res.status(200).json({
                success: true,
                data: doctor,
            });
        }
        catch (error) {
            return this.manejarError(error, res);
        }
    }
    async actualizar(req, res) {
        try {
            const useCase = tsyringe_1.container.resolve(GestionarDoctoresUseCase_1.GestionarDoctoresUseCase);
            const usuarioId = parseInt(req.params.id);
            const doctor = await useCase.actualizar(usuarioId, req.body);
            return res.status(200).json({
                success: true,
                message: 'Doctor actualizado exitosamente.',
                data: doctor,
            });
        }
        catch (error) {
            return this.manejarError(error, res);
        }
    }
    async actualizarPerfil(req, res) {
        try {
            const useCase = tsyringe_1.container.resolve(GestionarDoctoresUseCase_1.GestionarDoctoresUseCase);
            const usuarioId = req.user.userId; // Del middleware de autenticación
            const doctor = await useCase.actualizar(usuarioId, req.body);
            return res.status(200).json({
                success: true,
                message: 'Perfil actualizado exitosamente.',
                data: doctor,
            });
        }
        catch (error) {
            return this.manejarError(error, res);
        }
    }
    async eliminar(req, res) {
        try {
            const useCase = tsyringe_1.container.resolve(GestionarDoctoresUseCase_1.GestionarDoctoresUseCase);
            const usuarioId = parseInt(req.params.id);
            await useCase.eliminar(usuarioId);
            return res.status(200).json({
                success: true,
                message: 'Doctor eliminado exitosamente.',
            });
        }
        catch (error) {
            return this.manejarError(error, res);
        }
    }
    manejarError(error, res) {
        console.error(error);
        if (error instanceof DoctorNoEncontradoError_1.DoctorNoEncontradoError) {
            return res.status(404).json({
                success: false,
                message: error.message,
            });
        }
        if (error instanceof ExequaturYaExisteError_1.ExequaturYaExisteError || error instanceof DocumentoDoctorYaExisteError_1.DocumentoDoctorYaExisteError) {
            return res.status(409).json({
                success: false,
                message: error.message,
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor.',
        });
    }
}
exports.DoctorController = DoctorController;
