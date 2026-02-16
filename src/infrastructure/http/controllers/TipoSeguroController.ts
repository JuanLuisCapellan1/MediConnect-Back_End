import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

// Use Cases
import { CrearTipoSeguroUseCase } from '../../../application/use-cases/tipos-seguros/CrearTipoSeguroUseCase';
import { ObtenerTodosTiposSegurosUseCase } from '../../../application/use-cases/tipos-seguros/ObtenerTodosTiposSegurosUseCase';
import { ObtenerTipoSeguroPorIdUseCase } from '../../../application/use-cases/tipos-seguros/ObtenerTipoSeguroPorIdUseCase';
import { ActualizarTipoSeguroUseCase } from '../../../application/use-cases/tipos-seguros/ActualizarTipoSeguroUseCase';
import { EliminarTipoSeguroUseCase } from '../../../application/use-cases/tipos-seguros/EliminarTipoSeguroUseCase';
import { ObtenerTiposActivosUseCase } from '../../../application/use-cases/tipos-seguros/ObtenerTiposActivosUseCase';

// DTOs
import {
    CrearTipoSeguroDto,
    ActualizarTipoSeguroDto,
    FiltroTiposSegurosDto,
} from '../../../application/dtos/TipoSeguroDtos';

export class TipoSeguroController {
    // ============================================
    // Admin - CRUD completo
    // ============================================

    async crear(req: Request, res: Response): Promise<void> {
        try {
            const dto = Object.assign(new CrearTipoSeguroDto(req.body.nombre, req.body.descripcion), req.body);
            const errors = await validate(dto);

            if (errors.length > 0) {
                res.status(400).json({
                    success: false,
                    message: 'Validación fallida',
                    errors: errors.map((e) => Object.values(e.constraints || {})).flat(),
                });
                return;
            }

            const useCase = container.resolve(CrearTipoSeguroUseCase);
            const tipoSeguro = await useCase.execute(dto);

            res.status(201).json({
                success: true,
                message: 'Tipo de seguro creado exitosamente',
                data: tipoSeguro,
            });
        } catch (error: any) {
            this.manejarError(error, res);
        }
    }

    async obtenerTodos(req: Request, res: Response): Promise<void> {
        try {
            const filtros = new FiltroTiposSegurosDto(
                req.query.estado as string,
                req.query.busqueda as string,
                req.query.pagina ? parseInt(req.query.pagina as string) : undefined,
                req.query.limite ? parseInt(req.query.limite as string) : undefined
            );

            const useCase = container.resolve(ObtenerTodosTiposSegurosUseCase);
            const resultado = await useCase.execute(filtros);

            res.status(200).json({
                success: true,
                message: 'Tipos de seguros obtenidos exitosamente',
                data: resultado.datos,
                total: resultado.total,
                pagina: filtros.pagina,
                limite: filtros.limite,
            });
        } catch (error: any) {
            this.manejarError(error, res);
        }
    }

    async obtenerPorId(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id as string);

            const useCase = container.resolve(ObtenerTipoSeguroPorIdUseCase);
            const tipoSeguro = await useCase.execute(id);

            res.status(200).json({
                success: true,
                message: 'Tipo de seguro obtenido exitosamente',
                data: tipoSeguro,
            });
        } catch (error: any) {
            this.manejarError(error, res);
        }
    }

    async actualizar(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id as string);
            const dto = Object.assign(new ActualizarTipoSeguroDto(), req.body);
            const errors = await validate(dto);

            if (errors.length > 0) {
                res.status(400).json({
                    success: false,
                    message: 'Validación fallida',
                    errors: errors.map((e) => Object.values(e.constraints || {})).flat(),
                });
                return;
            }

            const useCase = container.resolve(ActualizarTipoSeguroUseCase);
            const tipoSeguro = await useCase.execute(id, dto);

            res.status(200).json({
                success: true,
                message: 'Tipo de seguro actualizado exitosamente',
                data: tipoSeguro,
            });
        } catch (error: any) {
            this.manejarError(error, res);
        }
    }

    async eliminar(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id as string);

            const useCase = container.resolve(EliminarTipoSeguroUseCase);
            await useCase.execute(id);

            res.status(200).json({
                success: true,
                message: 'Tipo de seguro eliminado exitosamente',
            });
        } catch (error: any) {
            this.manejarError(error, res);
        }
    }

    // ============================================
    // Cliente - Solo lectura
    // ============================================

    async obtenerActivos(req: Request, res: Response): Promise<void> {
        try {
            const useCase = container.resolve(ObtenerTiposActivosUseCase);
            const tiposSeguros = await useCase.execute();

            res.status(200).json({
                success: true,
                message: 'Tipos de seguros activos obtenidos exitosamente',
                data: tiposSeguros,
            });
        } catch (error: any) {
            this.manejarError(error, res);
        }
    }

    // ============================================
    // Manejo de Errores
    // ============================================

    private manejarError(error: any, res: Response): void {
        console.error('Error en TipoSeguroController:', error);

        if (error.message.includes('no fue encontrado') || error.message.includes('no existe')) {
            res.status(404).json({
                success: false,
                message: error.message,
            });
            return;
        }

        if (error.message.includes('ya existe') || error.message.includes('en uso')) {
            res.status(409).json({
                success: false,
                message: error.message,
            });
            return;
        }

        res.status(400).json({
            success: false,
            message: error.message || 'Error al procesar la solicitud',
        });
    }
}
