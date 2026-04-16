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
const GestionarPacientesUseCase_1 = require("../../../application/use-cases/GestionarPacientesUseCase");
const GestionarCitasUseCase_1 = require("../../../application/use-cases/GestionarCitasUseCase");
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
            const esPaciente = req.user?.rol === 'Paciente';
            const getString = (value) => {
                if (Array.isArray(value))
                    return value[0];
                return value;
            };
            const filtros = {
                nombre: getString(req.query.nombre),
                apellido: getString(req.query.apellido),
                genero: getString(req.query.genero),
                nacionalidad: getString(req.query.nacionalidad),
                especialidadId: req.query.especialidadId ? parseInt(req.query.especialidadId) : undefined,
                pagina: req.query.pagina ? parseInt(req.query.pagina) : undefined,
                limite: req.query.limite ? parseInt(req.query.limite) : undefined,
            };
            if (esPaciente) {
                // Los pacientes solo ven doctores activos y verificados
                filtros.estado = 'Activo';
                filtros.estadoVerificacion = 'Aprobado';
            }
            else {
                filtros.estado = getString(req.query.estado);
                filtros.estadoVerificacion = getString(req.query.estadoVerificacion);
            }
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
            const esPaciente = req.user?.rol === 'Paciente';
            const pacienteId = esPaciente ? req.user?.userId : undefined;
            if (isNaN(id)) {
                return res.status(400).json({ success: false, message: 'ID inválido.' });
            }
            // Siempre usamos obtenerPerfilCompleto para devolver foto, banner y datos completos
            const doctor = await useCase['doctorRepository'].obtenerPerfilCompleto(id);
            if (!doctor) {
                return res.status(404).json({ success: false, message: 'Doctor no encontrado.' });
            }
            // Para pacientes, ocultamos datos sensibles y calculamos isFavorite
            if (esPaciente) {
                delete doctor.documentos;
                delete doctor.comentarioVerificacion;
                delete doctor.estadoAccionVerificacion;
                delete doctor.fechaResolucionVerificacion;
                const favRepo = tsyringe_1.container.resolve('FavoritoRepository');
                doctor.isFavorite = await favRepo.existe(pacienteId, id);
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
    /**
     * GET /doctores/admin
     * Admin lista todos los doctores con filtros completos (sin restricciones de estado)
     */
    async listarParaAdmin(req, res) {
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
                genero: getString(req.query.genero),
                nacionalidad: getString(req.query.nacionalidad),
                especialidadId: req.query.especialidadId ? parseInt(req.query.especialidadId) : undefined,
                estado: getString(req.query.estado),
                estadoVerificacion: getString(req.query.estadoVerificacion),
                pagina: req.query.pagina ? parseInt(req.query.pagina) : 1,
                limite: req.query.limite ? parseInt(req.query.limite) : 10,
            };
            const resultado = await useCase.listar(filtros);
            return res.status(200).json({
                success: true,
                data: resultado.datos,
                paginacion: {
                    total: resultado.total,
                    pagina: filtros.pagina,
                    limite: filtros.limite,
                    totalPaginas: Math.ceil(resultado.total / filtros.limite),
                },
            });
        }
        catch (error) {
            return this.manejarError(error, res);
        }
    }
    /**
     * GET /doctores/admin/:id
     * Admin obtiene toda la información de un doctor (sin filtrar datos sensibles)
     * Incluye: documentos, comentarioVerificacion, estadoVerificacion, ubicaciones, etc.
     */
    async obtenerParaAdmin(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({ success: false, message: 'ID inválido.' });
            }
            const doctor = await tsyringe_1.container.resolve(GestionarDoctoresUseCase_1.GestionarDoctoresUseCase)['doctorRepository'].obtenerPerfilCompleto(id);
            if (!doctor) {
                return res.status(404).json({ success: false, message: 'Doctor no encontrado.' });
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
    /**
     * POST /doctores/comparar
     * Compara hasta 4 doctores seleccionados por el paciente.
     * Body: { ids: number[] }
     */
    async compararDoctores(req, res) {
        try {
            const useCase = tsyringe_1.container.resolve(GestionarDoctoresUseCase_1.GestionarDoctoresUseCase);
            const { ids } = req.body;
            if (!Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El campo "ids" debe ser un arreglo con al menos un ID de doctor.',
                });
            }
            const idsNumericos = ids.map((id) => parseInt(id)).filter((id) => !isNaN(id));
            if (idsNumericos.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Los IDs proporcionados no son válidos.',
                });
            }
            const doctores = await useCase.compararDoctores(idsNumericos);
            return res.status(200).json({
                success: true,
                total: doctores.length,
                data: doctores,
            });
        }
        catch (error) {
            if (error.message?.includes('Solo se pueden comparar')) {
                return res.status(400).json({ success: false, message: error.message });
            }
            return this.manejarError(error, res);
        }
    }
    // GET /doctores/estadisticas/resumen
    async resumenDoctor(req, res) {
        try {
            const useCase = tsyringe_1.container.resolve(GestionarDoctoresUseCase_1.GestionarDoctoresUseCase);
            const doctorId = req.user?.userId;
            if (!doctorId)
                return res.status(401).json({ success: false, message: 'No autenticado' });
            const data = await useCase.resumenDoctor(doctorId);
            return res.status(200).json({ success: true, data });
        }
        catch (error) {
            return this.manejarError(error, res);
        }
    }
    // GET /doctores/estadisticas/servicios
    async estadisticasServicios(req, res) {
        try {
            const useCase = tsyringe_1.container.resolve(GestionarDoctoresUseCase_1.GestionarDoctoresUseCase);
            const doctorId = req.user?.userId;
            if (!doctorId)
                return res.status(401).json({ success: false, message: 'No autenticado' });
            const data = await useCase.estadisticasServiciosDoctor(doctorId);
            return res.status(200).json({ success: true, data });
        }
        catch (error) {
            return this.manejarError(error, res);
        }
    }
    // GET /doctores/estadisticas/productividad
    async productividadDoctor(req, res) {
        try {
            const useCase = tsyringe_1.container.resolve(GestionarDoctoresUseCase_1.GestionarDoctoresUseCase);
            const doctorId = req.user?.userId;
            if (!doctorId)
                return res.status(401).json({ success: false, message: 'No autenticado' });
            const periodosValidos = ['semana', 'mes', '3meses', 'año', 'todo'];
            const periodo = req.query.periodo ?? 'mes';
            if (!periodosValidos.includes(periodo)) {
                return res.status(400).json({
                    success: false,
                    message: `El parámetro "periodo" debe ser uno de: ${periodosValidos.join(', ')}.`,
                });
            }
            const data = await useCase.productividadDoctor(doctorId, periodo);
            return res.status(200).json({ success: true, ...data });
        }
        catch (error) {
            return this.manejarError(error, res);
        }
    }
    // GET /doctores/estadisticas/servicios-mas-utilizados
    async serviciosMasUtilizados(req, res) {
        try {
            const useCase = tsyringe_1.container.resolve(GestionarDoctoresUseCase_1.GestionarDoctoresUseCase);
            const doctorId = req.user?.userId;
            if (!doctorId)
                return res.status(401).json({ success: false, message: 'No autenticado' });
            const data = await useCase.serviciosMasUtilizados(doctorId);
            return res.status(200).json({ success: true, ...data });
        }
        catch (error) {
            return this.manejarError(error, res);
        }
    }
    // GET /doctores/pacientes-info/:pacienteId
    async obtenerPaciente(req, res) {
        try {
            const doctorId = req.user?.userId;
            if (!doctorId) {
                return res.status(401).json({ success: false, message: 'No autenticado' });
            }
            const pacienteId = parseInt(req.params.pacienteId);
            if (isNaN(pacienteId)) {
                return res.status(400).json({ success: false, message: 'ID de paciente inválido' });
            }
            // Verificar que el doctor tiene al menos una cita con este paciente
            const citaRepository = tsyringe_1.container.resolve('CitaRepository');
            const citasDelDoctor = await citaRepository.listarPorDoctor(doctorId, {});
            const tieneCitaConPaciente = citasDelDoctor.datos.some((cita) => cita.pacienteId === pacienteId);
            if (!tieneCitaConPaciente) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permiso para ver la información de este paciente. '
                        + 'Solo puedes ver pacientes con los que has tenido citas.',
                });
            }
            // 1. Obtener información completa del paciente y sus imágenes de perfil
            const pacienteUseCase = tsyringe_1.container.resolve(GestionarPacientesUseCase_1.GestionarPacientesUseCase);
            const paciente = await pacienteUseCase.obtenerPorUsuarioId(pacienteId);
            // 2. Extraer futuras citas usando el Use Case correcto
            const gestionarCitasUseCase = tsyringe_1.container.resolve(GestionarCitasUseCase_1.GestionarCitasUseCase);
            const futurasCitasFormateadas = await gestionarCitasUseCase.listarFuturasCitas(doctorId, pacienteId);
            return res.status(200).json({
                success: true,
                data: {
                    ...paciente,
                    futurasCitas: futurasCitasFormateadas
                },
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
