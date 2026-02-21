"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GestionarServiciosUseCase = void 0;
const MAX_IMAGENES = 10;
const TIPOS_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const BUCKET = 'public-assets';
class GestionarServiciosUseCase {
    constructor(servicioRepository, storageService) {
        this.servicioRepository = servicioRepository;
        this.storageService = storageService;
    }
    // ─── Crear ────────────────────────────────────────────────────────────────
    async crear(doctorId, dto, imagenes = []) {
        this.validarImagenes(imagenes);
        if (dto.sedes)
            this.validarSedes(dto.sedes);
        this.validarModalidad(dto.modalidad);
        const servicio = await this.servicioRepository.crear(doctorId, dto.tipoServicioId, dto.especialidadId, dto.nombre.trim(), dto.descripcion?.trim() ?? null, dto.precio, dto.duracionMinutos, dto.maxPacientesDia ?? null, dto.modalidad, dto.sedes);
        if (imagenes.length > 0) {
            await this.subirYGuardarImagenes(servicio.id, doctorId, imagenes);
        }
        return (await this.servicioRepository.buscarPorId(servicio.id));
    }
    // ─── Obtener ──────────────────────────────────────────────────────────────
    async buscarPorId(id) {
        const s = await this.servicioRepository.buscarPorId(id);
        if (!s)
            throw new Error(`Servicio con ID ${id} no encontrado`);
        return s;
    }
    async listarMisServicios(doctorId, filtros) {
        return this.listarPorDoctor(doctorId, filtros);
    }
    async listarPorDoctor(doctorId, filtros) {
        const f = {};
        if (filtros?.especialidadId)
            f.especialidadId = filtros.especialidadId;
        if (filtros?.tipoServicioId)
            f.tipoServicioId = filtros.tipoServicioId;
        if (filtros?.estado)
            f.estado = filtros.estado;
        if (filtros?.precioMin !== undefined)
            f.precioMin = filtros.precioMin;
        if (filtros?.precioMax !== undefined)
            f.precioMax = filtros.precioMax;
        return this.servicioRepository.listarPorDoctor(doctorId, f);
    }
    /** Obtiene todos los servicios ofrecidos en un centro de salud */
    async listarPorCentro(centroId, filtros) {
        const f = {};
        if (filtros?.especialidadId)
            f.especialidadId = filtros.especialidadId;
        if (filtros?.tipoServicioId)
            f.tipoServicioId = filtros.tipoServicioId;
        if (filtros?.estado)
            f.estado = filtros.estado;
        if (filtros?.precioMin !== undefined)
            f.precioMin = filtros.precioMin;
        if (filtros?.precioMax !== undefined)
            f.precioMax = filtros.precioMax;
        return this.servicioRepository.listarPorCentro(centroId, f);
    }
    // ─── Actualizar ───────────────────────────────────────────────────────────
    async actualizar(dto, doctorId) {
        const existente = await this.servicioRepository.buscarPorId(dto.id);
        if (!existente)
            throw new Error(`Servicio con ID ${dto.id} no encontrado`);
        if (existente.doctorId !== doctorId)
            throw new Error('No tienes permiso para modificar este servicio');
        if (existente.estado === 'Eliminado')
            throw new Error('No se puede modificar un servicio eliminado');
        if (dto.sedesAgregar)
            this.validarSedes(dto.sedesAgregar);
        if (dto.modalidad)
            this.validarModalidad(dto.modalidad);
        if (dto.estado !== undefined && !['Activo', 'Inactivo'].includes(dto.estado)) {
            throw new Error('Estado inválido. Valores permitidos: Activo, Inactivo');
        }
        return this.servicioRepository.actualizar(dto.id, {
            tipoServicioId: dto.tipoServicioId,
            especialidadId: dto.especialidadId,
            nombre: dto.nombre?.trim(),
            descripcion: dto.descripcion?.trim(),
            precio: dto.precio,
            duracionMinutos: dto.duracionMinutos,
            maxPacientesDia: dto.maxPacientesDia,
            modalidad: dto.modalidad,
            estado: dto.estado,
            sedesAgregar: dto.sedesAgregar,
            sedesEliminar: dto.sedesEliminar,
            horariosEliminar: dto.horariosEliminar
        });
    }
    // ─── Eliminar / Desactivar ────────────────────────────────────────────────
    async eliminar(id, doctorId) {
        const s = await this._verificarPropiedad(id, doctorId);
        return this.servicioRepository.eliminar(id);
    }
    async desactivar(id, doctorId) {
        const s = await this._verificarPropiedad(id, doctorId);
        if (s.estado === 'Inactivo')
            throw new Error('El servicio ya está inactivo');
        return this.servicioRepository.desactivar(id);
    }
    // ─── Imágenes ─────────────────────────────────────────────────────────────
    async agregarImagenes(servicioId, doctorId, imagenes) {
        await this._verificarPropiedad(servicioId, doctorId);
        this.validarImagenes(imagenes);
        const actual = await this.servicioRepository.contarImagenes(servicioId);
        if (actual + imagenes.length > MAX_IMAGENES) {
            throw new Error(`Ya tiene ${actual} imágenes. Máximo: ${MAX_IMAGENES}`);
        }
        return this.subirYGuardarImagenes(servicioId, doctorId, imagenes, actual);
    }
    async eliminarImagen(imagenId, servicioId, doctorId) {
        await this._verificarPropiedad(servicioId, doctorId);
        const imgs = await this.servicioRepository.listarImagenes(servicioId);
        const img = imgs.find(i => i.id === imagenId);
        if (!img)
            throw new Error(`Imagen ${imagenId} no encontrada en el servicio`);
        try {
            const partes = new URL(img.url).pathname.split('/public-assets/');
            if (partes.length > 1)
                await this.storageService.deleteFile(partes[1], BUCKET);
        }
        catch { /* no bloquear si falla Supabase */ }
        await this.servicioRepository.eliminarImagen(imagenId);
    }
    // ─── Validaciones ─────────────────────────────────────────────────────────
    /**
     * Valida el array de sedes:
     * - Cada sede tiene centroSaludId XOR ubicacionId (no ambos, no ninguno)
     * - Cada sede tiene al menos un horario
     * - Cada horario tiene horaInicio < horaFin
     * - No hay horarios que se solapen dentro del mismo diaSemana en el conjunto total
     */
    validarSedes(sedes) {
        if (sedes.length === 0)
            return;
        // Mapa por dia para detectar choques entre todas las sedes del request
        const rangosPorDia = new Map();
        for (const sede of sedes) {
            const tieneCentro = sede.centroSaludId !== undefined && sede.centroSaludId !== null;
            const tieneUbicacion = sede.ubicacionId !== undefined && sede.ubicacionId !== null;
            if (tieneCentro && tieneUbicacion) {
                throw new Error('Cada sede debe tener centroSaludId O ubicacionId, no ambos');
            }
            if (!tieneCentro && !tieneUbicacion) {
                throw new Error('Cada sede debe especificar centroSaludId o ubicacionId');
            }
            if (!sede.horarios || sede.horarios.length === 0) {
                const label = tieneCentro ? `centro ${sede.centroSaludId}` : `ubicación ${sede.ubicacionId}`;
                throw new Error(`La sede (${label}) debe tener al menos un horario`);
            }
            for (const h of sede.horarios) {
                this.validarFormatoHorario(h);
                const inicioMin = this.horaAMinutos(h.horaInicio);
                const finMin = this.horaAMinutos(h.horaFin);
                if (inicioMin >= finMin) {
                    throw new Error(`El horario "${h.nombre}" tiene horaInicio >= horaFin`);
                }
                const existentes = rangosPorDia.get(h.diaSemana) ?? [];
                for (const r of existentes) {
                    if (inicioMin < r.fin && finMin > r.inicio) {
                        throw new Error(`El horario "${h.nombre}" (día ${h.diaSemana} ${h.horaInicio}-${h.horaFin}) ` +
                            `choca con "${r.nombre}"`);
                    }
                }
                existentes.push({ inicio: inicioMin, fin: finMin, nombre: h.nombre });
                rangosPorDia.set(h.diaSemana, existentes);
            }
        }
    }
    validarModalidad(modalidad) {
        const permitidos = ['Presencial', 'Teleconsulta', 'Mixta'];
        if (!permitidos.includes(modalidad)) {
            throw new Error(`Modalidad inválida. Valores permitidos: ${permitidos.join(', ')}`);
        }
    }
    validarFormatoHorario(h) {
        const re = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!re.test(h.horaInicio))
            throw new Error(`horaInicio inválida: "${h.horaInicio}" (usa HH:MM)`);
        if (!re.test(h.horaFin))
            throw new Error(`horaFin inválida: "${h.horaFin}" (usa HH:MM)`);
        if (h.diaSemana < 1 || h.diaSemana > 7)
            throw new Error(`diaSemana inválido: ${h.diaSemana} (1-7)`);
        if (!h.nombre?.trim())
            throw new Error('El nombre del horario es requerido');
    }
    horaAMinutos(hora) {
        const [h, m] = hora.split(':').map(Number);
        return h * 60 + m;
    }
    validarImagenes(imgs) {
        if (imgs.length > MAX_IMAGENES)
            throw new Error(`Máximo ${MAX_IMAGENES} imágenes`);
        for (const img of imgs) {
            if (!TIPOS_MIME.includes(img.mimetype)) {
                throw new Error(`Tipo no permitido: ${img.mimetype}`);
            }
            if (img.size > 5 * 1024 * 1024) {
                throw new Error(`${img.originalname} supera el límite de 5MB`);
            }
        }
    }
    async subirYGuardarImagenes(servicioId, doctorId, imagenes, base = 0) {
        const result = [];
        for (let i = 0; i < imagenes.length; i++) {
            const img = imagenes[i];
            const ext = img.originalname.split('.').pop() ?? 'jpg';
            const path = `servicios/${doctorId}/${servicioId}/${Date.now()}_${i}.${ext}`;
            const url = await this.storageService.uploadFile(img.buffer, path, BUCKET, img.mimetype);
            result.push(await this.servicioRepository.agregarImagen(servicioId, url, base + i));
        }
        return result;
    }
    async _verificarPropiedad(id, doctorId) {
        const s = await this.servicioRepository.buscarPorId(id);
        if (!s)
            throw new Error(`Servicio con ID ${id} no encontrado`);
        if (s.doctorId !== doctorId)
            throw new Error('No tienes permiso para modificar este servicio');
        return s;
    }
}
exports.GestionarServiciosUseCase = GestionarServiciosUseCase;
