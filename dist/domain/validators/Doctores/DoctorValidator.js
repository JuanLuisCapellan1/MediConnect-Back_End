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
exports.DoctorValidator = void 0;
const tsyringe_1 = require("tsyringe");
const ExequaturYaExisteError_1 = require("../../errors/Doctores/ExequaturYaExisteError");
const DocumentoDoctorYaExisteError_1 = require("../../errors/Doctores/DocumentoDoctorYaExisteError");
let DoctorValidator = class DoctorValidator {
    constructor(doctorRepository) {
        this.doctorRepository = doctorRepository;
    }
    async validarActualizacion(usuarioId, exequatur, numeroDocumento) {
        if (exequatur) {
            const existeExequatur = await this.doctorRepository.existePorExequatur(exequatur, usuarioId);
            if (existeExequatur) {
                throw new ExequaturYaExisteError_1.ExequaturYaExisteError(exequatur);
            }
        }
        if (numeroDocumento) {
            const existeDocumento = await this.doctorRepository.existePorDocumento(numeroDocumento, usuarioId);
            if (existeDocumento) {
                throw new DocumentoDoctorYaExisteError_1.DocumentoDoctorYaExisteError(numeroDocumento);
            }
        }
    }
};
exports.DoctorValidator = DoctorValidator;
exports.DoctorValidator = DoctorValidator = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('DoctorRepository')),
    __metadata("design:paramtypes", [Object])
], DoctorValidator);
