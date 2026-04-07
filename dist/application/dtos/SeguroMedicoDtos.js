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
exports.FiltroSegurosDto = exports.AgregarSeguroDoctorDto = exports.AgregarSeguroPacienteDto = exports.ActualizarSeguroMedicoDto = exports.CrearSeguroMedicoDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
/**
 * DTO para crear un seguro médico (Admin)
 */
class CrearSeguroMedicoDto {
}
exports.CrearSeguroMedicoDto = CrearSeguroMedicoDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'El nombre del seguro es requerido' }),
    __metadata("design:type", String)
], CrearSeguroMedicoDto.prototype, "nombre", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CrearSeguroMedicoDto.prototype, "urlImage", void 0);
/**
 * DTO para actualizar un seguro médico (Admin)
 */
class ActualizarSeguroMedicoDto {
}
exports.ActualizarSeguroMedicoDto = ActualizarSeguroMedicoDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ActualizarSeguroMedicoDto.prototype, "nombre", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ActualizarSeguroMedicoDto.prototype, "urlImage", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['Activo', 'Inactivo'], { message: 'El estado debe ser Activo o Inactivo' }),
    __metadata("design:type", String)
], ActualizarSeguroMedicoDto.prototype, "estado", void 0);
/**
 * DTO para agregar un seguro a un paciente (máximo 3)
 */
class AgregarSeguroPacienteDto {
}
exports.AgregarSeguroPacienteDto = AgregarSeguroPacienteDto;
__decorate([
    (0, class_validator_1.IsInt)({ message: 'El ID del seguro debe ser un número entero' }),
    (0, class_validator_1.IsPositive)({ message: 'El ID del seguro debe ser positivo' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], AgregarSeguroPacienteDto.prototype, "idSeguro", void 0);
__decorate([
    (0, class_validator_1.IsInt)({ message: 'El ID del tipo de seguro debe ser un número entero' }),
    (0, class_validator_1.IsPositive)({ message: 'El ID del tipo de seguro debe ser positivo' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], AgregarSeguroPacienteDto.prototype, "idTipoSeguro", void 0);
/**
 * DTO para agregar un seguro a un doctor (ilimitado)
 */
class AgregarSeguroDoctorDto {
}
exports.AgregarSeguroDoctorDto = AgregarSeguroDoctorDto;
__decorate([
    (0, class_validator_1.IsInt)({ message: 'El ID del seguro debe ser un número entero' }),
    (0, class_validator_1.IsPositive)({ message: 'El ID del seguro debe ser positivo' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], AgregarSeguroDoctorDto.prototype, "idSeguro", void 0);
__decorate([
    (0, class_validator_1.IsInt)({ message: 'El ID del tipo de seguro debe ser un número entero' }),
    (0, class_validator_1.IsPositive)({ message: 'El ID del tipo de seguro debe ser positivo' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], AgregarSeguroDoctorDto.prototype, "idTipoSeguro", void 0);
/**
 * DTO para filtrar seguros
 */
class FiltroSegurosDto {
}
exports.FiltroSegurosDto = FiltroSegurosDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FiltroSegurosDto.prototype, "estado", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], FiltroSegurosDto.prototype, "pagina", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], FiltroSegurosDto.prototype, "limite", void 0);
