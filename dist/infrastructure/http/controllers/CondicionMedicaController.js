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
exports.CondicionMedicaController = void 0;
const tsyringe_1 = require("tsyringe");
const GestionarCondicionesMedicasUseCase_1 = require("../../../application/use-cases/GestionarCondicionesMedicasUseCase");
let CondicionMedicaController = class CondicionMedicaController {
    constructor(useCase) {
        this.useCase = useCase;
    }
    async crear(req, res) {
        try {
            const { nombre, descripcion, tipo } = req.body;
            const datos = await this.useCase.crear({ nombre, descripcion, tipo });
            res.status(201).json({
                success: true,
                message: 'Condición médica creada exitosamente.',
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
                tipo: req.query.tipo,
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
            const { nombre, descripcion, tipo, estado } = req.body;
            const datos = await this.useCase.actualizar(Number(id), {
                nombre,
                descripcion,
                tipo,
                estado,
            });
            res.status(200).json({
                success: true,
                message: 'Condición médica actualizada exitosamente.',
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
                message: 'Condición médica eliminada exitosamente.',
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    // Métodos para gestión de condiciones de pacientes
    async asignarAPaciente(req, res) {
        try {
            const { condicionId, pacienteId } = req.params;
            const { notas } = req.body;
            const datos = await this.useCase.asignarAPaciente({
                pacienteId: Number(pacienteId),
                condicionId: Number(condicionId),
                notas,
            });
            res.status(201).json({
                success: true,
                message: 'Condición asignada al paciente exitosamente.',
                data: datos,
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    async obtenerCondicionesPaciente(req, res) {
        try {
            const { pacienteId } = req.params;
            const filtros = {
                tipo: req.query.tipo,
                estado: req.query.estado,
            };
            const datos = await this.useCase.obtenerCondicionesPaciente(Number(pacienteId), filtros);
            res.status(200).json({
                success: true,
                data: datos,
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    async actualizarCondicionPaciente(req, res) {
        try {
            const { pacienteId, condicionId } = req.params;
            const { notas, estado } = req.body;
            const datos = await this.useCase.actualizarCondicionPaciente(Number(pacienteId), Number(condicionId), { notas, estado });
            res.status(200).json({
                success: true,
                message: 'Condición del paciente actualizada exitosamente.',
                data: datos,
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    async removerCondicionPaciente(req, res) {
        try {
            const { pacienteId, condicionId } = req.params;
            await this.useCase.removerCondicionPaciente(Number(pacienteId), Number(condicionId));
            res.status(200).json({
                success: true,
                message: 'Condición removida del paciente exitosamente.',
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    // Métodos para Pacientes
    async listarAlergiasDisponibles(req, res) {
        try {
            const alergias = await this.useCase.obtenerAlergias();
            res.json({
                success: true,
                data: alergias
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    async buscarAlergias(req, res) {
        try {
            const query = req.query.q;
            const limite = req.query.limite ? parseInt(req.query.limite) : undefined;
            const alergias = await this.useCase.buscarAlergias({ query, limite });
            res.json({
                success: true,
                data: alergias
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    async agregarMiAlergia(req, res) {
        try {
            const pacienteId = req.user.userId;
            const { condicionId, descripcion } = req.body;
            const alergia = await this.useCase.agregarMiAlergia(pacienteId, {
                condicionId,
                descripcion
            });
            res.status(201).json({
                success: true,
                message: 'Alergia agregada exitosamente.',
                data: alergia
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    async crearMiCondicion(req, res) {
        try {
            const pacienteId = req.user.userId;
            const { descripcion } = req.body;
            const condicion = await this.useCase.crearMiCondicion(pacienteId, { descripcion });
            res.status(201).json({
                success: true,
                message: 'Condición creada exitosamente.',
                data: condicion
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    async obtenerMisCondiciones(req, res) {
        try {
            const pacienteId = req.user.userId;
            const tipo = req.query.tipo;
            const estado = req.query.estado;
            const condiciones = await this.useCase.obtenerMisCondiciones(pacienteId, {
                tipo,
                estado
            });
            res.json({
                success: true,
                data: condiciones
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    async actualizarMiCondicion(req, res) {
        try {
            const pacienteId = req.user.userId;
            const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const condicionId = parseInt(idParam);
            const { descripcion, estado } = req.body;
            const condicion = await this.useCase.actualizarMiCondicion(pacienteId, condicionId, { descripcion, estado });
            res.json({
                success: true,
                message: 'Condición actualizada exitosamente.',
                data: condicion
            });
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    async eliminarMiCondicion(req, res) {
        try {
            const pacienteId = req.user.userId;
            const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const condicionId = parseInt(idParam);
            await this.useCase.eliminarMiCondicion(pacienteId, condicionId);
            res.status(204).send();
        }
        catch (error) {
            this.manejarError(error, res);
        }
    }
    manejarError(error, res) {
        if (error.name === 'CondicionMedicaYaExisteError') {
            res.status(409).json({ success: false, message: error.message });
        }
        else if (error.name === 'CondicionMedicaNoEncontradaError') {
            res.status(404).json({ success: false, message: error.message });
        }
        else if (error.name === 'VerificarValor') {
            res.status(400).json({ success: false, message: error.message });
        }
        else if (error.message.includes('ya está asignada') ||
            error.message.includes('no está asignada') ||
            error.message.includes('ya está registrada') ||
            error.message.includes('no existe en tu perfil') ||
            error.message.includes('no es una alergia')) {
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
exports.CondicionMedicaController = CondicionMedicaController;
exports.CondicionMedicaController = CondicionMedicaController = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)(GestionarCondicionesMedicasUseCase_1.GestionarCondicionesMedicasUseCase)),
    __metadata("design:paramtypes", [GestionarCondicionesMedicasUseCase_1.GestionarCondicionesMedicasUseCase])
], CondicionMedicaController);
