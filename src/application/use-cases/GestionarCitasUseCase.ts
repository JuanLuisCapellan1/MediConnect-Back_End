import { injectable, inject } from 'tsyringe';
import { ICitaRepository } from '../../domain/repositories/ICitaRepository';
import { IDoctorRepository } from '../../domain/repositories/IDoctorRepository';
import { IPacienteRepository } from '../../domain/repositories/IPacienteRepository';
import { IGrupoCitaRepository } from '../../domain/repositories/IGrupoCitaRepository';
import {
    CrearCitaDto,
    EditarCitaDto,
    CancelarCitaDto,
    ReprogramarCitaDto,
    DiagnosticarCitaDto,
    FiltroCitasDto,
    CrearCitaRecurrenteDto,
} from '../dtos/CitaDtos';

@injectable()
export class GestionarCitasUseCase {
    constructor(
        @inject('CitaRepository') private citaRepo: ICitaRepository,
        @inject('DoctorRepository') private doctorRepo: IDoctorRepository,
        @inject('PacienteRepository') private pacienteRepo: IPacienteRepository,
        @inject('GrupoCitaRepository') private grupoCitaRepo: IGrupoCitaRepository
    ) { }

    // ===================================================================
    // PACIENTE: Agendar cita
    // ===================================================================
    async agendarCita(pacienteId: number, dto: CrearCitaDto): Promise<any> {
        // 1. Obtener servicio con su doctor, precio y modalidades
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();

        const servicio = await prisma.servicio.findUnique({
            where: { id: dto.servicioId },
            include: {
                doctor: {
                    include: {
                        segurosAceptados: {
                            where: { estado: 'Activo' },
                        },
                    },
                },
                horarios: {
                    where: { estado: 'Activo' },
                    include: { horario: true },
                },
            },
        });

        if (!servicio || servicio.estado !== 'Activo') {
            throw new Error('El servicio no existe o no está disponible.');
        }

        const doctorId = servicio.doctorId;

        // 2. Validar horario: debe pertenecer al doctor a través del servicio
        const horarioVinculado = servicio.horarios.find(
            (sh: any) => sh.horarioId === dto.horarioId
        );
        if (!horarioVinculado) {
            throw new Error('El horario seleccionado no está disponible para este servicio.');
        }

        // 3. Validar seguro cruzado si se proporciona
        if (dto.seguroId && dto.tipoSeguroId) {
            // Verificar que el paciente tiene ese seguro
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

            // Verificar que el doctor acepta ese seguro
            const doctorSeguro = await prisma.doctorSeguro.findFirst({
                where: {
                    doctorId,
                    seguroId: dto.seguroId,
                    estado: 'Activo',
                },
            });
            if (!doctorSeguro) {
                throw new Error('El doctor no acepta el seguro seleccionado.');
            }
        }

        // 4. Validar conflicto de cita en ese horario/fecha
        const fechaInicio = new Date(dto.fechaInicio);
        const fechaFin = new Date(dto.fechaFin);

        const conflicto = await prisma.cita.findFirst({
            where: {
                doctorUsuarioId: doctorId,
                estado: { in: ['Programada', 'En Progreso', 'Reprogramada'] },
                OR: [
                    { fechaInicio: { lt: fechaFin }, fechaFin: { gt: fechaInicio } },
                ],
            },
        });
        if (conflicto) {
            throw new Error('El doctor ya tiene una cita en ese horario. Selecciona otro.');
        }

        // 5. Calcular total a pagar
        const numPacientes = dto.numPacientes ?? 1;
        const totalAPagar = parseFloat(servicio.precio.toString()) * numPacientes;

        await prisma.$disconnect();

        // 6. Crear la cita
        return await this.citaRepo.crear({
            pacienteId,
            doctorId,
            servicioId: dto.servicioId,
            horarioId: dto.horarioId,
            fechaInicio,
            fechaFin,
            modalidad: dto.modalidad,
            numPacientes,
            seguroId: dto.seguroId,
            tipoSeguroId: dto.tipoSeguroId,
            motivoConsulta: dto.motivoConsulta,
            totalAPagar,
        });
    }

    // ===================================================================
    // PACIENTE: Listar sus citas
    // ===================================================================
    async listarCitasPaciente(
        pacienteId: number,
        filtros: FiltroCitasDto
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
        filtros: FiltroCitasDto
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
    async obtenerDetalleCita(citaId: number, usuarioId: number, rol: 'Paciente' | 'Doctor'): Promise<any> {
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
        if (cita.pacienteId !== pacienteId) throw new Error('No tienes permisos para editar esta cita.');
        if (cita.estado !== 'Programada') {
            throw new Error('Solo puedes editar citas en estado Programada.');
        }

        const actualizacion: any = {};

        if (dto.horarioId !== undefined) actualizacion.horarioId = dto.horarioId;
        if (dto.fechaInicio !== undefined) actualizacion.fechaInicio = new Date(dto.fechaInicio);
        if (dto.fechaFin !== undefined) actualizacion.fechaFin = new Date(dto.fechaFin);
        if (dto.modalidad !== undefined) actualizacion.modalidad = dto.modalidad;
        if (dto.numPacientes !== undefined) actualizacion.numPacientes = dto.numPacientes;
        if (dto.seguroId !== undefined) actualizacion.seguroId = dto.seguroId;
        if (dto.tipoSeguroId !== undefined) actualizacion.tipoSeguroId = dto.tipoSeguroId;
        if (dto.motivoConsulta !== undefined) actualizacion.motivoConsulta = dto.motivoConsulta;

        // Recalcular total si cambiaron servicio o numPacientes
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
        dto: CancelarCitaDto
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
    // DOCTOR: Reprogramar cita
    // ===================================================================
    async reprogramarCita(citaId: number, doctorId: number, dto: ReprogramarCitaDto): Promise<any> {
        const cita = await this.citaRepo.buscarPorId(citaId);
        if (!cita) throw new Error('Cita no encontrada.');
        if (cita.doctorUsuarioId !== doctorId) throw new Error('No tienes permisos para reprogramar esta cita.');
        if (!['Programada', 'Reprogramada'].includes(cita.estado)) {
            throw new Error('Solo se pueden reprogramar citas en estado Programada o Reprogramada.');
        }

        return await this.citaRepo.actualizar(citaId, {
            horarioId: dto.horarioId,
            fechaInicio: new Date(dto.fechaInicio),
            fechaFin: new Date(dto.fechaFin),
            estado: 'Reprogramada',
        });
    }

    // ===================================================================
    // DOCTOR: Diagnosticar (crea historial y completa la cita)
    // ===================================================================
    async diagnosticarCita(citaId: number, doctorId: number, dto: DiagnosticarCitaDto): Promise<any> {
        const cita = await this.citaRepo.buscarPorId(citaId);
        if (!cita) throw new Error('Cita no encontrada.');
        if (cita.doctorUsuarioId !== doctorId) throw new Error('No tienes permisos para diagnosticar esta cita.');
        if (!['Programada', 'En Progreso', 'Reprogramada'].includes(cita.estado)) {
            throw new Error('Solo puedes diagnosticar citas en estado Programada, En Progreso o Reprogramada.');
        }

        // Crear o actualizar historial
        const historialExistente = await this.citaRepo.buscarHistorialPorCita(citaId);
        let historial: any;

        if (historialExistente) {
            // Actualizar historial existente via actualizar directo en repo
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

        // Marcar cita como Completada
        await this.citaRepo.actualizar(citaId, { estado: 'Completada' });

        return historial;
    }

    // ===================================================================
    // PACIENTE / DOCTOR: Historial de una cita específica
    // ===================================================================
    async obtenerHistorialCita(citaId: number, usuarioId: number, rol: 'Paciente' | 'Doctor'): Promise<any> {
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
        filtros: { pagina?: number; limite?: number }
    ): Promise<{ datos: any[]; total: number }> {
        return await this.citaRepo.listarHistorialPaciente(pacienteId, filtros);
    }

    // ===================================================================
    // PACIENTE: Agendar cita RECURRENTE
    // ===================================================================
    async agendarCitaRecurrente(pacienteId: number, dto: CrearCitaRecurrenteDto): Promise<any> {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();

        // 1. Validar servicio y horario
        const servicio = await prisma.servicio.findUnique({
            where: { id: dto.servicioId },
            include: {
                doctor: { include: { segurosAceptados: { where: { estado: 'Activo' } } } },
                horarios: { where: { estado: 'Activo' }, include: { horario: true } },
            },
        });

        if (!servicio || servicio.estado !== 'Activo') {
            await prisma.$disconnect();
            throw new Error('El servicio no existe o no está disponible.');
        }

        const horarioVinculado = servicio.horarios.find((sh: any) => sh.horarioId === dto.horarioId);
        if (!horarioVinculado) {
            await prisma.$disconnect();
            throw new Error('El horario seleccionado no está disponible para este servicio.');
        }

        // 2. Obtener los días de semana del horario
        const horarioCompleto = await (prisma as any).horario.findUnique({
            where: { id: dto.horarioId },
            include: { horarios_dias: { select: { dia_semana: true } } }
        });

        if (!horarioCompleto || !horarioCompleto.horarios_dias.length) {
            await prisma.$disconnect();
            throw new Error('El horario seleccionado no tiene días de semana configurados.');
        }

        const diasSemana: number[] = horarioCompleto.horarios_dias.map((d: any) => d.dia_semana);
        const doctorId = servicio.doctorId;
        const numPacientes = dto.numPacientes ?? 1;
        const totalAPagar = parseFloat(servicio.precio.toString()) * numPacientes;
        const duracion = servicio.duracionMinutos;

        // 3. Calcular fechas de inicio y fin del ciclo
        const fechaInicioCiclo = new Date(dto.fechaInicio);
        // Si no hay fecha fin, por defecto 3 meses
        const fechaFinCiclo = dto.fechaFin
            ? new Date(dto.fechaFin)
            : new Date(new Date(dto.fechaInicio).setMonth(new Date(dto.fechaInicio).getMonth() + 3));

        await prisma.$disconnect();

        // 4. Crear el grupo de citas
        const grupo = await this.grupoCitaRepo.crear({
            pacienteId,
            servicioId: dto.servicioId,
            horarioId: dto.horarioId,
            fechaInicio: fechaInicioCiclo,
            fechaFin: fechaFinCiclo,
            descripcion: dto.descripcion ?? null,
        });

        // 5. Generar citas individuales para cada ocurrencia
        const citasCreadas: any[] = [];
        const horaInicio = new Date(horarioCompleto.horaInicio);
        const cursor = new Date(fechaInicioCiclo);

        while (cursor <= fechaFinCiclo) {
            // dia JS: 0=Dom, 1=Lun, …, 6=Sab → transformar a nuestro 1=Lun…7=Dom
            const diaCursor = cursor.getDay() === 0 ? 7 : cursor.getDay();

            if (diasSemana.includes(diaCursor)) {
                const fechaCita = new Date(cursor);
                fechaCita.setUTCHours(horaInicio.getUTCHours(), horaInicio.getUTCMinutes(), 0, 0);
                const fechaFinCita = new Date(fechaCita.getTime() + duracion * 60 * 1000);

                const cita = await this.citaRepo.crear({
                    pacienteId,
                    doctorId,
                    servicioId: dto.servicioId,
                    horarioId: dto.horarioId,
                    fechaInicio: fechaCita,
                    fechaFin: fechaFinCita,
                    modalidad: dto.modalidad,
                    numPacientes,
                    seguroId: dto.seguroId,
                    tipoSeguroId: dto.tipoSeguroId,
                    motivoConsulta: dto.motivoConsulta,
                    totalAPagar,
                    grupoId: grupo.id,
                });
                citasCreadas.push(cita);
            }
            cursor.setDate(cursor.getDate() + 1);
        }

        return { grupo, citasGeneradas: citasCreadas.length, citas: citasCreadas };
    }

    // ===================================================================
    // AMBOS: Ver citas de un grupo
    // ===================================================================
    async listarPorGrupo(grupoId: number, usuarioId: number, rol: 'Paciente' | 'Doctor'): Promise<any> {
        const grupo = await this.grupoCitaRepo.buscarPorId(grupoId);
        if (!grupo) throw new Error('Grupo de citas no encontrado.');

        if (rol === 'Paciente' && grupo.pacienteId !== usuarioId) {
            throw new Error('No tienes permisos para ver este grupo.');
        }

        return grupo;
    }

    // ===================================================================
    // PACIENTE/DOCTOR: Cancelar grupo de citas
    // ===================================================================
    async cancelarGrupo(
        grupoId: number,
        usuarioId: number,
        rol: 'Paciente' | 'Doctor',
        motivo: string
    ): Promise<any> {
        const grupo = await this.grupoCitaRepo.buscarPorId(grupoId);
        if (!grupo) throw new Error('Grupo de citas no encontrado.');

        if (rol === 'Paciente' && grupo.pacienteId !== usuarioId) {
            throw new Error('No tienes permisos para cancelar este grupo.');
        }
        if (!['Activo', 'Parcial'].includes(grupo.estado)) {
            throw new Error('Este grupo ya ha sido cancelado o no está activo.');
        }

        return await this.grupoCitaRepo.cancelarGrupo(grupoId);
    }

    // ===================================================================
    // PACIENTE: Listar sus grupos de citas recurrentes
    // ===================================================================
    async listarGruposPaciente(
        pacienteId: number,
        filtros: { pagina?: number; limite?: number }
    ): Promise<{ datos: any[]; total: number }> {
        return await this.grupoCitaRepo.listarPorPaciente(pacienteId, filtros.pagina, filtros.limite);
    }
}
