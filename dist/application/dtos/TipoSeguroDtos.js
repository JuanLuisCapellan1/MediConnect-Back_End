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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FiltroTiposSegurosDto = exports.ActualizarTipoSeguroDto = exports.CrearTipoSeguroDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
/**
 * DTOs para Tipos de Seguros
 */
/**
 * DTO para crear un nuevo tipo de seguro
 */
class CrearTipoSeguroDto {
}
exports.CrearTipoSeguroDto = CrearTipoSeguroDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'El nombre del tipo de seguro es requerido' }),
    __metadata("design:type", String)
], CrearTipoSeguroDto.prototype, "nombre", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CrearTipoSeguroDto.prototype, "descripcion", void 0);
/**
 * DTO para actualizar un tipo de seguro existente
 */
class ActualizarTipoSeguroDto {
}
exports.ActualizarTipoSeguroDto = ActualizarTipoSeguroDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ActualizarTipoSeguroDto.prototype, "nombre", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ActualizarTipoSeguroDto.prototype, "descripcion", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['Activo', 'Inactivo'], { message: 'El estado debe ser Activo o Inactivo' }),
    __metadata("design:type", String)
], ActualizarTipoSeguroDto.prototype, "estado", void 0);
/**
 * DTO para filtrar tipos de seguros
 */
class FiltroTiposSegurosDto {
}
exports.FiltroTiposSegurosDto = FiltroTiposSegurosDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FiltroTiposSegurosDto.prototype, "estado", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FiltroTiposSegurosDto.prototype, "busqueda", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], FiltroTiposSegurosDto.prototype, "pagina", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], FiltroTiposSegurosDto.prototype, "limite", void 0);
