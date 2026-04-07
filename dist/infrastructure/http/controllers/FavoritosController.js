"use strict";
/**
 * FavoritosController.ts
 * Controlador HTTP para gestión de doctores favoritos de un paciente.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FavoritosController = void 0;
const tsyringe_1 = require("tsyringe");
const GestionarFavoritosUseCase_1 = require("../../../application/use-cases/GestionarFavoritosUseCase");
class FavoritosController {
    /**
     * GET /favoritos
     * Lista los doctores favoritos del paciente autenticado.
     */
    async listar(req, res) {
        try {
            const usuarioId = req.usuarioId;
            if (!usuarioId) {
                return res.status(401).json({ success: false, error: 'No autorizado' });
            }
            const pacienteId = await this._resolverPacienteId(usuarioId);
            const useCase = tsyringe_1.container.resolve(GestionarFavoritosUseCase_1.GestionarFavoritosUseCase);
            const favoritos = await useCase.listar(pacienteId);
            return res.status(200).json({
                success: true,
                total: favoritos.length,
                data: favoritos.map(f => f.toJSON())
            });
        }
        catch (error) {
            return res.status(500).json({ success: false, error: error.message || 'Error interno del servidor' });
        }
    }
    /**
     * POST /favoritos/:doctorId
     * Agrega un doctor a la lista de favoritos del paciente autenticado.
     */
    async agregar(req, res) {
        try {
            const usuarioId = req.usuarioId;
            if (!usuarioId) {
                return res.status(401).json({ success: false, error: 'No autorizado' });
            }
            const doctorId = parseInt(req.params.doctorId);
            if (isNaN(doctorId) || doctorId <= 0) {
                return res.status(400).json({ success: false, error: 'El doctorId debe ser un número válido' });
            }
            const pacienteId = await this._resolverPacienteId(usuarioId);
            const useCase = tsyringe_1.container.resolve(GestionarFavoritosUseCase_1.GestionarFavoritosUseCase);
            const favorito = await useCase.agregar(pacienteId, doctorId);
            return res.status(201).json({
                success: true,
                mensaje: 'Doctor agregado a favoritos exitosamente',
                data: favorito.toJSON()
            });
        }
        catch (error) {
            if (error.message.includes('ya está en tu lista')) {
                return res.status(409).json({ success: false, error: error.message });
            }
            if (error.message.includes('no existe')) {
                return res.status(404).json({ success: false, error: error.message });
            }
            return res.status(500).json({ success: false, error: error.message || 'Error interno del servidor' });
        }
    }
    /**
     * DELETE /favoritos/:doctorId
     * Elimina un doctor de la lista de favoritos del paciente autenticado.
     */
    async eliminar(req, res) {
        try {
            const usuarioId = req.usuarioId;
            if (!usuarioId) {
                return res.status(401).json({ success: false, error: 'No autorizado' });
            }
            const doctorId = parseInt(req.params.doctorId);
            if (isNaN(doctorId) || doctorId <= 0) {
                return res.status(400).json({ success: false, error: 'El doctorId debe ser un número válido' });
            }
            const pacienteId = await this._resolverPacienteId(usuarioId);
            const useCase = tsyringe_1.container.resolve(GestionarFavoritosUseCase_1.GestionarFavoritosUseCase);
            await useCase.eliminar(pacienteId, doctorId);
            return res.status(200).json({
                success: true,
                mensaje: 'Doctor eliminado de favoritos exitosamente'
            });
        }
        catch (error) {
            if (error.message.includes('no está en tu lista')) {
                return res.status(404).json({ success: false, error: error.message });
            }
            return res.status(500).json({ success: false, error: error.message || 'Error interno del servidor' });
        }
    }
    /** Resuelve el pacienteId a partir del usuarioId del JWT */
    async _resolverPacienteId(usuarioId) {
        const pacienteRepo = tsyringe_1.container.resolve('PacienteRepository');
        const paciente = await pacienteRepo.obtenerPorUsuarioId(usuarioId);
        if (!paciente) {
            throw new Error('No se encontró el perfil de paciente para este usuario');
        }
        return paciente.usuarioId;
    }
}
exports.FavoritosController = FavoritosController;
