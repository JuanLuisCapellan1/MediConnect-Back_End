import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AprobarRechazarDocumentoUseCase } from '../../../application/use-cases/AprobarRechazarDocumentoUseCase';
import { AprobarRechazarDocumentoDto } from '../../../application/dtos/AprobarRechazarDocumentoDto';
import { prisma } from '../../database/prisma/client';
import { ValidationError } from 'class-validator';
import { SupabaseStorageService } from '../../external-services/SupabaseStorageService';

// Helper function para aplanar errores de validación
function flattenValidationErrors(errors: ValidationError[]): string[] {
    const messages: string[] = [];
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

// Helper: regenera la URL firmada de cualquier documento que tenga urlArchivo
async function regenerarUrlArchivo(doc: any, storage: SupabaseStorageService): Promise<any> {
    if (!doc || !doc.urlArchivo) return doc;
    return {
        ...doc,
        urlArchivo: await storage.refreshOrGetSignedUrl(doc.urlArchivo),
    };
}

/**
 * Controlador para gestión de acciones (revisión de documentos)
 */
export class AccionesController {
    private storage = new SupabaseStorageService();

    /**
     * GET /api/acciones/pendientes
     * Lista todas las acciones pendientes de revisión de documentos
     */
    async listarAccionesPendientes(req: Request, res: Response): Promise<void> {
        try {
            const acciones = await prisma.accion.findMany({
                where: { estado: 'Pendiente' },
                include: {
                    emisor: {
                        select: { id: true, email: true, rol: true, fotoPerfil: true },
                    },
                    tipoAccion: {
                        select: { id: true, nombre: true },
                    },
                    documento: {
                        select: {
                            id: true,
                            tipoDocumento: true,
                            descripcion: true,
                            urlArchivo: true,
                            nombreOriginal: true,
                            creadoEn: true,
                            doctor: {
                                select: {
                                    usuarioId: true,
                                    nombre: true,
                                    apellido: true,
                                    exequatur: true,
                                    estadoVerificacion: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { fechaEmision: 'asc' },
            });

            // Recopilar IDs de emisores para enriquecer con datos Doctor/CentroSalud
            const emisoresDoctor = acciones
                .filter((a) => a.emisor.rol === 'Doctor')
                .map((a) => a.emisorId);

            const emisoresCentro = acciones
                .filter((a) => a.emisor.rol === 'CentroSalud')
                .map((a) => a.emisorId);

            // Query en lote para enriquecer datos
            const [doctoresMap, centrosMap] = await Promise.all([
                emisoresDoctor.length > 0
                    ? prisma.doctor.findMany({
                          where: { usuarioId: { in: emisoresDoctor } },
                          select: {
                              usuarioId: true,
                              nombre: true,
                              apellido: true,
                              exequatur: true,
                              estadoVerificacion: true,
                          },
                      }).then((docs) => new Map(docs.map((d) => [d.usuarioId, d])))
                    : Promise.resolve(new Map<number, any>()),

                emisoresCentro.length > 0
                    ? prisma.centroSalud.findMany({
                          where: { usuarioId: { in: emisoresCentro } },
                          select: {
                              usuarioId: true,
                              nombreComercial: true,
                              estadoVerificacion: true,
                          },
                      }).then((centros) => new Map(centros.map((c) => [c.usuarioId, c])))
                    : Promise.resolve(new Map<number, any>()),
            ]);

            // Regenerar URL firmada fresca + adjuntar datos del emisor enriquecidos
            const accionesEnriquecidas = await Promise.all(
                acciones.map(async (accion) => {
                    const documentoConUrl = accion.documento
                        ? await regenerarUrlArchivo(accion.documento, this.storage)
                        : null;

                    // tipoRevision orienta al frontend sobre qué renderizar
                    const tipoRevision = accion.documento ? 'documento' : 'registro';

                    // Datos adicionales del emisor según su rol
                    let perfilEmisor: any = null;
                    if (accion.emisor.rol === 'Doctor') {
                        perfilEmisor = doctoresMap.get(accion.emisorId) || null;
                    } else if (accion.emisor.rol === 'CentroSalud') {
                        perfilEmisor = centrosMap.get(accion.emisorId) || null;
                    }

                    return {
                        ...accion,
                        tipoRevision,
                        documento: documentoConUrl,
                        perfilEmisor,
                    };
                })
            );

            res.status(200).json({ success: true, data: accionesEnriquecidas });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error al listar acciones pendientes',
            });
        }
    }

    /**
     * GET /api/acciones/:id
     * Obtiene el detalle de una acción específica
     */
    async obtenerDetalleAccion(req: Request, res: Response): Promise<void> {
        try {
            const accionId = parseInt(req.params.id as string);

            if (isNaN(accionId)) {
                res.status(400).json({
                    success: false,
                    message: 'ID de acción inválido',
                });
                return;
            }

            const accion = await prisma.accion.findUnique({
                where: { id: accionId },
                include: {
                    emisor: {
                        select: {
                            id: true,
                            email: true,
                            rol: true,
                        },
                    },
                    adminRevisor: {
                        select: {
                            id: true,
                            email: true,
                        },
                    },
                    tipoAccion: {
                        select: {
                            id: true,
                            nombre: true,
                        },
                    },
                    documento: {
                        select: {
                            id: true,
                            tipoDocumento: true,
                            descripcion: true,
                            urlArchivo: true,
                            nombreOriginal: true,
                            estadoRevision: true,
                            creadoEn: true,
                            actualizadoEn: true,
                            doctor: {
                                select: {
                                    usuarioId: true,
                                    nombre: true,
                                    apellido: true,
                                    exequatur: true,
                                    estadoVerificacion: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!accion) {
                res.status(404).json({
                    success: false,
                    message: 'Acción no encontrada',
                });
                return;
            }

            // Regenerar URL firmada fresca
            const accionConUrl = {
                ...accion,
                documento: accion.documento
                    ? await regenerarUrlArchivo(accion.documento, this.storage)
                    : null,
            };

            res.status(200).json({
                success: true,
                data: accionConUrl,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Error al obtener detalle de acción',
            });
        }
    }

    /**
     * PATCH /api/acciones/:id/revisar
     * Aprobar o rechazar un documento específico
     */
    async aprobarRechazarDocumento(req: Request, res: Response): Promise<void> {
        try {
            const accionId = parseInt(req.params.id as string);

            if (isNaN(accionId)) {
                res.status(400).json({
                    success: false,
                    message: 'ID de acción inválido',
                });
                return;
            }

            const dto = plainToInstance(AprobarRechazarDocumentoDto, {
                ...req.body,
                accionId,
            });

            const errors = await validate(dto);
            if (errors.length > 0) {
                res.status(400).json({
                    success: false,
                    message: 'Datos de revisión inválidos',
                    errors: flattenValidationErrors(errors),
                });
                return;
            }

            const adminId = req.user!.userId;
            const useCase = container.resolve(AprobarRechazarDocumentoUseCase);
            await useCase.execute(adminId, dto);

            res.status(200).json({
                success: true,
                message: `Documento ${dto.decision === 'Aprobada' ? 'aprobado' : 'rechazado'} exitosamente`,
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message || 'Error al procesar revisión',
            });
        }
    }
}
