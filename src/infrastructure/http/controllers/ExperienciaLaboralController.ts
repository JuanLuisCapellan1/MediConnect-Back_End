import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { GestionarExperienciasLaboralesUseCase } from '../../../application/use-cases/GestionarExperienciasLaboralesUseCase';
import {
  CrearExperienciaLaboralDto,
  ActualizarExperienciaLaboralDto,
  FiltroExperienciasLaboralesDto,
} from '../../../application/dtos/ExperienciaLaboralDtos';
import { ExperienciaLaboralNoEncontradaError } from '../../../domain/errors/ExperienciasLaborales/ExperienciaLaboralNoEncontradaError';
import { FechasInvalidasError } from '../../../domain/errors/ExperienciasLaborales/FechasInvalidasError';

@injectable()
export class ExperienciaLaboralController {
  constructor(
    @inject('GestionarExperienciasLaboralesUseCase')
    private gestionarExperienciasLaboralesUseCase: GestionarExperienciasLaboralesUseCase
  ) { }

  crear = async (req: Request, res: Response): Promise<void> => {
    try {
      const doctorId = (req as any).usuarioId; // Obtener doctor autenticado del JWT
      const dto: CrearExperienciaLaboralDto = {
        ...req.body,
        doctorId // Asignar doctor autenticado
      };
      const experiencia = await this.gestionarExperienciasLaboralesUseCase.crear(dto);
      res.status(201).json({
        message: 'Experiencia laboral creada exitosamente',
        success: true,
        data: experiencia,
      });
    } catch (error: any) {
      if (error instanceof FechasInvalidasError) {
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
        console.error('Error al crear experiencia laboral:', error);
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

      const experiencia = await this.gestionarExperienciasLaboralesUseCase.obtenerPorId(id);

      // Verificar que la experiencia pertenece al doctor autenticado
      if (experiencia.doctorId !== doctorId) {
        res.status(403).json({
          success: false,
          message: 'No tienes permiso para acceder a esta experiencia laboral',
        });
        return;
      }

      res.status(200).json({
        message: 'Experiencia laboral obtenida exitosamente',
        success: true,
        data: experiencia,
      });
    } catch (error: any) {
      if (error instanceof ExperienciaLaboralNoEncontradaError) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
      } else {
        console.error('Error al obtener experiencia laboral:', error);
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
      const filtro: FiltroExperienciasLaboralesDto = {
        doctorId, // Filtrar solo por el doctor autenticado
        estado: req.query.estado as string || 'Activo', // Por defecto solo mostrar activas
        busqueda: req.query.busqueda as string,
        pagina: req.query.pagina ? parseInt(req.query.pagina as string) : undefined,
        limite: req.query.limite ? parseInt(req.query.limite as string) : undefined,
      };

      const resultado = await this.gestionarExperienciasLaboralesUseCase.obtenerTodos(filtro);

      res.status(200).json({
        message: 'Experiencias laborales obtenidas exitosamente',
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      console.error('Error al obtener experiencias laborales:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
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

      // Verificar que la experiencia existe y pertenece al doctor
      const experienciaExistente = await this.gestionarExperienciasLaboralesUseCase.obtenerPorId(id);
      if (experienciaExistente.doctorId !== doctorId) {
        res.status(403).json({
          success: false,
          message: 'No tienes permiso para actualizar esta experiencia laboral',
        });
        return;
      }

      const dto: ActualizarExperienciaLaboralDto = req.body;
      const experiencia = await this.gestionarExperienciasLaboralesUseCase.actualizar(id, dto);

      res.status(200).json({
        message: 'Experiencia laboral actualizada exitosamente',
        success: true,
        data: experiencia,
      });
    } catch (error: any) {
      if (error instanceof ExperienciaLaboralNoEncontradaError) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
      } else if (error instanceof FechasInvalidasError) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
      } else if (
        error.message.includes('requerido') ||
        error.message.includes('inválido') ||
        error.message.includes('debe') ||
        error.message.includes('puede')
      ) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
      } else {
        console.error('Error al actualizar experiencia laboral:', error);
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

      // Verificar que la experiencia existe y pertenece al doctor
      const experiencia = await this.gestionarExperienciasLaboralesUseCase.obtenerPorId(id);
      if (experiencia.doctorId !== doctorId) {
        res.status(403).json({
          success: false,
          message: 'No tienes permiso para eliminar esta experiencia laboral',
        });
        return;
      }

      await this.gestionarExperienciasLaboralesUseCase.eliminar(id);

      res.status(200).json({
        message: 'Experiencia laboral eliminada exitosamente',
        success: true,
      });
    } catch (error: any) {
      if (error instanceof ExperienciaLaboralNoEncontradaError) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
      } else {
        console.error('Error al eliminar experiencia laboral:', error);
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor',
        });
      }
    }
  };
}
