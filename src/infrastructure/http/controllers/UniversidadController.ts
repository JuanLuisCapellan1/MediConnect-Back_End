import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { GestionarUniversidadesUseCase } from '../../../application/use-cases/GestionarUniversidadesUseCase';
import { CrearUniversidadDto, ActualizarUniversidadDto, FiltroUniversidadesDto } from '../../../application/dtos/UniversidadDtos';

@injectable()
export class UniversidadController {
    constructor(
        @inject('GestionarUniversidadesUseCase')
        private gestionarUniversidadesUseCase: GestionarUniversidadesUseCase
    ) { }

    crear = async (req: Request, res: Response): Promise<void> => {
        try {
            const dto: CrearUniversidadDto = req.body;
            const universidad = await this.gestionarUniversidadesUseCase.crear(dto);
            res.status(201).json({
                message: 'Universidad creada exitosamente',
                success: true,
                data: universidad,
            });
        } catch (error: any) {
            console.error('Error al crear universidad:', error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    };

    obtenerPorId = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id as string);
            const universidad = await this.gestionarUniversidadesUseCase.obtenerPorId(id);
            res.status(200).json({
                message: 'Universidad obtenida exitosamente',
                success: true,
                data: universidad,
            });
        } catch (error: any) {
            console.error('Error al obtener universidad:', error);
            res.status(error.message.includes('no encontrada') ? 404 : 400).json({
                success: false,
                message: error.message,
            });
        }
    };

    obtenerTodos = async (req: Request, res: Response): Promise<void> => {
        try {
            const filtro: FiltroUniversidadesDto = {
                paisId: req.query.paisId ? parseInt(req.query.paisId as string) : undefined,
                estado: req.query.estado as string || 'Activo',
                busqueda: req.query.busqueda as string,
                pagina: req.query.pagina ? parseInt(req.query.pagina as string) : undefined,
                limite: req.query.limite ? parseInt(req.query.limite as string) : undefined,
            };

            const resultado = await this.gestionarUniversidadesUseCase.obtenerTodos(filtro);
            res.status(200).json({
                message: 'Universidades obtenidas exitosamente',
                success: true,
                data: resultado,
            });
        } catch (error: any) {
            console.error('Error al obtener universidades:', error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    };

    obtenerPorPais = async (req: Request, res: Response): Promise<void> => {
        try {
            const paisId = parseInt(req.params.paisId as string);
            const universidades = await this.gestionarUniversidadesUseCase.obtenerPorPais(paisId);
            res.status(200).json({
                message: 'Universidades del país obtenidas exitosamente',
                success: true,
                data: universidades,
            });
        } catch (error: any) {
            console.error('Error al obtener universidades del país:', error);
            res.status(error.message.includes('no encontrado') ? 404 : 400).json({
                success: false,
                message: error.message,
            });
        }
    };

    actualizar = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id as string);
            const dto: ActualizarUniversidadDto = req.body;
            const universidad = await this.gestionarUniversidadesUseCase.actualizar(id, dto);
            res.status(200).json({
                message: 'Universidad actualizada exitosamente',
                success: true,
                data: universidad,
            });
        } catch (error: any) {
            console.error('Error al actualizar universidad:', error);
            res.status(error.message.includes('no encontrada') ? 404 : 400).json({
                success: false,
                message: error.message,
            });
        }
    };

    eliminar = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id as string);
            await this.gestionarUniversidadesUseCase.eliminar(id);
            res.status(200).json({
                message: 'Universidad eliminada exitosamente',
                success: true,
            });
        } catch (error: any) {
            console.error('Error al eliminar universidad:', error);
            res.status(error.message.includes('no encontrada') ? 404 : 400).json({
                success: false,
                message: error.message,
            });
        }
    };
}
