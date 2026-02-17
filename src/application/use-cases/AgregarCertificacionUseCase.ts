import { inject, injectable } from 'tsyringe';
import { IStorageService } from '../interfaces/IStorageService';
import { AgregarCertificacionDto } from '../dtos/AgregarCertificacionDto';
import { prisma } from '../../infrastructure/database/prisma/client';

/**
 * Caso de uso para agregar una nueva certificación
 */
@injectable()
export class AgregarCertificacionUseCase {
    constructor(
        @inject('StorageService') private storageService: IStorageService
    ) { }

    async execute(
        doctorId: number,
        dto: AgregarCertificacionDto,
        file: Express.Multer.File
    ): Promise<void> {
        // 1. Verificar que el doctor existe
        const doctor = await prisma.doctor.findUnique({
            where: { usuarioId: doctorId },
            select: { estadoVerificacion: true, usuarioId: true },
        });

        if (!doctor) {
            throw new Error('Doctor no encontrado');
        }

        // Los doctores pueden agregar certificaciones en cualquier estado
        // (En revisión o Aprobado)

        // 2. Obtener email del doctor para la ruta de almacenamiento
        const usuario = await prisma.usuario.findUnique({
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

        const urlArchivo = await this.storageService.uploadFile(
            file.buffer,
            fileName,
            'secure-documents',
            file.mimetype
        );

        // 4. Crear documento y acción de revisión en transacción
        await prisma.$transaction(async (tx) => {
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
