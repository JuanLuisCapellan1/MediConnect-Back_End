/**
 * GestionarServiciosUseCase.ts
 */
import { Servicio } from '../../domain/entities/Servicio';
import { ServicioImagen } from '../../domain/entities/ServicioImagen';
import { IServicioRepository, FiltrosServicio, FiltrosCercania } from '../../domain/repositories/IServicioRepository';
import { IStorageService } from '../interfaces/IStorageService';
import {
    CrearServicioDto,
    ActualizarServicioDto,
    FiltrosServicioDto,
} from '../dtos/ServicioDtos';

const MAX_IMAGENES = 10;
const TIPOS_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const BUCKET = 'public-assets' as const;

export interface ImagenUpload {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
}

export class GestionarServiciosUseCase {
    constructor(
        private readonly servicioRepository: IServicioRepository,
        private readonly storageService: IStorageService
    ) { }

    // ─── Crear ────────────────────────────────────────────────────────────────
    async crear(doctorId: number, dto: CrearServicioDto, imagenes: ImagenUpload[] = []): Promise<Servicio> {
        this.validarImagenes(imagenes);
        this.validarModalidad(dto.modalidad);

        const servicio = await this.servicioRepository.crear(
            doctorId,
            dto.especialidadId,
            dto.nombre.trim(),
            dto.descripcion?.trim() ?? null,
            dto.precio,
            dto.duracionMinutos,
            dto.sesiones ?? 1,
            dto.maxPacientesDia ?? null,
            dto.modalidad,
            dto.centroSaludIds,
            dto.ubicacionIds,
            dto.horarioIds
        );

        if (imagenes.length > 0) {
            await this.subirYGuardarImagenes(servicio.id, doctorId, imagenes);
        }

        return (await this.servicioRepository.buscarPorId(servicio.id))!;
    }

    // ─── Obtener ──────────────────────────────────────────────────────────────
    async buscarPorId(id: number): Promise<Servicio> {
        const s = await this.servicioRepository.buscarPorId(id);
        if (!s) throw new Error(`Servicio con ID ${id} no encontrado`);
        return s;
    }

    async listarMisServicios(doctorId: number, filtros?: FiltrosServicioDto): Promise<Servicio[]> {
        return this.listarPorDoctor(doctorId, filtros);
    }

    async listarPorDoctor(doctorId: number, filtros?: FiltrosServicioDto): Promise<Servicio[]> {
        const f: FiltrosServicio = {};
        if (filtros?.especialidadId) f.especialidadId = filtros.especialidadId;
        if (filtros?.estado) f.estado = filtros.estado;
        if (filtros?.precioMin !== undefined) f.precioMin = filtros.precioMin;
        if (filtros?.precioMax !== undefined) f.precioMax = filtros.precioMax;
        return this.servicioRepository.listarPorDoctor(doctorId, f);
    }

    async listarPorCentro(centroId: number, filtros?: FiltrosServicioDto): Promise<Servicio[]> {
        const f: FiltrosServicio = {};
        if (filtros?.especialidadId) f.especialidadId = filtros.especialidadId;
        if (filtros?.estado) f.estado = filtros.estado;
        if (filtros?.precioMin !== undefined) f.precioMin = filtros.precioMin;
        if (filtros?.precioMax !== undefined) f.precioMax = filtros.precioMax;
        return this.servicioRepository.listarPorCentro(centroId, f);
    }

    // ─── Actualizar ───────────────────────────────────────────────────────────
    async actualizar(dto: ActualizarServicioDto, doctorId: number): Promise<Servicio> {
        const existente = await this.servicioRepository.buscarPorId(dto.id);
        if (!existente) throw new Error(`Servicio con ID ${dto.id} no encontrado`);
        if (existente.doctorId !== doctorId) throw new Error('No tienes permiso para modificar este servicio');
        if (existente.estado === 'Eliminado') throw new Error('No se puede modificar un servicio eliminado');

        if (dto.modalidad) this.validarModalidad(dto.modalidad);

        if (dto.estado !== undefined && !['Activo', 'Inactivo'].includes(dto.estado)) {
            throw new Error('Estado inválido. Valores permitidos: Activo, Inactivo');
        }

        return this.servicioRepository.actualizar(dto.id, {
            especialidadId: dto.especialidadId,
            nombre: dto.nombre?.trim(),
            descripcion: dto.descripcion?.trim(),
            precio: dto.precio,
            duracionMinutos: dto.duracionMinutos,
            sesiones: dto.sesiones,
            maxPacientesDia: dto.maxPacientesDia,
            modalidad: dto.modalidad,
            estado: dto.estado,
            centroSaludIds: dto.centroSaludIds,
            ubicacionIds: dto.ubicacionIds,
            horarioIds: dto.horarioIds
        });
    }

    // ─── Eliminar / Desactivar ────────────────────────────────────────────────
    async eliminar(id: number, doctorId: number): Promise<Servicio> {
        await this._verificarPropiedad(id, doctorId);
        return this.servicioRepository.eliminar(id);
    }

    async desactivar(id: number, doctorId: number): Promise<Servicio> {
        const s = await this._verificarPropiedad(id, doctorId);
        if (s.estado === 'Inactivo') throw new Error('El servicio ya está inactivo');
        return this.servicioRepository.desactivar(id);
    }

    // ─── Imágenes ─────────────────────────────────────────────────────────────
    async agregarImagenes(servicioId: number, doctorId: number, imagenes: ImagenUpload[]): Promise<ServicioImagen[]> {
        await this._verificarPropiedad(servicioId, doctorId);
        this.validarImagenes(imagenes);
        const actual = await this.servicioRepository.contarImagenes(servicioId);
        if (actual + imagenes.length > MAX_IMAGENES) {
            throw new Error(`Ya tiene ${actual} imágenes. Máximo: ${MAX_IMAGENES}`);
        }
        return this.subirYGuardarImagenes(servicioId, doctorId, imagenes, actual);
    }

    async eliminarImagen(imagenId: number, servicioId: number, doctorId: number): Promise<void> {
        await this._verificarPropiedad(servicioId, doctorId);
        const imgs = await this.servicioRepository.listarImagenes(servicioId);
        const img = imgs.find(i => i.id === imagenId);
        if (!img) throw new Error(`Imagen ${imagenId} no encontrada en el servicio`);
        try {
            const partes = new URL(img.url).pathname.split('/public-assets/');
            if (partes.length > 1) await this.storageService.deleteFile(partes[1], BUCKET);
        } catch { /* no bloquear si falla Supabase */ }
        await this.servicioRepository.eliminarImagen(imagenId);
    }

    // ─── Validaciones ─────────────────────────────────────────────────────────
    private validarModalidad(modalidad: string): void {
        const permitidos = ['Presencial', 'Teleconsulta', 'Mixta'];
        if (!permitidos.includes(modalidad)) {
            throw new Error(`Modalidad inválida. Valores permitidos: ${permitidos.join(', ')}`);
        }
    }

    private validarImagenes(imgs: ImagenUpload[]): void {
        if (imgs.length > MAX_IMAGENES) throw new Error(`Máximo ${MAX_IMAGENES} imágenes`);
        for (const img of imgs) {
            if (!TIPOS_MIME.includes(img.mimetype)) {
                throw new Error(`Tipo no permitido: ${img.mimetype}`);
            }
            if (img.size > 5 * 1024 * 1024) {
                throw new Error(`${img.originalname} supera el límite de 5MB`);
            }
        }
    }

    private async subirYGuardarImagenes(
        servicioId: number,
        doctorId: number,
        imagenes: ImagenUpload[],
        base = 0
    ): Promise<ServicioImagen[]> {
        const result: ServicioImagen[] = [];
        for (let i = 0; i < imagenes.length; i++) {
            const img = imagenes[i];
            const ext = img.originalname.split('.').pop() ?? 'jpg';
            const path = `servicios/${doctorId}/${servicioId}/${Date.now()}_${i}.${ext}`;
            const url = await this.storageService.uploadFile(img.buffer, path, BUCKET, img.mimetype);
            result.push(await this.servicioRepository.agregarImagen(servicioId, url, base + i));
        }
        return result;
    }

    private async _verificarPropiedad(id: number, doctorId: number): Promise<Servicio> {
        const s = await this.servicioRepository.buscarPorId(id);
        if (!s) throw new Error(`Servicio con ID ${id} no encontrado`);
        if (s.doctorId !== doctorId) throw new Error('No tienes permiso para modificar este servicio');
        return s;
    }

    // ─── Buscar por cercanía geográfica ──────────────────────────────────────
    async buscarCercanos(
        lat: number,
        lng: number,
        radioKm: number,
        filtros?: FiltrosCercania
    ): Promise<(Servicio & { distanciaMetros: number })[]> {
        if (isNaN(lat) || lat < -90 || lat > 90) {
            throw new Error('La latitud debe ser un número entre -90 y 90');
        }
        if (isNaN(lng) || lng < -180 || lng > 180) {
            throw new Error('La longitud debe ser un número entre -180 y 180');
        }
        if (isNaN(radioKm) || radioKm < 0 || radioKm > 15) {
            throw new Error('El radio debe ser un número entre 0 y 15 km');
        }
        return this.servicioRepository.buscarCercanos(lat, lng, radioKm, filtros);
    }
}
