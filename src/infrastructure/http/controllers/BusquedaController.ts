import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { GestionarDoctoresUseCase } from '../../../application/use-cases/GestionarDoctoresUseCase';
import { GestionarCentroSaludUseCase } from '../../../application/use-cases/GestionarCentroSaludUseCase';

/**
 * GET /busqueda/cercanos
 * Endpoint unificado — devuelve doctores y centros de salud en paralelo,
 * con filtro geográfico opcional (si no hay lat/lng se devuelven todos).
 */
export class BusquedaController {

    async cercanos(req: Request, res: Response): Promise<Response> {
        try {
            // ── Geo params (opcionales) ───────────────────────────────────────
            const latRaw = req.query.lat as string | undefined;
            const lngRaw = req.query.lng as string | undefined;
            const radioRaw = req.query.radio as string | undefined;

            const lat = latRaw !== undefined ? parseFloat(latRaw) : undefined;
            const lng = lngRaw !== undefined ? parseFloat(lngRaw) : undefined;
            const radio = radioRaw !== undefined ? parseFloat(radioRaw) : 5;

            if (lat !== undefined && (isNaN(lat) || lat < -90 || lat > 90)) {
                return res.status(400).json({ success: false, message: 'lat debe ser un número entre -90 y 90.' });
            }
            if (lng !== undefined && (isNaN(lng) || lng < -180 || lng > 180)) {
                return res.status(400).json({ success: false, message: 'lng debe ser un número entre -180 y 180.' });
            }
            if (isNaN(radio) || radio < 0 || radio > 50) {
                return res.status(400).json({ success: false, message: 'radio debe ser un número entre 0 y 50 km.' });
            }

            const useGeo = lat !== undefined && lng !== undefined;
            const latFinal = useGeo ? lat : undefined;
            const lngFinal = useGeo ? lng : undefined;
            const radioFinal = useGeo ? radio : undefined;

            // ── tipo ──────────────────────────────────────────────────────────
            const tipo = (req.query.tipo as string | undefined)?.trim();

            // ── Filtros de doctores ───────────────────────────────────────
            const filtrosDoctor: any = {};
            if (req.query.nombre) filtrosDoctor.nombre = String(req.query.nombre);
            if (req.query.especialidadId) filtrosDoctor.especialidadId = Number(req.query.especialidadId);
            if (req.query.genero) filtrosDoctor.genero = String(req.query.genero);
            if (req.query.calificacionMin) filtrosDoctor.calificacionMin = Number(req.query.calificacionMin);
            if (req.query.idioma) filtrosDoctor.idioma = String(req.query.idioma);
            if (req.query.anosExperienciaMin) filtrosDoctor.anosExperienciaMin = Number(req.query.anosExperienciaMin);
            if (req.query.turno) filtrosDoctor.turno = String(req.query.turno);
            if (req.query.modalidad) filtrosDoctor.modalidad = String(req.query.modalidad);
            if (req.query.seguroId) filtrosDoctor.seguroId = Number(req.query.seguroId);
            if (req.query.soloFavoritos === 'true') filtrosDoctor.soloFavoritos = true;

            // ── Filtros de centros ────────────────────────────────────────
            const filtrosCentro: any = {};
            if (req.query.nombre) filtrosCentro.nombre = String(req.query.nombre);
            if (req.query.tipoCentroId) filtrosCentro.tipoCentroId = Number(req.query.tipoCentroId);
            if (req.query.estadoVerificacion) filtrosCentro.estadoVerificacion = String(req.query.estadoVerificacion);

            // ── pacienteId para esFavorito ────────────────────────────────────
            const esPaciente = (req as any).user?.rol === 'Paciente';
            const pacienteId = esPaciente ? ((req as any).user?.userId as number) : undefined;

            // ── doctorId para estaConectado (en centros) ─────────────────────
            const esDoctor = (req as any).user?.rol === 'Doctor';
            const doctorId = esDoctor ? ((req as any).user?.userId as number) : undefined;

            // ── Repos desde el contenedor ────────────────────────────────────
            const doctorRepo = container.resolve(GestionarDoctoresUseCase)['doctorRepository'];
            const centroRepo = container.resolve(GestionarCentroSaludUseCase)['centroRepo'];

            // ── Ejecución paralela ────────────────────────────────────────────
            const quiereDoctores = !tipo || tipo === 'Doctor';
            const quiereCentros = !tipo || tipo === 'CentroSalud';

            const [doctores, centros] = await Promise.all([
                quiereDoctores
                    ? doctorRepo.buscarCercanos(latFinal, lngFinal, radioFinal, filtrosDoctor, pacienteId)
                    : Promise.resolve([]),
                quiereCentros
                    ? centroRepo.buscarCercanos(latFinal, lngFinal, radioFinal, filtrosCentro, doctorId)
                    : Promise.resolve([]),
            ]);

            return res.status(200).json({
                success: true,
                total: { doctores: doctores.length, centros: centros.length },
                doctores,
                centros,
            });
        } catch (error: any) {
            console.error('BusquedaController.cercanos:', error);
            return res.status(500).json({ success: false, message: error?.message ?? 'Error interno del servidor.' });
        }
    }
}
