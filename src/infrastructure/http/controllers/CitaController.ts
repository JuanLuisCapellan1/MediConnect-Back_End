import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { GestionarCitasUseCase } from '../../../application/use-cases/GestionarCitasUseCase';

@injectable()
export class CitaController {
    constructor(
        @inject(GestionarCitasUseCase)
        private citasUseCase: GestionarCitasUseCase
    ) { }

    // POST /citas — Paciente agenda una cita
    async agendar(req: Request, res: Response): Promise<void> {
        try {
            const pacienteId = req.user?.userId;
            if (!pacienteId) { res.status(401).json({ success: false, message: 'No autenticado' }); return; }

            const dto = req.body;
            if (!dto.servicioId || !dto.horarioId || !dto.fechaInicio || !dto.fechaFin || !dto.modalidad) {
                res.status(400).json({ success: false, message: 'servicioId, horarioId, fechaInicio, fechaFin y modalidad son requeridos.' });
                return;
            }

            const data = await this.citasUseCase.agendarCita(pacienteId, dto);
            res.status(201).json({ success: true, data, message: 'Cita agendada exitosamente.' });
        } catch (error) { this.manejarError(error, res); }
    }

    // GET /citas — Paciente lista sus citas
    async listarMisCitas(req: Request, res: Response): Promise<void> {
        try {
            const pacienteId = req.user?.userId;
            if (!pacienteId) { res.status(401).json({ success: false, message: 'No autenticado' }); return; }

            const { estado, pagina, limite, fechaDesde, fechaHasta } = req.query;
            const filtros = {
                estado: estado as string | undefined,
                pagina: pagina ? Number(pagina) : undefined,
                limite: limite ? Number(limite) : undefined,
                fechaDesde: fechaDesde as string | undefined,
                fechaHasta: fechaHasta as string | undefined,
            };

            const { datos, total } = await this.citasUseCase.listarCitasPaciente(pacienteId, filtros);
            const lim = filtros.limite ?? 10;
            const pag = filtros.pagina ?? 1;
            res.status(200).json({
                success: true,
                data: datos,
                paginacion: { total, pagina: pag, limite: lim, totalPaginas: Math.ceil(total / lim) },
            });
        } catch (error) { this.manejarError(error, res); }
    }

    // GET /citas/doctor — Doctor lista sus citas
    async listarCitasDoctor(req: Request, res: Response): Promise<void> {
        try {
            const doctorId = req.user?.userId;
            if (!doctorId) { res.status(401).json({ success: false, message: 'No autenticado' }); return; }

            const { estado, pagina, limite, fechaDesde, fechaHasta } = req.query;
            const filtros = {
                estado: estado as string | undefined,
                pagina: pagina ? Number(pagina) : undefined,
                limite: limite ? Number(limite) : undefined,
                fechaDesde: fechaDesde as string | undefined,
                fechaHasta: fechaHasta as string | undefined,
            };

            const { datos, total } = await this.citasUseCase.listarCitasDoctor(doctorId, filtros);
            const lim = filtros.limite ?? 10;
            const pag = filtros.pagina ?? 1;
            res.status(200).json({
                success: true,
                data: datos,
                paginacion: { total, pagina: pag, limite: lim, totalPaginas: Math.ceil(total / lim) },
            });
        } catch (error) { this.manejarError(error, res); }
    }

    // GET /citas/:id — Detalle de una cita
    async obtenerDetalle(req: Request, res: Response): Promise<void> {
        try {
            const usuarioId = req.user?.userId;
            const rol = req.user?.rol as 'Paciente' | 'Doctor';
            if (!usuarioId) { res.status(401).json({ success: false, message: 'No autenticado' }); return; }

            const citaId = Number(req.params.id);
            if (isNaN(citaId)) { res.status(400).json({ success: false, message: 'ID de cita inválido.' }); return; }

            const data = await this.citasUseCase.obtenerDetalleCita(citaId, usuarioId, rol);
            res.status(200).json({ success: true, data });
        } catch (error) { this.manejarError(error, res); }
    }

    // PATCH /citas/:id — Paciente edita su cita
    async editar(req: Request, res: Response): Promise<void> {
        try {
            const pacienteId = req.user?.userId;
            if (!pacienteId) { res.status(401).json({ success: false, message: 'No autenticado' }); return; }

            const citaId = Number(req.params.id);
            if (isNaN(citaId)) { res.status(400).json({ success: false, message: 'ID de cita inválido.' }); return; }

            const data = await this.citasUseCase.editarCita(citaId, pacienteId, req.body);
            res.status(200).json({ success: true, data, message: 'Cita actualizada exitosamente.' });
        } catch (error) { this.manejarError(error, res); }
    }

    // PATCH /citas/:id/cancelar — Cancelar cita (Paciente o Doctor)
    async cancelar(req: Request, res: Response): Promise<void> {
        try {
            const usuarioId = req.user?.userId;
            const rol = req.user?.rol as 'Paciente' | 'Doctor';
            if (!usuarioId) { res.status(401).json({ success: false, message: 'No autenticado' }); return; }

            const citaId = Number(req.params.id);
            if (isNaN(citaId)) { res.status(400).json({ success: false, message: 'ID de cita inválido.' }); return; }

            const { motivoCancelacion } = req.body;
            if (!motivoCancelacion?.trim()) {
                res.status(400).json({ success: false, message: 'motivoCancelacion es requerido.' });
                return;
            }

            const data = await this.citasUseCase.cancelarCita(citaId, usuarioId, rol, { motivoCancelacion });
            res.status(200).json({ success: true, data, message: 'Cita cancelada exitosamente.' });
        } catch (error) { this.manejarError(error, res); }
    }

    // PATCH /citas/:id/reprogramar — Doctor reprograma una cita
    async reprogramar(req: Request, res: Response): Promise<void> {
        try {
            const doctorId = req.user?.userId;
            if (!doctorId) { res.status(401).json({ success: false, message: 'No autenticado' }); return; }

            const citaId = Number(req.params.id);
            if (isNaN(citaId)) { res.status(400).json({ success: false, message: 'ID de cita inválido.' }); return; }

            const { horarioId, fechaInicio, fechaFin } = req.body;
            if (!horarioId || !fechaInicio || !fechaFin) {
                res.status(400).json({ success: false, message: 'horarioId, fechaInicio y fechaFin son requeridos.' });
                return;
            }

            const data = await this.citasUseCase.reprogramarCita(citaId, doctorId, { horarioId, fechaInicio, fechaFin });
            res.status(200).json({ success: true, data, message: 'Cita reprogramada exitosamente.' });
        } catch (error) { this.manejarError(error, res); }
    }

    // POST /citas/:id/diagnosticar — Doctor diagnostica y completa la cita
    async diagnosticar(req: Request, res: Response): Promise<void> {
        try {
            const doctorId = req.user?.userId;
            if (!doctorId) { res.status(401).json({ success: false, message: 'No autenticado' }); return; }

            const citaId = Number(req.params.id);
            if (isNaN(citaId)) { res.status(400).json({ success: false, message: 'ID de cita inválido.' }); return; }

            const { resumen, diagnostico, tratamiento, observacion } = req.body;
            if (!resumen?.trim() || !diagnostico?.trim()) {
                res.status(400).json({ success: false, message: 'resumen y diagnostico son requeridos.' });
                return;
            }

            const data = await this.citasUseCase.diagnosticarCita(citaId, doctorId, { resumen, diagnostico, tratamiento, observacion });
            res.status(200).json({ success: true, data, message: 'Diagnóstico registrado. Cita marcada como Completada.' });
        } catch (error) { this.manejarError(error, res); }
    }

    // GET /citas/historial — Historial del paciente
    async historialPaciente(req: Request, res: Response): Promise<void> {
        try {
            const pacienteId = req.user?.userId;
            if (!pacienteId) { res.status(401).json({ success: false, message: 'No autenticado' }); return; }

            const pagina = req.query.pagina ? Number(req.query.pagina) : undefined;
            const limite = req.query.limite ? Number(req.query.limite) : undefined;

            const { datos, total } = await this.citasUseCase.obtenerHistorialPaciente(pacienteId, { pagina, limite });
            const lim = limite ?? 10;
            const pag = pagina ?? 1;
            res.status(200).json({
                success: true,
                data: datos,
                paginacion: { total, pagina: pag, limite: lim, totalPaginas: Math.ceil(total / lim) },
            });
        } catch (error) { this.manejarError(error, res); }
    }

    // GET /citas/:id/historial — Historial de una cita específica
    async historialCita(req: Request, res: Response): Promise<void> {
        try {
            const usuarioId = req.user?.userId;
            const rol = req.user?.rol as 'Paciente' | 'Doctor';
            if (!usuarioId) { res.status(401).json({ success: false, message: 'No autenticado' }); return; }

            const citaId = Number(req.params.id);
            if (isNaN(citaId)) { res.status(400).json({ success: false, message: 'ID de cita inválido.' }); return; }

            const data = await this.citasUseCase.obtenerHistorialCita(citaId, usuarioId, rol);
            res.status(200).json({ success: true, data });
        } catch (error) { this.manejarError(error, res); }
    }

    private manejarError(error: any, res: Response): void {
        const msg: string = error?.message ?? 'Error interno del servidor';
        if (msg.includes('no encontrad') || msg.includes('no existe')) {
            res.status(404).json({ success: false, message: msg }); return;
        }
        if (msg.includes('No tienes permisos')) {
            res.status(403).json({ success: false, message: msg }); return;
        }
        if (
            msg.includes('requerido') || msg.includes('inválido') ||
            msg.includes('no está disponible') || msg.includes('no tiene') ||
            msg.includes('no acepta') || msg.includes('ya tiene una cita') ||
            msg.includes('Solo puedes') || msg.includes('Solo se pueden')
        ) {
            res.status(400).json({ success: false, message: msg }); return;
        }
        if (error?.code === 'P2025') {
            res.status(404).json({ success: false, message: 'Registro no encontrado.' }); return;
        }
        console.error('Error en CitaController:', error);
        res.status(500).json({ success: false, message: msg });
    }
}
