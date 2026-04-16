"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccionesController = void 0;
const tsyringe_1 = require("tsyringe");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const AprobarRechazarDocumentoUseCase_1 = require("../../../application/use-cases/AprobarRechazarDocumentoUseCase");
const AprobarRechazarDocumentoDto_1 = require("../../../application/dtos/AprobarRechazarDocumentoDto");
const client_1 = require("../../database/prisma/client");
const SupabaseStorageService_1 = require("../../external-services/SupabaseStorageService");
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
// Helper: regenera la URL firmada de cualquier documento que tenga urlArchivo
async function regenerarUrlArchivo(doc, storage) {
    if (!doc || !doc.urlArchivo)
        return doc;
    return {
        ...doc,
        urlArchivo: await storage.refreshOrGetSignedUrl(doc.urlArchivo),
    };
}
/**
 * Controlador para gestión de acciones (revisión de documentos)
 */
class AccionesController {
    constructor() {
        this.storage = new SupabaseStorageService_1.SupabaseStorageService();
    }
    /**
     * GET /api/acciones/pendientes
     * Lista todas las acciones pendientes de revisión de documentos
     */
    async listarAccionesPendientes(req, res) {
        try {
            const acciones = await client_1.prisma.accion.findMany({
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
                    documentos_centros: {
                        select: {
                            id_documento_centro: true,
                            tipo_documento: true,
                            descripcion: true,
                            url_archivo: true,
                            nombre_original: true,
                            creado_en: true,
                        }
                    }
                },
                orderBy: { fechaEmision: 'asc' },
            });
            // Recopilar IDs de emisores para enriquecer con datos Doctor/CentroSalud
            const emisoresDoctor = acciones
                .filter((a) => a.emisor.rol === 'Doctor')
                .map((a) => a.emisorId);
            const emisoresCentro = acciones
                .filter((a) => a.emisor.rol === 'Centro' || a.emisor.rol === 'Centro')
                .map((a) => a.emisorId);
            // Query en lote para enriquecer datos
            const [doctoresMap, centrosMap] = await Promise.all([
                emisoresDoctor.length > 0
                    ? client_1.prisma.doctor.findMany({
                        where: { usuarioId: { in: emisoresDoctor } },
                        select: {
                            usuarioId: true,
                            nombre: true,
                            apellido: true,
                            exequatur: true,
                            estadoVerificacion: true,
                        },
                    }).then((docs) => new Map(docs.map((d) => [d.usuarioId, d])))
                    : Promise.resolve(new Map()),
                emisoresCentro.length > 0
                    ? client_1.prisma.centroSalud.findMany({
                        where: { usuarioId: { in: emisoresCentro } },
                        select: {
                            usuarioId: true,
                            nombreComercial: true,
                            estadoVerificacion: true,
                        },
                    }).then((centros) => new Map(centros.map((c) => [c.usuarioId, c])))
                    : Promise.resolve(new Map()),
            ]);
            // Regenerar URL firmada fresca + adjuntar datos del emisor enriquecidos
            const accionesEnriquecidas = await Promise.all(acciones.map(async (accion) => {
                let documentoMapeado = null;
                if (accion.documento) {
                    documentoMapeado = await regenerarUrlArchivo(accion.documento, this.storage);
                }
                else if (accion.documentos_centros) {
                    // Mapear documentos_centros al formato que espera el frontend (camelCase)
                    const docCentro = {
                        id: accion.documentos_centros.id_documento_centro,
                        tipoDocumento: accion.documentos_centros.tipo_documento,
                        descripcion: accion.documentos_centros.descripcion,
                        urlArchivo: accion.documentos_centros.url_archivo,
                        nombreOriginal: accion.documentos_centros.nombre_original,
                        creadoEn: accion.documentos_centros.creado_en,
                    };
                    documentoMapeado = await regenerarUrlArchivo(docCentro, this.storage);
                }
                // tipoRevision orienta al frontend sobre qué renderizar
                const tipoRevision = documentoMapeado ? 'documento' : 'registro';
                // Datos adicionales del emisor según su rol
                let perfilEmisor = null;
                if (accion.emisor.rol === 'Doctor') {
                    perfilEmisor = doctoresMap.get(accion.emisorId) || null;
                }
                else if (accion.emisor.rol === 'Centro' || accion.emisor.rol === 'Centro') {
                    perfilEmisor = centrosMap.get(accion.emisorId) || null;
                }
                // Removemos documentos_centros puro de la respuesta por limpieza, 
                // devolviéndolo dentro de "documento" como espera el frontend
                const { documentos_centros, ...accionSinDocCentro } = accion;
                return {
                    ...accionSinDocCentro,
                    tipoRevision,
                    documento: documentoMapeado,
                    perfilEmisor,
                };
            }));
            res.status(200).json({ success: true, data: accionesEnriquecidas });
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
                    documentos_centros: {
                        select: {
                            id_documento_centro: true,
                            tipo_documento: true,
                            descripcion: true,
                            url_archivo: true,
                            nombre_original: true,
                            estado_revision: true,
                            creado_en: true,
                            actualizado_en: true,
                        }
                    }
                },
            });
            if (!accion) {
                res.status(404).json({
                    success: false,
                    message: 'Acción no encontrada',
                });
                return;
            }
            let documentoMapeado = null;
            if (accion.documento) {
                documentoMapeado = await regenerarUrlArchivo(accion.documento, this.storage);
            }
            else if (accion.documentos_centros) {
                const docCentro = {
                    id: accion.documentos_centros.id_documento_centro,
                    tipoDocumento: accion.documentos_centros.tipo_documento,
                    descripcion: accion.documentos_centros.descripcion,
                    urlArchivo: accion.documentos_centros.url_archivo,
                    nombreOriginal: accion.documentos_centros.nombre_original,
                    estadoRevision: accion.documentos_centros.estado_revision,
                    creadoEn: accion.documentos_centros.creado_en,
                    actualizadoEn: accion.documentos_centros.actualizado_en,
                };
                documentoMapeado = await regenerarUrlArchivo(docCentro, this.storage);
            }
            const { documentos_centros, ...accionSinDocCentro } = accion;
            // Regenerar URL firmada fresca
            const accionConUrl = {
                ...accionSinDocCentro,
                documento: documentoMapeado,
            };
            res.status(200).json({
                success: true,
                data: accionConUrl,
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
