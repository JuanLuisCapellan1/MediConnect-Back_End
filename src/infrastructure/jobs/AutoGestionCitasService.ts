import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { EnviarNotificacionUseCase } from '../../application/use-cases/notificaciones/EnviarNotificacionUseCase';

const GRACE_MINUTOS = 15;   // Minutos de gracia tras el fin de la cita
const CRON_EXPRESSION = '*/5 * * * *'; // Cada 5 minutos

/**
 * AutoGestionCitasService
 *
 * Cron job que corre cada 5 minutos y gestiona el ciclo de vida de las citas.
 *
 * NOTA DE TIMEZONE:
 *   Las fechas se almacenan en UTC real (via _combinarFechaHora con sufijo Z).
 *   El cron usa new Date() (UTC real) para comparar, garantizando consistencia.
 *
 * FLUJO PRESENCIAL:
 *   1. _procesarEnCurso  → Programada/Reprogramada + fechaInicio<=ahora → "En curso"
 *   2. _procesarNoShows  → En curso + (fechaInicio+duracion+grace)<=ahora → "Cancelada"
 *
 * FLUJO TELECONSULTA:
 *   _procesarNoShows → Programada/En curso + (fechaInicio+duracion+grace)<=ahora → "Cancelada"
 */
export class AutoGestionCitasService {

    constructor(
        private readonly prisma: PrismaClient,
        private readonly enviarNotifUC: EnviarNotificacionUseCase,
    ) { }

    iniciar(): void {
        console.log('⏰ AutoGestionCitasService: cron iniciado (cada 5 min).');

        cron.schedule(CRON_EXPRESSION, async () => {
            try {
                await this._procesarEnCurso();
                await this._procesarNoShows();
            } catch (err) {
                console.error('❌ AutoGestionCitasService: error en ciclo:', err);
            }
        });
    }

    // ── Ejecución manual (útil para testing) ─────────────────────────────────
    async ejecutarAhora(): Promise<number> {
        await this._procesarEnCurso();
        return this._procesarNoShows();
    }

    // ── Marcar citas presenciales como "En curso" cuando llega su hora ───────
    private async _procesarEnCurso(): Promise<number> {
        const ahora = new Date(); // UTC real, consistente con cómo se guarda fechaInicio

        // Buscar citas presenciales Programadas/Reprogramadas cuya hora ya llegó
        const candidatas = await (this.prisma.cita as any).findMany({
            where: {
                estado: { in: ['Programada', 'Reprogramada'] },
                modalidad: 'Presencial',
                fechaInicio: { lte: ahora },
                historial: null,        // sin diagnóstico aún
            },
            select: { id: true },
        });

        if (candidatas.length === 0) return 0;

        const ids = candidatas.map((c: any) => c.id);
        console.log(`⏰ AutoGestionCitasService: ${ids.length} cita(s) presencial(es) → marcando 'En curso' [${ids.join(', ')}]`);

        await (this.prisma.cita as any).updateMany({
            where: { id: { in: ids } },
            data: {
                estado: 'En curso',
                actualizadoEn: ahora,
            },
        });

        return ids.length;
    }

    // ── Lógica principal ──────────────────────────────────────────────────────
    private async _procesarNoShows(): Promise<number> {
        const ahora = new Date(); // UTC real

        // 1. Obtener candidatas por modalidad con diferentes criterios de estado:
        //    - Presencial: SOLO 'En curso' (deben haber pasado por _procesarEnCurso primero)
        //    - Teleconsulta/otras: 'Programada' o 'En curso' (comportamiento original)
        const candidatas = await (this.prisma.cita as any).findMany({
            where: {
                historial: null,        // sin diagnóstico
                OR: [
                    // Citas presenciales: solo cuando ya estén en curso
                    { modalidad: 'Presencial', estado: 'En curso' },
                    // Otras modalidades (Teleconsulta, etc.): estado Programada o En curso
                    { modalidad: { not: 'Presencial' }, estado: { in: ['Programada', 'En curso'] } },
                ],
            },
            include: {
                servicio: { select: { duracionMinutos: true } },
            },
        });

        // 2. Filtrar por ventana de tiempo (Prisma no hace aritmética de fechas)
        const noShows = candidatas.filter((c: any) => {
            const duracion = c.servicio?.duracionMinutos ?? 30;
            const fechaFin = new Date(c.fechaInicio.getTime() + duracion * 60_000);
            const limite = new Date(fechaFin.getTime() + GRACE_MINUTOS * 60_000);
            const debeCancelar = ahora >= limite;

            console.log(`🔎 [CRON-DEBUG] Evaluando Cita ID: ${c.id} [${c.modalidad}] estado=${c.estado}`);
            console.log(`   - ahora (UTC):      ${ahora.toISOString()}`);
            console.log(`   - fechaInicio (UTC): ${c.fechaInicio.toISOString()}`);
            console.log(`   - límite (UTC):      ${limite.toISOString()}`);
            console.log(`   - ¿Cancela?:         ${debeCancelar}`);

            return debeCancelar;
        });

        if (noShows.length === 0) return 0;

        const ids = noShows.map((c: any) => c.id);
        console.log(`⏰ AutoGestionCitasService: ${noShows.length} cita(s) sin diagnóstico → cancelando [${ids.join(', ')}]`);

        // 3. Cancelar en bloque
        await (this.prisma.cita as any).updateMany({
            where: { id: { in: ids } },
            data: {
                estado: 'Cancelada',
                motivoCancelacion: 'Paciente no se presentó',
                actualizadoEn: ahora,
            },
        });

        // 4. Notificar a cada participante (fallo silencioso por cita)
        for (const cita of noShows) {
            await this._notificar(cita).catch(err =>
                console.error(`❌ AutoGestionCitasService: error notificando cita ${cita.id}:`, err)
            );
        }

        return noShows.length;
    }

    private async _notificar(cita: any): Promise<void> {
        const base = {
            tipoEntidad: 'Cita' as const,
            entidadId: cita.id,
        };

        // Notificación al doctor (si tiene doctor asignado)
        if (cita.doctorUsuarioId) {
            await this.enviarNotifUC.execute({
                ...base,
                usuarioId: cita.doctorUsuarioId,
                titulo: 'Cita cancelada por inasistencia',
                mensaje: `El paciente no se presentó a la cita #${cita.id}. La cita ha sido cancelada automáticamente.`,
                tipoAlerta: 'Advertencia',
            });
        }

        // Notificación al paciente
        await this.enviarNotifUC.execute({
            ...base,
            usuarioId: cita.pacienteId,
            titulo: 'Tu cita fue cancelada',
            mensaje: `No se registró asistencia para tu cita #${cita.id}. Ha sido cancelada automáticamente.`,
            tipoAlerta: 'Advertencia',
        });
    }
}
