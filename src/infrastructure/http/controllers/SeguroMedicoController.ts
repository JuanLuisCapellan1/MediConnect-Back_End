import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

// Use Cases
import { CrearSeguroMedicoUseCase } from '../../../application/use-cases/seguros/CrearSeguroMedicoUseCase';
import { ObtenerTodosSegurosUseCase } from '../../../application/use-cases/seguros/ObtenerTodosSegurosUseCase';
import { ActualizarSeguroMedicoUseCase } from '../../../application/use-cases/seguros/ActualizarSeguroMedicoUseCase';
import { EliminarSeguroMedicoUseCase } from '../../../application/use-cases/seguros/EliminarSeguroMedicoUseCase';
import { AgregarSeguroPacienteUseCase } from '../../../application/use-cases/seguros/AgregarSeguroPacienteUseCase';
import { ObtenerMisSegurosUseCase } from '../../../application/use-cases/seguros/ObtenerMisSegurosUseCase';
import { EliminarMiSeguroUseCase } from '../../../application/use-cases/seguros/EliminarMiSeguroUseCase';
import { AgregarSeguroDoctorUseCase } from '../../../application/use-cases/seguros/AgregarSeguroDoctorUseCase';
import { ObtenerSegurosAceptadosUseCase } from '../../../application/use-cases/seguros/ObtenerSegurosAceptadosUseCase';
import { EliminarSeguroAceptadoUseCase } from '../../../application/use-cases/seguros/EliminarSeguroAceptadoUseCase';

// DTOs
import {
    CrearSeguroMedicoDto,
    ActualizarSeguroMedicoDto,
    AgregarSeguroPacienteDto,
    AgregarSeguroDoctorDto,
    FiltroSegurosDto,
} from '../../../application/dtos/SeguroMedicoDtos';

export class SeguroMedicoController {
    // ============================================
    // Admin - CRUD completo
    // ============================================

    async crear(req: Request, res: Response): Promise<void> {
        try {
            const dto = plainToInstance(CrearSeguroMedicoDto, req.body);
            const errors = await validate(dto);

            if (errors.length > 0) {
                res.status(400).json({
                    success: false,
                    message: 'Validación fallida',
                    errors: errors.map((e) => Object.values(e.constraints || {})).flat(),
                });
                return;
            }

            const useCase = container.resolve(CrearSeguroMedicoUseCase);
            const seguro = await useCase.execute(dto);

            res.status(201).json({
                success: true,
                message: 'Seguro creado exitosamente',
                data: seguro,
            });
        } catch (error: any) {
            this.manejarError(error, res);
        }
    }

    async obtenerTodos(req: Request, res: Response): Promise<void> {
        try {
            const filtros = plainToInstance(FiltroSegurosDto, req.query);

            const useCase = container.resolve(ObtenerTodosSegurosUseCase);
            const resultado = await useCase.execute(filtros);

            res.status(200).json({
                success: true,
                message: 'Seguros obtenidos exitosamente',
                data: resultado.datos,
                total: resultado.total,
                pagina: filtros.pagina || 1,
                limite: filtros.limite || 20,
            });
        } catch (error: any) {
            this.manejarError(error, res);
        }
    }

    async actualizar(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(String(req.params.id));
            const dto = plainToInstance(ActualizarSeguroMedicoDto, req.body);
            const errors = await validate(dto);

            if (errors.length > 0) {
                res.status(400).json({
                    success: false,
                    message: 'Validación fallida',
                    errors: errors.map((e) => Object.values(e.constraints || {})).flat(),
                });
                return;
            }

            const useCase = container.resolve(ActualizarSeguroMedicoUseCase);
            const seguro = await useCase.execute(id, dto);

            res.status(200).json({
                success: true,
                message: 'Seguro actualizado exitosamente',
                data: seguro,
            });
        } catch (error: any) {
            this.manejarError(error, res);
        }
    }

    async eliminar(req: Request, res: Response): Promise<void> {
        try {
            const id = parseInt(String(req.params.id));

            const useCase = container.resolve(EliminarSeguroMedicoUseCase);
            await useCase.execute(id);

            res.status(200).json({
                success: true,
                message: 'Seguro eliminado exitosamente',
            });
        } catch (error: any) {
            this.manejarError(error, res);
        }
    }

    // ============================================
    // Paciente - Gestión de seguros (máximo 3)
    // ============================================

    async agregarMiSeguro(req: Request, res: Response): Promise<void> {
        try {
            const pacienteId = (req as any).user?.userId;
            const dto = plainToInstance(AgregarSeguroPacienteDto, req.body);
            const errors = await validate(dto);

            if (errors.length > 0) {
                res.status(400).json({
                    success: false,
                    message: 'Validación fallida',
                    errors: errors.map((e) => Object.values(e.constraints || {})).flat(),
                });
                return;
            }

            const useCase = container.resolve(AgregarSeguroPacienteUseCase);
            const resultado = await useCase.execute(pacienteId, dto);

            res.status(201).json({
                success: true,
                message: 'Seguro agregado exitosamente a tu perfil',
                data: resultado,
            });
        } catch (error: any) {
            this.manejarError(error, res);
        }
    }

    async obtenerMisSeguros(req: Request, res: Response): Promise<void> {
        try {
            const pacienteId = (req as any).user?.userId;

            const useCase = container.resolve(ObtenerMisSegurosUseCase);
            const seguros = await useCase.execute(pacienteId);

            res.status(200).json({
                success: true,
                message: 'Seguros obtenidos exitosamente',
                data: seguros,
            });
        } catch (error: any) {
            this.manejarError(error, res);
        }
    }

    async eliminarMiSeguro(req: Request, res: Response): Promise<void> {
        try {
            const pacienteId = (req as any).user?.userId;
            const seguroId = parseInt(String(req.params.id));

            const useCase = container.resolve(EliminarMiSeguroUseCase);
            await useCase.execute(pacienteId, seguroId);

            res.status(200).json({
                success: true,
                message: 'Seguro eliminado exitosamente de tu perfil',
            });
        } catch (error: any) {
            this.manejarError(error, res);
        }
    }

    // ============================================
    // Doctor - Gestión de seguros aceptados
    // ============================================

    async agregarSeguroAceptado(req: Request, res: Response): Promise<void> {
        try {
            const doctorId = (req as any).user?.userId;
            const dto = plainToInstance(AgregarSeguroDoctorDto, req.body);
            const errors = await validate(dto);

            if (errors.length > 0) {
                res.status(400).json({
                    success: false,
                    message: 'Validación fallida',
                    errors: errors.map((e) => Object.values(e.constraints || {})).flat(),
                });
                return;
            }

            const useCase = container.resolve(AgregarSeguroDoctorUseCase);
            const resultado = await useCase.execute(doctorId, dto);

            res.status(201).json({
                success: true,
                message: 'Seguro agregado exitosamente a tus seguros aceptados',
                data: resultado,
            });
        } catch (error: any) {
            this.manejarError(error, res);
        }
    }

    async obtenerSegurosAceptados(req: Request, res: Response): Promise<void> {
        try {
            const doctorId = (req as any).user?.userId;

            const useCase = container.resolve(ObtenerSegurosAceptadosUseCase);
            const seguros = await useCase.execute(doctorId);

            res.status(200).json({
                success: true,
                message: 'Seguros aceptados obtenidos exitosamente',
                data: seguros,
            });
        } catch (error: any) {
            this.manejarError(error, res);
        }
    }

    async eliminarSeguroAceptado(req: Request, res: Response): Promise<void> {
        try {
            const doctorId = (req as any).user?.userId;
            const seguroId = parseInt(String(req.params.seguroId));
            const tipoSeguroId = parseInt(String(req.params.tipoSeguroId));

            const useCase = container.resolve(EliminarSeguroAceptadoUseCase);
            await useCase.execute(doctorId, seguroId, tipoSeguroId);

            res.status(200).json({
                success: true,
                message: 'Seguro eliminado exitosamente de tus seguros aceptados',
            });
        } catch (error: any) {
            this.manejarError(error, res);
        }
    }

    // ============================================
    // Público (autenticado) - Ver seguros disponibles
    // ============================================

    async obtenerSegurosDisponibles(req: Request, res: Response): Promise<void> {
        try {
            const filtros = plainToInstance(FiltroSegurosDto, {
                ...req.query,
                estado: 'Activo', // Solo mostrar seguros activos
            });

            const useCase = container.resolve(ObtenerTodosSegurosUseCase);
            const resultado = await useCase.execute(filtros);

            res.status(200).json({
                success: true,
                message: 'Seguros disponibles obtenidos exitosamente',
                data: resultado.datos,
            });
        } catch (error: any) {
            this.manejarError(error, res);
        }
    }

    // ============================================
    // Manejo de errores
    // ============================================

    private manejarError(error: any, res: Response): void {
        console.error('Error en SeguroMedicoController:', error);

        if (error.message) {
            res.status(400).json({
                success: false,
                message: error.message,
            });
            return;
        }

        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
        });
    }
}
