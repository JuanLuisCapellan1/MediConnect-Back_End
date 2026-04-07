"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GestionarFavoritosUseCase = void 0;
class GestionarFavoritosUseCase {
    constructor(favoritoRepository, doctorRepository, enviarNotifUC) {
        this.favoritoRepository = favoritoRepository;
        this.doctorRepository = doctorRepository;
        this.enviarNotifUC = enviarNotifUC;
    }
    /**
     * Agrega un doctor a la lista de favoritos del paciente.
     * Lanza error si el doctor no existe o ya es favorito.
     */
    async agregar(pacienteId, doctorId) {
        const doctor = await this.doctorRepository.obtenerPorId(doctorId);
        if (!doctor) {
            throw new Error(`El doctor con ID ${doctorId} no existe`);
        }
        const yaExiste = await this.favoritoRepository.existe(pacienteId, doctorId);
        if (yaExiste) {
            throw new Error('Este doctor ya está en tu lista de favoritos');
        }
        const favorito = await this.favoritoRepository.agregar(pacienteId, doctorId);
        // ─ Notificar al doctor ─────────────────────────────────────────────
        this.enviarNotifUC.execute({
            usuarioId: doctorId,
            titulo: 'Nuevo Seguidor',
            mensaje: 'Un paciente te ha añadido a su lista de médicos favoritos.',
            tipoAlerta: 'Informacion',
            tipoEntidad: 'Perfil',
        }).catch((e) => console.error('notif agregar favorito:', e));
        return favorito;
    }
    /**
     * Elimina un doctor de la lista de favoritos del paciente.
     * Lanza error si no estaba en favoritos.
     */
    async eliminar(pacienteId, doctorId) {
        const existe = await this.favoritoRepository.existe(pacienteId, doctorId);
        if (!existe) {
            throw new Error('Este doctor no está en tu lista de favoritos');
        }
        return this.favoritoRepository.eliminar(pacienteId, doctorId);
    }
    /**
     * Lista todos los doctores favoritos del paciente con datos enriquecidos.
     */
    async listar(pacienteId) {
        return this.favoritoRepository.listar(pacienteId);
    }
}
exports.GestionarFavoritosUseCase = GestionarFavoritosUseCase;
