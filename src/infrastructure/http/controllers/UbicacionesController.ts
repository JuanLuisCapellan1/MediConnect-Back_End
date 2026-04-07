/**
 * UbicacionesController.ts
 * Controlador HTTP para Ubicaciones
 */

import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { GestionarUbicacionesUseCase } from '../../../application/use-cases/GestionarUbicacionesUseCase';
import { CrearUbicacionDto, ActualizarUbicacionDto } from '../../../application/dtos/UbicacionDtos';
import { UbicacionFueraDeRangoError } from '../../../domain/errors/UbicacionFueraDeRangoError';

export class UbicacionesController {
  private gestionarUbicacionesUseCase: GestionarUbicacionesUseCase;

  constructor() {
    this.gestionarUbicacionesUseCase = container.resolve(GestionarUbicacionesUseCase);
  }

  /**
   * POST /ubicaciones - Crear una nueva Ubicacion
   */
  async crear(req: Request, res: Response): Promise<void> {
    try {
      const { barrioId, direccion, subBarrioId, codigoPostal, puntoGeografico, nombre } = req.body;

      // Validación de entrada
      if (barrioId === undefined || barrioId === null) {
        res.status(400).json({
          success: false,
          error: 'El campo barrioId es requerido'
        });
        return;
      }
      if (isNaN(barrioId)) {
        res.status(400).json({
          success: false,
          error: 'El campo barrioId debe ser un número'
        });
        return;
      }
      if (!direccion || typeof direccion !== 'string') {
        res.status(400).json({
          success: false,
          error: 'El campo direccion es requerido y debe ser string'
        });
        return;
      }
      if (nombre !== undefined && typeof nombre !== 'string') {
        res.status(400).json({ success: false, error: 'El campo nombre debe ser string' });
        return;
      }
      if (codigoPostal !== undefined && typeof codigoPostal !== 'string') {
        res.status(400).json({
          success: false,
          error: 'El campo codigoPostal debe ser string'
        });
        return;
      }
      if (puntoGeografico === undefined || puntoGeografico === null) {
        res.status(400).json({
          success: false,
          error: 'El campo puntoGeografico es requerido'
        });
        return;
      }
      if (typeof puntoGeografico !== 'object' || Array.isArray(puntoGeografico)) {
        res.status(400).json({
          success: false,
          error: 'El campo puntoGeografico debe ser un objeto GeoJSON Point: {"type":"Point","coordinates":[lon,lat]}'
        });
        return;
      }

      const dto: CrearUbicacionDto = {
        barrioId,
        direccion,
        nombre: nombre || undefined,
        codigoPostal: codigoPostal || undefined,
        puntoGeografico: JSON.stringify(puntoGeografico),
      };

      const ubicacion = await this.gestionarUbicacionesUseCase.crear(dto);
      res.status(201).json({
        success: true,
        data: ubicacion,
        message: 'Ubicación creada exitosamente'
      });
    } catch (error) {
      // Capturar errores de validación geográfica del trigger
      if (error instanceof UbicacionFueraDeRangoError) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }
      res
        .status(400)
        .json({
          success: false,
          error: error instanceof Error ? error.message : 'Error al crear la ubicación',
        });
    }
  }

  /**
   * GET /ubicaciones - Listar todas las Ubicaciones
   */
  async listarTodas(req: Request, res: Response): Promise<void> {
    try {
      const ubicaciones = await this.gestionarUbicacionesUseCase.listarTodas();
      res.status(200).json({
        success: true,
        count: ubicaciones.length,
        data: ubicaciones
      });
    } catch (error) {
      res
        .status(500)
        .json({
          success: false,
          error: error instanceof Error ? error.message : 'Error al listar ubicaciones',
        });
    }
  }

  /**
   * GET /ubicaciones/barrio/:barrioId - Listar Ubicaciones por barrio
   */
  async listarPorBarrio(req: Request, res: Response): Promise<void> {
    try {
      const barrioId = parseInt(String(req.params.barrioId), 10);

      if (isNaN(barrioId)) {
        res.status(400).json({
          success: false,
          error: 'El parámetro barrioId debe ser un número válido'
        });
        return;
      }

      const ubicaciones = await this.gestionarUbicacionesUseCase.listarPorBarrio(barrioId);
      res.status(200).json({
        success: true,
        count: ubicaciones.length,
        data: ubicaciones
      });
    } catch (error) {
      res
        .status(500)
        .json({
          success: false,
          error: error instanceof Error ? error.message : 'Error al listar ubicaciones por barrio',
        });
    }
  }

  /**
   * GET /ubicaciones/:id - Buscar Ubicacion por ID
   */
  async buscarPorId(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'El parámetro id debe ser un número válido'
        });
        return;
      }

      const ubicacion = await this.gestionarUbicacionesUseCase.buscarPorId(id);
      if (!ubicacion) {
        res.status(404).json({
          success: false,
          error: 'Ubicación no encontrada'
        });
        return;
      }

      res.status(200).json(ubicacion);
    } catch (error) {
      res
        .status(500)
        .json({
          success: false,
          error: error instanceof Error ? error.message : 'Error al buscar ubicación',
        });
    }
  }

  /**
   * GET /ubicaciones/buscar/direccion/:direccion - Buscar Ubicaciones por dirección
   */
  async buscarPorDireccion(req: Request, res: Response): Promise<void> {
    try {
      const direccion = req.params.direccion;

      if (!direccion || typeof direccion !== 'string') {
        res.status(400).json({
          success: false,
          error: 'El parámetro direccion es requerido'
        });
        return;
      }

      const ubicaciones = await this.gestionarUbicacionesUseCase.buscarPorDireccion(direccion);
      res.status(200).json({
        success: true,
        count: ubicaciones.length,
        data: ubicaciones
      });
    } catch (error) {
      res
        .status(500)
        .json({
          success: false,
          error: error instanceof Error ? error.message : 'Error al buscar por dirección',
        });
    }
  }

  /**
   * GET /ubicaciones/buscar/codigopostal/:codigoPostal - Buscar Ubicaciones por código postal
   */
  async buscarPorCodigoPostal(req: Request, res: Response): Promise<void> {
    try {
      const codigoPostal = req.params.codigoPostal;

      if (!codigoPostal || typeof codigoPostal !== 'string') {
        res.status(400).json({
          success: false,
          error: 'El parámetro codigoPostal es requerido'
        });
        return;
      }

      const ubicaciones = await this.gestionarUbicacionesUseCase.buscarPorCodigoPostal(codigoPostal);
      res.status(200).json({
        success: true,
        count: ubicaciones.length,
        data: ubicaciones
      });
    } catch (error) {
      res
        .status(500)
        .json({
          success: false,
          error: error instanceof Error ? error.message : 'Error al buscar por código postal',
        });
    }
  }

  /**
   * GET /ubicaciones/buscar/estado/:estado - Buscar Ubicaciones por estado
   */
  async buscarPorEstado(req: Request, res: Response): Promise<void> {
    try {
      const estado = req.params.estado;

      if (!estado || typeof estado !== 'string') {
        res.status(400).json({
          success: false,
          error: 'El parámetro estado es requerido'
        });
        return;
      }

      const ubicaciones = await this.gestionarUbicacionesUseCase.buscarPorEstado(estado);
      res.status(200).json({
        success: true,
        count: ubicaciones.length,
        data: ubicaciones
      });
    } catch (error) {
      res
        .status(500)
        .json({
          success: false,
          error: error instanceof Error ? error.message : 'Error al buscar por estado',
        });
    }
  }

  /**
   * PUT /ubicaciones/:id - Actualizar una Ubicacion
   */
  async actualizar(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'El parámetro id debe ser un número válido'
        });
        return;
      }

      const { barrioId, subBarrioId, direccion, codigoPostal, estado, puntoGeografico, nombre } = req.body;

      // Validación de entrada
      if (
        barrioId !== undefined &&
        (barrioId === null || isNaN(barrioId))
      ) {
        res.status(400).json({
          success: false,
          error: 'El campo barrioId debe ser un número válido'
        });
        return;
      }
      if (direccion !== undefined && typeof direccion !== 'string') {
        res.status(400).json({
          success: false,
          error: 'El campo direccion debe ser string'
        });
        return;
      }
      if (nombre !== undefined && typeof nombre !== 'string') {
        res.status(400).json({ success: false, error: 'El campo nombre debe ser string' });
        return;
      }
      if (codigoPostal !== undefined && typeof codigoPostal !== 'string') {
        res.status(400).json({
          success: false,
          error: 'El campo codigoPostal debe ser string'
        });
        return;
      }
      if (estado !== undefined && typeof estado !== 'string') {
        res.status(400).json({
          success: false,
          error: 'El campo estado debe ser string'
        });
        return;
      }
      if (puntoGeografico !== undefined) {
        if (typeof puntoGeografico !== 'object' || Array.isArray(puntoGeografico) || puntoGeografico === null) {
          res.status(400).json({
            success: false,
            error: 'El campo puntoGeografico debe ser un objeto GeoJSON Point: {"type":"Point","coordinates":[lon,lat]}'
          });
          return;
        }
      }

      const dto: ActualizarUbicacionDto = {
        id,
        barrioId: barrioId || undefined,
        direccion: direccion || undefined,
        nombre: nombre !== undefined ? nombre : undefined,
        codigoPostal: codigoPostal || undefined,
        estado: estado || undefined,
        puntoGeografico: puntoGeografico ? JSON.stringify(puntoGeografico) : undefined,
      };

      const ubicacion = await this.gestionarUbicacionesUseCase.actualizar(dto);
      res.status(200).json({
        success: true,
        data: ubicacion,
        message: 'Ubicación actualizada exitosamente'
      });
    } catch (error) {
      // Capturar errores de validación geográfica del trigger
      if (error instanceof UbicacionFueraDeRangoError) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }
      res
        .status(400)
        .json({
          success: false,
          error: error instanceof Error ? error.message : 'Error al actualizar la ubicación',
        });
    }
  }

  /**
   * DELETE /ubicaciones/:id - Eliminar una Ubicacion
   */
  async eliminar(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'El parámetro id debe ser un número válido'
        });
        return;
      }

      const ubicacion = await this.gestionarUbicacionesUseCase.eliminar(id);
      res.status(200).json({
        success: true,
        message: 'Ubicación eliminada correctamente',
        data: ubicacion,
      });
    } catch (error) {
      res
        .status(400)
        .json({
          success: false,
          error: error instanceof Error ? error.message : 'Error al eliminar la ubicación',
        });
    }
  }

  /**
   * GET /ubicaciones/mis-ubicaciones - Listar ubicaciones del doctor autenticado
   */
  async listarMisUbicaciones(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = (req as any).usuarioId as number;

      if (!doctorId) {
        res.status(401).json({
          success: false,
          error: 'No se pudo identificar al doctor autenticado',
        });
        return;
      }

      const ubicaciones = await this.gestionarUbicacionesUseCase.listarPorDoctor(doctorId);
      res.status(200).json({
        success: true,
        count: ubicaciones.length,
        data: ubicaciones,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al listar ubicaciones del doctor',
      });
    }
  }

  /**
   * POST /ubicaciones/mis-ubicaciones - Crear ubicación para el doctor autenticado
   */
  async crearMiUbicacion(req: Request, res: Response): Promise<void> {
    try {
      const doctorId = (req as any).usuarioId as number;

      if (!doctorId) {
        res.status(401).json({
          success: false,
          error: 'No se pudo identificar al doctor autenticado',
        });
        return;
      }

      const { barrioId, codigoPostal, puntoGeografico, direccion, nombre } = req.body;

      if (barrioId === undefined || barrioId === null) {
        res.status(400).json({ success: false, error: 'El campo barrioId es requerido' });
        return;
      }
      if (isNaN(Number(barrioId))) {
        res.status(400).json({ success: false, error: 'El campo barrioId debe ser un número' });
        return;
      }
      if (!direccion || typeof direccion !== 'string') {
        res.status(400).json({ success: false, error: 'El campo direccion es requerido y debe ser string' });
        return;
      }
      if (nombre !== undefined && typeof nombre !== 'string') {
        res.status(400).json({ success: false, error: 'El campo nombre debe ser string' });
        return;
      }
      if (codigoPostal !== undefined && typeof codigoPostal !== 'string') {
        res.status(400).json({ success: false, error: 'El campo codigoPostal debe ser string' });
        return;
      }
      if (puntoGeografico === undefined || puntoGeografico === null) {
        res.status(400).json({ success: false, error: 'El campo puntoGeografico es requerido' });
        return;
      }
      if (typeof puntoGeografico !== 'object' || Array.isArray(puntoGeografico)) {
        res.status(400).json({ success: false, error: 'El campo puntoGeografico debe ser un objeto GeoJSON Point: {"type":"Point","coordinates":[lon,lat]}' });
        return;
      }

      const dto = {
        barrioId: Number(barrioId),
        direccion,
        nombre: nombre || undefined,
        codigoPostal: codigoPostal || undefined,
        puntoGeografico: JSON.stringify(puntoGeografico),
      };

      const ubicacion = await this.gestionarUbicacionesUseCase.crearParaDoctor(doctorId, dto);
      res.status(201).json({
        success: true,
        data: ubicacion,
        message: 'Ubicación creada y asignada al doctor exitosamente',
      });
    } catch (error) {
      if (error instanceof UbicacionFueraDeRangoError) {
        res.status(400).json({ success: false, error: error.message });
        return;
      }
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Error al crear la ubicación',
      });
    }
  }
}

