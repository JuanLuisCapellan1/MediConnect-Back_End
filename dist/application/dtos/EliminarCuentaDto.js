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
exports.EliminarCuentaDto = void 0;
const class_validator_1 = require("class-validator");
class EliminarCuentaDto {
    constructor(password, confirmacion) {
        this.password = password;
        this.confirmacion = confirmacion;
    }
    /**
     * Valida que la confirmación sea exactamente "ELIMINAR CUENTA"
     */
    validarConfirmacion() {
        return this.confirmacion === 'ELIMINAR CUENTA';
    }
}
exports.EliminarCuentaDto = EliminarCuentaDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'La contraseña es requerida' }),
    (0, class_validator_1.IsString)({ message: 'La contraseña debe ser un texto' }),
    __metadata("design:type", String)
], EliminarCuentaDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'La confirmación es requerida' }),
    (0, class_validator_1.IsString)({ message: 'La confirmación debe ser un texto' }),
    __metadata("design:type", String)
], EliminarCuentaDto.prototype, "confirmacion", void 0);
