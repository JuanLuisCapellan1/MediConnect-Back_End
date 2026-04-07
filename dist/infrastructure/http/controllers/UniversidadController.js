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
exports.UniversidadController = void 0;
const tsyringe_1 = require("tsyringe");
const GestionarUniversidadesUseCase_1 = require("../../../application/use-cases/GestionarUniversidadesUseCase");
let UniversidadController = class UniversidadController {
    constructor(gestionarUniversidadesUseCase) {
        this.gestionarUniversidadesUseCase = gestionarUniversidadesUseCase;
        this.crear = async (req, res) => {
            try {
                const dto = req.body;
                const universidad = await this.gestionarUniversidadesUseCase.crear(dto);
                res.status(201).json({
                    message: 'Universidad creada exitosamente',
                    success: true,
                    data: universidad,
                });
            }
            catch (error) {
                console.error('Error al crear universidad:', error);
                res.status(400).json({
                    success: false,
                    message: error.message,
                });
            }
        };
        this.obtenerPorId = async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                const universidad = await this.gestionarUniversidadesUseCase.obtenerPorId(id);
                res.status(200).json({
                    message: 'Universidad obtenida exitosamente',
                    success: true,
                    data: universidad,
                });
            }
            catch (error) {
                console.error('Error al obtener universidad:', error);
                res.status(error.message.includes('no encontrada') ? 404 : 400).json({
                    success: false,
                    message: error.message,
                });
            }
        };
        this.obtenerTodos = async (req, res) => {
            try {
                const filtro = {
                    paisId: req.query.paisId ? parseInt(req.query.paisId) : undefined,
                    estado: req.query.estado || 'Activo',
                    busqueda: req.query.busqueda,
                    pagina: req.query.pagina ? parseInt(req.query.pagina) : undefined,
                    limite: req.query.limite ? parseInt(req.query.limite) : undefined,
                };
                const resultado = await this.gestionarUniversidadesUseCase.obtenerTodos(filtro);
                res.status(200).json({
                    message: 'Universidades obtenidas exitosamente',
                    success: true,
                    data: resultado,
                });
            }
            catch (error) {
                console.error('Error al obtener universidades:', error);
                res.status(400).json({
                    success: false,
                    message: error.message,
                });
            }
        };
        this.obtenerPorPais = async (req, res) => {
            try {
                const paisId = parseInt(req.params.paisId);
                const universidades = await this.gestionarUniversidadesUseCase.obtenerPorPais(paisId);
                res.status(200).json({
                    message: 'Universidades del país obtenidas exitosamente',
                    success: true,
                    data: universidades,
                });
            }
            catch (error) {
                console.error('Error al obtener universidades del país:', error);
                res.status(error.message.includes('no encontrado') ? 404 : 400).json({
                    success: false,
                    message: error.message,
                });
            }
        };
        this.actualizar = async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                const dto = req.body;
                const universidad = await this.gestionarUniversidadesUseCase.actualizar(id, dto);
                res.status(200).json({
                    message: 'Universidad actualizada exitosamente',
                    success: true,
                    data: universidad,
                });
            }
            catch (error) {
                console.error('Error al actualizar universidad:', error);
                res.status(error.message.includes('no encontrada') ? 404 : 400).json({
                    success: false,
                    message: error.message,
                });
            }
        };
        this.eliminar = async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                await this.gestionarUniversidadesUseCase.eliminar(id);
                res.status(200).json({
                    message: 'Universidad eliminada exitosamente',
                    success: true,
                });
            }
            catch (error) {
                console.error('Error al eliminar universidad:', error);
                res.status(error.message.includes('no encontrada') ? 404 : 400).json({
                    success: false,
                    message: error.message,
                });
            }
        };
    }
};
exports.UniversidadController = UniversidadController;
exports.UniversidadController = UniversidadController = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('GestionarUniversidadesUseCase')),
    __metadata("design:paramtypes", [GestionarUniversidadesUseCase_1.GestionarUniversidadesUseCase])
], UniversidadController);
