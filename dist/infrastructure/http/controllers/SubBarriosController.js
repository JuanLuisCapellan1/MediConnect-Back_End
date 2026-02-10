"use strict";
/**
 * SubBarriosController.ts
 * Controlador HTTP para manejar solicitudes relacionadas con SubBarrios
 * Valida entrada, llama al use case y maneja errores
 */
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
exports.SubBarriosController = void 0;
const tsyringe_1 = require("tsyringe");
const GestionarSubBarriosUseCase_1 = require("../../../application/use-cases/GestionarSubBarriosUseCase");
const SubBarrioYaExisteError_1 = require("../../../domain/errors/SubBarrios/SubBarrioYaExisteError");
let SubBarriosController = class SubBarriosController {
    constructor(useCase) {
        this.useCase = useCase;
    }
    /**
     * POST /subBarrios
     * Crea un nuevo SubBarrio
     */
    async crear(req, res) {
        try {
            const { barrioId, nombre } = req.body;
            // Validación de entrada
            if (!barrioId || isNaN(barrioId) || barrioId <= 0) {
                res.status(400).json({ error: 'El ID del barrio es requerido y debe ser un número válido' });
                return;
            }
            if (!nombre || nombre.trim().length === 0) {
                res.status(400).json({ error: 'El nombre del SubBarrio es requerido' });
                return;
            }
            const dto = { barrioId, nombre: nombre.trim() };
            const subBarrio = await this.useCase.crear(dto);
            res.status(201).json({
                success: true,
                data: subBarrio,
                message: 'SubBarrio creado exitosamente'
            });
        }
        catch (error) {
            if (error instanceof SubBarrioYaExisteError_1.SubBarrioYaExisteError) {
                res.status(409).json({
                    success: false,
                    error: error.message
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        }
    }
    /**
     * GET /subBarrios
     * Lista todos los SubBarrios
     */
    async listar(req, res) {
        try {
            const subBarrios = await this.useCase.listar();
            res.status(200).json({
                success: true,
                data: subBarrios,
                count: subBarrios.length,
                message: 'SubBarrios obtenidos exitosamente'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    /**
     * GET /subBarrios/:id
     * Obtiene un SubBarrio por ID
     */
    async obtenerPorId(req, res) {
        try {
            const { id } = req.params;
            // Validación de entrada
            if (!id || isNaN(Number(id)) || Number(id) <= 0) {
                res.status(400).json({
                    success: false,
                    error: 'El ID del SubBarrio es requerido y debe ser un número válido'
                });
                return;
            }
            const subBarrio = await this.useCase.buscarPorId(Number(id));
            if (!subBarrio) {
                res.status(404).json({
                    success: false,
                    error: 'SubBarrio no encontrado'
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: subBarrio,
                message: 'SubBarrio obtenido exitosamente'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    /**
     * PUT /subBarrios/:id
     * Actualiza un SubBarrio
     */
    async actualizar(req, res) {
        try {
            const { id } = req.params;
            const { barrioId, nombre, estado } = req.body;
            // Validación de entrada
            if (!id || isNaN(Number(id)) || Number(id) <= 0) {
                res.status(400).json({
                    success: false,
                    error: 'El ID del SubBarrio es requerido y debe ser un número válido',
                });
                return;
            }
            if (barrioId !== undefined && (isNaN(barrioId) || barrioId <= 0)) {
                res.status(400).json({
                    success: false,
                    error: 'El ID del barrio debe ser un número válido'
                });
                return;
            }
            const dto = {
                id: Number(id),
                barrioId,
                nombre: nombre ? nombre.trim() : undefined,
                estado,
            };
            const subBarrio = await this.useCase.actualizar(dto);
            res.status(200).json({
                success: true,
                data: subBarrio,
                message: 'SubBarrio actualizado exitosamente'
            });
        }
        catch (error) {
            if (error instanceof SubBarrioYaExisteError_1.SubBarrioYaExisteError) {
                res.status(409).json({
                    success: false,
                    error: error.message
                });
            }
            else if (error.message.includes('no existe')) {
                res.status(404).json({
                    success: false,
                    error: error.message
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        }
    }
    /**
     * DELETE /subBarrios/:id
     * Elimina un SubBarrio (eliminación lógica)
     */
    async eliminar(req, res) {
        try {
            const { id } = req.params;
            // Validación de entrada
            if (!id || isNaN(Number(id)) || Number(id) <= 0) {
                res.status(400).json({
                    success: false,
                    error: 'El ID del SubBarrio es requerido y debe ser un número válido'
                });
                return;
            }
            const subBarrio = await this.useCase.eliminar(Number(id));
            res.status(200).json({
                success: true,
                data: subBarrio,
                message: 'SubBarrio eliminado exitosamente'
            });
        }
        catch (error) {
            if (error.message.includes('no existe')) {
                res.status(404).json({
                    success: false,
                    error: error.message
                });
            }
            else if (error.message.includes('No se puede eliminar')) {
                res.status(400).json({
                    success: false,
                    error: error.message
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        }
    }
    /**
     * GET /subBarrios/barrio/:barrioId
     * Lista todos los SubBarrios de un barrio específico
     */
    async listarPorBarrio(req, res) {
        try {
            const { barrioId } = req.params;
            // Validación de entrada
            if (!barrioId || isNaN(Number(barrioId)) || Number(barrioId) <= 0) {
                res.status(400).json({
                    success: false,
                    error: 'El ID del barrio es requerido y debe ser un número válido'
                });
                return;
            }
            const subBarrios = await this.useCase.listarPorBarrio(Number(barrioId));
            res.status(200).json({
                success: true,
                data: subBarrios,
                count: subBarrios.length,
                message: 'SubBarrios obtenidos exitosamente'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    /**
     * GET /subBarrios/nombre/:nombre/:estado
     * Busca SubBarrios por nombre y estado
     */
    async buscarPorNombre(req, res) {
        try {
            const nombre = String(req.params.nombre || '');
            const estado = String(req.params.estado || '');
            if (!nombre || nombre.trim().length === 0) {
                res.status(400).json({
                    success: false,
                    error: 'El nombre es requerido'
                });
                return;
            }
            const subBarrios = await this.useCase.buscarPorNombre(nombre.trim());
            // Filtrar por estado si se proporciona
            const resultados = estado && estado !== 'Todos'
                ? subBarrios.filter((sb) => sb.estado === estado)
                : subBarrios;
            res.status(200).json({
                success: true,
                data: resultados,
                count: resultados.length,
                message: 'SubBarrios obtenidos exitosamente'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    /**
     * GET /subBarrios/estado/:estado
     * Busca SubBarrios por estado
     */
    async buscarPorEstado(req, res) {
        try {
            const estado = String(req.params.estado || '');
            if (!estado || estado.trim().length === 0) {
                res.status(400).json({
                    success: false,
                    error: 'El estado es requerido'
                });
                return;
            }
            const subBarrios = await this.useCase.buscarPorEstado(estado.trim());
            res.status(200).json({
                success: true,
                data: subBarrios,
                count: subBarrios.length,
                message: 'SubBarrios obtenidos exitosamente'
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
};
exports.SubBarriosController = SubBarriosController;
exports.SubBarriosController = SubBarriosController = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(GestionarSubBarriosUseCase_1.GestionarSubBarriosUseCase)),
    __metadata("design:paramtypes", [GestionarSubBarriosUseCase_1.GestionarSubBarriosUseCase])
], SubBarriosController);
