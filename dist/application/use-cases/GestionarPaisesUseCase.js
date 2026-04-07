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
exports.GestionarPaisesUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const Pais_1 = require("../../domain/entities/Pais");
let GestionarPaisesUseCase = class GestionarPaisesUseCase {
    constructor(paisRepository) {
        this.paisRepository = paisRepository;
    }
    async crear(dto) {
        if (!dto.nombre || dto.nombre.trim() === '') {
            throw new Error('El nombre del país es requerido');
        }
        const pais = new Pais_1.Pais({
            nombre: dto.nombre.trim(),
            codigo_iso: dto.codigo_iso?.toUpperCase(),
            estado: 'Activo',
            creadoEn: new Date(),
        });
        return this.paisRepository.crear(pais);
    }
    async obtenerPorId(id) {
        if (isNaN(id) || id < 1) {
            throw new Error('ID de país inválido');
        }
        const pais = await this.paisRepository.obtenerPorId(id);
        if (!pais) {
            throw new Error(`País con ID ${id} no encontrado`);
        }
        return pais;
    }
    async obtenerTodos(filtro) {
        const pagina = filtro.pagina || 1;
        const limite = filtro.limite || 10;
        if (pagina < 1) {
            throw new Error('La página debe ser mayor a 0');
        }
        if (limite < 1 || limite > 1000) {
            throw new Error('El límite debe estar entre 1 y 1000');
        }
        return this.paisRepository.obtenerTodos(filtro.estado || 'Activo', filtro.busqueda, pagina, limite);
    }
    async actualizar(id, dto) {
        await this.obtenerPorId(id); // Validar que existe
        if (dto.nombre && dto.nombre.trim() === '') {
            throw new Error('El nombre del país no puede estar vacío');
        }
        const paisActualizado = new Pais_1.Pais({
            nombre: dto.nombre?.trim(),
            codigo_iso: dto.codigo_iso?.toUpperCase(),
            estado: dto.estado,
        });
        return this.paisRepository.actualizar(id, paisActualizado);
    }
    async eliminar(id) {
        await this.obtenerPorId(id); // Validar que existe
        await this.paisRepository.eliminar(id);
    }
};
exports.GestionarPaisesUseCase = GestionarPaisesUseCase;
exports.GestionarPaisesUseCase = GestionarPaisesUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IPaisRepository')),
    __metadata("design:paramtypes", [Object])
], GestionarPaisesUseCase);
