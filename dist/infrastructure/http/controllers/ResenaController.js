"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResenaController = void 0;
const tsyringe_1 = require("tsyringe");
const GestionarResenasUseCase_1 = require("../../../application/use-cases/GestionarResenasUseCase");
let ResenaController = class ResenaController {
    constructor(resenasUseCase) {
        this.resenasUseCase = resenasUseCase;
    }
    // POST /resenas — Paciente crea una reseña
    async crear(req, res) {
        try {
            const pacienteId = req.user?.userId;
            if (!pacienteId) {
                res.status(401).json({ success: false, message: 'No autenticado.' });
                return;
            }
            const { servicioId, calificacion, comentario, citaId } = req.body;
            if (!servicioId || calificacion === undefined) {
                res.status(400).json({ success: false, message: 'servicioId y calificacion son requeridos.' });
                return;
            }
            const data = await this.resenasUseCase.crearResena(pacienteId, { servicioId, calificacion, comentario, citaId });
            res.status(201).json({ success: true, data, message: 'Reseña creada exitosamente.' });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    // GET /resenas/servicio/:servicioId — Listar reseñas de un servicio (público)
    async listarPorServicio(req, res) {
        try {
            const servicioId = Number(req.params.servicioId);
            if (isNaN(servicioId)) {
                res.status(400).json({ success: false, message: 'ID de servicio inválido.' });
                return;
            }
            const pagina = req.query.pagina ? Number(req.query.pagina) : 1;
            const limite = req.query.limite ? Number(req.query.limite) : 10;
            const { datos, total } = await this.resenasUseCase.listarPorServicio(servicioId, { pagina, limite });
            res.status(200).json({
                success: true,
                data: datos,
                paginacion: { total, pagina, limite, totalPaginas: Math.ceil(total / limite) }
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    // GET /resenas/doctor/:doctorId — Listar reseñas de un doctor (público)
    async listarPorDoctor(req, res) {
        try {
            const doctorId = Number(req.params.doctorId);
            if (isNaN(doctorId)) {
                res.status(400).json({ success: false, message: 'ID de doctor inválido.' });
                return;
            }
            const pagina = req.query.pagina ? Number(req.query.pagina) : 1;
            const limite = req.query.limite ? Number(req.query.limite) : 10;
            const { datos, total } = await this.resenasUseCase.listarPorDoctor(doctorId, { pagina, limite });
            res.status(200).json({
                success: true,
                data: datos,
                paginacion: { total, pagina, limite, totalPaginas: Math.ceil(total / limite) }
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    // GET /resenas/mis-resenas — Reseñas del paciente autenticado
    async misResenas(req, res) {
        try {
            const pacienteId = req.user?.userId;
            if (!pacienteId) {
                res.status(401).json({ success: false, message: 'No autenticado.' });
                return;
            }
            const data = await this.resenasUseCase.misResenas(pacienteId);
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    // DELETE /resenas/:id — Paciente elimina su propia reseña
    async eliminar(req, res) {
        try {
            const pacienteId = req.user?.userId;
            if (!pacienteId) {
                res.status(401).json({ success: false, message: 'No autenticado.' });
                return;
            }
            const resenaId = Number(req.params.id);
            if (isNaN(resenaId)) {
                res.status(400).json({ success: false, message: 'ID de reseña inválido.' });
                return;
            }
            await this.resenasUseCase.eliminarResena(resenaId, pacienteId);
            res.status(200).json({ success: true, message: 'Reseña eliminada exitosamente.' });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    manejarError(error, res) {
        const msg = error?.message ?? 'Error interno del servidor';
        if (msg.includes('no encontrad') || msg.includes('no existe')) {
            res.status(404).json({ success: false, message: msg });
            return;
        }
        if (msg.includes('No tienes permisos')) {
            res.status(403).json({ success: false, message: msg });
            return;
        }
        if (msg.includes('requerido') || msg.includes('inválido') ||
            msg.includes('ya has calificado') || msg.includes('calificación debe') ||
            msg.includes('no está activo') || msg.includes('no corresponde') ||
            msg.includes('completada') || msg.includes('no existe')) {
            res.status(400).json({ success: false, message: msg });
            return;
        }
        if (error?.code === 'P2025') {
            res.status(404).json({ success: false, message: 'Registro no encontrado.' });
            return;
        }
        if (error?.code === 'P2002') {
            res.status(409).json({ success: false, message: 'Ya existe una reseña para este servicio.' });
            return;
        }
        console.error('Error en ResenaController:', error);
        res.status(500).json({ success: false, message: msg });
    }
};
exports.ResenaController = ResenaController;
exports.ResenaController = ResenaController = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(GestionarResenasUseCase_1.GestionarResenasUseCase)),
    __metadata("design:paramtypes", [GestionarResenasUseCase_1.GestionarResenasUseCase])
], ResenaController);
