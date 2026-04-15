"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusquedaController = void 0;
const tsyringe_1 = require("tsyringe");
const GestionarDoctoresUseCase_1 = require("../../../application/use-cases/GestionarDoctoresUseCase");
const GestionarCentroSaludUseCase_1 = require("../../../application/use-cases/GestionarCentroSaludUseCase");
/**
 * GET /busqueda/cercanos
 * Endpoint unificado — devuelve doctores y centros de salud en paralelo,
 * con filtro geográfico opcional (si no hay lat/lng se devuelven todos).
 */
class BusquedaController {
    async cercanos(req, res) {
        try {
            // ── Geo params (opcionales) ───────────────────────────────────────
            const latRaw = req.query.lat;
            const lngRaw = req.query.lng;
            const radioRaw = req.query.radio;
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
            const tipo = req.query.tipo?.trim();
            // ── Filtros de doctores ───────────────────────────────────────
            const filtrosDoctor = {};
            if (req.query.nombre)
                filtrosDoctor.nombre = String(req.query.nombre);
            if (req.query.especialidadId)
                filtrosDoctor.especialidadId = Number(req.query.especialidadId);
            if (req.query.genero)
                filtrosDoctor.genero = String(req.query.genero);
            if (req.query.calificacionMin)
                filtrosDoctor.calificacionMin = Number(req.query.calificacionMin);
            if (req.query.idioma)
                filtrosDoctor.idioma = String(req.query.idioma);
            if (req.query.anosExperienciaMin)
                filtrosDoctor.anosExperienciaMin = Number(req.query.anosExperienciaMin);
            if (req.query.turno)
                filtrosDoctor.turno = String(req.query.turno);
            if (req.query.modalidad)
                filtrosDoctor.modalidad = String(req.query.modalidad);
            if (req.query.seguroId)
                filtrosDoctor.seguroId = Number(req.query.seguroId);
            if (req.query.soloFavoritos === 'true')
                filtrosDoctor.soloFavoritos = true;
            // ── Filtros de centros ────────────────────────────────────────
            const filtrosCentro = {};
            if (req.query.nombre)
                filtrosCentro.nombre = String(req.query.nombre);
            if (req.query.tipoCentroId)
                filtrosCentro.tipoCentroId = Number(req.query.tipoCentroId);
            if (req.query.estadoVerificacion)
                filtrosCentro.estadoVerificacion = String(req.query.estadoVerificacion);
            // ── pacienteId para esFavorito ────────────────────────────────────
            const esPaciente = req.user?.rol === 'Paciente';
            const pacienteId = esPaciente ? req.user?.userId : undefined;
            // ── Repos desde el contenedor ────────────────────────────────────
            const doctorRepo = tsyringe_1.container.resolve(GestionarDoctoresUseCase_1.GestionarDoctoresUseCase)['doctorRepository'];
            const centroRepo = tsyringe_1.container.resolve(GestionarCentroSaludUseCase_1.GestionarCentroSaludUseCase)['centroRepo'];
            // ── Ejecución paralela ────────────────────────────────────────────
            const quiereDoctores = !tipo || tipo === 'Doctor';
            const quiereCentros = !tipo || tipo === 'Centro';
            const [doctores, centros] = await Promise.all([
                quiereDoctores
                    ? doctorRepo.buscarCercanos(latFinal, lngFinal, radioFinal, filtrosDoctor, pacienteId)
                    : Promise.resolve([]),
                quiereCentros
                    ? centroRepo.buscarCercanos(latFinal, lngFinal, radioFinal, filtrosCentro)
                    : Promise.resolve([]),
            ]);
            return res.status(200).json({
                success: true,
                total: { doctores: doctores.length, centros: centros.length },
                doctores,
                centros,
            });
        }
        catch (error) {
            console.error('BusquedaController.cercanos:', error);
            return res.status(500).json({ success: false, message: error?.message ?? 'Error interno del servidor.' });
        }
    }
}
exports.BusquedaController = BusquedaController;
