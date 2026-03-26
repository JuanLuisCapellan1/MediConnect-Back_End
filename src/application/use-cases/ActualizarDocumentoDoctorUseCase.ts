import { inject, injectable } from 'tsyringe';
import { IStorageService } from '../interfaces/IStorageService';
import { ActualizarDocumentoDoctorDto } from '../dtos/ActualizarDocumentoDoctorDto';
import { prisma } from '../../infrastructure/database/prisma/client';

/**
 * Caso de uso para actualizar un documento rechazado
 */
@injectable()
export class ActualizarDocumentoDoctorUseCase {
    constructor(
        @inject('StorageService') private storageService: IStorageService
    ) { }

    async execute(
        doctorId: number,
        dto: ActualizarDocumentoDoctorDto,
        file: Express.Multer.File
    ): Promise<void> {
        // 1. Verificar que el doctor existe y está en revisión
        const doctor = await prisma.doctor.findUnique({
            where: { usuarioId: doctorId },
            select: { estadoVerificacion: true, usuarioId: true },
        });

        if (!doctor) {
            throw new Error('Doctor no encontrado');
        }

        if (doctor.estadoVerificacion === 'Aprobado') {
            throw new Error('Tu cuenta ya está aprobada. No es necesario actualizar documentos.');
        }

        if (!['En revisión', 'Rechazado'].includes(doctor.estadoVerificacion)) {
            throw new Error('No se pueden actualizar documentos en el estado actual de verificación.');
        }

        // 2. Verificar que el documento existe y pertenece al doctor
        const documento = await prisma.documentoDoctor.findUnique({
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
        const usuario = await prisma.usuario.findUnique({
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

        const urlArchivo = await this.storageService.uploadFile(
            file.buffer,
            fileName,
            'secure-documents',
            file.mimetype
        );

        // 5. Actualizar documento en BD
        await prisma.$transaction(async (tx) => {
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

    private getExtension(mimeType: string): string {
        const map: Record<string, string> = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
            'application/pdf': 'pdf',
        };
        return map[mimeType] || 'bin';
    }
}
