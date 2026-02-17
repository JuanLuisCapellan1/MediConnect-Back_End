import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { GestionarFormacionesAcademicasUseCase } from '../../../application/use-cases/GestionarFormacionesAcademicasUseCase';
import {
    CrearFormacionAcademicaDto,
    ActualizarFormacionAcademicaDto,
    FiltroFormacionesAcademicasDto,
} from '../../../application/dtos/FormacionAcademicaDtos';
import { FormacionAcademicaNoEncontradaError } from '../../../domain/errors/FormacionesAcademicas/FormacionAcademicaNoEncontradaError';
import { UniversidadNoEncontradaError } from '../../../domain/errors/FormacionesAcademicas/UniversidadNoEncontradaError';
import { FechasFormacionInvalidasError } from '../../../domain/errors/FormacionesAcademicas/FechasFormacionInvalidasError';
import { FormacionDuplicadaError } from '../../../domain/errors/FormacionesAcademicas/FormacionDuplicadaError';

@injectable()
export class FormacionAcademicaController {
    constructor(
        @inject('GestionarFormacionesAcademicasUseCase')
        private gestionarFormacionesAcademicasUseCase: GestionarFormacionesAcademicasUseCase
    ) { }

    crear = async (req: Request, res: Response): Promise<void> => {
        try {
            const doctorId = (req as any).usuarioId; // Obtener doctor autenticado del JWT
            const dto: CrearFormacionAcademicaDto = {
                ...req.body,
                doctorId // Asignar doctor autenticado
            };
            const formacion = await this.gestionarFormacionesAcademicasUseCase.crear(dto);
            res.status(201).json({
                message: 'Formación académica creada exitosamente',
                success: true,
                data: formacion,
            });
        } catch (error: any) {
            if (error instanceof UniversidadNoEncontradaError) {
                res.status(404).json({
                    success: false,
                    message: error.message,
                });
            } else if (
                error instanceof FechasFormacionInvalidasError ||
                error instanceof FormacionDuplicadaError
            ) {
                res.status(400).json({
                    success: false,
                    message: error.message,
                });
            } else if (
                error.message.includes('requerido') ||
                error.message.includes('inválido') ||
                error.message.includes('No se encontró') ||
                error.message.includes('debe') ||
                error.message.includes('puede')
            ) {
                res.status(400).json({
                    success: false,
                    message: error.message,
                });
            } else {
                console.error('Error al crear formación académica:', error);
                res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor',
                });
            }
        }
    };

    obtenerPorId = async (req: Request, res: Response): Promise<void> => {
        try {
            const doctorId = (req as any).usuarioId; // Obtener doctor autenticado del JWT
            const id = parseInt(req.params.id as string);

            if (isNaN(id)) {
                res.status(400).json({
                    success: false,
                    message: 'ID inválido',
                });
                return;
            }

            const formacion = await this.gestionarFormacionesAcademicasUseCase.obtenerPorId(id);

            // Verificar que la formación pertenece al doctor autenticado
            if (formacion.doctorId !== doctorId) {
                res.status(403).json({
                    success: false,
                    message: 'No tienes permiso para acceder a esta formación académica',
                });
                return;
            }

            res.status(200).json({
                message: 'Formación académica obtenida exitosamente',
                success: true,
                data: formacion,
            });
        } catch (error: any) {
            if (error instanceof FormacionAcademicaNoEncontradaError) {
                res.status(404).json({
                    success: false,
                    message: error.message,
                });
            } else {
                console.error('Error al obtener formación académica:', error);
                res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor',
                });
            }
        }
    };

    obtenerTodos = async (req: Request, res: Response): Promise<void> => {
        try {
            const doctorId = (req as any).usuarioId; // Obtener doctor autenticado del JWT
            const filtro: FiltroFormacionesAcademicasDto = {
                doctorId, // Filtrar solo por el doctor autenticado
                estado: req.query.estado as string || 'Activo', // Por defecto solo mostrar activas
                busqueda: req.query.busqueda as string,
                pagina: req.query.pagina ? parseInt(req.query.pagina as string) : undefined,
                limite: req.query.limite ? parseInt(req.query.limite as string) : undefined,
            };

            const resultado = await this.gestionarFormacionesAcademicasUseCase.obtenerTodos(filtro);
            res.status(200).json({
                message: 'Formaciones académicas obtenidas exitosamente',
                success: true,
                data: resultado,
            });
        } catch (error: any) {
            if (error.message.includes('inválido')) {
                res.status(400).json({
                    success: false,
                    message: error.message,
                });
            } else {
                console.error('Error al obtener formaciones académicas:', error);
                res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor',
                });
            }
        }
    };

    actualizar = async (req: Request, res: Response): Promise<void> => {
        try {
            const doctorId = (req as any).usuarioId; // Obtener doctor autenticado del JWT
            const id = parseInt(req.params.id as string);

            if (isNaN(id)) {
                res.status(400).json({
                    success: false,
                    message: 'ID inválido',
                });
                return;
            }

            // Verificar que la formación pertenece al doctor autenticado
            const formacionExistente = await this.gestionarFormacionesAcademicasUseCase.obtenerPorId(id);
            if (formacionExistente.doctorId !== doctorId) {
                res.status(403).json({
                    success: false,
                    message: 'No tienes permiso para actualizar esta formación académica',
                });
                return;
            }

            const dto: ActualizarFormacionAcademicaDto = req.body;
            const formacion = await this.gestionarFormacionesAcademicasUseCase.actualizar(id, dto);
            res.status(200).json({
                message: 'Formación académica actualizada exitosamente',
                success: true,
                data: formacion,
            });
        } catch (error: any) {
            if (error instanceof FormacionAcademicaNoEncontradaError) {
                res.status(404).json({
                    success: false,
                    message: error.message,
                });
            } else if (error instanceof UniversidadNoEncontradaError) {
                res.status(404).json({
                    success: false,
                    message: error.message,
                });
            } else if (
                error instanceof FechasFormacionInvalidasError ||
                error instanceof FormacionDuplicadaError
            ) {
                res.status(400).json({
                    success: false,
                    message: error.message,
                });
            } else if (
                error.message.includes('requerido') ||
                error.message.includes('inválido') ||
                error.message.includes('No se encontró') ||
                error.message.includes('debe') ||
                error.message.includes('puede')
            ) {
                res.status(400).json({
                    success: false,
                    message: error.message,
                });
            } else {
                console.error('Error al actualizar formación académica:', error);
                res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor',
                });
            }
        }
    };

    eliminar = async (req: Request, res: Response): Promise<void> => {
        try {
            const doctorId = (req as any).usuarioId; // Obtener doctor autenticado del JWT
            const id = parseInt(req.params.id as string);

            if (isNaN(id)) {
                res.status(400).json({
                    success: false,
                    message: 'ID inválido',
                });
                return;
            }

            // Verificar que la formación pertenece al doctor autenticado
            const formacionExistente = await this.gestionarFormacionesAcademicasUseCase.obtenerPorId(id);
            if (formacionExistente.doctorId !== doctorId) {
                res.status(403).json({
                    success: false,
                    message: 'No tienes permiso para eliminar esta formación académica',
                });
                return;
            }

            await this.gestionarFormacionesAcademicasUseCase.eliminar(id);
            res.status(200).json({
                message: 'Formación académica eliminada exitosamente',
                success: true,
            });
        } catch (error: any) {
            if (error instanceof FormacionAcademicaNoEncontradaError) {
                res.status(404).json({
                    success: false,
                    message: error.message,
                });
            } else {
                console.error('Error al eliminar formación académica:', error);
                res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor',
                });
            }
        }
    };
}
