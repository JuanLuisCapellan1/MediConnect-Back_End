"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObtenerEstadoDocumentosCentroUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const client_1 = require("../../infrastructure/database/prisma/client");
const SupabaseStorageService_1 = require("../../infrastructure/external-services/SupabaseStorageService");
/**
 * Caso de uso para obtener el estado del documento (certificación sanitaria) de un centro de salud.
 * Las URLs de documentos se regeneran en tiempo de lectura para evitar tokens de Supabase expirados.
 */
let ObtenerEstadoDocumentosCentroUseCase = class ObtenerEstadoDocumentosCentroUseCase {
    constructor() {
        this.storage = new SupabaseStorageService_1.SupabaseStorageService();
    }
    async execute(centroId) {
        // Verificar que el centro existe
        const centro = await client_1.prisma.centroSalud.findUnique({
            where: { usuarioId: centroId },
            select: {
                usuarioId: true,
                estadoVerificacion: true,
                creadoEn: true,
                actualizadoEn: true,
                documentos_centros: {
                    where: { estado: 'Activo' },
                    orderBy: { creado_en: 'desc' }
                }
            },
        });
        if (!centro) {
            throw new Error('Centro de Salud no encontrado');
        }
        // Obtener historial de acciones del centro por si el documento no tiene acción directa aún
        const ultimaAccionPerfil = await client_1.prisma.accion.findFirst({
            where: {
                emisorId: centroId,
                tipoAccion: { nombre: 'Registro Centro de Salud' }
            },
            orderBy: { fechaEmision: 'desc' },
            select: { id: true, estado: true, comentarioAdmin: true, fechaResolucion: true },
        });
        // Regenerar URL firmada para cada documento y obtener su acción individual (si existe)
        const documentosMapeados = await Promise.all(centro.documentos_centros.map(async (doc) => {
            let urlArchivo = doc.url_archivo;
            if (urlArchivo) {
                try {
                    urlArchivo = await this.storage.refreshOrGetSignedUrl(urlArchivo);
                }
                catch {
                    // Ignorar si el token falla
                }
            }
            // Buscar la última acción específica para este documento
            const accionDoc = await client_1.prisma.accion.findFirst({
                where: {
                    id_documento_centro: doc.id_documento_centro,
                    tipoAccion: { nombre: 'Revisión Certificado Sanitario' }
                },
                orderBy: { fechaEmision: 'desc' },
                select: { id: true, estado: true, comentarioAdmin: true, fechaResolucion: true },
            });
            const estadoRevision = doc.estado_revision || (accionDoc ? accionDoc.estado : 'Pendiente');
            return {
                id: doc.id_documento_centro,
                tipoDocumento: doc.tipo_documento,
                nombreOriginal: doc.nombre_original,
                tipoMime: doc.tipo_mime,
                tamanioBytes: doc.tamanio_bytes ? Number(doc.tamanio_bytes) : null,
                urlArchivo,
                estadoRevision,
                creadoEn: doc.creado_en,
                actualizadoEn: doc.actualizado_en,
                ultimaAccion: accionDoc || ultimaAccionPerfil || null, // Fallback al perfil
            };
        }));
        const totalDocs = documentosMapeados.length;
        const aprobados = documentosMapeados.filter(d => d.estadoRevision === 'Aprobado').length;
        const rechazados = documentosMapeados.filter(d => d.estadoRevision === 'Rechazado').length;
        const pendientes = totalDocs - aprobados - rechazados;
        const progreso = totalDocs === 0 ? 0 : Math.round((aprobados / totalDocs) * 100);
        return {
            estadoVerificacion: centro.estadoVerificacion,
            estadisticas: {
                total: totalDocs,
                aprobados,
                rechazados,
                pendientes,
                progreso,
            },
            documentos: documentosMapeados,
        };
    }
};
exports.ObtenerEstadoDocumentosCentroUseCase = ObtenerEstadoDocumentosCentroUseCase;
exports.ObtenerEstadoDocumentosCentroUseCase = ObtenerEstadoDocumentosCentroUseCase = __decorate([
    (0, tsyringe_1.injectable)()
], ObtenerEstadoDocumentosCentroUseCase);
