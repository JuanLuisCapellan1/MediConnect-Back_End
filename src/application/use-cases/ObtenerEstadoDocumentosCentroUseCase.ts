import { injectable } from 'tsyringe';
import { prisma } from '../../infrastructure/database/prisma/client';
import { SupabaseStorageService } from '../../infrastructure/external-services/SupabaseStorageService';

/**
 * Caso de uso para obtener el estado del documento (certificación sanitaria) de un centro de salud.
 * Las URLs de documentos se regeneran en tiempo de lectura para evitar tokens de Supabase expirados.
 */
@injectable()
export class ObtenerEstadoDocumentosCentroUseCase {
    private storage = new SupabaseStorageService();

    async execute(centroId: number): Promise<any> {
        // Verificar que el centro existe
        const centro = await prisma.centroSalud.findUnique({
            where: { usuarioId: centroId },
            select: {
                usuarioId: true,
                estadoVerificacion: true,
                certificacion_sanitaria: true,
                creadoEn: true,
                actualizadoEn: true,
            },
        });

        if (!centro) {
            throw new Error('Centro de Salud no encontrado');
        }

        // Buscar la última acción de revisión asociada a este centro
        const ultimaAccion = await prisma.accion.findFirst({
            where: {
                emisorId: centroId,
                tipoAccion: {
                    nombre: 'Registro Centro de Salud'
                }
            },
            orderBy: {
                fechaEmision: 'desc',
            },
            select: {
                id: true,
                estado: true,
                comentarioAdmin: true,
                fechaResolucion: true,
            },
        });

        let estadoRevision = 'Pendiente';

        if (centro.estadoVerificacion === 'Aprobado') {
            estadoRevision = 'Aprobado';
        } else if (ultimaAccion) {
            estadoRevision = ultimaAccion.estado === 'Rechazada' ? 'Rechazado'
                : ultimaAccion.estado === 'Aprobada' ? 'Aprobado'
                : 'Pendiente';
        }

        // Regenerar URL firmada fresca para el certificado sanitario
        let urlArchivo: string | null = centro.certificacion_sanitaria;
        if (urlArchivo) {
            try {
                urlArchivo = await this.storage.refreshOrGetSignedUrl(urlArchivo);
            } catch {
                // Si falla, devolver el valor original para no romper la respuesta
            }
        }

        return {
            estadoVerificacion: centro.estadoVerificacion,
            estadisticas: {
                total: 1,
                aprobados: centro.estadoVerificacion === 'Aprobado' ? 1 : 0,
                rechazados: estadoRevision === 'Rechazado' ? 1 : 0,
                pendientes: estadoRevision === 'Pendiente' ? 1 : 0,
                progreso: centro.estadoVerificacion === 'Aprobado' ? 100 : 0,
            },
            documentos: [
                {
                    id: 1,
                    tipoDocumento: 'Certificación Sanitaria',
                    urlArchivo,
                    estadoRevision,
                    creadoEn: centro.creadoEn,
                    actualizadoEn: centro.actualizadoEn,
                    ultimaAccion: ultimaAccion || null,
                }
            ],
        };
    }
}
