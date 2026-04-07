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
exports.AprobarRechazarDocumentoDto = void 0;
const class_validator_1 = require("class-validator");
/**
 * DTO para aprobar o rechazar un documento específico
 */
class AprobarRechazarDocumentoDto {
}
exports.AprobarRechazarDocumentoDto = AprobarRechazarDocumentoDto;
__decorate([
    (0, class_validator_1.IsInt)({ message: 'El ID de la acción debe ser un número entero' }),
    __metadata("design:type", Number)
], AprobarRechazarDocumentoDto.prototype, "accionId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['Aprobada', 'Rechazada'], {
        message: 'La decisión debe ser "Aprobada" o "Rechazada"',
    }),
    __metadata("design:type", String)
], AprobarRechazarDocumentoDto.prototype, "decision", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'El comentario debe ser una cadena de texto' }),
    __metadata("design:type", String)
], AprobarRechazarDocumentoDto.prototype, "comentario", void 0);
