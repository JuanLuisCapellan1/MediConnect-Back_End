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
exports.VerificarDocumentoUseCase = void 0;
const tsyringe_1 = require("tsyringe");
let VerificarDocumentoUseCase = class VerificarDocumentoUseCase {
    constructor(usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }
    async execute(numeroDocumento) {
        // Validar que el número de documento no esté vacío
        if (!numeroDocumento || numeroDocumento.trim() === '') {
            throw new Error('El número de documento es requerido');
        }
        // Verificar en la base de datos
        const resultado = await this.usuarioRepository.verificarDocumentoExistente(numeroDocumento.trim());
        return {
            disponible: !resultado.existe,
            tipoUsuario: resultado.tipo,
        };
    }
};
exports.VerificarDocumentoUseCase = VerificarDocumentoUseCase;
exports.VerificarDocumentoUseCase = VerificarDocumentoUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('UsuarioRepository')),
    __metadata("design:paramtypes", [Object])
], VerificarDocumentoUseCase);
