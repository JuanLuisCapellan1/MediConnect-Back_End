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
exports.RegistrarPacienteDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
/**
 * DTO para registro de pacientes
 * Recibe: multipart/form-data con archivos
 */
class RegistrarPacienteDto {
}
exports.RegistrarPacienteDto = RegistrarPacienteDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El nombre es requerido' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegistrarPacienteDto.prototype, "nombre", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El apellido es requerido' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegistrarPacienteDto.prototype, "apellido", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El número de documento es requerido' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(4, { message: 'El número de documento debe tener al menos 4 caracteres' }),
    (0, class_validator_1.MaxLength)(30, { message: 'El número de documento no puede exceder 30 caracteres' }),
    __metadata("design:type", String)
], RegistrarPacienteDto.prototype, "numero_documento", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El tipo de documento es requerido' }),
    (0, class_validator_1.IsEnum)(['Cédula', 'Pasaporte']),
    __metadata("design:type", String)
], RegistrarPacienteDto.prototype, "tipo_documento", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'La contraseña es requerida' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8, { message: 'La contraseña debe tener al menos 8 caracteres' }),
    (0, class_validator_1.MaxLength)(100, { message: 'La contraseña no puede exceder 100 caracteres' }),
    __metadata("design:type", String)
], RegistrarPacienteDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value ? new Date(value) : undefined)),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], RegistrarPacienteDto.prototype, "fecha_nacimiento", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['M', 'F', 'O']),
    __metadata("design:type", String)
], RegistrarPacienteDto.prototype, "genero", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (value == null || value === '')
            return undefined;
        const num = Number(value);
        if (isNaN(num))
            return undefined;
        // Normalizar: si el valor es <= 10 lo consideramos metros (ej. 1.75 -> 175 cm)
        if (num > 0 && num <= 10)
            return Math.round(num * 100);
        // Si valor está en cm ya (ej. 170)
        return Math.round(num);
    }),
    (0, class_validator_1.Min)(30, { message: 'La altura debe ser al menos 30 cm' }),
    (0, class_validator_1.Max)(300, { message: 'La altura no puede exceder 300 cm' }),
    __metadata("design:type", Number)
], RegistrarPacienteDto.prototype, "altura", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1, { message: 'El peso debe ser mayor a 0' }),
    (0, class_validator_1.Max)(500, { message: 'El peso no puede exceder 500 kg' }),
    (0, class_transformer_1.Transform)(({ value }) => (value ? Number(value) : undefined)),
    __metadata("design:type", Number)
], RegistrarPacienteDto.prototype, "peso", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(7, { message: 'El teléfono debe tener al menos 7 caracteres' }),
    (0, class_validator_1.MaxLength)(20, { message: 'El teléfono no puede exceder 20 caracteres' }),
    __metadata("design:type", String)
], RegistrarPacienteDto.prototype, "telefono", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
    __metadata("design:type", String)
], RegistrarPacienteDto.prototype, "tipo_sangre", void 0);
