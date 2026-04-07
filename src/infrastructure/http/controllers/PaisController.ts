import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { GestionarPaisesUseCase } from '../../../application/use-cases/GestionarPaisesUseCase';
import { CrearPaisDto, ActualizarPaisDto, FiltroPaisesDto } from '../../../application/dtos/PaisDtos';

@injectable()
export class PaisController {
    constructor(
        @inject('GestionarPaisesUseCase')
        private gestionarPaisesUseCase: GestionarPaisesUseCase
    ) { }

    crear = async (req: Request, res: Response): Promise<void> => {
        try {
            const dto: CrearPaisDto = req.body;
            const pais = await this.gestionarPaisesUseCase.crear(dto);
            res.status(201).json({
                message: 'País creado exitosamente',
                success: true,
                data: pais,
            });
        } catch (error: any) {
            console.error('Error al crear país:', error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    };

    obtenerPorId = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id as string);
            const pais = await this.gestionarPaisesUseCase.obtenerPorId(id);
            res.status(200).json({
                message: 'País obtenido exitosamente',
                success: true,
                data: pais,
            });
        } catch (error: any) {
            console.error('Error al obtener país:', error);
            res.status(error.message.includes('no encontrado') ? 404 : 400).json({
                success: false,
                message: error.message,
            });
        }
    };

    obtenerTodos = async (req: Request, res: Response): Promise<void> => {
        try {
            const filtro: FiltroPaisesDto = {
                estado: req.query.estado as string || 'Activo',
                busqueda: req.query.busqueda as string,
                pagina: req.query.pagina ? parseInt(req.query.pagina as string) : undefined,
                limite: req.query.limite ? parseInt(req.query.limite as string) : undefined,
            };

            const resultado = await this.gestionarPaisesUseCase.obtenerTodos(filtro);
            res.status(200).json({
                message: 'Países obtenidos exitosamente',
                success: true,
                data: resultado,
            });
        } catch (error: any) {
            console.error('Error al obtener países:', error);
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    };

    actualizar = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id as string);
            const dto: ActualizarPaisDto = req.body;
            const pais = await this.gestionarPaisesUseCase.actualizar(id, dto);
            res.status(200).json({
                message: 'País actualizado exitosamente',
                success: true,
                data: pais,
            });
        } catch (error: any) {
            console.error('Error al actualizar país:', error);
            res.status(error.message.includes('no encontrado') ? 404 : 400).json({
                success: false,
                message: error.message,
            });
        }
    };

    eliminar = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id as string);
            await this.gestionarPaisesUseCase.eliminar(id);
            res.status(200).json({
                message: 'País eliminado exitosamente',
                success: true,
            });
        } catch (error: any) {
            console.error('Error al eliminar país:', error);
            res.status(error.message.includes('no encontrado') ? 404 : 400).json({
                success: false,
                message: error.message,
            });
        }
    };
}
