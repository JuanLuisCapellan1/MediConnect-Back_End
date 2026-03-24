import { inject, injectable } from 'tsyringe';
import { IStorageService } from '../interfaces/IStorageService';
import { ActualizarDocumentoCentroDto } from '../dtos/ActualizarDocumentoCentroDto';
import { prisma } from '../../infrastructure/database/prisma/client';

/**
 * Caso de uso para actualizar la certificación sanitaria rechazada de un Centro de Salud
 */
@injectable()
export class ActualizarDocumentoCentroUseCase {
    constructor(
        @inject('StorageService') private storageService: IStorageService
    ) { }

    async execute(
        centroId: number,
        dto: ActualizarDocumentoCentroDto,
        file: Express.Multer.File
    ): Promise<void> {
        // 1. Verificar que el centro existe y está en revisión
        const centro = await prisma.centroSalud.findUnique({
            where: { usuarioId: centroId },
            select: { estadoVerificacion: true, usuarioId: true, certificacion_sanitaria: true },
        });

        if (!centro) {
            throw new Error('Centro de Salud no encontrado');
        }

        // Permitimos subir el documento si el centro está En revisión o si su acción de registro fue rechazada
        const usuario = await prisma.usuario.findUnique({
            where: { id: centroId },
            select: { email: true },
        });

        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }

        // Buscar la última acción para saber si fue rechazada
        const ultimaAccion = await prisma.accion.findFirst({
            where: {
                emisorId: centroId,
                tipoAccion: {
                    nombre: 'Registro Centro de Salud'
                }
            },
            orderBy: { fechaEmision: 'desc' }
        });

        if (centro.estadoVerificacion === 'Aprobado') {
             throw new Error('El Centro de Salud ya está aprobado. No requiere actualizar documentos.');
        }

        if (ultimaAccion && ultimaAccion.estado !== 'Rechazada' && centro.certificacion_sanitaria) {
             throw new Error('Solo se puede actualizar el documento si ha sido rechazado o si el centro se encuentra completando su registro.');
        }

        // 2. Subir nuevo archivo a Supabase
        const extension = this.getExtension(file.mimetype);
        const fileName = `centers/${usuario.email}/certificacion-sanitaria-${Date.now()}.${extension}`;

        const urlArchivo = await this.storageService.uploadFile(
            file.buffer,
            fileName,
            'secure-documents', // Asumimos que usa el mismo bucket seguro
            file.mimetype
        );

        // 3. Actualizar documento en BD (en este caso es actualizar el campo en la tabla CentroSalud)
        await prisma.$transaction(async (tx) => {
            // Actualizar el certificado
            await tx.centroSalud.update({
                where: { usuarioId: centroId },
                data: {
                    certificacion_sanitaria: urlArchivo,
                    actualizadoEn: new Date(),
                    // Si estaba rechazado, pero vuelve a subir documento, idealmente habría que marcar algo de "En revisión" 
                    // si tuviese un estado general o interno para el documento. Usaremos el de la acción para guiarlo.
                },
            });

            // 4. Crear nueva acción de revisión para el documento actualizado
            let tipoAccion = await tx.tipoAccion.findFirst({
                where: { nombre: 'Registro Centro de Salud' },
            });

            // Si no existiera, la creamos (aunque de acuerdo a los seeders ya debería existir)
            if (!tipoAccion) {
                tipoAccion = await tx.tipoAccion.create({
                    data: { nombre: 'Registro Centro de Salud', estado: 'Activo' }
                });
            }

            await tx.accion.create({
                data: {
                    tipoAccionId: tipoAccion.id,
                    emisorId: centroId,
                    detalle: `Certificación Sanitaria actualizada`,
                    comentarioEmisor: dto.descripcion || 'Documento actualizado por el centro de salud',
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
