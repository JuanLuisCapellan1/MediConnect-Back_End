import { injectable, inject } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { ICentroSaludRepository } from '../../domain/repositories/ICentroSaludRepository';
import { SupabaseStorageService } from '../../infrastructure/external-services/SupabaseStorageService';
import { ActualizarCentroSaludDto, ActualizarUbicacionCentroDto } from '../dtos/ActualizarCentroSaludDto';

@injectable()
export class GestionarCentroSaludUseCase {
    constructor(
        @inject('CentroSaludRepository') private centroRepo: ICentroSaludRepository,
        @inject(SupabaseStorageService) private supabase: SupabaseStorageService,
        @inject('PrismaClient') private prisma: PrismaClient
    ) { }

    // ─── Perfil ────────────────────────────────────────────────────────────────

    async obtenerPerfil(centroId: number): Promise<any> {
        const centro = await this.centroRepo.obtenerPerfilCompleto(centroId);
        if (!centro) throw new Error('Centro de salud no encontrado');
        return centro;
    }

    async actualizarPerfil(centroId: number, dto: ActualizarCentroSaludDto): Promise<any> {
        const centro = await this.centroRepo.obtenerPorId(centroId);
        if (!centro) throw new Error('Centro de salud no encontrado');

        if (dto.nombreComercial !== undefined) {
            if (dto.nombreComercial.trim().length < 3)
                throw new Error('El nombre comercial debe tener al menos 3 caracteres');
            if (dto.nombreComercial.trim().length > 120)
                throw new Error('El nombre comercial no puede exceder 120 caracteres');
        }

        let requiereRevisionAdmin = false;
        let razonRevision = '';

        // Análisis de reglas de negocio para re-evalución
        if (centro.estadoVerificacion === 'Rechazado') {
            // Caso 1: Estaba rechazado, cualquier actualización es un intento de arreglo
            requiereRevisionAdmin = true;
            razonRevision = 'El centro ha corregido sus datos tras ser rechazado previamente.';
        } else if (centro.estadoVerificacion === 'Aprobado' || centro.estadoVerificacion === 'En revisión') {
            // Caso 2: Estaba aprobado (o en revisión por documentos pendientes). 
            // Revisar si cambian datos legales críticos (RNC / Nombre Comercial)
            const nombreCambiado = dto.nombreComercial !== undefined && dto.nombreComercial.trim() !== centro.nombreComercial;
            const rncCambiado = dto.rnc !== undefined && dto.rnc.trim() !== centro.rnc;
            
            if (nombreCambiado || rncCambiado) {
                // Verificar si YA tiene una acción pendiente de Registro/Revisión de Perfil
                const accionPerfilPendiente = await this.prisma.accion.findFirst({
                    where: {
                        emisorId: centroId,
                        estado: 'Pendiente',
                        tipoAccion: { nombre: { in: ['Registro Centro de Salud', 'Revisión Centro de Salud'] } }
                    }
                });

                // Si no hay acción pendiente para el perfil, o si estaba ya aprobado, exigimos revisión
                if (!accionPerfilPendiente) {
                    requiereRevisionAdmin = true;
                    razonRevision = 'El centro ha modificado su información legal sensible (RNC o Nombre Comercial).';
                }
            }
        }

        // Realizamos la transición transaccional para evitar inconsistencias
        return await this.prisma.$transaction(async (tx) => {
            // Actualizar datos de Centro en Prisma directamente o usar logica de actualizacion
            const updatePayload: any = { actualizadoEn: new Date() };

            if (dto.nombreComercial !== undefined) updatePayload.nombreComercial = dto.nombreComercial?.trim();
            if (dto.rnc !== undefined) updatePayload.rnc = dto.rnc?.trim();
            if (dto.tipoCentroId !== undefined) updatePayload.tipoCentro = { connect: { id: dto.tipoCentroId } };
            if (dto.sitio_web !== undefined) updatePayload.sitio_web = dto.sitio_web;
            if (dto.descripcion !== undefined) updatePayload.descripcion = dto.descripcion;
            if (dto.telefono !== undefined) updatePayload.usuario = { update: { telefono: dto.telefono?.trim() } };

            if (requiereRevisionAdmin) {
                updatePayload.estadoVerificacion = 'En revisión';
            }

            const centroActualizado = await tx.centroSalud.update({
                where: { usuarioId: centroId },
                data: updatePayload,
                include: { usuario: true, tipoCentro: true, ubicacion: true }
            });

            // Si se requiere revisión, generar nueva acción "Registro Centro de Salud"
            if (requiereRevisionAdmin) {
                let tipoAccion = await tx.tipoAccion.findFirst({
                    where: { nombre: 'Registro Centro de Salud' },
                });

                if (!tipoAccion) {
                    tipoAccion = await tx.tipoAccion.create({
                        data: { nombre: 'Registro Centro de Salud', estado: 'Activo' }
                    });
                }

                await tx.accion.create({
                    data: {
                        tipoAccionId: tipoAccion.id,
                        emisorId: centroId,
                        detalle: 'Revisión de datos del perfil del Centro',
                        comentarioEmisor: razonRevision,
                        estado: 'Pendiente',
                        fechaEmision: new Date(),
                    },
                });
            }

            return centroActualizado;
        });
    }

    async actualizarFoto(centroId: number, file: Express.Multer.File): Promise<any> {
        const centro = await this.centroRepo.obtenerPorId(centroId);
        if (!centro) throw new Error('Centro de salud no encontrado');

        const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];
        if (!TIPOS_PERMITIDOS.includes(file.mimetype))
            throw new Error('Tipo de archivo no permitido. Use JPG, PNG o WebP');
        if (file.size > 5 * 1024 * 1024)
            throw new Error('La foto no puede superar 5MB');

        const ext = file.originalname.split('.').pop()?.toUpperCase() ?? 'JPG';
        const fileName = `centros-salud/${centroId}/foto_perfil_${Date.now()}.${ext}`;

        // SupabaseStorageService.uploadFile(fileBuffer, fileName, bucket, mimeType)
        const url = await this.supabase.uploadFile(file.buffer, fileName, 'public-assets', file.mimetype);
        return await this.centroRepo.actualizarFotoPerfil(centroId, url);
    }

    // ─── Ubicación ─────────────────────────────────────────────────────────────

    async obtenerUbicacion(centroId: number): Promise<any> {
        const centro = await this.centroRepo.obtenerPorId(centroId);
        if (!centro) throw new Error('Centro de salud no encontrado');
        return await this.centroRepo.obtenerUbicacion(centroId);
    }

    async actualizarUbicacion(centroId: number, dto: ActualizarUbicacionCentroDto): Promise<any> {
        const centro = await this.centroRepo.obtenerPorId(centroId);
        if (!centro) throw new Error('Centro de salud no encontrado');

        // Si estaba Rechazado, una actualización de ubicación es un intento de corrección → En revisión
        if (centro.estadoVerificacion === 'Rechazado') {
            return await this.prisma.$transaction(async (tx) => {
                // Actualizar ubicación
                const result = await this.centroRepo.actualizarUbicacion(centroId, dto);

                // Cambiar estado a En revisión
                await tx.centroSalud.update({
                    where: { usuarioId: centroId },
                    data: { estadoVerificacion: 'En revisión', actualizadoEn: new Date() },
                });

                // Crear / reutilizar TipoAccion
                let tipoAccion = await tx.tipoAccion.findFirst({
                    where: { nombre: 'Registro Centro de Salud' },
                });
                if (!tipoAccion) {
                    tipoAccion = await tx.tipoAccion.create({
                        data: { nombre: 'Registro Centro de Salud', estado: 'Activo' },
                    });
                }

                // Crear acción de revisión
                await tx.accion.create({
                    data: {
                        tipoAccionId: tipoAccion.id,
                        emisorId: centroId,
                        detalle: 'Revisión de ubicación del Centro',
                        comentarioEmisor: 'El centro ha corregido su ubicación tras ser rechazado previamente.',
                        estado: 'Pendiente',
                        fechaEmision: new Date(),
                    },
                });

                return result;
            });
        }

        return await this.centroRepo.actualizarUbicacion(centroId, dto);
    }

    // ─── Doctores asociados ────────────────────────────────────────────────────

    async listarDoctoresAsociados(centroId: number): Promise<any[]> {
        const centro = await this.centroRepo.obtenerPorId(centroId);
        if (!centro) throw new Error('Centro de salud no encontrado');
        return await this.centroRepo.listarDoctoresAsociados(centroId);
    }

    // ─── ANALÍTICAS ───────────────────────────────────────────────────────────

    async estadisticasGenerales(centroId: number) {
        const centro = await this.centroRepo.obtenerPorId(centroId);
        if (!centro) throw new Error('Centro de salud no encontrado');
        return await this.centroRepo.estadisticasGenerales(centroId);
    }

    async crecimientoMedicos(centroId: number, periodo: string) {
        const centro = await this.centroRepo.obtenerPorId(centroId);
        if (!centro) throw new Error('Centro de salud no encontrado');
        const periodosValidos = ['semana', 'mes', '3meses', 'año', 'todo'];
        const p = periodosValidos.includes(periodo) ? periodo : 'mes';
        return await this.centroRepo.crecimientoMedicos(centroId, p);
    }

    async distribucionEspecialidades(centroId: number) {
        const centro = await this.centroRepo.obtenerPorId(centroId);
        if (!centro) throw new Error('Centro de salud no encontrado');
        return await this.centroRepo.distribucionEspecialidades(centroId);
    }

    async listarParaAdmin(filtros: {
        nombre?: string;
        estadoVerificacion?: string;
        estado?: string;
        tipoCentroId?: number;
        pagina?: number;
        limite?: number;
    }): Promise<{ datos: any[]; total: number }> {
        return await this.centroRepo.listarParaAdmin(filtros);
    }
}
