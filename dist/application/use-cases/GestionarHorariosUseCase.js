"use strict";
/**
 * GestionarHorariosUseCase.ts
 * Casos de uso para la gestión de Horarios
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GestionarHorariosUseCase = void 0;
class GestionarHorariosUseCase {
    constructor(horariosRepository, horarioValidator, estadoValidator) {
        this.horariosRepository = horariosRepository;
        this.horarioValidator = horarioValidator;
        this.estadoValidator = estadoValidator;
    }
    async crear(dto) {
        const { horaInicioDate, horaFinDate } = await this.horarioValidator.validarDatosHorario(dto.doctorId, dto.nombre, dto.diaSemana, dto.horaInicio, dto.horaFin);
        return await this.horariosRepository.crear(dto.doctorId, dto.nombre.trim(), dto.diaSemana, horaInicioDate, horaFinDate);
    }
    async listarTodos() {
        return await this.horariosRepository.listarTodos();
    }
    async listarPorDoctor(doctorId) {
        return await this.horariosRepository.listarPorDoctor(doctorId);
    }
    async listarPorDia(diaSemana) {
        return await this.horariosRepository.listarPorDia(diaSemana);
    }
    async buscarPorId(id) {
        return await this.horariosRepository.buscarPorId(id);
    }
    async actualizar(dto) {
        const existente = await this.horariosRepository.buscarPorId(dto.id);
        if (!existente) {
            throw new Error(`Horario con ID ${dto.id} no existe`);
        }
        const doctorId = dto.doctorId ?? existente.doctorId;
        const nombre = dto.nombre ?? existente.nombre;
        const diaSemana = dto.diaSemana ?? existente.diaSemana;
        const horaInicio = dto.horaInicio ?? this.formatearHora(existente.horaInicio);
        const horaFin = dto.horaFin ?? this.formatearHora(existente.horaFin);
        if (dto.estado) {
            await this.estadoValidator.validarEstado(dto.estado, ['Activo', 'Inactivo', 'Eliminado']);
        }
        const { horaInicioDate, horaFinDate } = await this.horarioValidator.validarDatosHorario(doctorId, nombre, diaSemana, horaInicio, horaFin, dto.id);
        return await this.horariosRepository.actualizar(dto.id, dto.doctorId, dto.nombre?.trim(), dto.diaSemana, dto.horaInicio ? horaInicioDate : undefined, dto.horaFin ? horaFinDate : undefined, dto.estado);
    }
    async eliminar(id) {
        return await this.horariosRepository.eliminar(id);
    }
    async listarPorEstado(estado) {
        await this.estadoValidator.validarEstado(estado, ['Activo', 'Inactivo', 'Eliminado']);
        return await this.horariosRepository.listarPorEstado(estado);
    }
    formatearHora(fecha) {
        const hh = String(fecha.getUTCHours()).padStart(2, '0');
        const mm = String(fecha.getUTCMinutes()).padStart(2, '0');
        const ss = String(fecha.getUTCSeconds()).padStart(2, '0');
        return `${hh}:${mm}:${ss}`;
    }
}
exports.GestionarHorariosUseCase = GestionarHorariosUseCase;
