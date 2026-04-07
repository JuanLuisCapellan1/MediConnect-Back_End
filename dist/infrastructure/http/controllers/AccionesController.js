"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccionesController = void 0;
const tsyringe_1 = require("tsyringe");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const AprobarRechazarDocumentoUseCase_1 = require("../../../application/use-cases/AprobarRechazarDocumentoUseCase");
const AprobarRechazarDocumentoDto_1 = require("../../../application/dtos/AprobarRechazarDocumentoDto");
const client_1 = require("../../database/prisma/client");
// Helper function para aplanar errores de validación
function flattenValidationErrors(errors) {
    const messages = [];
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
class AccionesController {
    /**
     * GET /api/acciones/pendientes
     * Lista todas las acciones pendientes de revisión de documentos
     */
    async listarAccionesPendientes(req, res) {
        try {
            const acciones = await client_1.prisma.accion.findMany({
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
        }
        catch (error) {
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
    async obtenerDetalleAccion(req, res) {
        try {
            const accionId = parseInt(req.params.id);
            if (isNaN(accionId)) {
                res.status(400).json({
                    success: false,
                    message: 'ID de acción inválido',
                });
                return;
            }
            const accion = await client_1.prisma.accion.findUnique({
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
        }
        catch (error) {
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
    async aprobarRechazarDocumento(req, res) {
        try {
            const accionId = parseInt(req.params.id);
            if (isNaN(accionId)) {
                res.status(400).json({
                    success: false,
                    message: 'ID de acción inválido',
                });
                return;
            }
            // Validar DTO
            const dto = (0, class_transformer_1.plainToInstance)(AprobarRechazarDocumentoDto_1.AprobarRechazarDocumentoDto, {
                ...req.body,
                accionId,
            });
            const errors = await (0, class_validator_1.validate)(dto);
            if (errors.length > 0) {
                res.status(400).json({
                    success: false,
                    message: 'Datos de revisión inválidos',
                    errors: flattenValidationErrors(errors),
                });
                return;
            }
            // Ejecutar caso de uso
            const adminId = req.user.userId;
            const useCase = tsyringe_1.container.resolve(AprobarRechazarDocumentoUseCase_1.AprobarRechazarDocumentoUseCase);
            await useCase.execute(adminId, dto);
            res.status(200).json({
                success: true,
                message: `Documento ${dto.decision === 'Aprobada' ? 'aprobado' : 'rechazado'} exitosamente`,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message || 'Error al procesar revisión',
            });
        }
    }
}
exports.AccionesController = AccionesController;
