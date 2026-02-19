/**
 * ServiciosController.ts
 * Controlador HTTP para Servicios médicos
 */

import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { GestionarServiciosUseCase } from '../../../application/use-cases/GestionarServiciosUseCase';
import { CrearServicioDto, ActualizarServicioDto, FiltrosServicioDto } from '../../../application/dtos/ServicioDtos';

export class ServiciosController {
    private gestionarServiciosUseCase: GestionarServiciosUseCase;

    constructor() {
        this.gestionarServiciosUseCase = container.resolve(GestionarServiciosUseCase);
    }

    /**
     * POST /servicios
     * Crea un nuevo servicio. El doctor es el usuario autenticado (JWT).
     */
    async crear(req: Request, res: Response): Promise<void> {
        try {
            const doctorId = req.user?.userId;
            if (!doctorId) {
                res.status(401).json({ success: false, message: 'No autenticado' });
                return;
            }

            const { tipoServicioId, especialidadId, nombre, descripcion, precio, duracionMinutos, maxPacientesDia } = req.body;

            if (!tipoServicioId || isNaN(Number(tipoServicioId))) {
                res.status(400).json({ success: false, message: 'El campo tipoServicioId es requerido y debe ser numérico' });
                return;
            }
            if (!especialidadId || isNaN(Number(especialidadId))) {
                res.status(400).json({ success: false, message: 'El campo especialidadId es requerido y debe ser numérico' });
                return;
            }
            if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0) {
                res.status(400).json({ success: false, message: 'El campo nombre es requerido' });
                return;
            }
            if (precio === undefined || isNaN(Number(precio)) || Number(precio) < 0) {
                res.status(400).json({ success: false, message: 'El campo precio es requerido y debe ser un número positivo' });
                return;
            }
            if (!duracionMinutos || isNaN(Number(duracionMinutos)) || Number(duracionMinutos) <= 0) {
                res.status(400).json({ success: false, message: 'El campo duracionMinutos es requerido y debe ser un número positivo' });
                return;
            }

            // `sedes` puede llegar como string JSON, objeto, o array en multipart/form-data
            const sedes = this.parseSedes(req.body.sedes);


            const dto: CrearServicioDto = {
                tipoServicioId: Number(tipoServicioId),
                especialidadId: Number(especialidadId),
                nombre,
                descripcion,
                precio: Number(precio),
                duracionMinutos: Number(duracionMinutos),
                maxPacientesDia: maxPacientesDia !== undefined ? Number(maxPacientesDia) : undefined,
                sedes
            };

            const archivos = (req.files as Express.Multer.File[]) ?? [];
            const imagenes = archivos.map(f => ({
                buffer: f.buffer,
                originalname: f.originalname,
                mimetype: f.mimetype,
                size: f.size
            }));

            const servicio = await this.gestionarServiciosUseCase.crear(doctorId, dto, imagenes);
            res.status(201).json({
                success: true,
                data: servicio,
                message: 'Servicio creado exitosamente'
            });
        } catch (error) {
            this.manejarError(error, res);
        }
    }

    /**
     * GET /servicios/mis-servicios
     * Lista los servicios del doctor autenticado
     */
    async listarMisServicios(req: Request, res: Response): Promise<void> {
        try {
            const doctorId = req.user?.userId;
            if (!doctorId) {
                res.status(401).json({ success: false, message: 'No autenticado' });
                return;
            }

            const filtros = this.parseFiltros(req);
            const servicios = await this.gestionarServiciosUseCase.listarMisServicios(doctorId, filtros);
            res.status(200).json({
                success: true,
                data: servicios,
                count: servicios.length
            });
        } catch (error) {
            this.manejarError(error, res, 500);
        }
    }

    /**
     * GET /servicios/:id
     * Obtiene el detalle completo de un servicio
     */
    async obtenerDetalle(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(String(req.params.id), 10);
            if (isNaN(id) || id <= 0) {
                res.status(400).json({ success: false, message: 'El ID debe ser un número válido' });
                return;
            }

            const servicio = await this.gestionarServiciosUseCase.buscarPorId(id);
            res.status(200).json({ success: true, data: servicio });
        } catch (error) {
            this.manejarError(error, res, 404);
        }
    }

    /**
     * GET /servicios/doctor/:doctorId
     * Lista los servicios de un doctor (para pacientes/admin)
     */
    async listarPorDoctor(req: Request, res: Response): Promise<void> {
        try {
            const doctorId = parseInt(String(req.params.doctorId), 10);
            if (isNaN(doctorId) || doctorId <= 0) {
                res.status(400).json({ success: false, message: 'El doctorId debe ser un número válido' });
                return;
            }

            const filtros = this.parseFiltros(req);
            const servicios = await this.gestionarServiciosUseCase.listarPorDoctor(doctorId, filtros);
            res.status(200).json({
                success: true,
                data: servicios,
                count: servicios.length
            });
        } catch (error) {
            this.manejarError(error, res, 500);
        }
    }

    /**
     * GET /servicios/centro/:centroId
     * Lista todos los servicios ofrecidos en un centro de salud
     */
    async listarPorCentro(req: Request, res: Response): Promise<void> {
        try {
            const centroId = parseInt(String(req.params.centroId), 10);
            if (isNaN(centroId) || centroId <= 0) {
                res.status(400).json({ success: false, message: 'El centroId debe ser un número válido' });
                return;
            }
            const filtros = this.parseFiltros(req);
            const servicios = await this.gestionarServiciosUseCase.listarPorCentro(centroId, filtros);
            res.status(200).json({
                success: true,
                data: servicios,
                count: servicios.length
            });
        } catch (error) {
            this.manejarError(error, res, 500);
        }
    }


    /**
     * PUT /servicios/:id
     * Actualiza los datos de un servicio (solo el doctor propietario)
     */
    async actualizar(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(String(req.params.id), 10);
            if (isNaN(id) || id <= 0) {
                res.status(400).json({ success: false, message: 'El ID debe ser un número válido' });
                return;
            }

            const doctorId = req.user?.userId;
            if (!doctorId) {
                res.status(401).json({ success: false, message: 'No autenticado' });
                return;
            }

            const dto: ActualizarServicioDto = {
                id,
                tipoServicioId: req.body.tipoServicioId !== undefined ? Number(req.body.tipoServicioId) : undefined,
                especialidadId: req.body.especialidadId !== undefined ? Number(req.body.especialidadId) : undefined,
                nombre: req.body.nombre,
                descripcion: req.body.descripcion,
                precio: req.body.precio !== undefined ? Number(req.body.precio) : undefined,
                duracionMinutos: req.body.duracionMinutos !== undefined ? Number(req.body.duracionMinutos) : undefined,
                maxPacientesDia: req.body.maxPacientesDia !== undefined ? Number(req.body.maxPacientesDia) : undefined,
                estado: req.body.estado,
                // Nuevas sedes con sus horarios (JSON o string JSON)
                sedesAgregar: this.parseSedes(req.body.sedesAgregar),
                // IDs de centros a desactivar
                sedesEliminar: this.parseIds(req.body.sedesEliminar),
                // IDs de horarios existentes a desactivar
                horariosEliminar: this.parseIds(req.body.horariosEliminar)
            };

            const actualizado = await this.gestionarServiciosUseCase.actualizar(dto, doctorId);
            res.status(200).json({
                success: true,
                data: actualizado,
                message: 'Servicio actualizado exitosamente'
            });
        } catch (error) {
            this.manejarError(error, res);
        }
    }

    /**
     * DELETE /servicios/:id
     * Elimina un servicio (soft delete)
     */
    async eliminar(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(String(req.params.id), 10);
            if (isNaN(id) || id <= 0) {
                res.status(400).json({ success: false, message: 'El ID debe ser un número válido' });
                return;
            }

            const doctorId = req.user?.userId;
            if (!doctorId) {
                res.status(401).json({ success: false, message: 'No autenticado' });
                return;
            }

            const eliminado = await this.gestionarServiciosUseCase.eliminar(id, doctorId);
            res.status(200).json({
                success: true,
                data: eliminado,
                message: 'Servicio eliminado exitosamente'
            });
        } catch (error) {
            this.manejarError(error, res);
        }
    }

    /**
     * PATCH /servicios/:id/desactivar
     * Desactiva un servicio (estado → Inactivo)
     */
    async desactivar(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(String(req.params.id), 10);
            if (isNaN(id) || id <= 0) {
                res.status(400).json({ success: false, message: 'El ID debe ser un número válido' });
                return;
            }

            const doctorId = req.user?.userId;
            if (!doctorId) {
                res.status(401).json({ success: false, message: 'No autenticado' });
                return;
            }

            const desactivado = await this.gestionarServiciosUseCase.desactivar(id, doctorId);
            res.status(200).json({
                success: true,
                data: desactivado,
                message: 'Servicio desactivado exitosamente'
            });
        } catch (error) {
            this.manejarError(error, res);
        }
    }

    /**
     * POST /servicios/:id/imagenes
     * Agrega imágenes a un servicio existente
     */
    async agregarImagenes(req: Request, res: Response): Promise<void> {
        try {
            const servicioId = parseInt(String(req.params.id), 10);
            if (isNaN(servicioId) || servicioId <= 0) {
                res.status(400).json({ success: false, message: 'El ID debe ser un número válido' });
                return;
            }

            const doctorId = req.user?.userId;
            if (!doctorId) {
                res.status(401).json({ success: false, message: 'No autenticado' });
                return;
            }

            const archivos = (req.files as Express.Multer.File[]) ?? [];
            if (archivos.length === 0) {
                res.status(400).json({ success: false, message: 'Se requiere al menos una imagen' });
                return;
            }

            const imagenes = archivos.map(f => ({
                buffer: f.buffer,
                originalname: f.originalname,
                mimetype: f.mimetype,
                size: f.size
            }));

            const imagenesGuardadas = await this.gestionarServiciosUseCase.agregarImagenes(servicioId, doctorId, imagenes);
            res.status(201).json({
                success: true,
                data: imagenesGuardadas,
                message: `${imagenesGuardadas.length} imagen(es) agregada(s) exitosamente`
            });
        } catch (error) {
            this.manejarError(error, res);
        }
    }

    /**
     * DELETE /servicios/:id/imagenes/:imagenId
     * Elimina una imagen de un servicio
     */
    async eliminarImagen(req: Request, res: Response): Promise<void> {
        try {
            const servicioId = parseInt(String(req.params.id), 10);
            const imagenId = parseInt(String(req.params.imagenId), 10);

            if (isNaN(servicioId) || servicioId <= 0) {
                res.status(400).json({ success: false, message: 'El servicioId debe ser un número válido' });
                return;
            }
            if (isNaN(imagenId) || imagenId <= 0) {
                res.status(400).json({ success: false, message: 'El imagenId debe ser un número válido' });
                return;
            }

            const doctorId = req.user?.userId;
            if (!doctorId) {
                res.status(401).json({ success: false, message: 'No autenticado' });
                return;
            }

            await this.gestionarServiciosUseCase.eliminarImagen(imagenId, servicioId, doctorId);
            res.status(200).json({
                success: true,
                message: 'Imagen eliminada exitosamente'
            });
        } catch (error) {
            this.manejarError(error, res);
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /** Parsea IDs que pueden venir como array JSON, string CSV o array de strings */
    private parseIds(value: any): number[] | undefined {
        if (value === undefined || value === null) return undefined;
        if (Array.isArray(value)) {
            const nums = value.map(Number).filter(n => !isNaN(n));
            return nums.length ? nums : undefined;
        }
        if (typeof value === 'string') {
            const nums = value.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
            return nums.length ? nums : undefined;
        }
        return undefined;
    }

    /**
     * Parsea el campo `sedes` que puede llegar de múltiples formas en multipart/form-data:
     *   1. Ya parseado como array u objeto (Express lo resolvió)
     *   2. String JSON válido: '[{...},{...}]'
     *   3. Array de strings (múltiples -F sedes=...): cada elemento se parsea y se une
     *   4. Un solo objeto JSON: '{...}' → se envuelve en array
     *   5. Objetos concatenados sin array: '{...},{...}' → se envuelve en '[...]'
     */
    private parseSedes(value: any): any[] | undefined {
        if (value === undefined || value === null) return undefined;

        // Ya es un array de objetos
        if (Array.isArray(value)) {
            // Puede ser string[] (múltiples -F fields) o ya objetos
            const result: any[] = [];
            for (const item of value) {
                if (typeof item === 'string') {
                    const parsed = this.tryParseSedesString(item);
                    if (parsed) result.push(...(Array.isArray(parsed) ? parsed : [parsed]));
                } else if (item && typeof item === 'object') {
                    result.push(item);
                }
            }
            return result.length > 0 ? result : undefined;
        }

        // Es un objeto JS ya parseado
        if (typeof value === 'object') return [value];

        // Es un string
        if (typeof value === 'string') {
            const parsed = this.tryParseSedesString(value);
            if (!parsed) return undefined;
            return Array.isArray(parsed) ? parsed : [parsed];
        }

        return undefined;
    }

    /**
     * Intenta parsear un string como JSON de sedes.
     * Estrategias: directo → envuelto en [...] → cada elemento separado por '},{'.
     */
    private tryParseSedesString(str: string): any | undefined {
        const s = str.trim();
        if (!s) return undefined;

        // Intento 1: parseo directo (ya es JSON válido: array u objeto)
        try { return JSON.parse(s); } catch { /* continuar */ }

        // Intento 2: envolver en array ('{...}' o '{...},{...}')
        try { return JSON.parse(`[${s}]`); } catch { /* continuar */ }

        return undefined;
    }

    /** Parsea un campo JSON genérico (no sedes) */
    private parseJsonField(value: any): any {
        if (value === undefined || value === null) return undefined;
        if (typeof value === 'string') {
            try { return JSON.parse(value); } catch { return undefined; }
        }
        return value;
    }


    private parseFiltros(req: Request): FiltrosServicioDto {
        const filtros: FiltrosServicioDto = {};
        if (req.query.especialidadId) filtros.especialidadId = Number(req.query.especialidadId);
        if (req.query.tipoServicioId) filtros.tipoServicioId = Number(req.query.tipoServicioId);
        if (req.query.estado) filtros.estado = String(req.query.estado);
        if (req.query.precioMin) filtros.precioMin = Number(req.query.precioMin);
        if (req.query.precioMax) filtros.precioMax = Number(req.query.precioMax);
        return filtros;
    }

    private manejarError(error: unknown, res: Response, statusCode: number = 400): void {
        const mensaje = error instanceof Error ? error.message : 'Error inesperado';

        if (mensaje.includes('no encontrado') || mensaje.includes('no existe') || mensaje.includes('no encontrada')) {
            res.status(404).json({ success: false, message: mensaje });
            return;
        }
        if (mensaje.includes('No tienes permiso')) {
            res.status(403).json({ success: false, message: mensaje });
            return;
        }
        // Errores de FK de Prisma (P2003) — reemplazar mensaje técnico por uno amigable
        if (mensaje.includes('Foreign key constraint') || mensaje.includes('P2003')) {
            const friendly = this.friendlyFkMessage(mensaje);
            res.status(400).json({ success: false, message: friendly });
            return;
        }

        res.status(statusCode).json({ success: false, message: mensaje });
    }

    /** Convierte errores de FK de Prisma en mensajes legibles */
    private friendlyFkMessage(raw: string): string {
        if (raw.includes('id_ubicacion') || raw.includes('ubicacion')) {
            return 'La ubicación especificada no existe. Verifica el ubicacionId.';
        }
        if (raw.includes('id_centro_salud') || raw.includes('centros_salud')) {
            return 'El centro de salud especificado no existe. Verifica el centroSaludId.';
        }
        if (raw.includes('id_doctor') || raw.includes('doctores')) {
            return 'El doctor especificado no existe.';
        }
        if (raw.includes('id_especialidad') || raw.includes('especialidades')) {
            return 'La especialidad especificada no existe. Verifica el especialidadId.';
        }
        if (raw.includes('id_tipo_servicio') || raw.includes('tipos_servicios')) {
            return 'El tipo de servicio especificado no existe. Verifica el tipoServicioId.';
        }
        return 'Uno de los IDs proporcionados no existe en la base de datos. Verifica centroSaludId, ubicacionId, especialidadId y tipoServicioId.';
    }
}
