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
exports.GestionarDoctoresUseCase = void 0;
const tsyringe_1 = require("tsyringe");
const client_1 = require("@prisma/client");
const DoctorValidator_1 = require("../../domain/validators/Doctores/DoctorValidator");
const EstadoValidator_1 = require("../../domain/validators/Estados/EstadoValidator");
const DoctorNoEncontradoError_1 = require("../../domain/errors/Doctores/DoctorNoEncontradoError");
let GestionarDoctoresUseCase = class GestionarDoctoresUseCase {
    constructor(doctorRepository, citaRepository, validator, estadoValidator, prisma) {
        this.doctorRepository = doctorRepository;
        this.citaRepository = citaRepository;
        this.validator = validator;
        this.estadoValidator = estadoValidator;
        this.prisma = prisma;
    }
    async obtenerPorId(id) {
        const doctor = await this.doctorRepository.obtenerPorId(id);
        if (!doctor) {
            throw new DoctorNoEncontradoError_1.DoctorNoEncontradoError(id);
        }
        return doctor;
    }
    async obtenerPorUsuarioId(usuarioId) {
        const doctor = await this.doctorRepository.obtenerPorUsuarioId(usuarioId);
        if (!doctor) {
            throw new DoctorNoEncontradoError_1.DoctorNoEncontradoError(usuarioId);
        }
        return doctor;
    }
    async listar(filtros) {
        // Normalizar estado si existe
        if (filtros.estado) {
            filtros.estado = this.normalizarEstado(filtros.estado);
        }
        // Normalizar estadoVerificacion si existe
        if (filtros.estadoVerificacion) {
            filtros.estadoVerificacion = this.normalizarEstado(filtros.estadoVerificacion);
        }
        return await this.doctorRepository.obtenerTodos(filtros);
    }
    async actualizar(usuarioId, dto) {
        // Verificar que el doctor existe
        const doctor = await this.obtenerPorUsuarioId(usuarioId);
        // Normalizar estado si existe
        if (dto.estado) {
            dto.estado = this.normalizarEstado(dto.estado);
        }
        // Validar campos únicos si se están actualizando
        await this.validator.validarActualizacion(usuarioId);
        let requiereRevisionAdmin = false;
        let razonRevision = '';
        console.log(`[UPDATE DOCTOR] Evaluando doctor ${usuarioId} — estadoVerificacion: ${doctor.estadoVerificacion}, estadoInfoPersonal: ${doctor.estadoInfoPersonal}`);
        const infoPersonalRechazada = doctor.estadoInfoPersonal === 'Rechazado';
        const cuentaRechazada = doctor.estadoVerificacion === 'Rechazado';
        if (cuentaRechazada || infoPersonalRechazada) {
            console.log(`[UPDATE DOCTOR] Re-envío tras rechazo (cuenta=${cuentaRechazada}, infoPersonal=${infoPersonalRechazada}).`);
            requiereRevisionAdmin = true;
            razonRevision = 'El doctor ha corregido su información personal tras ser rechazado previamente.';
        }
        else if (doctor.estadoVerificacion === 'Aprobado') {
            const nombreCambiado = dto.nombre && dto.nombre.trim() !== doctor.nombre;
            const apellidoCambiado = dto.apellido && dto.apellido.trim() !== doctor.apellido;
            console.log(`[UPDATE DOCTOR] Entró por APROBADO. Cambios -> Nombre: ${nombreCambiado}, Apellido: ${apellidoCambiado}`);
            if (nombreCambiado || apellidoCambiado) {
                requiereRevisionAdmin = true;
                razonRevision = 'El doctor, que ya estaba aprobado, ha modificado su Nombre o Apellido, requiriendo validación contra sus documentos.';
            }
        }
        console.log(`[UPDATE DOCTOR] requiereRevisionAdmin final = ${requiereRevisionAdmin}`);
        return await this.prisma.$transaction(async (tx) => {
            let estadoActualizado = dto.estado || doctor.estado;
            let estadoVerifActualizado = doctor.estadoVerificacion;
            if (requiereRevisionAdmin) {
                estadoVerifActualizado = 'En revisión';
            }
            // Realizamos la actualización en la tabla doctores usando Prisma directamente
            // o delegamos las partes posibles a la repo, pero necesitamos transaccionalidad con "Accion"
            const updatePayload = { actualizadoEn: new Date(), estadoVerificacion: estadoVerifActualizado };
            // Si el doctor reenvía info tras rechazo, el estadoInfoPersonal vuelve a 'Pendiente'
            if (requiereRevisionAdmin) {
                updatePayload.estadoInfoPersonal = 'Pendiente';
            }
            if (dto.nombre !== undefined)
                updatePayload.nombre = dto.nombre.trim();
            if (dto.apellido !== undefined)
                updatePayload.apellido = dto.apellido.trim();
            if (dto.fechaNacimiento !== undefined)
                updatePayload.fechaNacimiento = new Date(dto.fechaNacimiento);
            if (dto.nacionalidad !== undefined)
                updatePayload.nacionalidad = dto.nacionalidad?.trim();
            if (dto.biografia !== undefined)
                updatePayload.biografia = dto.biografia;
            if (dto.anosExperiencia !== undefined)
                updatePayload.anosExperiencia = dto.anosExperiencia;
            if (dto.duracionCitaPromedio !== undefined)
                updatePayload.duracionCitaPromedio = dto.duracionCitaPromedio;
            if (dto.tarifas !== undefined)
                updatePayload.tarifas = dto.tarifas;
            if (dto.estado !== undefined)
                updatePayload.estado = dto.estado;
            // También actualizar teléfono en Usuario si viene en el dto (dependiendo de tu lógica normal)
            if (dto.telefono !== undefined)
                updatePayload.usuario = { update: { telefono: dto.telefono.trim() } };
            const docActualizado = await tx.doctor.update({
                where: { usuarioId },
                data: updatePayload,
                include: { usuario: true, especialidades: { include: { especialidades: true } } }
            });
            if (requiereRevisionAdmin) {
                let tipoAccion = await tx.tipoAccion.findFirst({
                    where: { nombre: 'Registro Doctor' },
                });
                if (!tipoAccion) {
                    tipoAccion = await tx.tipoAccion.create({
                        data: { nombre: 'Registro Doctor', estado: 'Activo' }
                    });
                }
                await tx.accion.create({
                    data: {
                        tipoAccionId: tipoAccion.id,
                        emisorId: usuarioId,
                        detalle: 'Revisión de datos del perfil del Doctor',
                        comentarioEmisor: razonRevision,
                        estado: 'Pendiente',
                        fechaEmision: new Date(),
                    },
                });
            }
            return docActualizado;
        });
    }
    async eliminar(usuarioId) {
        // Verificar que el doctor existe
        await this.obtenerPorUsuarioId(usuarioId);
        await this.doctorRepository.eliminar(usuarioId);
    }
    async compararDoctores(ids) {
        if (!ids || ids.length === 0) {
            throw new Error('Debe proporcionar al menos un ID de doctor.');
        }
        if (ids.length > 4) {
            throw new Error('Solo se pueden comparar hasta 4 doctores a la vez.');
        }
        return await this.doctorRepository.compararDoctores(ids);
    }
    normalizarEstado(estado) {
        if (!estado)
            return estado;
        return estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase();
    }
    // ─── ESTADÍSTICAS DE DOCTOR ──────────────────────────────────────────────
    async resumenDoctor(doctorId) {
        return await this.citaRepository.resumenDoctor(doctorId);
    }
    async estadisticasServiciosDoctor(doctorId) {
        return await this.citaRepository.estadisticasServicios(doctorId);
    }
    async productividadDoctor(doctorId, periodo) {
        const periodosValidos = ['semana', 'mes', '3meses', 'año', 'todo'];
        const p = periodosValidos.includes(periodo) ? periodo : 'mes';
        return await this.citaRepository.productividadDoctor(doctorId, p);
    }
    async serviciosMasUtilizados(doctorId) {
        return await this.citaRepository.serviciosMasUtilizados(doctorId);
    }
};
exports.GestionarDoctoresUseCase = GestionarDoctoresUseCase;
exports.GestionarDoctoresUseCase = GestionarDoctoresUseCase = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)('DoctorRepository')),
    __param(1, (0, tsyringe_1.inject)('CitaRepository')),
    __param(2, (0, tsyringe_1.inject)(DoctorValidator_1.DoctorValidator)),
    __param(3, (0, tsyringe_1.inject)(EstadoValidator_1.EstadoValidator)),
    __param(4, (0, tsyringe_1.inject)('PrismaClient')),
    __metadata("design:paramtypes", [Object, Object, DoctorValidator_1.DoctorValidator,
        EstadoValidator_1.EstadoValidator,
        client_1.PrismaClient])
], GestionarDoctoresUseCase);
