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
exports.ProfesionController = void 0;
const tsyringe_1 = require("tsyringe");
const GestionarProfesionesUseCase_1 = require("../../../application/use-cases/GestionarProfesionesUseCase");
const ProfesionYaExisteError_1 = require("../../../domain/errors/Profesiones/ProfesionYaExisteError");
const ProfesionNoEncontradaError_1 = require("../../../domain/errors/Profesiones/ProfesionNoEncontradaError");
let ProfesionController = class ProfesionController {
    constructor(gestionarProfesionesUseCase) {
        this.gestionarProfesionesUseCase = gestionarProfesionesUseCase;
        this.crear = async (req, res) => {
            try {
                const dto = req.body;
                const profesion = await this.gestionarProfesionesUseCase.crear(dto);
                res.status(201).json({
                    message: 'Profesión creada exitosamente',
                    success: true,
                    data: profesion
                });
            }
            catch (error) {
                if (error instanceof ProfesionYaExisteError_1.ProfesionYaExisteError) {
                    res.status(409).json({
                        success: false,
                        message: error.message
                    });
                }
                else if (error.message.includes('requerido') || error.message.includes('inválido')) {
                    res.status(400).json({
                        success: false,
                        message: error.message
                    });
                }
                else {
                    console.error('Error al crear profesión:', error);
                    res.status(500).json({
                        success: false,
                        message: 'Error interno del servidor'
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
                        message: 'ID inválido'
                    });
                    return;
                }
                const profesion = await this.gestionarProfesionesUseCase.obtenerPorId(id);
                res.status(200).json({
                    message: 'Profesión obtenida exitosamente',
                    success: true,
                    data: profesion
                });
            }
            catch (error) {
                if (error instanceof ProfesionNoEncontradaError_1.ProfesionNoEncontradaError) {
                    res.status(404).json({
                        success: false,
                        message: error.message
                    });
                }
                else {
                    console.error('Error al obtener profesión:', error);
                    res.status(500).json({
                        success: false,
                        message: 'Error interno del servidor'
                    });
                }
            }
        };
        this.obtenerTodos = async (req, res) => {
            try {
                const filtro = {
                    estado: req.query.estado,
                    busqueda: req.query.busqueda,
                    pagina: req.query.pagina ? parseInt(req.query.pagina) : undefined,
                    limite: req.query.limite ? parseInt(req.query.limite) : undefined,
                };
                const resultado = await this.gestionarProfesionesUseCase.obtenerTodos(filtro);
                res.status(200).json({
                    message: 'Profesiones obtenidas exitosamente',
                    success: true,
                    data: resultado
                });
            }
            catch (error) {
                if (error.message.includes('inválido')) {
                    res.status(400).json({
                        success: false,
                        message: error.message
                    });
                }
                else {
                    console.error('Error al obtener profesiones:', error);
                    res.status(500).json({
                        success: false,
                        message: 'Error interno del servidor'
                    });
                }
            }
        };
        this.actualizar = async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                if (isNaN(id)) {
                    res.status(400).json({
                        success: false,
                        message: 'ID inválido'
                    });
                    return;
                }
                const dto = req.body;
                const profesion = await this.gestionarProfesionesUseCase.actualizar(id, dto);
                res.status(200).json({
                    message: 'Profesión actualizada exitosamente',
                    success: true,
                    data: profesion
                });
            }
            catch (error) {
                if (error instanceof ProfesionNoEncontradaError_1.ProfesionNoEncontradaError) {
                    res.status(404).json({
                        success: false,
                        message: error.message
                    });
                }
                else if (error instanceof ProfesionYaExisteError_1.ProfesionYaExisteError) {
                    res.status(409).json({
                        success: false,
                        message: error.message
                    });
                }
                else if (error.message.includes('requerido') || error.message.includes('inválido')) {
                    res.status(400).json({
                        success: false,
                        message: error.message
                    });
                }
                else {
                    console.error('Error al actualizar profesión:', error);
                    res.status(500).json({
                        success: false,
                        message: 'Error interno del servidor'
                    });
                }
            }
        };
        this.eliminar = async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                if (isNaN(id)) {
                    res.status(400).json({
                        success: false,
                        message: 'ID inválido'
                    });
                    return;
                }
                await this.gestionarProfesionesUseCase.eliminar(id);
                res.status(200).json({
                    message: 'Profesión eliminada exitosamente',
                    success: true
                });
            }
            catch (error) {
                if (error instanceof ProfesionNoEncontradaError_1.ProfesionNoEncontradaError) {
                    res.status(404).json({
                        success: false,
                        message: error.message
                    });
                }
                else {
                    console.error('Error al eliminar profesión:', error);
                    res.status(500).json({
                        success: false,
                        message: 'Error interno del servidor'
                    });
                }
            }
        };
    }
};
exports.ProfesionController = ProfesionController;
exports.ProfesionController = ProfesionController = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('GestionarProfesionesUseCase')),
    __metadata("design:paramtypes", [GestionarProfesionesUseCase_1.GestionarProfesionesUseCase])
], ProfesionController);
