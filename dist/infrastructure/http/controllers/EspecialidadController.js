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
exports.EspecialidadController = void 0;
const tsyringe_1 = require("tsyringe");
const GestionarEspecialidadesUseCase_1 = require("../../../application/use-cases/GestionarEspecialidadesUseCase");
let EspecialidadController = class EspecialidadController {
    constructor(useCase) {
        this.useCase = useCase;
    }
    async crear(req, res) {
        try {
            const { nombre, descripcion, estado } = req.body;
            const datos = await this.useCase.crear({ nombre, descripcion, estado });
            res.status(201).json({
                success: true,
                message: 'Especialidad creada exitosamente.',
                data: datos,
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    async obtener(req, res) {
        try {
            const { id } = req.params;
            const datos = await this.useCase.obtenerPorId(Number(id));
            res.status(200).json({
                success: true,
                data: datos,
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    async listar(req, res) {
        try {
            const filtros = {
                nombre: req.query.nombre,
                estado: req.query.estado,
                pagina: req.query.pagina ? Number(req.query.pagina) : 1,
                limite: req.query.limite ? Number(req.query.limite) : 10,
            };
            const { datos, total } = await this.useCase.listar(filtros);
            const totalPaginas = Math.ceil(total / (filtros.limite || 10));
            res.status(200).json({
                success: true,
                data: datos,
                paginacion: {
                    total,
                    pagina: filtros.pagina || 1,
                    limite: filtros.limite || 10,
                    totalPaginas,
                },
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    async actualizar(req, res) {
        try {
            const { id } = req.params;
            const { nombre, descripcion, estado } = req.body;
            const datos = await this.useCase.actualizar(Number(id), {
                nombre,
                descripcion,
                estado,
            });
            res.status(200).json({
                success: true,
                message: 'Especialidad actualizada exitosamente.',
                data: datos,
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    async eliminar(req, res) {
        try {
            const { id } = req.params;
            await this.useCase.eliminar(Number(id));
            res.status(200).json({
                success: true,
                message: 'Especialidad eliminada exitosamente.',
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    manejarError(error, res) {
        if (error.name === 'EspecialidadYaExisteError') {
            res.status(409).json({ success: false, message: error.message });
        }
        else if (error.name === 'EspecialidadNoEncontradaError') {
            res.status(404).json({ success: false, message: error.message });
        }
        else if (error.name === 'VerificarValor') {
            res.status(400).json({ success: false, message: error.message });
        }
        else {
            console.error(error);
            res.status(500).json({
                success: false,
                message: 'Ocurrió un error interno en el servidor.',
            });
        }
    }
};
exports.EspecialidadController = EspecialidadController;
exports.EspecialidadController = EspecialidadController = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(GestionarEspecialidadesUseCase_1.GestionarEspecialidadesUseCase)),
    __metadata("design:paramtypes", [GestionarEspecialidadesUseCase_1.GestionarEspecialidadesUseCase])
], EspecialidadController);
