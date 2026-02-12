import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { GestionarDoctoresUseCase } from '../../../application/use-cases/GestionarDoctoresUseCase';
import { DoctorNoEncontradoError } from '../../../domain/errors/Doctores/DoctorNoEncontradoError';
import { ExequaturYaExisteError } from '../../../domain/errors/Doctores/ExequaturYaExisteError';
import { DocumentoDoctorYaExisteError } from '../../../domain/errors/Doctores/DocumentoDoctorYaExisteError';

export class DoctorController {
    async listar(req: Request, res: Response): Promise<Response> {
        try {
            const useCase = container.resolve(GestionarDoctoresUseCase);

            const getString = (value: any): string | undefined => {
                if (Array.isArray(value)) return value[0] as string;
                return value as string | undefined;
            };

            const filtros = {
                nombre: getString(req.query.nombre),
                apellido: getString(req.query.apellido),
                estado: getString(req.query.estado),
                estadoVerificacion: getString(req.query.estadoVerificacion),
                genero: getString(req.query.genero),
                nacionalidad: getString(req.query.nacionalidad),
                especialidadId: req.query.especialidadId ? parseInt(req.query.especialidadId as string) : undefined,
                pagina: req.query.pagina ? parseInt(req.query.pagina as string) : undefined,
                limite: req.query.limite ? parseInt(req.query.limite as string) : undefined,
            };

            const resultado = await useCase.listar(filtros);

            return res.status(200).json({
                success: true,
                data: resultado.datos,
                paginacion: {
                    total: resultado.total,
                    pagina: filtros.pagina || 1,
                    limite: filtros.limite || 10,
                    totalPaginas: Math.ceil(resultado.total / (filtros.limite || 10)),
                },
            });
        } catch (error) {
            return this.manejarError(error, res);
        }
    }

    async obtenerPorId(req: Request, res: Response): Promise<Response> {
        try {
            const useCase = container.resolve(GestionarDoctoresUseCase);
            const id = parseInt(req.params.id as string);

            const doctor = await useCase.obtenerPorId(id);

            return res.status(200).json({
                success: true,
                data: doctor,
            });
        } catch (error) {
            return this.manejarError(error, res);
        }
    }

    async obtenerPerfil(req: Request, res: Response): Promise<Response> {
        try {
            const useCase = container.resolve(GestionarDoctoresUseCase);
            const usuarioId = req.user!.userId; // Del middleware de autenticación

            const doctor = await useCase.obtenerPorUsuarioId(usuarioId);

            return res.status(200).json({
                success: true,
                data: doctor,
            });
        } catch (error) {
            return this.manejarError(error, res);
        }
    }

    async actualizar(req: Request, res: Response): Promise<Response> {
        try {
            const useCase = container.resolve(GestionarDoctoresUseCase);
            const usuarioId = parseInt(req.params.id as string);

            const doctor = await useCase.actualizar(usuarioId, req.body);

            return res.status(200).json({
                success: true,
                message: 'Doctor actualizado exitosamente.',
                data: doctor,
            });
        } catch (error) {
            return this.manejarError(error, res);
        }
    }

    async actualizarPerfil(req: Request, res: Response): Promise<Response> {
        try {
            const useCase = container.resolve(GestionarDoctoresUseCase);
            const usuarioId = req.user!.userId; // Del middleware de autenticación

            const doctor = await useCase.actualizar(usuarioId, req.body);

            return res.status(200).json({
                success: true,
                message: 'Perfil actualizado exitosamente.',
                data: doctor,
            });
        } catch (error) {
            return this.manejarError(error, res);
        }
    }

    async eliminar(req: Request, res: Response): Promise<Response> {
        try {
            const useCase = container.resolve(GestionarDoctoresUseCase);
            const usuarioId = parseInt(req.params.id as string);

            await useCase.eliminar(usuarioId);

            return res.status(200).json({
                success: true,
                message: 'Doctor eliminado exitosamente.',
            });
        } catch (error) {
            return this.manejarError(error, res);
        }
    }

    private manejarError(error: any, res: Response): Response {
        console.error(error);

        if (error instanceof DoctorNoEncontradoError) {
            return res.status(404).json({
                success: false,
                message: error.message,
            });
        }

        if (error instanceof ExequaturYaExisteError || error instanceof DocumentoDoctorYaExisteError) {
            return res.status(409).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor.',
        });
    }
}
