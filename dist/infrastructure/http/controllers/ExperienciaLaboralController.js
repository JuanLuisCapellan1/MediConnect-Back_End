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
exports.ExperienciaLaboralController = void 0;
const tsyringe_1 = require("tsyringe");
const GestionarExperienciasLaboralesUseCase_1 = require("../../../application/use-cases/GestionarExperienciasLaboralesUseCase");
const ExperienciaLaboralNoEncontradaError_1 = require("../../../domain/errors/ExperienciasLaborales/ExperienciaLaboralNoEncontradaError");
const FechasInvalidasError_1 = require("../../../domain/errors/ExperienciasLaborales/FechasInvalidasError");
let ExperienciaLaboralController = class ExperienciaLaboralController {
    constructor(gestionarExperienciasLaboralesUseCase) {
        this.gestionarExperienciasLaboralesUseCase = gestionarExperienciasLaboralesUseCase;
        this.crear = async (req, res) => {
            try {
                const doctorId = req.usuarioId; // Obtener doctor autenticado del JWT
                const dto = {
                    ...req.body,
                    doctorId // Asignar doctor autenticado
                };
                const experiencia = await this.gestionarExperienciasLaboralesUseCase.crear(dto);
                res.status(201).json({
                    message: 'Experiencia laboral creada exitosamente',
                    success: true,
                    data: experiencia,
                });
            }
            catch (error) {
                if (error instanceof FechasInvalidasError_1.FechasInvalidasError) {
                    res.status(400).json({
                        success: false,
                        message: error.message,
                    });
                }
                else if (error.message.includes('requerido') ||
                    error.message.includes('inválido') ||
                    error.message.includes('No se encontró') ||
                    error.message.includes('debe') ||
                    error.message.includes('puede')) {
                    res.status(400).json({
                        success: false,
                        message: error.message,
                    });
                }
                else {
                    console.error('Error al crear experiencia laboral:', error);
                    res.status(500).json({
                        success: false,
                        message: 'Error interno del servidor',
                    });
                }
            }
        };
        this.obtenerPorId = async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                if (isNaN(id)) {
                    res.status(400).json({
                        success: false,
                        message: 'ID inválido',
                    });
                    return;
                }
                const experiencia = await this.gestionarExperienciasLaboralesUseCase.obtenerPorId(id);
                res.status(200).json({
                    message: 'Experiencia laboral obtenida exitosamente',
                    success: true,
                    data: experiencia,
                });
            }
            catch (error) {
                if (error instanceof ExperienciaLaboralNoEncontradaError_1.ExperienciaLaboralNoEncontradaError) {
                    res.status(404).json({
                        success: false,
                        message: error.message,
                    });
                }
                else {
                    console.error('Error al obtener experiencia laboral:', error);
                    res.status(500).json({
                        success: false,
                        message: 'Error interno del servidor',
                    });
                }
            }
        };
        this.obtenerTodos = async (req, res) => {
            try {
                const doctorId = req.usuarioId; // Obtener doctor autenticado del JWT
                const filtro = {
                    doctorId, // Filtrar solo por el doctor autenticado
                    estado: req.query.estado || 'Activo', // Por defecto solo mostrar activas
                    busqueda: req.query.busqueda,
                    pagina: req.query.pagina ? parseInt(req.query.pagina) : undefined,
                    limite: req.query.limite ? parseInt(req.query.limite) : undefined,
                };
                const resultado = await this.gestionarExperienciasLaboralesUseCase.obtenerTodos(filtro);
                res.status(200).json({
                    message: 'Experiencias laborales obtenidas exitosamente',
                    success: true,
                    data: resultado,
                });
            }
            catch (error) {
                console.error('Error al obtener experiencias laborales:', error);
                res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor',
                });
            }
        };
        this.actualizar = async (req, res) => {
            try {
                const doctorId = req.usuarioId; // Obtener doctor autenticado del JWT
                const id = parseInt(req.params.id);
                if (isNaN(id)) {
                    res.status(400).json({
                        success: false,
                        message: 'ID inválido',
                    });
                    return;
                }
                // Verificar que la experiencia existe y pertenece al doctor
                const experienciaExistente = await this.gestionarExperienciasLaboralesUseCase.obtenerPorId(id);
                if (experienciaExistente.doctorId !== doctorId) {
                    res.status(403).json({
                        success: false,
                        message: 'No tienes permiso para actualizar esta experiencia laboral',
                    });
                    return;
                }
                const dto = req.body;
                const experiencia = await this.gestionarExperienciasLaboralesUseCase.actualizar(id, dto);
                res.status(200).json({
                    message: 'Experiencia laboral actualizada exitosamente',
                    success: true,
                    data: experiencia,
                });
            }
            catch (error) {
                if (error instanceof ExperienciaLaboralNoEncontradaError_1.ExperienciaLaboralNoEncontradaError) {
                    res.status(404).json({
                        success: false,
                        message: error.message,
                    });
                }
                else if (error instanceof FechasInvalidasError_1.FechasInvalidasError) {
                    res.status(400).json({
                        success: false,
                        message: error.message,
                    });
                }
                else if (error.message.includes('requerido') ||
                    error.message.includes('inválido') ||
                    error.message.includes('debe') ||
                    error.message.includes('puede')) {
                    res.status(400).json({
                        success: false,
                        message: error.message,
                    });
                }
                else {
                    console.error('Error al actualizar experiencia laboral:', error);
                    res.status(500).json({
                        success: false,
                        message: 'Error interno del servidor',
                    });
                }
            }
        };
        this.eliminar = async (req, res) => {
            try {
                const doctorId = req.usuarioId; // Obtener doctor autenticado del JWT
                const id = parseInt(req.params.id);
                if (isNaN(id)) {
                    res.status(400).json({
                        success: false,
                        message: 'ID inválido',
                    });
                    return;
                }
                // Verificar que la experiencia existe y pertenece al doctor
                const experiencia = await this.gestionarExperienciasLaboralesUseCase.obtenerPorId(id);
                if (experiencia.doctorId !== doctorId) {
                    res.status(403).json({
                        success: false,
                        message: 'No tienes permiso para eliminar esta experiencia laboral',
                    });
                    return;
                }
                await this.gestionarExperienciasLaboralesUseCase.eliminar(id);
                res.status(200).json({
                    message: 'Experiencia laboral eliminada exitosamente',
                    success: true,
                });
            }
            catch (error) {
                if (error instanceof ExperienciaLaboralNoEncontradaError_1.ExperienciaLaboralNoEncontradaError) {
                    res.status(404).json({
                        success: false,
                        message: error.message,
                    });
                }
                else {
                    console.error('Error al eliminar experiencia laboral:', error);
                    res.status(500).json({
                        success: false,
                        message: 'Error interno del servidor',
                    });
                }
            }
        };
        /**
         * GET /experiencias-laborales/doctor/:doctorId
         * Obtener todas las experiencias laborales activas de un doctor específico
         * Acceso público (cualquier usuario autenticado puede ver el perfil de un doctor)
         */
        this.obtenerPorDoctor = async (req, res) => {
            try {
                const doctorId = parseInt(req.params.doctorId);
                if (isNaN(doctorId)) {
                    res.status(400).json({
                        success: false,
                        message: 'ID de doctor inválido',
                    });
                    return;
                }
                const filtro = {
                    doctorId,
                    estado: 'Activo',
                    pagina: req.query.pagina ? parseInt(req.query.pagina) : 1,
                    limite: req.query.limite ? parseInt(req.query.limite) : 20,
                };
                const resultado = await this.gestionarExperienciasLaboralesUseCase.obtenerTodos(filtro);
                res.status(200).json({
                    message: 'Experiencias laborales del doctor obtenidas exitosamente',
                    success: true,
                    data: resultado,
                });
            }
            catch (error) {
                console.error('Error al obtener experiencias del doctor:', error);
                res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor',
                });
            }
        };
    }
};
exports.ExperienciaLaboralController = ExperienciaLaboralController;
exports.ExperienciaLaboralController = ExperienciaLaboralController = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('GestionarExperienciasLaboralesUseCase')),
    __metadata("design:paramtypes", [GestionarExperienciasLaboralesUseCase_1.GestionarExperienciasLaboralesUseCase])
], ExperienciaLaboralController);
