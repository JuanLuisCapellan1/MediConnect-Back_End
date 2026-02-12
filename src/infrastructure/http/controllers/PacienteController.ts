import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { GestionarPacientesUseCase } from '../../../application/use-cases/GestionarPacientesUseCase';
import { PacienteNoEncontradoError } from '../../../domain/errors/Pacientes/PacienteNoEncontradoError';
import { DocumentoPacienteYaExisteError } from '../../../domain/errors/Pacientes/DocumentoPacienteYaExisteError';

export class PacienteController {
    async listar(req: Request, res: Response): Promise<Response> {
        try {
            const useCase = container.resolve(GestionarPacientesUseCase);

            const getNombre = (value: any): string | undefined => {
                if (Array.isArray(value)) return value[0] as string;
                return value as string | undefined;
            };

            const filtros = {
                nombre: getNombre(req.query.nombre),
                apellido: getNombre(req.query.apellido),
                estado: getNombre(req.query.estado),
                genero: getNombre(req.query.genero),
                tipoSangre: getNombre(req.query.tipoSangre),
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
            const useCase = container.resolve(GestionarPacientesUseCase);
            const id = parseInt(req.params.id as string);

            const paciente = await useCase.obtenerPorId(id);

            return res.status(200).json({
                success: true,
                data: paciente,
            });
        } catch (error) {
            return this.manejarError(error, res);
        }
    }

    async obtenerPerfil(req: Request, res: Response): Promise<Response> {
        try {
            const useCase = container.resolve(GestionarPacientesUseCase);
            const usuarioId = req.user!.userId; // Del middleware de autenticación

            const paciente = await useCase.obtenerPorUsuarioId(usuarioId);

            return res.status(200).json({
                success: true,
                data: paciente,
            });
        } catch (error) {
            return this.manejarError(error, res);
        }
    }

    async actualizar(req: Request, res: Response): Promise<Response> {
        try {
            const useCase = container.resolve(GestionarPacientesUseCase);
            const usuarioId = parseInt(req.params.id as string);

            const paciente = await useCase.actualizar(usuarioId, req.body);

            return res.status(200).json({
                success: true,
                message: 'Paciente actualizado exitosamente.',
                data: paciente,
            });
        } catch (error) {
            return this.manejarError(error, res);
        }
    }

    async actualizarPerfil(req: Request, res: Response): Promise<Response> {
        try {
            const useCase = container.resolve(GestionarPacientesUseCase);
            const usuarioId = req.user!.userId; // Del middleware de autenticación

            const paciente = await useCase.actualizar(usuarioId, req.body);

            return res.status(200).json({
                success: true,
                message: 'Perfil actualizado exitosamente.',
                data: paciente,
            });
        } catch (error) {
            return this.manejarError(error, res);
        }
    }

    async eliminar(req: Request, res: Response): Promise<Response> {
        try {
            const useCase = container.resolve(GestionarPacientesUseCase);
            const usuarioId = parseInt(req.params.id as string);

            await useCase.eliminar(usuarioId);

            return res.status(200).json({
                success: true,
                message: 'Paciente eliminado exitosamente.',
            });
        } catch (error) {
            return this.manejarError(error, res);
        }
    }

    private manejarError(error: any, res: Response): Response {
        console.error(error);

        if (error instanceof PacienteNoEncontradoError) {
            return res.status(404).json({
                success: false,
                message: error.message,
            });
        }

        if (error instanceof DocumentoPacienteYaExisteError) {
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
