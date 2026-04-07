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
        // 1. Verificar que el centro existe y su estado
        const centro = await prisma.centroSalud.findUnique({
            where: { usuarioId: centroId },
            select: { 
                estadoVerificacion: true, 
                usuarioId: true,
                documentos_centros: {
                    where: { tipo_documento: 'Certificado Sanitario', estado: { not: 'Eliminado' } },
                    orderBy: { creado_en: 'desc' }, // Traer el más reciente
                    take: 1
                }
            },
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
                    nombre: { in: ['Registro Centro de Salud', 'Revisión Centro de Salud'] }
                }
            },
            orderBy: { fechaEmision: 'desc' }
        });

        // Regla de negocio: solo se puede re-subir si:
        //   a) El perfil del centro fue rechazado (estadoVerificacion === 'Rechazado')
        //   b) El documento en sí fue rechazado (estado_revision === 'Rechazado')
        //   c) Aún no tiene certificado (registro incompleto)
        const certificadoAsociado = centro.documentos_centros?.[0];
        
        const perfilRechazado = centro.estadoVerificacion === 'Rechazado';
        const documentoRechazado = certificadoAsociado && certificadoAsociado.estado_revision === 'Rechazado';
        
        const estadoPermitido = perfilRechazado || documentoRechazado || !certificadoAsociado;

        if (!estadoPermitido) {
            if (centro.estadoVerificacion === 'Aprobado' && (!certificadoAsociado || certificadoAsociado.estado_revision === 'Aprobado')) {
                throw new Error('El Centro de Salud y su documento ya están aprobados. No requiere actualizar documentos.');
            }
            throw new Error('Solo se puede actualizar el documento si ha sido rechazado por el administrador.');
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
            // Actualizar estado del centro
            await tx.centroSalud.update({
                where: { usuarioId: centroId },
                data: {
                    estadoVerificacion: 'En revisión',
                    actualizadoEn: new Date(),
                },
            });

            // Si existe un documento anterior, lo "eliminamos" lógicamente
            if (certificadoAsociado) {
                await tx.documentos_centros.update({
                    where: { id_documento_centro: certificadoAsociado.id_documento_centro },
                    data: { estado: 'Eliminado', actualizado_en: new Date() }
                });
            }

            // Crear el nuevo registro del certificado en documentos_centros
            const nuevoDocumento = await tx.documentos_centros.create({
                data: {
                    id_centro_salud: centroId,
                    tipo_documento: 'Certificado Sanitario',
                    url_archivo: urlArchivo,
                    nombre_original: file.originalname,
                    tipo_mime: file.mimetype,
                    tamanio_bytes: file.size,
                    estado_revision: 'Pendiente',
                    estado: 'Activo',
                    creado_en: new Date(),
                }
            });

            // 4. Crear nueva acción de revisión para el documento actualizado
            let tipoAccion = await tx.tipoAccion.findFirst({
                where: { nombre: 'Revisión Certificado Sanitario' },
            });

            if (!tipoAccion) {
                tipoAccion = await tx.tipoAccion.create({
                    data: { nombre: 'Revisión Certificado Sanitario', estado: 'Activo' }
                });
            }

            await tx.accion.create({
                data: {
                    tipoAccionId: tipoAccion.id,
                    emisorId: centroId,
                    id_documento_centro: nuevoDocumento.id_documento_centro,
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
