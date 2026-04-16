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
exports.SuscribirseNewsletterDto = exports.ContactarSoporteDto = void 0;
const class_validator_1 = require("class-validator");
/**
 * DTO para el formulario de contacto público.
 * POST /contacto/enviar
 */
class ContactarSoporteDto {
}
exports.ContactarSoporteDto = ContactarSoporteDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'El nombre es requerido.' }),
    (0, class_validator_1.MaxLength)(100, { message: 'El nombre no puede superar los 100 caracteres.' }),
    __metadata("design:type", String)
], ContactarSoporteDto.prototype, "nombre", void 0);
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: 'Correo electrónico inválido.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El correo es requerido.' }),
    __metadata("design:type", String)
], ContactarSoporteDto.prototype, "correo", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'El asunto es requerido.' }),
    (0, class_validator_1.MaxLength)(150, { message: 'El asunto no puede superar los 150 caracteres.' }),
    __metadata("design:type", String)
], ContactarSoporteDto.prototype, "asunto", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'El mensaje es requerido.' }),
    (0, class_validator_1.MaxLength)(2000, { message: 'El mensaje no puede superar los 2000 caracteres.' }),
    __metadata("design:type", String)
], ContactarSoporteDto.prototype, "mensaje", void 0);
/**
 * DTO para la suscripción al newsletter.
 * POST /contacto/newsletter
 */
class SuscribirseNewsletterDto {
}
exports.SuscribirseNewsletterDto = SuscribirseNewsletterDto;
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: 'Correo electrónico inválido.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'El correo es requerido.' }),
    __metadata("design:type", String)
], SuscribirseNewsletterDto.prototype, "correo", void 0);
