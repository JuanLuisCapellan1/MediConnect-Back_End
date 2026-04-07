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
exports.PaisController = void 0;
const tsyringe_1 = require("tsyringe");
const GestionarPaisesUseCase_1 = require("../../../application/use-cases/GestionarPaisesUseCase");
let PaisController = class PaisController {
    constructor(gestionarPaisesUseCase) {
        this.gestionarPaisesUseCase = gestionarPaisesUseCase;
        this.crear = async (req, res) => {
            try {
                const dto = req.body;
                const pais = await this.gestionarPaisesUseCase.crear(dto);
                res.status(201).json({
                    message: 'País creado exitosamente',
                    success: true,
                    data: pais,
                });
            }
            catch (error) {
                console.error('Error al crear país:', error);
                res.status(400).json({
                    success: false,
                    message: error.message,
                });
            }
        };
        this.obtenerPorId = async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                const pais = await this.gestionarPaisesUseCase.obtenerPorId(id);
                res.status(200).json({
                    message: 'País obtenido exitosamente',
                    success: true,
                    data: pais,
                });
            }
            catch (error) {
                console.error('Error al obtener país:', error);
                res.status(error.message.includes('no encontrado') ? 404 : 400).json({
                    success: false,
                    message: error.message,
                });
            }
        };
        this.obtenerTodos = async (req, res) => {
            try {
                const filtro = {
                    estado: req.query.estado || 'Activo',
                    busqueda: req.query.busqueda,
                    pagina: req.query.pagina ? parseInt(req.query.pagina) : undefined,
                    limite: req.query.limite ? parseInt(req.query.limite) : undefined,
                };
                const resultado = await this.gestionarPaisesUseCase.obtenerTodos(filtro);
                res.status(200).json({
                    message: 'Países obtenidos exitosamente',
                    success: true,
                    data: resultado,
                });
            }
            catch (error) {
                console.error('Error al obtener países:', error);
                res.status(400).json({
                    success: false,
                    message: error.message,
                });
            }
        };
        this.actualizar = async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                const dto = req.body;
                const pais = await this.gestionarPaisesUseCase.actualizar(id, dto);
                res.status(200).json({
                    message: 'País actualizado exitosamente',
                    success: true,
                    data: pais,
                });
            }
            catch (error) {
                console.error('Error al actualizar país:', error);
                res.status(error.message.includes('no encontrado') ? 404 : 400).json({
                    success: false,
                    message: error.message,
                });
            }
        };
        this.eliminar = async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                await this.gestionarPaisesUseCase.eliminar(id);
                res.status(200).json({
                    message: 'País eliminado exitosamente',
                    success: true,
                });
            }
            catch (error) {
                console.error('Error al eliminar país:', error);
                res.status(error.message.includes('no encontrado') ? 404 : 400).json({
                    success: false,
                    message: error.message,
                });
            }
        };
    }
};
exports.PaisController = PaisController;
exports.PaisController = PaisController = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('GestionarPaisesUseCase')),
    __metadata("design:paramtypes", [GestionarPaisesUseCase_1.GestionarPaisesUseCase])
], PaisController);
