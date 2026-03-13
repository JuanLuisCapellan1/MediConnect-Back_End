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
exports.GestionarUniversidadesUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const Universidad_1 = require("../../domain/entities/Universidad");
let GestionarUniversidadesUseCase = class GestionarUniversidadesUseCase {
    constructor(universidadRepository, paisRepository) {
        this.universidadRepository = universidadRepository;
        this.paisRepository = paisRepository;
    }
    async crear(dto) {
        if (!dto.nombre || dto.nombre.trim() === '') {
            throw new Error('El nombre de la universidad es requerido');
        }
        if (!dto.paisId || isNaN(dto.paisId) || dto.paisId < 1) {
            throw new Error('El ID del país es requerido y debe ser válido');
        }
        // Validar que el país existe
        const paisExiste = await this.paisRepository.obtenerPorId(dto.paisId);
        if (!paisExiste) {
            throw new Error(`País con ID ${dto.paisId} no encontrado`);
        }
        const universidad = new Universidad_1.Universidad({
            nombre: dto.nombre.trim(),
            paisId: dto.paisId,
            estado: 'Activo',
            creadoEn: new Date(),
        });
        return this.universidadRepository.crear(universidad);
    }
    async obtenerPorId(id) {
        if (isNaN(id) || id < 1) {
            throw new Error('ID de universidad inválido');
        }
        const universidad = await this.universidadRepository.obtenerPorId(id);
        if (!universidad) {
            throw new Error(`Universidad con ID ${id} no encontrada`);
        }
        return universidad;
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
        // Si se especifica un paisId, validar que existe
        if (filtro.paisId && filtro.paisId > 0) {
            const paisExiste = await this.paisRepository.obtenerPorId(filtro.paisId);
            if (!paisExiste) {
                throw new Error(`País con ID ${filtro.paisId} no encontrado`);
            }
        }
        return this.universidadRepository.obtenerTodos(filtro.paisId, filtro.estado || 'Activo', filtro.busqueda, pagina, limite);
    }
    async obtenerPorPais(paisId) {
        if (isNaN(paisId) || paisId < 1) {
            throw new Error('ID de país inválido');
        }
        // Validar que el país existe
        const paisExiste = await this.paisRepository.obtenerPorId(paisId);
        if (!paisExiste) {
            throw new Error(`País con ID ${paisId} no encontrado`);
        }
        return this.universidadRepository.obtenerPorPais(paisId);
    }
    async actualizar(id, dto) {
        await this.obtenerPorId(id); // Validar que existe
        if (dto.nombre && dto.nombre.trim() === '') {
            throw new Error('El nombre de la universidad no puede estar vacío');
        }
        // Si se especifica otro país, validar que existe
        if (dto.paisId && dto.paisId > 0) {
            const paisExiste = await this.paisRepository.obtenerPorId(dto.paisId);
            if (!paisExiste) {
                throw new Error(`País con ID ${dto.paisId} no encontrado`);
            }
        }
        const universidadActualizada = new Universidad_1.Universidad({
            nombre: dto.nombre?.trim(),
            paisId: dto.paisId,
            estado: dto.estado,
        });
        return this.universidadRepository.actualizar(id, universidadActualizada);
    }
    async eliminar(id) {
        await this.obtenerPorId(id); // Validar que existe
        await this.universidadRepository.eliminar(id);
    }
};
exports.GestionarUniversidadesUseCase = GestionarUniversidadesUseCase;
exports.GestionarUniversidadesUseCase = GestionarUniversidadesUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('IUniversidadRepository')),
    __param(1, (0, tsyringe_1.inject)('IPaisRepository')),
    __metadata("design:paramtypes", [Object, Object])
], GestionarUniversidadesUseCase);
