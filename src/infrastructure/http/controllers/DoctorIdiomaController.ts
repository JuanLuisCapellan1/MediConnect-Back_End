import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { GestionarDoctorIdiomasUseCase } from '../../../application/use-cases/GestionarDoctorIdiomasUseCase';

export class DoctorIdiomaController {
    async agregar(req: Request, res: Response): Promise<Response> {
        try {
            const useCase = container.resolve(GestionarDoctorIdiomasUseCase);
            const doctorId = req.user!.userId;

            const idioma = await useCase.agregar(doctorId, req.body);

            return res.status(201).json({
                success: true,
                message: 'Idioma agregado exitosamente.',
                data: idioma,
            });
        } catch (error) {
            return this.manejarError(error, res);
        }
    }

    async obtenerIdiomas(req: Request, res: Response): Promise<Response> {
        try {
            const useCase = container.resolve(GestionarDoctorIdiomasUseCase);
            const doctorId = req.user!.userId;

            const idiomas = await useCase.obtenerPorDoctorId(doctorId);

            return res.status(200).json({
                success: true,
                data: idiomas,
            });
        } catch (error) {
            return this.manejarError(error, res);
        }
    }

    async actualizar(req: Request, res: Response): Promise<Response> {
        try {
            const useCase = container.resolve(GestionarDoctorIdiomasUseCase);
            const idiomaId = parseInt(req.params.id as string);

            const idioma = await useCase.actualizar(idiomaId, req.body);

            return res.status(200).json({
                success: true,
                message: 'Idioma actualizado exitosamente.',
                data: idioma,
            });
        } catch (error) {
            return this.manejarError(error, res);
        }
    }

    async eliminar(req: Request, res: Response): Promise<Response> {
        try {
            const useCase = container.resolve(GestionarDoctorIdiomasUseCase);
            const idiomaId = parseInt(req.params.id as string);

            await useCase.eliminar(idiomaId);

            return res.status(200).json({
                success: true,
                message: 'Idioma eliminado exitosamente.',
            });
        } catch (error) {
            return this.manejarError(error, res);
        }
    }

    private manejarError(error: any, res: Response): Response {
        if (error.message === 'Idioma no encontrado' || error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Idioma no encontrado.',
            });
        }

        if (error.code === 'P2002') {
            return res.status(409).json({
                success: false,
                message: 'El idioma ya existe para este doctor.',
            });
        }

        console.error('Error en DoctorIdiomaController:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor.',
            error: error.message,
        });
    }
}
