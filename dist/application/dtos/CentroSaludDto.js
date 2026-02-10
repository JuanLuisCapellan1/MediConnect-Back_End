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
exports.CompletarPerfilCentroSaludDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class CompletarPerfilCentroSaludDto {
}
exports.CompletarPerfilCentroSaludDto = CompletarPerfilCentroSaludDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'La contraseña es requerida' }),
    (0, class_validator_1.IsString)({ message: 'La contraseña debe ser texto' }),
    (0, class_validator_1.MinLength)(8, { message: 'La contraseña debe tener al menos 8 caracteres' }),
    (0, class_validator_1.MaxLength)(100, { message: 'La contraseña no puede exceder 100 caracteres' }),
    __metadata("design:type", String)
], CompletarPerfilCentroSaludDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El nombre del centro es requerido' }),
    (0, class_validator_1.IsString)({ message: 'El nombre debe ser texto' }),
    (0, class_validator_1.MinLength)(3, { message: 'El nombre debe tener al menos 3 caracteres' }),
    (0, class_validator_1.MaxLength)(120, { message: 'El nombre no puede exceder 120 caracteres' }),
    __metadata("design:type", String)
], CompletarPerfilCentroSaludDto.prototype, "nombreComercial", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El teléfono es requerido' }),
    (0, class_validator_1.IsString)({ message: 'El teléfono debe ser texto' }),
    (0, class_validator_1.MinLength)(10, { message: 'El teléfono debe tener al menos 10 caracteres' }),
    (0, class_validator_1.MaxLength)(20, { message: 'El teléfono no puede exceder 20 caracteres' }),
    __metadata("design:type", String)
], CompletarPerfilCentroSaludDto.prototype, "telefono", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({}, { message: 'El sitio web debe ser una URL válida' }),
    __metadata("design:type", String)
], CompletarPerfilCentroSaludDto.prototype, "sitioWeb", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'La descripción debe ser texto' }),
    (0, class_validator_1.MaxLength)(1000, { message: 'La descripción no puede exceder 1000 caracteres' }),
    __metadata("design:type", String)
], CompletarPerfilCentroSaludDto.prototype, "descripcion", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El tipo de centro es requerido' }),
    (0, class_validator_1.IsNumber)({}, { message: 'El tipo de centro debe ser un número' }),
    (0, class_validator_1.IsPositive)({ message: 'El tipo de centro debe ser un ID válido' }),
    (0, class_transformer_1.Transform)(({ value }) => Number(value)),
    __metadata("design:type", Number)
], CompletarPerfilCentroSaludDto.prototype, "tipoCentroId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'La dirección es requerida' }),
    (0, class_validator_1.IsString)({ message: 'La dirección debe ser texto' }),
    (0, class_validator_1.MinLength)(5, { message: 'La dirección debe tener al menos 5 caracteres' }),
    (0, class_validator_1.MaxLength)(255, { message: 'La dirección no puede exceder 255 caracteres' }),
    __metadata("design:type", String)
], CompletarPerfilCentroSaludDto.prototype, "direccion", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El barrio es requerido' }),
    (0, class_validator_1.IsNumber)({}, { message: 'El barrio debe ser un número' }),
    (0, class_validator_1.IsPositive)({ message: 'El barrio debe ser un ID válido' }),
    (0, class_transformer_1.Transform)(({ value }) => Number(value)),
    __metadata("design:type", Number)
], CompletarPerfilCentroSaludDto.prototype, "barrioId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'El sub-barrio debe ser un número' }),
    (0, class_validator_1.IsPositive)({ message: 'El sub-barrio debe ser un ID válido' }),
    (0, class_transformer_1.Transform)(({ value }) => (value ? Number(value) : undefined)),
    __metadata("design:type", Number)
], CompletarPerfilCentroSaludDto.prototype, "subBarrioId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El código postal debe ser texto' }),
    (0, class_validator_1.MaxLength)(10, { message: 'El código postal no puede exceder 10 caracteres' }),
    __metadata("design:type", String)
], CompletarPerfilCentroSaludDto.prototype, "codigoPostal", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El punto geográfico debe ser GeoJSON' }),
    __metadata("design:type", String)
], CompletarPerfilCentroSaludDto.prototype, "puntoGeografico", void 0);
