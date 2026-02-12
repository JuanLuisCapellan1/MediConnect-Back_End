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
exports.RegistrarDoctorDto = exports.FormacionAcademicaDto = exports.UbicacionDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class UbicacionDto {
}
exports.UbicacionDto = UbicacionDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'La dirección es requerida' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5, { message: 'La dirección debe tener al menos 5 caracteres' }),
    (0, class_validator_1.MaxLength)(255, { message: 'La dirección no puede exceder 255 caracteres' }),
    __metadata("design:type", String)
], UbicacionDto.prototype, "direccion", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El ID del barrio es requerido' }),
    (0, class_transformer_1.Transform)(({ value }) => Number(value)),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1, { message: 'El ID del barrio debe ser un número positivo' }),
    __metadata("design:type", Number)
], UbicacionDto.prototype, "id_barrio", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value ? Number(value) : null)),
    __metadata("design:type", Object)
], UbicacionDto.prototype, "id_sub_barrio", void 0);
class FormacionAcademicaDto {
}
exports.FormacionAcademicaDto = FormacionAcademicaDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'ID de especialidad requerido' }),
    (0, class_transformer_1.Transform)(({ value }) => Number(value)),
    __metadata("design:type", Number)
], FormacionAcademicaDto.prototype, "id_especialidad", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'ID de universidad requerido' }),
    (0, class_transformer_1.Transform)(({ value }) => Number(value)),
    __metadata("design:type", Number)
], FormacionAcademicaDto.prototype, "id_universidad", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Fecha de inicio requerida' }),
    (0, class_transformer_1.Transform)(({ value }) => new Date(value)),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], FormacionAcademicaDto.prototype, "fecha_inicio", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value ? new Date(value) : null)),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Object)
], FormacionAcademicaDto.prototype, "fecha_finalizacion", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Estado de formación requerido' }),
    (0, class_validator_1.IsEnum)(['Activo', 'Finalizado', 'En curso']),
    __metadata("design:type", String)
], FormacionAcademicaDto.prototype, "estado", void 0);
class RegistrarDoctorDto {
}
exports.RegistrarDoctorDto = RegistrarDoctorDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El nombre es requerido' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
    (0, class_validator_1.MaxLength)(80, { message: 'El nombre no puede exceder 80 caracteres' }),
    __metadata("design:type", String)
], RegistrarDoctorDto.prototype, "nombre", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El apellido es requerido' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2, { message: 'El apellido debe tener al menos 2 caracteres' }),
    (0, class_validator_1.MaxLength)(80, { message: 'El apellido no puede exceder 80 caracteres' }),
    __metadata("design:type", String)
], RegistrarDoctorDto.prototype, "apellido", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El género es requerido' }),
    (0, class_validator_1.IsEnum)(['M', 'F', 'O']),
    __metadata("design:type", String)
], RegistrarDoctorDto.prototype, "genero", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'La fecha de nacimiento es requerida' }),
    (0, class_transformer_1.Transform)(({ value }) => new Date(value)),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], RegistrarDoctorDto.prototype, "fecha_nacimiento", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'La nacionalidad es requerida' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2, { message: 'La nacionalidad debe tener al menos 2 caracteres' }),
    (0, class_validator_1.MaxLength)(80, { message: 'La nacionalidad no puede exceder 80 caracteres' }),
    __metadata("design:type", String)
], RegistrarDoctorDto.prototype, "nacionalidad", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El teléfono es requerido' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(7, { message: 'El teléfono debe tener al menos 7 caracteres' }),
    (0, class_validator_1.MaxLength)(20, { message: 'El teléfono no puede exceder 20 caracteres' }),
    __metadata("design:type", String)
], RegistrarDoctorDto.prototype, "telefono", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El tipo de documento es requerido' }),
    (0, class_validator_1.IsEnum)(['Cédula', 'Pasaporte']),
    __metadata("design:type", String)
], RegistrarDoctorDto.prototype, "tipo_documento", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El número de documento es requerido' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(4, { message: 'El número de documento debe tener al menos 4 caracteres' }),
    (0, class_validator_1.MaxLength)(30, { message: 'El número de documento no puede exceder 30 caracteres' }),
    __metadata("design:type", String)
], RegistrarDoctorDto.prototype, "numero_documento", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'La contraseña es requerida' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8, { message: 'La contraseña debe tener al menos 8 caracteres' }),
    (0, class_validator_1.MaxLength)(100, { message: 'La contraseña no puede exceder 100 caracteres' }),
    __metadata("design:type", String)
], RegistrarDoctorDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'El exequatur es requerido' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3, { message: 'El exequatur debe tener al menos 3 caracteres' }),
    (0, class_validator_1.MaxLength)(60, { message: 'El exequatur no puede exceder 60 caracteres' }),
    __metadata("design:type", String)
], RegistrarDoctorDto.prototype, "exequatur", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegistrarDoctorDto.prototype, "biografia", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'La ubicación es requerida' }),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (typeof value !== 'string')
            return value;
        try {
            const raw = JSON.parse(value);
            const u = new UbicacionDto();
            u.direccion = String(raw.direccion ?? '');
            u.id_barrio = Number(raw.id_barrio);
            u.id_sub_barrio = raw.id_sub_barrio != null && raw.id_sub_barrio !== '' ? Number(raw.id_sub_barrio) : null;
            return u;
        }
        catch (e) {
            throw new Error('ubicacion debe ser un JSON válido');
        }
    }),
    (0, class_validator_1.ValidateNested)(),
    __metadata("design:type", UbicacionDto)
], RegistrarDoctorDto.prototype, "ubicacion", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (!value || value === '')
            return [];
        if (typeof value !== 'string')
            return Array.isArray(value) ? value : [];
        try {
            const parsed = JSON.parse(value);
            const arr = Array.isArray(parsed) ? parsed : [parsed];
            return arr.map((item) => {
                const f = new FormacionAcademicaDto();
                f.id_especialidad = Number(item.id_especialidad);
                f.id_universidad = Number(item.id_universidad);
                f.fecha_inicio = item.fecha_inicio ? new Date(item.fecha_inicio) : new Date();
                f.fecha_finalizacion = item.fecha_finalizacion != null && item.fecha_finalizacion !== '' ? new Date(item.fecha_finalizacion) : null;
                f.estado = String(item.estado ?? '');
                return f;
            });
        }
        catch (e) {
            throw new Error('formaciones debe ser un JSON válido (array)');
        }
    }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], RegistrarDoctorDto.prototype, "formaciones", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'La especialidad principal es requerida' }),
    (0, class_transformer_1.Transform)(({ value }) => Number(value)),
    (0, class_validator_1.IsNumber)({}, { message: 'La especialidad principal debe ser un número' }),
    (0, class_validator_1.Min)(1, { message: 'El ID de la especialidad principal debe ser mayor a 0' }),
    __metadata("design:type", Number)
], RegistrarDoctorDto.prototype, "id_especialidad_principal", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (!value)
            return [];
        if (typeof value !== 'string')
            return Array.isArray(value) ? value : [];
        // Si ya es un array, devolverlo directamente
        if (Array.isArray(value))
            return value.map((id) => Number(id));
        try {
            // Intentar parsear como JSON primero (formato: "[2,3,4]" o "[2, 3, 4]")
            const parsed = JSON.parse(value);
            const arr = Array.isArray(parsed) ? parsed : [];
            return arr.map((id) => Number(id));
        }
        catch (e) {
            // Si falla el JSON, intentar como string separado por comas (formato: "2,3,4" o "2, 3, 4")
            const trimmed = value.trim();
            if (trimmed === '')
                return [];
            const arr = trimmed.split(',').map((id) => id.trim()).filter((id) => id !== '');
            if (arr.length === 0) {
                throw new Error('ids_especialidades_secundarias debe ser un JSON válido (array de números) o números separados por comas');
            }
            return arr.map((id) => Number(id));
        }
    }),
    (0, class_validator_1.IsArray)({ message: 'Las especialidades secundarias deben ser un array' }),
    (0, class_validator_1.IsNumber)({}, { each: true, message: 'Cada especialidad secundaria debe ser un número' }),
    __metadata("design:type", Array)
], RegistrarDoctorDto.prototype, "ids_especialidades_secundarias", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (!value)
            return [];
        if (typeof value !== 'string')
            return Array.isArray(value) ? value : [];
        try {
            return JSON.parse(value);
        }
        catch {
            return [];
        }
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], RegistrarDoctorDto.prototype, "descripciones_documentos", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (!value)
            return [];
        if (typeof value !== 'string')
            return Array.isArray(value) ? value : [];
        try {
            return JSON.parse(value);
        }
        catch {
            return [];
        }
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], RegistrarDoctorDto.prototype, "descripciones_titulos", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (!value)
            return [];
        if (typeof value !== 'string')
            return Array.isArray(value) ? value : [];
        try {
            return JSON.parse(value);
        }
        catch {
            return [];
        }
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], RegistrarDoctorDto.prototype, "descripciones_certificaciones", void 0);
