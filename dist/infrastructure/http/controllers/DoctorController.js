"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorController = void 0;
const tsyringe_1 = require("tsyringe");
const GestionarDoctoresUseCase_1 = require("../../../application/use-cases/GestionarDoctoresUseCase");
const DoctorNoEncontradoError_1 = require("../../../domain/errors/Doctores/DoctorNoEncontradoError");
const ExequaturYaExisteError_1 = require("../../../domain/errors/Doctores/ExequaturYaExisteError");
const DocumentoDoctorYaExisteError_1 = require("../../../domain/errors/Doctores/DocumentoDoctorYaExisteError");
// Helper function para aplanar errores de validación
function flattenValidationErrors(errors) {
    const messages = [];
    for (const error of errors) {
        if (error.constraints) {
            messages.push(...Object.values(error.constraints));
        }
        if (error.children && error.children.length > 0) {
            messages.push(...flattenValidationErrors(error.children));
        }
    }
    return messages;
}
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
            const usuarioId = req.user.userId;
            // Obtener perfil completo directamente del repository
            const doctor = await tsyringe_1.container.resolve(GestionarDoctoresUseCase_1.GestionarDoctoresUseCase)['doctorRepository'].obtenerPerfilCompleto(usuarioId);
            if (!doctor) {
                return res.status(404).json({
                    success: false,
                    message: 'Doctor no encontrado',
                });
            }
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
            // Transformar fechaNacimiento si viene en formato string
            if (req.body.fechaNacimiento && typeof req.body.fechaNacimiento === 'string') {
                req.body.fechaNacimiento = new Date(req.body.fechaNacimiento);
            }
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
    /**
     * PUT /api/doctores/documentos/:id
     * Actualizar un documento rechazado
     */
    async actualizarDocumento(req, res) {
        try {
            const ActualizarDocumentoDoctorUseCase = (await Promise.resolve().then(() => __importStar(require('../../../application/use-cases/ActualizarDocumentoDoctorUseCase')))).ActualizarDocumentoDoctorUseCase;
            const ActualizarDocumentoDoctorDto = (await Promise.resolve().then(() => __importStar(require('../../../application/dtos/ActualizarDocumentoDoctorDto')))).ActualizarDocumentoDoctorDto;
            const { plainToInstance } = await Promise.resolve().then(() => __importStar(require('class-transformer')));
            const { validate } = await Promise.resolve().then(() => __importStar(require('class-validator')));
            const documentoId = parseInt(req.params.id);
            const doctorId = req.user.userId;
            if (isNaN(documentoId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de documento inválido',
                });
            }
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Debe proporcionar un archivo',
                });
            }
            const dto = plainToInstance(ActualizarDocumentoDoctorDto, {
                documentoId,
                descripcion: req.body.descripcion,
            });
            const errors = await validate(dto);
            if (errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos inválidos',
                    errors: flattenValidationErrors(errors),
                });
            }
            const useCase = tsyringe_1.container.resolve(ActualizarDocumentoDoctorUseCase);
            await useCase.execute(doctorId, dto, req.file);
            return res.status(200).json({
                success: true,
                message: 'Documento actualizado exitosamente. Será revisado nuevamente.',
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Error al actualizar documento',
            });
        }
    }
    /**
     * POST /api/doctores/certificaciones
     * Agregar una nueva certificación
     */
    async agregarCertificacion(req, res) {
        try {
            const AgregarCertificacionUseCase = (await Promise.resolve().then(() => __importStar(require('../../../application/use-cases/AgregarCertificacionUseCase')))).AgregarCertificacionUseCase;
            const AgregarCertificacionDto = (await Promise.resolve().then(() => __importStar(require('../../../application/dtos/AgregarCertificacionDto')))).AgregarCertificacionDto;
            const { plainToInstance } = await Promise.resolve().then(() => __importStar(require('class-transformer')));
            const { validate } = await Promise.resolve().then(() => __importStar(require('class-validator')));
            const doctorId = req.user.userId;
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Debe proporcionar un archivo de certificación',
                });
            }
            const dto = plainToInstance(AgregarCertificacionDto, {
                descripcion: req.body.descripcion,
            });
            const errors = await validate(dto);
            if (errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos inválidos',
                    errors: flattenValidationErrors(errors),
                });
            }
            const useCase = tsyringe_1.container.resolve(AgregarCertificacionUseCase);
            await useCase.execute(doctorId, dto, req.file);
            return res.status(201).json({
                success: true,
                message: 'Certificación agregada exitosamente. Será revisada por un administrador.',
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Error al agregar certificación',
            });
        }
    }
    /**
     * GET /api/doctores/mis-documentos
     * Obtener el estado de todos los documentos del doctor
     */
    async obtenerEstadoDocumentos(req, res) {
        try {
            const { ObtenerEstadoDocumentosDoctorUseCase } = await Promise.resolve().then(() => __importStar(require('../../../application/use-cases/ObtenerEstadoDocumentosDoctorUseCase')));
            const doctorId = req.user.userId;
            const useCase = tsyringe_1.container.resolve(ObtenerEstadoDocumentosDoctorUseCase);
            const resultado = await useCase.execute(doctorId);
            return res.status(200).json({
                success: true,
                data: resultado,
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || 'Error al obtener estado de documentos',
            });
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
