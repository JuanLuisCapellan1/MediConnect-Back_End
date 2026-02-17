import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AprobarRechazarDocumentoUseCase } from '../../../application/use-cases/AprobarRechazarDocumentoUseCase';
import { AprobarRechazarDocumentoDto } from '../../../application/dtos/AprobarRechazarDocumentoDto';
import { prisma } from '../../database/prisma/client';
import { ValidationError } from 'class-validator';

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

/**
 * Controlador para gestión de acciones (revisión de documentos)
 */
export class AccionesController {
    /**
     * GET /api/acciones/pendientes
     * Lista todas las acciones pendientes de revisión de documentos
     */
    async listarAccionesPendientes(req: Request, res: Response): Promise<void> {
        try {
            const acciones = await prisma.accion.findMany({
                where: {
                    estado: 'Pendiente',
                    documentoId: { not: null },
                },
                include: {
                    emisor: {
                        select: {
                            id: true,
                            email: true,
                            rol: true,
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
                            creadoEn: true,
                            doctor: {
                                select: {
                                    usuarioId: true,
                                    nombre: true,
                                    apellido: true,
                                    exequatur: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    fechaEmision: 'asc',
                },
            });

            res.status(200).json({
                success: true,
                data: acciones,
            });
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

            res.status(200).json({
                success: true,
                data: accion,
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

            // Validar DTO
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

            // Ejecutar caso de uso
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
