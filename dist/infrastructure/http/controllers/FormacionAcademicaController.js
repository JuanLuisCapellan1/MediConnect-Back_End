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
exports.FormacionAcademicaController = void 0;
const tsyringe_1 = require("tsyringe");
const client_1 = require("@prisma/client");
const GestionarFormacionesAcademicasUseCase_1 = require("../../../application/use-cases/GestionarFormacionesAcademicasUseCase");
const FormacionAcademicaNoEncontradaError_1 = require("../../../domain/errors/FormacionesAcademicas/FormacionAcademicaNoEncontradaError");
const UniversidadNoEncontradaError_1 = require("../../../domain/errors/FormacionesAcademicas/UniversidadNoEncontradaError");
const FechasFormacionInvalidasError_1 = require("../../../domain/errors/FormacionesAcademicas/FechasFormacionInvalidasError");
const FormacionDuplicadaError_1 = require("../../../domain/errors/FormacionesAcademicas/FormacionDuplicadaError");
let FormacionAcademicaController = class FormacionAcademicaController {
    constructor(gestionarFormacionesAcademicasUseCase, prisma) {
        this.gestionarFormacionesAcademicasUseCase = gestionarFormacionesAcademicasUseCase;
        this.prisma = prisma;
        this.crear = async (req, res) => {
            try {
                const doctorId = req.usuarioId; // Obtener doctor autenticado del JWT
                const dto = {
                    ...req.body,
                    doctorId // Asignar doctor autenticado
                };
                const formacion = await this.gestionarFormacionesAcademicasUseCase.crear(dto);
                res.status(201).json({
                    message: 'Formación académica creada exitosamente',
                    success: true,
                    data: formacion,
                });
            }
            catch (error) {
                if (error instanceof UniversidadNoEncontradaError_1.UniversidadNoEncontradaError) {
                    res.status(404).json({
                        success: false,
                        message: error.message,
                    });
                }
                else if (error instanceof FechasFormacionInvalidasError_1.FechasFormacionInvalidasError ||
                    error instanceof FormacionDuplicadaError_1.FormacionDuplicadaError) {
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
                    console.error('Error al crear formación académica:', error);
                    res.status(500).json({
                        success: false,
                        message: 'Error interno del servidor',
                    });
                }
            }
        };
        this.obtenerPorId = async (req, res) => {
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
                const formacion = await this.gestionarFormacionesAcademicasUseCase.obtenerPorId(id);
                // Verificar que la formación pertenece al doctor autenticado
                if (formacion.doctorId !== doctorId) {
                    res.status(403).json({
                        success: false,
                        message: 'No tienes permiso para acceder a esta formación académica',
                    });
                    return;
                }
                res.status(200).json({
                    message: 'Formación académica obtenida exitosamente',
                    success: true,
                    data: formacion,
                });
            }
            catch (error) {
                if (error instanceof FormacionAcademicaNoEncontradaError_1.FormacionAcademicaNoEncontradaError) {
                    res.status(404).json({
                        success: false,
                        message: error.message,
                    });
                }
                else {
                    console.error('Error al obtener formación académica:', error);
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
                const resultado = await this.gestionarFormacionesAcademicasUseCase.obtenerTodos(filtro);
                res.status(200).json({
                    message: 'Formaciones académicas obtenidas exitosamente',
                    success: true,
                    data: resultado,
                });
            }
            catch (error) {
                if (error.message.includes('inválido')) {
                    res.status(400).json({
                        success: false,
                        message: error.message,
                    });
                }
                else {
                    console.error('Error al obtener formaciones académicas:', error);
                    res.status(500).json({
                        success: false,
                        message: 'Error interno del servidor',
                    });
                }
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
                // Verificar que la formación pertenece al doctor autenticado
                const formacionExistente = await this.gestionarFormacionesAcademicasUseCase.obtenerPorId(id);
                if (formacionExistente.doctorId !== doctorId) {
                    res.status(403).json({
                        success: false,
                        message: 'No tienes permiso para actualizar esta formación académica',
                    });
                    return;
                }
                const dto = req.body;
                const formacion = await this.gestionarFormacionesAcademicasUseCase.actualizar(id, dto);
                res.status(200).json({
                    message: 'Formación académica actualizada exitosamente',
                    success: true,
                    data: formacion,
                });
            }
            catch (error) {
                if (error instanceof FormacionAcademicaNoEncontradaError_1.FormacionAcademicaNoEncontradaError) {
                    res.status(404).json({
                        success: false,
                        message: error.message,
                    });
                }
                else if (error instanceof UniversidadNoEncontradaError_1.UniversidadNoEncontradaError) {
                    res.status(404).json({
                        success: false,
                        message: error.message,
                    });
                }
                else if (error instanceof FechasFormacionInvalidasError_1.FechasFormacionInvalidasError ||
                    error instanceof FormacionDuplicadaError_1.FormacionDuplicadaError) {
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
                    console.error('Error al actualizar formación académica:', error);
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
                // Verificar que la formación pertenece al doctor autenticado
                const formacionExistente = await this.gestionarFormacionesAcademicasUseCase.obtenerPorId(id);
                if (formacionExistente.doctorId !== doctorId) {
                    res.status(403).json({
                        success: false,
                        message: 'No tienes permiso para eliminar esta formación académica',
                    });
                    return;
                }
                await this.gestionarFormacionesAcademicasUseCase.eliminar(id);
                res.status(200).json({
                    message: 'Formación académica eliminada exitosamente',
                    success: true,
                });
            }
            catch (error) {
                if (error instanceof FormacionAcademicaNoEncontradaError_1.FormacionAcademicaNoEncontradaError) {
                    res.status(404).json({
                        success: false,
                        message: error.message,
                    });
                }
                else {
                    console.error('Error al eliminar formación académica:', error);
                    res.status(500).json({
                        success: false,
                        message: 'Error interno del servidor',
                    });
                }
            }
        };
        /**
         * GET /formaciones/referencias/paises
         * Obtener todos los países activos
         */
        this.obtenerPaises = async (req, res) => {
            try {
                const paises = await this.prisma.pais.findMany({
                    where: { estado: 'Activo' },
                    select: {
                        id: true,
                        nombre: true,
                    },
                    orderBy: { nombre: 'asc' },
                });
                res.status(200).json({
                    message: 'Países obtenidos exitosamente',
                    success: true,
                    data: paises,
                });
            }
            catch (error) {
                console.error('Error al obtener países:', error);
                res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor',
                });
            }
        };
        /**
         * GET /formaciones/referencias/universidades/:paisId
         * Obtener todas las universidades activas de un país específico
         */
        this.obtenerUniversidadesPorPais = async (req, res) => {
            try {
                const paisId = parseInt(req.params.paisId);
                if (isNaN(paisId)) {
                    res.status(400).json({
                        success: false,
                        message: 'ID del país inválido',
                    });
                    return;
                }
                // Verificar que el país existe
                const paisExiste = await this.prisma.pais.findUnique({
                    where: { id: paisId },
                });
                if (!paisExiste) {
                    res.status(404).json({
                        success: false,
                        message: 'País no encontrado',
                    });
                    return;
                }
                const universidades = await this.prisma.universidad.findMany({
                    where: {
                        paisId,
                        estado: 'Activo',
                    },
                    select: {
                        id: true,
                        nombre: true,
                    },
                    orderBy: { nombre: 'asc' },
                });
                res.status(200).json({
                    message: 'Universidades obtenidas exitosamente',
                    success: true,
                    data: universidades,
                });
            }
            catch (error) {
                console.error('Error al obtener universidades por país:', error);
                res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor',
                });
            }
        };
    }
};
exports.FormacionAcademicaController = FormacionAcademicaController;
exports.FormacionAcademicaController = FormacionAcademicaController = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('GestionarFormacionesAcademicasUseCase')),
    __param(1, (0, tsyringe_1.inject)('PrismaClient')),
    __metadata("design:paramtypes", [GestionarFormacionesAcademicasUseCase_1.GestionarFormacionesAcademicasUseCase,
        client_1.PrismaClient])
], FormacionAcademicaController);
