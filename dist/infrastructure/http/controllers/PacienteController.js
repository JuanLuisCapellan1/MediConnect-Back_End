"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacienteController = void 0;
const tsyringe_1 = require("tsyringe");
const GestionarPacientesUseCase_1 = require("../../../application/use-cases/GestionarPacientesUseCase");
const PacienteNoEncontradoError_1 = require("../../../domain/errors/Pacientes/PacienteNoEncontradoError");
const DocumentoPacienteYaExisteError_1 = require("../../../domain/errors/Pacientes/DocumentoPacienteYaExisteError");
class PacienteController {
    async listar(req, res) {
        try {
            const useCase = tsyringe_1.container.resolve(GestionarPacientesUseCase_1.GestionarPacientesUseCase);
            const getNombre = (value) => {
                if (Array.isArray(value))
                    return value[0];
                return value;
            };
            const filtros = {
                nombre: getNombre(req.query.nombre),
                apellido: getNombre(req.query.apellido),
                estado: getNombre(req.query.estado),
                genero: getNombre(req.query.genero),
                tipoSangre: getNombre(req.query.tipoSangre),
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
            const useCase = tsyringe_1.container.resolve(GestionarPacientesUseCase_1.GestionarPacientesUseCase);
            const id = parseInt(req.params.id);
            const paciente = await useCase.obtenerPorId(id);
            return res.status(200).json({
                success: true,
                data: paciente,
            });
        }
        catch (error) {
            return this.manejarError(error, res);
        }
    }
    async obtenerPerfil(req, res) {
        try {
            const useCase = tsyringe_1.container.resolve(GestionarPacientesUseCase_1.GestionarPacientesUseCase);
            const usuarioId = req.user.userId; // Del middleware de autenticación
            const paciente = await useCase.obtenerPorUsuarioId(usuarioId);
            return res.status(200).json({
                success: true,
                data: paciente,
            });
        }
        catch (error) {
            return this.manejarError(error, res);
        }
    }
    async actualizar(req, res) {
        try {
            const useCase = tsyringe_1.container.resolve(GestionarPacientesUseCase_1.GestionarPacientesUseCase);
            const usuarioId = parseInt(req.params.id);
            const paciente = await useCase.actualizar(usuarioId, req.body);
            return res.status(200).json({
                success: true,
                message: 'Paciente actualizado exitosamente.',
                data: paciente,
            });
        }
        catch (error) {
            return this.manejarError(error, res);
        }
    }
    async actualizarPerfil(req, res) {
        try {
            const useCase = tsyringe_1.container.resolve(GestionarPacientesUseCase_1.GestionarPacientesUseCase);
            const usuarioId = req.user.userId; // Del middleware de autenticación
            const paciente = await useCase.actualizar(usuarioId, req.body);
            return res.status(200).json({
                success: true,
                message: 'Perfil actualizado exitosamente.',
                data: paciente,
            });
        }
        catch (error) {
            return this.manejarError(error, res);
        }
    }
    async eliminar(req, res) {
        try {
            const useCase = tsyringe_1.container.resolve(GestionarPacientesUseCase_1.GestionarPacientesUseCase);
            const usuarioId = parseInt(req.params.id);
            await useCase.eliminar(usuarioId);
            return res.status(200).json({
                success: true,
                message: 'Paciente eliminado exitosamente.',
            });
        }
        catch (error) {
            return this.manejarError(error, res);
        }
    }
    manejarError(error, res) {
        console.error(error);
        if (error instanceof PacienteNoEncontradoError_1.PacienteNoEncontradoError) {
            return res.status(404).json({
                success: false,
                message: error.message,
            });
        }
        if (error instanceof DocumentoPacienteYaExisteError_1.DocumentoPacienteYaExisteError) {
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
exports.PacienteController = PacienteController;
