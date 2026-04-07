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
exports.ActualizarDocumentoDoctorUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const client_1 = require("../../infrastructure/database/prisma/client");
/**
 * Caso de uso para actualizar un documento rechazado
 */
let ActualizarDocumentoDoctorUseCase = class ActualizarDocumentoDoctorUseCase {
    constructor(storageService) {
        this.storageService = storageService;
    }
    async execute(doctorId, dto, file) {
        // 1. Verificar que el doctor existe y está en revisión
        const doctor = await client_1.prisma.doctor.findUnique({
            where: { usuarioId: doctorId },
            select: { estadoVerificacion: true, usuarioId: true },
        });
        if (!doctor) {
            throw new Error('Doctor no encontrado');
        }
        if (doctor.estadoVerificacion !== 'En revisión') {
            throw new Error('Solo los doctores en revisión pueden actualizar documentos');
        }
        // 2. Verificar que el documento existe y pertenece al doctor
        const documento = await client_1.prisma.documentoDoctor.findUnique({
            where: { id: dto.documentoId },
            select: {
                id: true,
                doctorId: true,
                estadoRevision: true,
                tipoDocumento: true,
                urlArchivo: true,
            },
        });
        if (!documento) {
            throw new Error('Documento no encontrado');
        }
        if (documento.doctorId !== doctorId) {
            throw new Error('Este documento no pertenece al doctor');
        }
        if (documento.estadoRevision !== 'Rechazado') {
            throw new Error('Solo se pueden actualizar documentos rechazados');
        }
        // 3. Obtener email del doctor para la ruta de almacenamiento
        const usuario = await client_1.prisma.usuario.findUnique({
            where: { id: doctorId },
            select: { email: true },
        });
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }
        // 4. Subir nuevo archivo a Supabase
        const tipoDocumentoPath = documento.tipoDocumento.toLowerCase().replace(/ /g, '-');
        const extension = this.getExtension(file.mimetype);
        const fileName = `doctors/${usuario.email}/${tipoDocumentoPath}/${documento.id}-updated.${extension}`;
        const urlArchivo = await this.storageService.uploadFile(file.buffer, fileName, 'secure-documents', file.mimetype);
        // 5. Actualizar documento en BD
        await client_1.prisma.$transaction(async (tx) => {
            // Actualizar el documento
            await tx.documentoDoctor.update({
                where: { id: dto.documentoId },
                data: {
                    urlArchivo,
                    nombreOriginal: file.originalname,
                    tipoMime: file.mimetype,
                    tamanio_bytes: BigInt(file.size),
                    descripcion: dto.descripcion || documento.tipoDocumento,
                    estadoRevision: 'Pendiente',
                    actualizadoEn: new Date(),
                },
            });
            // 6. Crear nueva acción de revisión para el documento actualizado
            const tipoAccion = await tx.tipoAccion.findFirst({
                where: { nombre: `Revisión ${documento.tipoDocumento}` },
            });
            if (tipoAccion) {
                await tx.accion.create({
                    data: {
                        tipoAccionId: tipoAccion.id,
                        emisorId: doctorId,
                        documentoId: dto.documentoId,
                        detalle: `Documento actualizado: ${documento.tipoDocumento}`,
                        comentarioEmisor: dto.descripcion || 'Documento actualizado por el doctor',
                        estado: 'Pendiente',
                        fechaEmision: new Date(),
                    },
                });
            }
        });
    }
    getExtension(mimeType) {
        const map = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
            'application/pdf': 'pdf',
        };
        return map[mimeType] || 'bin';
    }
};
exports.ActualizarDocumentoDoctorUseCase = ActualizarDocumentoDoctorUseCase;
exports.ActualizarDocumentoDoctorUseCase = ActualizarDocumentoDoctorUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('StorageService')),
    __metadata("design:paramtypes", [Object])
], ActualizarDocumentoDoctorUseCase);
