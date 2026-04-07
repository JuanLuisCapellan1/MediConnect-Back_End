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
exports.ActualizarSeguroMedicoUseCase = void 0;
const tsyringe_1 = require("tsyringe");
let ActualizarSeguroMedicoUseCase = class ActualizarSeguroMedicoUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute(id, dto) {
        // Verificar que el seguro existe
        const seguroExistente = await this.repository.obtenerPorId(id);
        if (!seguroExistente) {
            throw new Error(`El seguro con ID ${id} no existe`);
        }
        // Si se está actualizando el nombre, validar que no exista otro con ese nombre
        if (dto.nombre) {
            const nombreExiste = await this.repository.existeNombre(dto.nombre, id);
            if (nombreExiste) {
                throw new Error(`Ya existe otro seguro con el nombre "${dto.nombre}"`);
            }
        }
        return await this.repository.actualizar(id, dto);
    }
};
exports.ActualizarSeguroMedicoUseCase = ActualizarSeguroMedicoUseCase;
exports.ActualizarSeguroMedicoUseCase = ActualizarSeguroMedicoUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('SeguroMedicoRepository')),
    __metadata("design:paramtypes", [Object])
], ActualizarSeguroMedicoUseCase);
