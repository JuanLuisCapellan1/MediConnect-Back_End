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
    // PÚBLICO: Solo los slots DISPONIBLES de un servicio para una fecha
    // GET /servicios/:id/slots-disponibles?fecha=YYYY-MM-DD
    // ===================================================================
    async slotsDisponiblesParaServicio(servicioId: number, fecha: string): Promise<{
        horaInicio: string;       // "HH:MM" (UTC 24h)
        horaFin: string;          // "HH:MM" (UTC 24h)
        horaInicioFormateada: string; // "10:00 a.m." estilo UI
        horarioId: number;
        horarioNombre: string | null;
    }[]> {
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

            // Prefetch citas e inactividades del día completo
            const diaFin = new Date(fechaBase.getTime() + 24 * 60 * 60 * 1000);
            const citasDelDia = await this.citaRepo.obtenerCitasEnRango(servicio.doctorId, fechaBase, diaFin);
            const inactividades = await this.inactividadRepo.buscarSolapantes(servicio.doctorId, fechaBase, diaFin);

            // Helper: formato 12h "10:00 a.m." / "2:30 p.m."
            const formatear12h = (hhmm: string): string => {
                const [hh, mm] = hhmm.split(':').map(Number);
                const periodo = hh < 12 ? 'a.m.' : 'p.m.';
                const hora12 = hh % 12 === 0 ? 12 : hh % 12;
                return `${hora12}:${mm.toString().padStart(2, '0')} ${periodo}`;
            };

            const disponibles: {
                horaInicio: string;
                horaFin: string;
                horaInicioFormateada: string;
                horarioId: number;
                horarioNombre: string | null;
            }[] = [];

            for (const sh of servicio.horarios) {
                const horario = sh.horario as any;
                const diasDelHorario: number[] = horario.horarios_dias.map((d: any) => d.dia_semana);
                if (!diasDelHorario.includes(diaRequerido)) continue;

                const horaInicioRef = new Date(horario.horaInicio);
                const horaFinRef = new Date(horario.horaFin);

                let cursor = this._aplicarHoraEnFecha(fechaBase, horaInicioRef);
                const limite = this._aplicarHoraEnFecha(fechaBase, horaFinRef);

                while (cursor.getTime() + duracion * 60 * 1000 <= limite.getTime()) {
                    const slotIni = cursor.getTime();
                    const slotFin = slotIni + duracion * 60 * 1000;

                    const conflictoCita = citasDelDia.some(c => {
                        const cIni = new Date(c.fechaInicio).getTime();
                        const cFin = c.fechaFin
                            ? new Date(c.fechaFin).getTime()
                            : cIni + duracion * 60 * 1000;
                        return cIni < slotFin && cFin > slotIni;
                    });

                    const conflictoInac = inactividades.some(p => {
                        const pIni = new Date(p.fechaInicio).getTime();
                        const pFin = new Date(p.fechaFin).getTime();
                        return pIni < slotFin && pFin > slotIni;
                    });

                    if (!conflictoCita && !conflictoInac) {
                        const horaInicioStr = new Date(slotIni).toISOString().substring(11, 16);
                        const horaFinStr = new Date(slotFin).toISOString().substring(11, 16);
                        disponibles.push({
                            horaInicio: horaInicioStr,
                            horaFin: horaFinStr,
                            horaInicioFormateada: formatear12h(horaInicioStr),
                            horarioId: horario.id,
                            horarioNombre: horario.nombre ?? null,
                        });
                    }

                    cursor = new Date(slotFin);
                }
            }

            return disponibles;
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
    // PÚBLICO: Disponibilidad de un doctor — resumen por día
    // GET /servicios/doctor/:doctorId/disponibilidad?dias=7&fechaInicio=YYYY-MM-DD
    // ===================================================================
    async disponibilidadDoctor(
        doctorId: number,
        dias: number,
        fechaInicioStr?: string,
    ): Promise<{
        fecha: string;
        diaSemana: string;
        mes: string;
        hayDisponibilidad: boolean;
        totalSlotsLibres: number;
    }[]> {
        if (dias < 1 || dias > 30) {
            throw new Error('El parámetro "dias" debe estar entre 1 y 30.');
        }
        if (fechaInicioStr) this._validarFecha(fechaInicioStr);

        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();

        try {
            // 1. Verificar que el doctor existe
            const doctor = await prisma.doctor.findUnique({ where: { usuarioId: doctorId } });
            if (!doctor) throw new Error('El doctor no existe.');

            // 2. Cargar todos los servicios activos con sus horarios
            const servicios = await (prisma as any).servicio.findMany({
                where: { doctorId, estado: 'Activo' },
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

            // 3. Determinar rango de fechas completo
            const hoy = fechaInicioStr
                ? new Date(`${fechaInicioStr}T00:00:00.000Z`)
                : new Date(new Date().toISOString().substring(0, 10) + 'T00:00:00.000Z');

            const ultimoDia = new Date(hoy.getTime() + (dias - 1) * 24 * 60 * 60 * 1000);
            const rangoFin = new Date(ultimoDia.getTime() + 24 * 60 * 60 * 1000); // día siguiente (exclusivo)

            // 4. Prefetch: TODAS las citas del doctor en el rango (una sola query)
            const todasLasCitas: any[] = await this.citaRepo.obtenerCitasEnRango(
                doctorId,
                hoy,
                rangoFin,
            );

            // 5. Prefetch: TODOS los periodos de inactividad solapantes
            const todasLasInactividades: any[] = await this.inactividadRepo.buscarSolapantes(
                doctorId,
                hoy,
                rangoFin,
            );

            // Abreviaturas en español
            const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

            const resultado: {
                fecha: string;
                diaSemana: string;
                mes: string;
                hayDisponibilidad: boolean;
                totalSlotsLibres: number;
            }[] = [];

            // 6. Iterar día a día
            for (let i = 0; i < dias; i++) {
                const fechaBase = new Date(hoy.getTime() + i * 24 * 60 * 60 * 1000);
                const fechaStr = fechaBase.toISOString().substring(0, 10);
                const diaNum = fechaBase.getUTCDay();
                const diaInicioMs = fechaBase.getTime();
                const diaFinMs = diaInicioMs + 24 * 60 * 60 * 1000;

                // Filtrar citas e inactividades solo de este día
                const citasDelDia = todasLasCitas.filter(c => {
                    const t = new Date(c.fechaInicio).getTime();
                    return t >= diaInicioMs && t < diaFinMs;
                });
                const inactividadesDelDia = todasLasInactividades.filter(p => {
                    const ini = new Date(p.fechaInicio).getTime();
                    const fin = new Date(p.fechaFin).getTime();
                    return ini < diaFinMs && fin > diaInicioMs;
                });

                let totalLibres = 0;

                for (const servicio of servicios) {
                    const duracion: number = servicio.duracionMinutos ?? 30;

                    for (const sh of servicio.horarios) {
                        const horario = sh.horario as any;
                        const dias_horario: number[] = horario.horarios_dias.map((d: any) => d.dia_semana);
                        if (!dias_horario.includes(diaNum)) continue;

                        const horaInicioRef = new Date(horario.horaInicio);
                        const horaFinRef = new Date(horario.horaFin);

                        let cursor = this._aplicarHoraEnFecha(fechaBase, horaInicioRef);
                        const limite = this._aplicarHoraEnFecha(fechaBase, horaFinRef);

                        while (cursor.getTime() + duracion * 60 * 1000 <= limite.getTime()) {
                            const slotIni = cursor.getTime();
                            const slotFin = slotIni + duracion * 60 * 1000;

                            // Verificar conflicto con citas (del día ya filtrado)
                            const conflictoCita = citasDelDia.some(c => {
                                const cIni = new Date(c.fechaInicio).getTime();
                                const cFin = c.fechaFin
                                    ? new Date(c.fechaFin).getTime()
                                    : cIni + duracion * 60 * 1000;
                                return cIni < slotFin && cFin > slotIni;
                            });

                            // Verificar conflicto con inactividades (del día ya filtrado)
                            const conflictoInac = inactividadesDelDia.some(p => {
                                const pIni = new Date(p.fechaInicio).getTime();
                                const pFin = new Date(p.fechaFin).getTime();
                                return pIni < slotFin && pFin > slotIni;
                            });

                            if (!conflictoCita && !conflictoInac) {
                                totalLibres++;
                            }

                            cursor = new Date(slotFin);
                        }
                    }
                }

                resultado.push({
                    fecha: fechaStr,
                    diaSemana: DIAS_SEMANA[diaNum],
                    mes: MESES[fechaBase.getUTCMonth()],
                    hayDisponibilidad: totalLibres > 0,
                    totalSlotsLibres: totalLibres,
                });
            }

            return resultado;
        } finally {
            await prisma.$disconnect();
        }
    }

    // ===================================================================
    // DOCTOR: Listar sus periodos de inactividad
    // ===================================================================
    async listarInactividades(doctorId: number): Promise<any[]> {
        return await this.inactividadRepo.listarPorDoctor(doctorId);
    }
}
