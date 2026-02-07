/**
 * HorariosController.ts
 * Controlador HTTP para Horarios
 */

import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { GestionarHorariosUseCase } from '../../../application/use-cases/GestionarHorariosUseCase';
import { CrearHorarioDto, ActualizarHorarioDto } from '../../../application/dtos/HorarioDtos';
import { HorarioConflictoError } from '../../../domain/errors/Horarios/HorarioConflictoError';
import { VerificarValor } from '../../../domain/errors/Estados/VerificarValor';

export class HorariosController {
  private gestionarHorariosUseCase: GestionarHorariosUseCase;

  constructor() {
    this.gestionarHorariosUseCase = container.resolve(GestionarHorariosUseCase);
  }

  /**
   * POST /horarios - Crear un nuevo Horario
   */
  async crear(req: Request, res: Response): Promise<void> {
    try {
      const { doctorId, nombre, diaSemana, horaInicio, horaFin, ubicacionId } = req.body;

      const doctorIdNum = Number(doctorId);
      const diaSemanaNum = Number(diaSemana);
      const ubicacionIdNum = Number(ubicacionId);

      if (!doctorId || isNaN(doctorIdNum)) {
        res.status(400).json({ success: false, message: 'El campo doctorId es requerido y debe ser numérico' });
        return;
      }

      if (!nombre || typeof nombre !== 'string') {
        res.status(400).json({ success: false, message: 'El campo nombre es requerido y debe ser string' });
        return;
      }

      if (diaSemana === undefined || isNaN(diaSemanaNum)) {
        res.status(400).json({ success: false, message: 'El campo diaSemana es requerido y debe ser numérico' });
        return;
      }

      if (!horaInicio || typeof horaInicio !== 'string') {
        res.status(400).json({ success: false, message: 'El campo horaInicio es requerido y debe ser string' });
        return;
      }

      if (!horaFin || typeof horaFin !== 'string') {
        res.status(400).json({ success: false, message: 'El campo horaFin es requerido y debe ser string' });
        return;
      }

      if (!ubicacionId || isNaN(ubicacionIdNum)) {
        res.status(400).json({ success: false, message: 'El campo ubicacionId es requerido y debe ser numérico' });
        return;
      }

      const dto: CrearHorarioDto = {
        doctorId: doctorIdNum,
        nombre,
        diaSemana: diaSemanaNum,
        horaInicio,
        horaFin,
        ubicacionId: ubicacionIdNum
      };

      const horario = await this.gestionarHorariosUseCase.crear(dto);
      res.status(201).json({
        success: true,
        data: horario,
        message: 'Horario creado exitosamente'
      });
    } catch (error) {
      this.manejarError(error, res);
    }
  }

  /**
   * GET /horarios - Listar todos los Horarios
   */
  async listarTodos(req: Request, res: Response): Promise<void> {
    try {
      const horarios = await this.gestionarHorariosUseCase.listarTodos();
      res.status(200).json({
        success: true,
        data: horarios,
        count: horarios.length
      });
    } catch (error) {
      this.manejarError(error, res, 500);
    }
  }

  /**
   * GET /horarios/doctor/:doctorId - Listar horarios por doctor
   */
  async listarPorDoctor(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = parseInt(String(req.params.doctorId), 10);

      if (isNaN(doctorId) || doctorId <= 0) {
        res.status(400).json({ success: false, message: 'El doctorId debe ser un número válido' });
        return;
      }

      const horarios = await this.gestionarHorariosUseCase.listarPorDoctor(doctorId);
      res.status(200).json({
        success: true,
        data: horarios,
        count: horarios.length
      });
    } catch (error) {
      this.manejarError(error, res, 500);
    }
  }

  /**
   * GET /horarios/dia/:diaSemana - Listar horarios por día
   */
  async listarPorDia(req: Request, res: Response): Promise<void> {
    try {
      const diaSemana = parseInt(String(req.params.diaSemana), 10);

      if (isNaN(diaSemana) || diaSemana < 0 || diaSemana > 6) {
        res.status(400).json({ success: false, message: 'El día de la semana debe estar entre 0 y 6' });
        return;
      }

      const horarios = await this.gestionarHorariosUseCase.listarPorDia(diaSemana);
      res.status(200).json({
        success: true,
        data: horarios,
        count: horarios.length
      });
    } catch (error) {
      this.manejarError(error, res, 500);
    }
  }

  /**
   * GET /horarios/:id - Buscar horario por ID
   */
  async buscarPorId(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);

      if (isNaN(id) || id <= 0) {
        res.status(400).json({ success: false, message: 'El ID debe ser un número válido' });
        return;
      }

      const horario = await this.gestionarHorariosUseCase.buscarPorId(id);
      if (!horario) {
        res.status(404).json({ success: false, message: 'Horario no encontrado' });
        return;
      }

      res.status(200).json({ success: true, data: horario });
    } catch (error) {
      this.manejarError(error, res, 500);
    }
  }

  /**
   * PUT /horarios/:id - Actualizar horario
   */
  async actualizar(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);

      if (isNaN(id) || id <= 0) {
        res.status(400).json({ success: false, message: 'El ID debe ser un número válido' });
        return;
      }

      const dto: ActualizarHorarioDto = {
        id,
        doctorId: req.body.doctorId !== undefined ? Number(req.body.doctorId) : undefined,
        nombre: req.body.nombre,
        diaSemana: req.body.diaSemana !== undefined ? Number(req.body.diaSemana) : undefined,
        horaInicio: req.body.horaInicio,
        horaFin: req.body.horaFin,
        ubicacionId: req.body.ubicacionId !== undefined ? Number(req.body.ubicacionId) : undefined,
        estado: req.body.estado
      };

      const horarioActualizado = await this.gestionarHorariosUseCase.actualizar(dto);
      res.status(200).json({
        success: true,
        data: horarioActualizado,
        message: 'Horario actualizado exitosamente'
      });
    } catch (error) {
      this.manejarError(error, res);
    }
  }

  /**
   * DELETE /horarios/:id - Eliminar horario (soft delete)
   */
  async eliminar(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);

      if (isNaN(id) || id <= 0) {
        res.status(400).json({ success: false, message: 'El ID debe ser un número válido' });
        return;
      }

      const horarioEliminado = await this.gestionarHorariosUseCase.eliminar(id);
      res.status(200).json({
        success: true,
        data: horarioEliminado,
        message: 'Horario eliminado exitosamente'
      });
    } catch (error) {
      this.manejarError(error, res);
    }
  }

  /**
   * GET /horarios/estado/:estado - Listar horarios por estado
   */
  async listarPorEstado(req: Request, res: Response): Promise<void> {
    try {
      const estado = String(req.params.estado).trim();

      if (!estado) {
        res.status(400).json({ success: false, message: 'El estado es requerido' });
        return;
      }

      const estadosValidos = ['Activo', 'Inactivo', 'Eliminado'];
      if (!estadosValidos.includes(estado)) {
        res.status(400).json({
          success: false,
          message: `El estado debe ser uno de: ${estadosValidos.join(', ')}`
        });
        return;
      }

      const horarios = await this.gestionarHorariosUseCase.listarPorEstado(estado);
      res.status(200).json({
        success: true,
        data: horarios,
        count: horarios.length
      });
    } catch (error) {
      this.manejarError(error, res, 500);
    }
  }

  private manejarError(error: unknown, res: Response, statusCode: number = 400): void {
    if (error instanceof HorarioConflictoError || error instanceof VerificarValor) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }

    res.status(statusCode).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error inesperado'
    });
  }
}