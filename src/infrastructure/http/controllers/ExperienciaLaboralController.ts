import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { GestionarExperienciasLaboralesUseCase } from '../../../application/use-cases/GestionarExperienciasLaboralesUseCase';
import {
  CrearExperienciaLaboralDto,
  ActualizarExperienciaLaboralDto,
  FiltroExperienciasLaboralesDto,
} from '../../../application/dtos/ExperienciaLaboralDtos';
import { ExperienciaLaboralNoEncontradaError } from '../../../domain/errors/ExperienciasLaborales/ExperienciaLaboralNoEncontradaError';
import { DoctorNoEncontradoError } from '../../../domain/errors/ExperienciasLaborales/DoctorNoEncontradoError';
import { FechasInvalidasError } from '../../../domain/errors/ExperienciasLaborales/FechasInvalidasError';
import { InstitucionRequeridaError } from '../../../domain/errors/ExperienciasLaborales/InstitucionRequeridaError';

@injectable()
export class ExperienciaLaboralController {
  constructor(
    @inject('GestionarExperienciasLaboralesUseCase')
    private gestionarExperienciasLaboralesUseCase: GestionarExperienciasLaboralesUseCase
  ) {}

  crear = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto: CrearExperienciaLaboralDto = req.body;
      const experiencia = await this.gestionarExperienciasLaboralesUseCase.crear(dto);
      res.status(201).json({
        message: 'Experiencia laboral creada exitosamente',
        success: true,
        data: experiencia,
      });
    } catch (error: any) {
      if (error instanceof DoctorNoEncontradoError) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
      } else if (error instanceof FechasInvalidasError || error instanceof InstitucionRequeridaError) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
      } else if (
        error.message.includes('requerido') ||
        error.message.includes('inválido') ||
        error.message.includes('No se encontró') ||
        error.message.includes('debe') ||
        error.message.includes('puede') ||
        error.message.includes('especificar')
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
      const id = parseInt(req.params.id as string);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'ID inválido',
        });
        return;
      }

      const experiencia = await this.gestionarExperienciasLaboralesUseCase.obtenerPorId(id);
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
      const filtro: FiltroExperienciasLaboralesDto = {
        doctorId: req.query.doctorId ? parseInt(req.query.doctorId as string) : undefined,
        centroSaludId: req.query.centroSaludId ? parseInt(req.query.centroSaludId as string) : undefined,
        profesionId: req.query.profesionId ? parseInt(req.query.profesionId as string) : undefined,
        trabajaActualmente: req.query.trabajaActualmente === 'true' ? true : req.query.trabajaActualmente === 'false' ? false : undefined,
        estado: req.query.estado as string,
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
      if (error.message.includes('inválido')) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
      } else {
        console.error('Error al obtener experiencias laborales:', error);
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor',
        });
      }
    }
  };

  obtenerPorDoctor = async (req: Request, res: Response): Promise<void> => {
    try {
      const doctorId = parseInt(req.params.doctorId as string);

      if (isNaN(doctorId)) {
        res.status(400).json({
          success: false,
          message: 'ID del doctor inválido',
        });
        return;
      }

      const pagina = req.query.pagina ? parseInt(req.query.pagina as string) : undefined;
      const limite = req.query.limite ? parseInt(req.query.limite as string) : undefined;

      const resultado = await this.gestionarExperienciasLaboralesUseCase.obtenerPorDoctor(
        doctorId,
        pagina,
        limite
      );
      res.status(200).json({
        message: 'Experiencias laborales del doctor obtenidas exitosamente',
        success: true,
        data: resultado,
      });
    } catch (error: any) {
      if (error instanceof DoctorNoEncontradoError) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
      } else {
        console.error('Error al obtener experiencias laborales del doctor:', error);
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor',
        });
      }
    }
  };

  actualizar = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id as string);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'ID inválido',
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
      } else if (error instanceof FechasInvalidasError || error instanceof InstitucionRequeridaError) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
      } else if (
        error.message.includes('requerido') ||
        error.message.includes('inválido') ||
        error.message.includes('No se encontró') ||
        error.message.includes('debe') ||
        error.message.includes('puede') ||
        error.message.includes('especificar')
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
      const id = parseInt(req.params.id as string);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'ID inválido',
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
