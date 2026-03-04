/**
 * FavoritosController.ts
 * Controlador HTTP para gestión de doctores favoritos de un paciente.
 */

import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { GestionarFavoritosUseCase } from '../../../application/use-cases/GestionarFavoritosUseCase';
import { IPacienteRepository } from '../../../domain/repositories/IPacienteRepository';

export class FavoritosController {

    /**
     * GET /favoritos
     * Lista los doctores favoritos del paciente autenticado.
     */
    async listar(req: Request, res: Response): Promise<Response> {
        try {
            const usuarioId = (req as any).usuarioId;
            if (!usuarioId) {
                return res.status(401).json({ success: false, error: 'No autorizado' });
            }

            const pacienteId = await this._resolverPacienteId(usuarioId);

            const useCase = container.resolve(GestionarFavoritosUseCase);
            const favoritos = await useCase.listar(pacienteId);

            return res.status(200).json({
                success: true,
                total: favoritos.length,
                data: favoritos.map(f => f.toJSON())
            });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error.message || 'Error interno del servidor' });
        }
    }

    /**
     * POST /favoritos/:doctorId
     * Agrega un doctor a la lista de favoritos del paciente autenticado.
     */
    async agregar(req: Request, res: Response): Promise<Response> {
        try {
            const usuarioId = (req as any).usuarioId;
            if (!usuarioId) {
                return res.status(401).json({ success: false, error: 'No autorizado' });
            }

            const doctorId = parseInt(req.params.doctorId as string);
            if (isNaN(doctorId) || doctorId <= 0) {
                return res.status(400).json({ success: false, error: 'El doctorId debe ser un número válido' });
            }

            const pacienteId = await this._resolverPacienteId(usuarioId);

            const useCase = container.resolve(GestionarFavoritosUseCase);
            const favorito = await useCase.agregar(pacienteId, doctorId);

            return res.status(201).json({
                success: true,
                mensaje: 'Doctor agregado a favoritos exitosamente',
                data: favorito.toJSON()
            });
        } catch (error: any) {
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
    async eliminar(req: Request, res: Response): Promise<Response> {
        try {
            const usuarioId = (req as any).usuarioId;
            if (!usuarioId) {
                return res.status(401).json({ success: false, error: 'No autorizado' });
            }

            const doctorId = parseInt(req.params.doctorId as string);
            if (isNaN(doctorId) || doctorId <= 0) {
                return res.status(400).json({ success: false, error: 'El doctorId debe ser un número válido' });
            }

            const pacienteId = await this._resolverPacienteId(usuarioId);

            const useCase = container.resolve(GestionarFavoritosUseCase);
            await useCase.eliminar(pacienteId, doctorId);

            return res.status(200).json({
                success: true,
                mensaje: 'Doctor eliminado de favoritos exitosamente'
            });
        } catch (error: any) {
            if (error.message.includes('no está en tu lista')) {
                return res.status(404).json({ success: false, error: error.message });
            }
            return res.status(500).json({ success: false, error: error.message || 'Error interno del servidor' });
        }
    }

    /** Resuelve el pacienteId a partir del usuarioId del JWT */
    private async _resolverPacienteId(usuarioId: number): Promise<number> {
        const pacienteRepo = container.resolve<IPacienteRepository>('PacienteRepository');
        const paciente = await pacienteRepo.obtenerPorUsuarioId(usuarioId);
        if (!paciente) {
            throw new Error('No se encontró el perfil de paciente para este usuario');
        }
        return paciente.usuarioId;
    }
}
