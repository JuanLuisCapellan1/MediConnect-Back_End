"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CentrosSaludController = void 0;
const tsyringe_1 = require("tsyringe");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const CompletarPerfilCentroSaludUseCase_1 = require("../../../application/use-cases/CompletarPerfilCentroSaludUseCase");
const CompletarPerfilCentroSaludDto_1 = require("../../../application/dtos/CompletarPerfilCentroSaludDto");
const RegistrarCentroUseCase_1 = require("../../../application/use-cases/RegistrarCentroUseCase");
const GestionarCentroSaludUseCase_1 = require("../../../application/use-cases/GestionarCentroSaludUseCase");
const GestionarSolicitudesAlianzaUseCase_1 = require("../../../application/use-cases/GestionarSolicitudesAlianzaUseCase");
const CentroSaludNoEncontradoError_1 = require("../../../domain/errors/CentrosSalud/CentroSaludNoEncontradoError");
const TipoCentroSaludNoEncontradoError_1 = require("../../../domain/errors/TiposCentrosSalud/TipoCentroSaludNoEncontradoError");
function flattenValidationErrors(errors) {
    const messages = [];
    errors.forEach(e => {
        if (e.constraints)
            messages.push(...Object.values(e.constraints));
        if (e.children?.length)
            messages.push(...flattenValidationErrors(e.children));
    });
    return messages;
}
let CentrosSaludController = class CentrosSaludController {
    constructor(completarPerfilUseCase, registrarCentroUseCase, gestionarCentroUseCase, solicitudesUseCase) {
        this.completarPerfilUseCase = completarPerfilUseCase;
        this.registrarCentroUseCase = registrarCentroUseCase;
        this.gestionarCentroUseCase = gestionarCentroUseCase;
        this.solicitudesUseCase = solicitudesUseCase;
    }
    // ══════════════════════════════════════════════════════════════
    // GET /centros-salud/mi-perfil
    // ══════════════════════════════════════════════════════════════
    async obtenerPerfil(req, res) {
        try {
            const centroId = req.user?.userId;
            if (!centroId) {
                res.status(401).json({ success: false, message: 'No autenticado' });
                return;
            }
            const data = await this.gestionarCentroUseCase.obtenerPerfil(centroId);
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    // ══════════════════════════════════════════════════════════════
    // PUT /centros-salud/mi-perfil
    // ══════════════════════════════════════════════════════════════
    async actualizarPerfil(req, res) {
        try {
            const centroId = req.user?.userId;
            if (!centroId) {
                res.status(401).json({ success: false, message: 'No autenticado' });
                return;
            }
            const dto = req.body;
            const data = await this.gestionarCentroUseCase.actualizarPerfil(centroId, dto);
            res.status(200).json({ success: true, data, message: 'Perfil actualizado exitosamente' });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    // ══════════════════════════════════════════════════════════════
    // PUT /centros-salud/mi-perfil/foto
    // ══════════════════════════════════════════════════════════════
    async actualizarFoto(req, res) {
        try {
            const centroId = req.user?.userId;
            if (!centroId) {
                res.status(401).json({ success: false, message: 'No autenticado' });
                return;
            }
            const file = req.files?.fotoPerfil?.[0]
                ?? req.file;
            if (!file) {
                res.status(400).json({ success: false, message: 'Se requiere una foto de perfil' });
                return;
            }
            const data = await this.gestionarCentroUseCase.actualizarFoto(centroId, file);
            res.status(200).json({ success: true, data, message: 'Foto actualizada exitosamente' });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    // ══════════════════════════════════════════════════════════════
    // GET /centros-salud/mi-ubicacion
    // ══════════════════════════════════════════════════════════════
    async obtenerUbicacion(req, res) {
        try {
            const centroId = req.user?.userId;
            if (!centroId) {
                res.status(401).json({ success: false, message: 'No autenticado' });
                return;
            }
            const data = await this.gestionarCentroUseCase.obtenerUbicacion(centroId);
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    // ══════════════════════════════════════════════════════════════
    // PUT /centros-salud/mi-ubicacion
    // ══════════════════════════════════════════════════════════════
    async actualizarUbicacion(req, res) {
        try {
            const centroId = req.user?.userId;
            if (!centroId) {
                res.status(401).json({ success: false, message: 'No autenticado' });
                return;
            }
            const { barrioId, subBarrioId, direccion, codigoPostal } = req.body;
            const dto = {
                barrioId: barrioId !== undefined ? Number(barrioId) : undefined,
                subBarrioId: subBarrioId !== undefined ? (subBarrioId === null ? null : Number(subBarrioId)) : undefined,
                direccion,
                codigoPostal: codigoPostal ?? undefined,
            };
            const data = await this.gestionarCentroUseCase.actualizarUbicacion(centroId, dto);
            res.status(200).json({ success: true, data, message: 'Ubicación actualizada exitosamente' });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    // ══════════════════════════════════════════════════════════════
    // GET /centros-salud/mis-doctores
    // ══════════════════════════════════════════════════════════════
    async listarDoctores(req, res) {
        try {
            const centroId = req.user?.userId;
            if (!centroId) {
                res.status(401).json({ success: false, message: 'No autenticado' });
                return;
            }
            const data = await this.gestionarCentroUseCase.listarDoctoresAsociados(centroId);
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    // ══════════════════════════════════════════════════════════════
    // POST /centros-salud/solicitudes-alianza
    // ══════════════════════════════════════════════════════════════
    async enviarSolicitud(req, res) {
        try {
            const centroId = req.user?.userId;
            if (!centroId) {
                res.status(401).json({ success: false, message: 'No autenticado' });
                return;
            }
            const { destinatarioId, mensaje } = req.body;
            if (!destinatarioId || isNaN(Number(destinatarioId))) {
                res.status(400).json({ success: false, message: 'destinatarioId (ID del doctor) es requerido y debe ser numérico' });
                return;
            }
            const data = await this.solicitudesUseCase.enviarSolicitud(centroId, 'CentroSalud', { destinatarioId: Number(destinatarioId), mensaje });
            res.status(201).json({ success: true, data, message: 'Solicitud de alianza enviada exitosamente' });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    // ══════════════════════════════════════════════════════════════
    // GET /centros-salud/solicitudes-alianza
    // ══════════════════════════════════════════════════════════════
    async listarSolicitudes(req, res) {
        try {
            const centroId = req.user?.userId;
            if (!centroId) {
                res.status(401).json({ success: false, message: 'No autenticado' });
                return;
            }
            const data = await this.solicitudesUseCase.listarSolicitudes(centroId, 'CentroSalud');
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    // ══════════════════════════════════════════════════════════════
    // PUT /centros-salud/solicitudes-alianza/:id
    // ══════════════════════════════════════════════════════════════
    async responderSolicitud(req, res) {
        try {
            const centroId = req.user?.userId;
            if (!centroId) {
                res.status(401).json({ success: false, message: 'No autenticado' });
                return;
            }
            const solicitudId = Number(req.params.id);
            if (isNaN(solicitudId)) {
                res.status(400).json({ success: false, message: 'ID de solicitud inválido' });
                return;
            }
            const { estado, motivoRechazo } = req.body;
            if (!estado || !['Aceptada', 'Rechazada'].includes(estado)) {
                res.status(400).json({ success: false, message: 'estado debe ser Aceptada o Rechazada' });
                return;
            }
            const data = await this.solicitudesUseCase.responderSolicitud(solicitudId, centroId, 'CentroSalud', { estado, motivoRechazo });
            res.status(200).json({ success: true, data, message: `Solicitud ${estado.toLowerCase()} exitosamente` });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    // ══════════════════════════════════════════════════════════════
    // SOLICITUDES DESDE EL LADO DEL DOCTOR
    // POST /doctores/solicitudes-alianza
    // ══════════════════════════════════════════════════════════════
    async doctorEnviarSolicitud(req, res) {
        try {
            const doctorId = req.user?.userId;
            if (!doctorId) {
                res.status(401).json({ success: false, message: 'No autenticado' });
                return;
            }
            const { destinatarioId, mensaje } = req.body;
            if (!destinatarioId || isNaN(Number(destinatarioId))) {
                res.status(400).json({ success: false, message: 'destinatarioId (ID del centro) es requerido y debe ser numérico' });
                return;
            }
            const data = await this.solicitudesUseCase.enviarSolicitud(doctorId, 'Doctor', { destinatarioId: Number(destinatarioId), mensaje });
            res.status(201).json({ success: true, data, message: 'Solicitud de alianza enviada exitosamente' });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    // GET /doctores/solicitudes-alianza
    async doctorListarSolicitudes(req, res) {
        try {
            const doctorId = req.user?.userId;
            if (!doctorId) {
                res.status(401).json({ success: false, message: 'No autenticado' });
                return;
            }
            const data = await this.solicitudesUseCase.listarSolicitudes(doctorId, 'Doctor');
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    // PUT /doctores/solicitudes-alianza/:id
    async doctorResponderSolicitud(req, res) {
        try {
            const doctorId = req.user?.userId;
            if (!doctorId) {
                res.status(401).json({ success: false, message: 'No autenticado' });
                return;
            }
            const solicitudId = Number(req.params.id);
            if (isNaN(solicitudId)) {
                res.status(400).json({ success: false, message: 'ID de solicitud inválido' });
                return;
            }
            const { estado, motivoRechazo } = req.body;
            if (!estado || !['Aceptada', 'Rechazada'].includes(estado)) {
                res.status(400).json({ success: false, message: 'estado debe ser Aceptada o Rechazada' });
                return;
            }
            const data = await this.solicitudesUseCase.responderSolicitud(solicitudId, doctorId, 'Doctor', { estado, motivoRechazo });
            res.status(200).json({ success: true, data, message: `Solicitud ${estado.toLowerCase()} exitosamente` });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    // ══════════════════════════════════════════════════════════════
    // Heredado: POST /centros-salud/completar-perfil
    // ══════════════════════════════════════════════════════════════
    async completarPerfil(req, res) {
        try {
            const usuarioId = req.usuarioId;
            if (!usuarioId) {
                let authHeader = req.originalAuthorization || req.headers.authorization || req.headers.Authorization;
                if (!authHeader) {
                    authHeader = req.headers['authorization'] ?? req.headers['Authorization']
                        ?? req.headers['x-authorization'] ?? req.headers['X-Authorization'];
                }
                let token = null;
                if (typeof authHeader === 'string') {
                    const trimmed = authHeader.trim();
                    token = trimmed.startsWith('Bearer ') ? trimmed.substring(7).trim() : trimmed;
                }
                if (!token) {
                    res.status(401).json({ success: false, message: 'Token de registro no proporcionado' });
                    return;
                }
                const files = req.files ?? {};
                if (!files.certificadoSanitario?.[0]) {
                    res.status(400).json({ success: false, message: 'El certificado sanitario es obligatorio' });
                    return;
                }
                const dtoReg = (0, class_transformer_1.plainToInstance)(CompletarPerfilCentroSaludDto_1.CompletarPerfilCentroSaludDto, req.body, {
                    enableImplicitConversion: true, excludeExtraneousValues: false,
                });
                const errorsReg = await (0, class_validator_1.validate)(dtoReg, { forbidNonWhitelisted: false, skipMissingProperties: false });
                if (errorsReg.length > 0) {
                    res.status(400).json({ success: false, message: 'Validación fallida', errors: flattenValidationErrors(errorsReg) });
                    return;
                }
                await this.registrarCentroUseCase.execute(dtoReg, files, token);
                res.status(201).json({ success: true, message: 'Centro registrado exitosamente. Su solicitud está en revisión.' });
                return;
            }
            const files = req.files ?? {};
            if (!files.certificadoSanitario?.[0]) {
                res.status(400).json({ success: false, message: 'El certificado sanitario es obligatorio' });
                return;
            }
            const mimesCert = ['application/pdf'];
            if (!mimesCert.includes(files.certificadoSanitario[0].mimetype)) {
                res.status(400).json({ success: false, message: 'El certificado sanitario debe ser un archivo PDF' });
                return;
            }
            if (files.fotoPerfil?.[0]) {
                const mimesFoto = ['image/jpeg', 'image/png', 'image/webp'];
                if (!mimesFoto.includes(files.fotoPerfil[0].mimetype)) {
                    res.status(400).json({ success: false, message: 'La foto de perfil debe ser JPG, PNG o WebP' });
                    return;
                }
            }
            const dto = (0, class_transformer_1.plainToInstance)(CompletarPerfilCentroSaludDto_1.CompletarPerfilCentroSaludDto, req.body, {
                enableImplicitConversion: true, excludeExtraneousValues: false,
            });
            const errors = await (0, class_validator_1.validate)(dto, { forbidNonWhitelisted: false, skipMissingProperties: false });
            if (errors.length > 0) {
                res.status(400).json({ success: false, message: 'Validación fallida', errors: flattenValidationErrors(errors) });
                return;
            }
            const resultado = await this.completarPerfilUseCase.execute(usuarioId, dto, files);
            res.status(200).json({
                success: true, message: resultado.message,
                data: { id: resultado.id, nombreComercial: resultado.nombreComercial, estado: resultado.estado, estadoVerificacion: resultado.estadoVerificacion },
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    manejarError(error, res) {
        const e = error;
        if (e?.code === 'P2002') {
            const fields = Array.isArray(e.meta?.target) ? e.meta.target.join(', ') : e.meta?.target;
            res.status(409).json({ success: false, message: `Valor duplicado en campo(s): ${fields}` });
            return;
        }
        if (e?.code === 'P2025') {
            res.status(404).json({ success: false, message: 'Registro no encontrado' });
            return;
        }
        if (error instanceof CentroSaludNoEncontradoError_1.CentroSaludNoEncontradoError) {
            res.status(404).json({ success: false, message: error.message });
            return;
        }
        if (error instanceof TipoCentroSaludNoEncontradoError_1.TipoCentroSaludNoEncontradoError) {
            res.status(404).json({ success: false, message: error.message });
            return;
        }
        const msg = error?.message ?? 'Error interno del servidor';
        if (msg.includes('no encontrad') || msg.includes('no existe')) {
            res.status(404).json({ success: false, message: msg });
            return;
        }
        if (msg.includes('No tienes permisos') || msg.includes('no puedes')) {
            res.status(403).json({ success: false, message: msg });
            return;
        }
        if (msg.includes('ya existe') || msg.includes('Ya existe') || msg.includes('pendiente')) {
            res.status(409).json({ success: false, message: msg });
            return;
        }
        if (msg.includes('requerido') || msg.includes('inválido') || msg.includes('debe')) {
            res.status(400).json({ success: false, message: msg });
            return;
        }
        console.error('Error en CentrosSaludController:', error);
        res.status(500).json({ success: false, message: msg });
    }
};
exports.CentrosSaludController = CentrosSaludController;
exports.CentrosSaludController = CentrosSaludController = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(CompletarPerfilCentroSaludUseCase_1.CompletarPerfilCentroSaludUseCase)),
    __param(1, (0, tsyringe_1.inject)(RegistrarCentroUseCase_1.RegistrarCentroUseCase)),
    __param(2, (0, tsyringe_1.inject)(GestionarCentroSaludUseCase_1.GestionarCentroSaludUseCase)),
    __param(3, (0, tsyringe_1.inject)(GestionarSolicitudesAlianzaUseCase_1.GestionarSolicitudesAlianzaUseCase)),
    __metadata("design:paramtypes", [CompletarPerfilCentroSaludUseCase_1.CompletarPerfilCentroSaludUseCase,
        RegistrarCentroUseCase_1.RegistrarCentroUseCase,
        GestionarCentroSaludUseCase_1.GestionarCentroSaludUseCase,
        GestionarSolicitudesAlianzaUseCase_1.GestionarSolicitudesAlianzaUseCase])
], CentrosSaludController);
