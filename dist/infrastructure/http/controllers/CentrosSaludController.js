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
const CentroSaludNoEncontradoError_1 = require("../../../domain/errors/CentrosSalud/CentroSaludNoEncontradoError");
const TipoCentroSaludNoEncontradoError_1 = require("../../../domain/errors/TiposCentrosSalud/TipoCentroSaludNoEncontradoError");
/**
 * Utilidad para aplanar errores de validación
 */
function flattenValidationErrors(errors) {
    const messages = [];
    errors.forEach((error) => {
        if (error.constraints) {
            messages.push(...Object.values(error.constraints));
        }
        if (error.children && error.children.length > 0) {
            messages.push(...flattenValidationErrors(error.children));
        }
    });
    return messages;
}
let CentrosSaludController = class CentrosSaludController {
    constructor(completarPerfilUseCase, registrarCentroUseCase) {
        this.completarPerfilUseCase = completarPerfilUseCase;
        this.registrarCentroUseCase = registrarCentroUseCase;
    }
    /**
     * POST /centros-salud/completar-perfil
     * Completa el perfil de un centro de salud autenticado
     *
     * Headers requeridos:
     * - Authorization: Bearer <token>
     *
     * Form Data:
     * - nombreComercial: string (requerido)
     * - telefono: string (requerido)
     * - sitioWeb: string (opcional, URL válida)
     * - descripcion: string (opcional)
     * - tipoCentroId: number (requerido)
     * - direccion: string (requerido)
     * - barrioId: number (requerido)
     * - subBarrioId: number (opcional)
     * - codigoPostal: string (opcional)
     * - puntoGeografico: string (opcional, GeoJSON)
     * - certificadoSanitario: file (requerido, PDF)
     * - fotoPerfil: file (opcional, JPG/PNG)
     */
    async completarPerfil(req, res) {
        try {
            // ===================================================================
            // 1. OBTENER USUARIO AUTENTICADO DEL REQUEST
            // ===================================================================
            const usuarioId = req.usuarioId;
            // Si no hay usuarioId intentamos flujo de registro usando token de registro
            if (!usuarioId) {
                // Extraer token del header Authorization (acepta 'Bearer ' o token puro)
                let authHeader = req.originalAuthorization || req.headers.authorization || req.headers.Authorization;
                if (!authHeader) {
                    authHeader = req.headers['authorization'] ?? req.headers['Authorization'] ?? req.headers['x-authorization'] ?? req.headers['X-Authorization'];
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
                // Validaciones de archivos y DTO se comparten con el otro flujo más abajo
                const files = req.files ?? {};
                // Validar archivos requeridos
                if (!files.certificadoSanitario?.[0]) {
                    res.status(400).json({ success: false, message: 'El certificado sanitario es obligatorio' });
                    return;
                }
                // Validar DTO
                const dtoReg = (0, class_transformer_1.plainToInstance)(CompletarPerfilCentroSaludDto_1.CompletarPerfilCentroSaludDto, req.body, {
                    enableImplicitConversion: true,
                    excludeExtraneousValues: false,
                });
                const errorsReg = await (0, class_validator_1.validate)(dtoReg, { forbidNonWhitelisted: false, skipMissingProperties: false });
                if (errorsReg.length > 0) {
                    const messages = flattenValidationErrors(errorsReg);
                    res.status(400).json({ success: false, message: 'Validación fallida', errors: messages });
                    return;
                }
                // Ejecutar use-case de registro para centros con el token de registro
                await this.registrarCentroUseCase.execute(dtoReg, files, token);
                res.status(201).json({ success: true, message: 'Centro registrado exitosamente. Su solicitud está en revisión.' });
                return;
            }
            // ===================================================================
            // 2. VALIDAR ARCHIVOS REQUERIDOS
            // ===================================================================
            const files = req.files ?? {};
            if (!files.certificadoSanitario?.[0]) {
                res.status(400).json({
                    success: false,
                    message: 'El certificado sanitario es obligatorio',
                });
                return;
            }
            // Validar tipos MIME
            const mimesCertificado = ['application/pdf'];
            if (!mimesCertificado.includes(files.certificadoSanitario[0].mimetype)) {
                res.status(400).json({
                    success: false,
                    message: 'El certificado sanitario debe ser un archivo PDF',
                });
                return;
            }
            if (files.fotoPerfil?.[0]) {
                const mimesFoto = ['image/jpeg', 'image/png', 'image/webp'];
                if (!mimesFoto.includes(files.fotoPerfil[0].mimetype)) {
                    res.status(400).json({
                        success: false,
                        message: 'La foto de perfil debe ser JPG, PNG o WebP',
                    });
                    return;
                }
            }
            // ===================================================================
            // 3. VALIDAR DTO
            // ===================================================================
            const dto = (0, class_transformer_1.plainToInstance)(CompletarPerfilCentroSaludDto_1.CompletarPerfilCentroSaludDto, req.body, {
                enableImplicitConversion: true,
                excludeExtraneousValues: false,
            });
            const errors = await (0, class_validator_1.validate)(dto, {
                forbidNonWhitelisted: false,
                skipMissingProperties: false,
            });
            if (errors.length > 0) {
                const messages = flattenValidationErrors(errors);
                res.status(400).json({
                    success: false,
                    message: 'Validación fallida',
                    errors: messages,
                });
                return;
            }
            // ===================================================================
            // 4. EJECUTAR USE CASE
            // ===================================================================
            const resultado = await this.completarPerfilUseCase.execute(usuarioId, dto, files);
            res.status(200).json({
                success: true,
                message: resultado.message,
                data: {
                    id: resultado.id,
                    nombreComercial: resultado.nombreComercial,
                    estado: resultado.estado,
                    estadoVerificacion: resultado.estadoVerificacion,
                },
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    /**
     * Manejador centralizado de errores
     */
    manejarError(error, res) {
        // Manejo en línea de errores de Prisma (sin depender de utils eliminadas)
        const e = error;
        if (e && typeof e === 'object') {
            if (e.code === 'P2002') {
                const target = e.meta?.target;
                const fields = Array.isArray(target) ? target.join(', ') : target;
                res.status(409).json({ success: false, message: `Valor duplicado en campo(s): ${fields}` });
                return;
            }
            if (e.code === 'P2025') {
                res.status(404).json({ success: false, message: 'Registro no encontrado' });
                return;
            }
        }
        if (error instanceof CentroSaludNoEncontradoError_1.CentroSaludNoEncontradoError) {
            res.status(404).json({ success: false, message: error.message });
            return;
        }
        if (error instanceof TipoCentroSaludNoEncontradoError_1.TipoCentroSaludNoEncontradoError) {
            res.status(404).json({ success: false, message: error.message });
            return;
        }
        if (error?.message?.includes('El certificado sanitario')) {
            res.status(400).json({ success: false, message: error.message });
            return;
        }
        if (error?.message?.includes('transacción')) {
            res.status(500).json({ success: false, message: 'Error al procesar la solicitud. Intente de nuevo.' });
            return;
        }
        console.error('Error en completarPerfil:', error);
        res.status(500).json({ success: false, message: error.message || 'Error interno del servidor' });
    }
};
exports.CentrosSaludController = CentrosSaludController;
exports.CentrosSaludController = CentrosSaludController = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(CompletarPerfilCentroSaludUseCase_1.CompletarPerfilCentroSaludUseCase)),
    __param(1, (0, tsyringe_1.inject)(RegistrarCentroUseCase_1.RegistrarCentroUseCase)),
    __metadata("design:paramtypes", [CompletarPerfilCentroSaludUseCase_1.CompletarPerfilCentroSaludUseCase,
        RegistrarCentroUseCase_1.RegistrarCentroUseCase])
], CentrosSaludController);
