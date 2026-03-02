import { injectable, inject } from 'tsyringe';
import { ICitaRepository } from '../../domain/repositories/ICitaRepository';
import { IDoctorRepository } from '../../domain/repositories/IDoctorRepository';
import { IPacienteRepository } from '../../domain/repositories/IPacienteRepository';
import { IInactividadRepository } from '../../domain/repositories/IInactividadRepository';
import {
    CrearCitaDto,
    EditarCitaDto,
    CancelarCitaDto,
    ReprogramarCitaDto,
    DiagnosticarCitaDto,
    FiltroCitasDto,
    CrearPeriodoInactividadDto,
} from '../dtos/CitaDtos';

@injectable()
export class GestionarCitasUseCase {
    constructor(
        @inject('CitaRepository') private citaRepo: ICitaRepository,
        @inject('DoctorRepository') private doctorRepo: IDoctorRepository,
        @inject('PacienteRepository') private pacienteRepo: IPacienteRepository,
        @inject('InactividadRepository') private inactividadRepo: IInactividadRepository,
    ) { }

    // ===================================================================
    // Helper: combina una fecha "YYYY-MM-DD" y una hora "HH:MM" en Date UTC
    // ===================================================================
    private _combinarFechaHora(fecha: string, hora: string): Date {
        return new Date(`${fecha}T${hora}:00.000Z`);
    }

    // ===================================================================
    // Helper: aplica la hora de un horario (DateTime con solo hora)
    // sobre una fecha base concreta.
    // ===================================================================
    private _aplicarHoraEnFecha(fechaBase: Date, horaRef: Date): Date {
        const result = new Date(fechaBase);
        result.setUTCHours(horaRef.getUTCHours(), horaRef.getUTCMinutes(), 0, 0);
        return result;
    }

    // ===================================================================
    // Helper: retorna el día de la semana como número 0-6
    // (0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado)
    // Mismo convenio que JavaScript nativo y que horarios_dias.dia_semana
    // ===================================================================
    private _diaSemana(fecha: Date): number {
        return fecha.getUTCDay();
    }

    // ===================================================================
    // Helper: valida formato "YYYY-MM-DD"
    // ===================================================================
    private _validarFecha(fecha: string): void {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
            throw new Error('El campo "fecha" debe tener formato YYYY-MM-DD (ej: "2026-03-10").');
        }
    }

    // ===================================================================
    // Helper: valida formato "HH:MM"
    // ===================================================================
    private _validarHora(hora: string): void {
        if (!/^\d{2}:\d{2}$/.test(hora)) {
            throw new Error('El campo "hora" debe tener formato HH:MM en UTC (ej: "09:00").');
        }
    }

    // ===================================================================
    // PACIENTE: Consultar slots disponibles de un servicio en una fecha
    // GET /servicios/:id/slots?fecha=YYYY-MM-DD
    // ===================================================================
    async obtenerSlotsDisponibles(servicioId: number, fecha: string): Promise<any[]> {
        this._validarFecha(fecha);

        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();

        try {
            const servicio = await prisma.servicio.findUnique({
                where: { id: servicioId },
                include: {
                    horarios: {
                        where: { estado: 'Activo' },
                        include: {
                            horario: {
                                include: { horarios_dias: { select: { dia_semana: true } } },
                            },
                        },
                    },
                },
            });

            if (!servicio || servicio.estado !== 'Activo') {
                throw new Error('El servicio no existe o no está disponible.');
            }

            const fechaBase = new Date(`${fecha}T00:00:00.000Z`);
            const diaRequerido = this._diaSemana(fechaBase);
            const duracion = servicio.duracionMinutos ?? 30;
            const slots: any[] = [];

            for (const sh of servicio.horarios) {
                const horario = sh.horario as any;
                const diasDelHorario: number[] = horario.horarios_dias.map((d: any) => d.dia_semana);

                if (!diasDelHorario.includes(diaRequerido)) continue;

                const horaInicioHorario = new Date(horario.horaInicio);
                const horaFinHorario = new Date(horario.horaFin);

                let cursor = this._aplicarHoraEnFecha(fechaBase, horaInicioHorario);
                const limite = this._aplicarHoraEnFecha(fechaBase, horaFinHorario);

                while (cursor.getTime() + duracion * 60 * 1000 <= limite.getTime()) {
                    const slotInicio = new Date(cursor);
                    const slotFin = new Date(cursor.getTime() + duracion * 60 * 1000);

                    const citasConflicto = await this.citaRepo.obtenerCitasEnRango(
                        servicio.doctorId, slotInicio, slotFin,
                    );
                    const inactividades = await this.inactividadRepo.buscarSolapantes(
                        servicio.doctorId, slotInicio, slotFin,
                    );

                    // Formato legible HH:MM
                    const horaInicioStr = slotInicio.toISOString().substring(11, 16);
                    const horaFinStr = slotFin.toISOString().substring(11, 16);

                    slots.push({
                        horarioId: horario.id,
                        horarioNombre: horario.nombre ?? null,
                        fecha,
                        horaInicio: horaInicioStr,
                        horaFin: horaFinStr,
                        horaInicioISO: slotInicio.toISOString(),
                        horaFinISO: slotFin.toISOString(),
                        disponible: citasConflicto.length === 0 && inactividades.length === 0,
                    });

                    cursor = new Date(slotFin);
                }
            }

            return slots;
        } finally {
            await prisma.$disconnect();
        }
    }

    // ===================================================================
    // PACIENTE: Agendar cita
    // ===================================================================
    async agendarCita(pacienteId: number, dto: CrearCitaDto): Promise<any> {
        this._validarFecha(dto.fecha);
        this._validarHora(dto.hora);

        const fechaInicio = this._combinarFechaHora(dto.fecha, dto.hora);

        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();

        try {
            const servicio = await prisma.servicio.findUnique({
                where: { id: dto.servicioId },
                include: {
                    doctor: {
                        include: {
                            segurosAceptados: { where: { estado: 'Activo' } },
                        },
                    },
                    horarios: {
                        where: { estado: 'Activo' },
                        include: {
                            horario: {
                                include: { horarios_dias: { select: { dia_semana: true } } },
                            },
                        },
                    },
                },
            });

            if (!servicio || servicio.estado !== 'Activo') {
                throw new Error('El servicio no existe o no está disponible.');
            }

            const doctorId = servicio.doctorId;

            // 1. Validar que el horario pertenece al servicio
            const horarioVinculado = servicio.horarios.find(
                (sh: any) => sh.horarioId === dto.horarioId,
            );
            if (!horarioVinculado) {
                throw new Error('El horario seleccionado no está disponible para este servicio.');
            }

            const horario = horarioVinculado.horario as any;
            const diasDelHorario: number[] = horario.horarios_dias.map((d: any) => d.dia_semana);

            // 2. Validar día de semana
            const diaSolicitado = this._diaSemana(fechaInicio);
            if (!diasDelHorario.includes(diaSolicitado)) {
                throw new Error('El servicio no está disponible ese día de la semana.');
            }

            // 3. Validar franja horaria
            const horaInicioHorario = this._aplicarHoraEnFecha(fechaInicio, new Date(horario.horaInicio));
            const horaFinHorario = this._aplicarHoraEnFecha(fechaInicio, new Date(horario.horaFin));
            const duracion = servicio.duracionMinutos ?? 30;
            const fechaFinEstimada = new Date(fechaInicio.getTime() + duracion * 60 * 1000);

            if (fechaInicio < horaInicioHorario || fechaFinEstimada > horaFinHorario) {
                throw new Error(
                    `La hora seleccionada está fuera del horario del servicio ` +
                    `(${horario.horaInicio?.toISOString().substring(11, 16)} – ` +
                    `${horario.horaFin?.toISOString().substring(11, 16)} UTC).`,
                );
            }

            // 4. Validar periodo de inactividad
            const inactividades = await this.inactividadRepo.buscarSolapantes(
                doctorId, fechaInicio, fechaFinEstimada,
            );
            if (inactividades.length > 0) {
                throw new Error('El doctor no está disponible en esa franja horaria (periodo de inactividad).');
            }

            // 5. Validar conflicto con otras citas del doctor
            const conflictos = await this.citaRepo.obtenerCitasEnRango(
                doctorId, fechaInicio, fechaFinEstimada,
            );
            if (conflictos.length > 0) {
                throw new Error(
                    'El doctor ya tiene una cita programada en ese horario. ' +
                    'Usa GET /servicios/:id/slots?fecha=YYYY-MM-DD para ver los slots disponibles.',
                );
            }

            // 6. Validar seguro
            if (dto.seguroId && dto.tipoSeguroId) {
                const pacienteSeguro = await prisma.pacienteSeguro.findFirst({
                    where: {
                        pacienteId,
                        seguroId: dto.seguroId,
                        tipoSeguroId: dto.tipoSeguroId,
                        estado: 'Activo',
                    },
                });
                if (!pacienteSeguro) {
                    throw new Error('El paciente no tiene el seguro seleccionado activo.');
                }
                const doctorSeguro = await prisma.doctorSeguro.findFirst({
                    where: { doctorId, seguroId: dto.seguroId, estado: 'Activo' },
                });
                if (!doctorSeguro) {
                    throw new Error('El doctor no acepta el seguro seleccionado.');
                }
            }

            // 7. Calcular total y crear cita
            const numPacientes = dto.numPacientes ?? 1;
            const totalAPagar = parseFloat(servicio.precio.toString()) * numPacientes;

            return await this.citaRepo.crear({
                pacienteId,
                doctorId,
                servicioId: dto.servicioId,
                horarioId: dto.horarioId,
                fechaInicio,
                modalidad: dto.modalidad,
                numPacientes,
                seguroId: dto.seguroId,
                tipoSeguroId: dto.tipoSeguroId,
                motivoConsulta: dto.motivoConsulta,
                totalAPagar,
            });
        } finally {
            await prisma.$disconnect();
        }
    }

    // ===================================================================
    // PACIENTE: Listar sus citas
    // ===================================================================
    async listarCitasPaciente(
        pacienteId: number,
        filtros: FiltroCitasDto,
    ): Promise<{ datos: any[]; total: number }> {
        return await this.citaRepo.listarPorPaciente(pacienteId, {
            estado: filtros.estado,
            pagina: filtros.pagina,
            limite: filtros.limite,
            fechaDesde: filtros.fechaDesde ? new Date(filtros.fechaDesde) : undefined,
            fechaHasta: filtros.fechaHasta ? new Date(filtros.fechaHasta) : undefined,
        });
    }

    // ===================================================================
    // DOCTOR: Listar sus citas
    // ===================================================================
    async listarCitasDoctor(
        doctorId: number,
        filtros: FiltroCitasDto,
    ): Promise<{ datos: any[]; total: number }> {
        return await this.citaRepo.listarPorDoctor(doctorId, {
            estado: filtros.estado,
            pagina: filtros.pagina,
            limite: filtros.limite,
            fechaDesde: filtros.fechaDesde ? new Date(filtros.fechaDesde) : undefined,
            fechaHasta: filtros.fechaHasta ? new Date(filtros.fechaHasta) : undefined,
        });
    }

    // ===================================================================
    // AMBOS: Detalle de una cita
    // ===================================================================
    async obtenerDetalleCita(
        citaId: number,
        usuarioId: number,
        rol: 'Paciente' | 'Doctor',
    ): Promise<any> {
        const cita = await this.citaRepo.buscarPorId(citaId);
        if (!cita) throw new Error('Cita no encontrada.');

        if (rol === 'Paciente' && cita.pacienteId !== usuarioId) {
            throw new Error('No tienes permisos para ver esta cita.');
        }
        if (rol === 'Doctor' && cita.doctorUsuarioId !== usuarioId) {
            throw new Error('No tienes permisos para ver esta cita.');
        }

        return cita;
    }

    // ===================================================================
    // PACIENTE: Editar cita (solo si Programada)
    // ===================================================================
    async editarCita(citaId: number, pacienteId: number, dto: EditarCitaDto): Promise<any> {
        const cita = await this.citaRepo.buscarPorId(citaId);
        if (!cita) throw new Error('Cita no encontrada.');
        if (cita.pacienteId !== pacienteId) {
            throw new Error('No tienes permisos para editar esta cita.');
        }
        if (cita.estado !== 'Programada') {
            throw new Error('Solo puedes editar citas en estado Programada.');
        }

        const actualizacion: any = {};

        // Combinar fecha+hora si se envían
        if (dto.fecha !== undefined || dto.hora !== undefined) {
            const fecha = dto.fecha ?? cita.fechaInicio.toISOString().substring(0, 10);
            const hora = dto.hora ?? cita.fechaInicio.toISOString().substring(11, 16);
            if (dto.fecha) this._validarFecha(dto.fecha);
            if (dto.hora) this._validarHora(dto.hora);
            actualizacion.fechaInicio = this._combinarFechaHora(fecha, hora);
        }

        if (dto.horarioId !== undefined) actualizacion.horarioId = dto.horarioId;
        if (dto.modalidad !== undefined) actualizacion.modalidad = dto.modalidad;
        if (dto.numPacientes !== undefined) actualizacion.numPacientes = dto.numPacientes;
        if (dto.seguroId !== undefined) actualizacion.seguroId = dto.seguroId;
        if (dto.tipoSeguroId !== undefined) actualizacion.tipoSeguroId = dto.tipoSeguroId;
        if (dto.motivoConsulta !== undefined) actualizacion.motivoConsulta = dto.motivoConsulta;

        if (dto.numPacientes !== undefined || dto.servicioId !== undefined) {
            const { PrismaClient } = await import('@prisma/client');
            const prisma = new PrismaClient();
            const servicioId = dto.servicioId ?? cita.servicioId;
            const servicio = await prisma.servicio.findUnique({ where: { id: servicioId } });
            if (!servicio) { await prisma.$disconnect(); throw new Error('Servicio no encontrado.'); }
            const numPacientes = dto.numPacientes ?? cita.numPacientes ?? 1;
            actualizacion.totalAPagar = parseFloat(servicio.precio.toString()) * numPacientes;
            if (dto.servicioId !== undefined) actualizacion.servicioId = dto.servicioId;
            await prisma.$disconnect();
        }

        return await this.citaRepo.actualizar(citaId, actualizacion);
    }

    // ===================================================================
    // AMBOS: Cancelar cita
    // ===================================================================
    async cancelarCita(
        citaId: number,
        usuarioId: number,
        rol: 'Paciente' | 'Doctor',
        dto: CancelarCitaDto,
    ): Promise<any> {
        const cita = await this.citaRepo.buscarPorId(citaId);
        if (!cita) throw new Error('Cita no encontrada.');

        if (rol === 'Paciente' && cita.pacienteId !== usuarioId) {
            throw new Error('No tienes permisos para cancelar esta cita.');
        }
        if (rol === 'Doctor' && cita.doctorUsuarioId !== usuarioId) {
            throw new Error('No tienes permisos para cancelar esta cita.');
        }
        if (!['Programada', 'Reprogramada'].includes(cita.estado)) {
            throw new Error('Solo se pueden cancelar citas en estado Programada o Reprogramada.');
        }
        if (!dto.motivoCancelacion?.trim()) {
            throw new Error('El motivo de cancelación es requerido.');
        }

        return await this.citaRepo.actualizar(citaId, {
            estado: 'Cancelada',
            motivoCancelacion: dto.motivoCancelacion,
        });
    }

    // ===================================================================
    // DOCTOR: Reprogramar cita (fecha + hora separadas)
    // ===================================================================
    async reprogramarCita(
        citaId: number,
        doctorId: number,
        dto: ReprogramarCitaDto,
    ): Promise<any> {
        this._validarFecha(dto.fecha);
        this._validarHora(dto.hora);

        const cita = await this.citaRepo.buscarPorId(citaId);
        if (!cita) throw new Error('Cita no encontrada.');
        if (cita.doctorUsuarioId !== doctorId) {
            throw new Error('No tienes permisos para reprogramar esta cita.');
        }
        if (!['Programada', 'Reprogramada'].includes(cita.estado)) {
            throw new Error('Solo se pueden reprogramar citas en estado Programada o Reprogramada.');
        }

        const nuevaFechaInicio = this._combinarFechaHora(dto.fecha, dto.hora);

        return await this.citaRepo.actualizar(citaId, {
            horarioId: dto.horarioId,
            fechaInicio: nuevaFechaInicio,
            fechaFin: null,
            estado: 'Reprogramada',
        });
    }

    // ===================================================================
    // DOCTOR: Diagnosticar (marca fechaFin=now y completa la cita)
    // ===================================================================
    async diagnosticarCita(
        citaId: number,
        doctorId: number,
        dto: DiagnosticarCitaDto,
    ): Promise<any> {
        const cita = await this.citaRepo.buscarPorId(citaId);
        if (!cita) throw new Error('Cita no encontrada.');
        if (cita.doctorUsuarioId !== doctorId) {
            throw new Error('No tienes permisos para diagnosticar esta cita.');
        }
        if (!['Programada', 'En Progreso', 'Reprogramada'].includes(cita.estado)) {
            throw new Error('Solo puedes diagnosticar citas en estado Programada, En Progreso o Reprogramada.');
        }

        const historialExistente = await this.citaRepo.buscarHistorialPorCita(citaId);
        let historial: any;

        if (historialExistente) {
            const { PrismaClient } = await import('@prisma/client');
            const prisma = new PrismaClient();
            historial = await prisma.historialConsulta.update({
                where: { citaId },
                data: {
                    resumen: dto.resumen,
                    diagnostico: dto.diagnostico,
                    tratamiento: dto.tratamiento,
                    observacion: dto.observacion,
                    actualizadoEn: new Date(),
                },
            });
            await prisma.$disconnect();
        } else {
            historial = await this.citaRepo.crearHistorial({
                citaId,
                pacienteId: cita.pacienteId,
                resumen: dto.resumen,
                diagnostico: dto.diagnostico,
                tratamiento: dto.tratamiento,
                observacion: dto.observacion,
            });
        }

        await this.citaRepo.actualizar(citaId, {
            estado: 'Completada',
            fechaFin: new Date(),
        });

        return historial;
    }

    // ===================================================================
    // PACIENTE / DOCTOR: Historial de una cita específica
    // ===================================================================
    async obtenerHistorialCita(
        citaId: number,
        usuarioId: number,
        rol: 'Paciente' | 'Doctor',
    ): Promise<any> {
        const cita = await this.citaRepo.buscarPorId(citaId);
        if (!cita) throw new Error('Cita no encontrada.');

        if (rol === 'Paciente' && cita.pacienteId !== usuarioId) {
            throw new Error('No tienes permisos para ver el historial de esta cita.');
        }
        if (rol === 'Doctor' && cita.doctorUsuarioId !== usuarioId) {
            throw new Error('No tienes permisos para ver el historial de esta cita.');
        }

        const historial = await this.citaRepo.buscarHistorialPorCita(citaId);
        if (!historial) throw new Error('Esta cita no tiene historial aún.');

        return historial;
    }

    // ===================================================================
    // PACIENTE: Historial completo de consultas
    // ===================================================================
    async obtenerHistorialPaciente(
        pacienteId: number,
        filtros: { pagina?: number; limite?: number },
    ): Promise<{ datos: any[]; total: number }> {
        return await this.citaRepo.listarHistorialPaciente(pacienteId, filtros);
    }

    // ===================================================================
    // DOCTOR: Registrar periodo de inactividad
    // ===================================================================
    async registrarInactividad(
        doctorId: number,
        dto: CrearPeriodoInactividadDto,
    ): Promise<any> {
        this._validarFecha(dto.fechaInicio);
        this._validarFecha(dto.fechaFin);

        const horaInicio = dto.horaInicio ?? '00:00';
        const horaFin = dto.horaFin ?? '23:59';

        if (dto.horaInicio) this._validarHora(dto.horaInicio);
        if (dto.horaFin) this._validarHora(dto.horaFin);

        const fechaInicio = this._combinarFechaHora(dto.fechaInicio, horaInicio);
        const fechaFin = this._combinarFechaHora(dto.fechaFin, horaFin);

        if (fechaFin <= fechaInicio) {
            throw new Error('La fecha/hora de fin debe ser posterior a la fecha/hora de inicio.');
        }

        const periodo = await this.inactividadRepo.crear({
            doctorId,
            fechaInicio,
            fechaFin,
            motivo: dto.motivo,
        });

        const citasAfectadas = await this.citaRepo.obtenerCitasEnRango(
            doctorId, fechaInicio, fechaFin,
        );
        const motivoCancelacion =
            `Doctor registró período de inactividad${dto.motivo ? ': ' + dto.motivo : '.'}`;

        let citasCanceladas = 0;
        for (const cita of citasAfectadas) {
            if (['Programada', 'Reprogramada'].includes(cita.estado)) {
                await this.citaRepo.actualizar(cita.id, {
                    estado: 'Cancelada',
                    motivoCancelacion,
                });
                citasCanceladas++;
            }
        }

        return { periodo, citasCanceladas };
    }

    // ===================================================================
    // DOCTOR: Cancelar un periodo de inactividad propio
    // ===================================================================
    async cancelarInactividad(periodoId: number, doctorId: number): Promise<any> {
        const periodo = await this.inactividadRepo.buscarPorId(periodoId);
        if (!periodo) throw new Error('Periodo de inactividad no encontrado.');
        if (periodo.id_doctor !== doctorId) {
            throw new Error('No tienes permisos para cancelar este periodo.');
        }
        if (periodo.estado !== 'Activo') {
            throw new Error('Este periodo ya fue cancelado.');
        }

        return await this.inactividadRepo.cancelar(periodoId);
    }

    // ===================================================================
    // DOCTOR: Listar sus periodos de inactividad
    // ===================================================================
    async listarInactividades(doctorId: number): Promise<any[]> {
        return await this.inactividadRepo.listarPorDoctor(doctorId);
    }
}
