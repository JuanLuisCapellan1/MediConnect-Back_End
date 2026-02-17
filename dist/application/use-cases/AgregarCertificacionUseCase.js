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
exports.AgregarCertificacionUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const client_1 = require("../../infrastructure/database/prisma/client");
/**
 * Caso de uso para agregar una nueva certificación
 */
let AgregarCertificacionUseCase = class AgregarCertificacionUseCase {
    constructor(storageService) {
        this.storageService = storageService;
    }
    async execute(doctorId, dto, file) {
        // 1. Verificar que el doctor existe
        const doctor = await client_1.prisma.doctor.findUnique({
            where: { usuarioId: doctorId },
            select: { estadoVerificacion: true, usuarioId: true },
        });
        if (!doctor) {
            throw new Error('Doctor no encontrado');
        }
        // Los doctores pueden agregar certificaciones en cualquier estado
        // (En revisión o Aprobado)
        // 2. Obtener email del doctor para la ruta de almacenamiento
        const usuario = await client_1.prisma.usuario.findUnique({
            where: { id: doctorId },
            select: { email: true },
        });
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }
        // 3. Subir certificación a Supabase
        const extension = this.getExtension(file.mimetype);
        const timestamp = Date.now();
        const fileName = `doctors/${usuario.email}/certifications/cert-${timestamp}.${extension}`;
        const urlArchivo = await this.storageService.uploadFile(file.buffer, fileName, 'secure-documents', file.mimetype);
        // 4. Crear documento y acción de revisión en transacción
        await client_1.prisma.$transaction(async (tx) => {
            // Crear documento
            const nuevoDocumento = await tx.documentoDoctor.create({
                data: {
                    doctorId,
                    tipoDocumento: 'Certificación',
                    urlArchivo,
                    nombreOriginal: file.originalname,
                    tipoMime: file.mimetype,
                    tamanio_bytes: BigInt(file.size),
                    descripcion: dto.descripcion,
                    estadoRevision: 'Pendiente',
                    estado: 'Activo',
                    creadoEn: new Date(),
                },
            });
            // 5. Crear acción de revisión para la nueva certificación
            let tipoAccion = await tx.tipoAccion.findFirst({
                where: { nombre: 'Revisión Certificación' },
            });
            // Si no existe el tipo de acción, crearlo
            if (!tipoAccion) {
                tipoAccion = await tx.tipoAccion.create({
                    data: {
                        nombre: 'Revisión Certificación',
                        estado: 'Activo',
                    },
                });
            }
            await tx.accion.create({
                data: {
                    tipoAccionId: tipoAccion.id,
                    emisorId: doctorId,
                    documentoId: nuevoDocumento.id,
                    detalle: `Nueva certificación agregada: ${dto.descripcion}`,
                    comentarioEmisor: dto.descripcion,
                    estado: 'Pendiente',
                    fechaEmision: new Date(),
                },
            });
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
exports.AgregarCertificacionUseCase = AgregarCertificacionUseCase;
exports.AgregarCertificacionUseCase = AgregarCertificacionUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('StorageService')),
    __metadata("design:paramtypes", [Object])
], AgregarCertificacionUseCase);
