import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { GestionarServicioHorariosUseCase } from '../../../application/use-cases/GestionarServicioHorariosUseCase';
import { FiltroServiciosHorariosDto } from '../../../application/dtos/ServicioHorarioDtos';
import { ServicioHorario } from '../../../domain/entities/ServicioHorario';

@injectable()
export class ServicioHorarioController {
  constructor(
    private gestionarServicioHorariosUseCase: GestionarServicioHorariosUseCase
  ) {}

  /**
   * Crea un nuevo ServicioHorario
   * POST /api/servicios-horarios
   */
  async crear(req: Request, res: Response): Promise<void> {
    try {
      const { servicioId, horarioId, estado } = req.body;

      const servicioHorario = await this.gestionarServicioHorariosUseCase.crear({
        servicioId,
        horarioId,
        estado,
      });

      res.status(201).json({
        success: true,
        message: 'ServicioHorario creado exitosamente',
        data: {
          servicioId: servicioHorario.servicioId,
          horarioId: servicioHorario.horarioId,
          estado: servicioHorario.estado,
          creadoEn: servicioHorario.creadoEn,
        },
      });
    } catch (error: any) {
      this.manejarError(error, res);
    }
  }

  /**
   * Obtiene un ServicioHorario específico
   * GET /api/servicios-horarios/:servicioId/:horarioId
   */
  async obtener(req: Request, res: Response): Promise<void> {
    try {
      const { servicioId, horarioId } = req.params;

      const servicioHorario = await this.gestionarServicioHorariosUseCase.obtener(
        Number(servicioId),
        Number(horarioId)
      );

      res.status(200).json({
        success: true,
        data: {
          servicioId: servicioHorario.servicioId,
          horarioId: servicioHorario.horarioId,
          estado: servicioHorario.estado,
          creadoEn: servicioHorario.creadoEn,
        },
      });
    } catch (error: any) {
      this.manejarError(error, res);
    }
  }

  /**
   * Actualiza un ServicioHorario
   * PUT /api/servicios-horarios/:servicioId/:horarioId
   * Permite cambiar la combinación de IDs (servicioId y/o horarioId) y/o el estado
   */
  async actualizar(req: Request, res: Response): Promise<void> {
    try {
      const { servicioId, horarioId } = req.params;
      const { servicioId: newServicioId, horarioId: newHorarioId, estado } = req.body;

      const servicioHorario = await this.gestionarServicioHorariosUseCase.actualizar(
        Number(servicioId),
        Number(horarioId),
        { 
          servicioId: newServicioId,
          horarioId: newHorarioId,
          estado 
        }
      );

      res.status(200).json({
        success: true,
        message: 'ServicioHorario actualizado exitosamente',
        data: {
          servicioId: servicioHorario.servicioId,
          horarioId: servicioHorario.horarioId,
          estado: servicioHorario.estado,
          creadoEn: servicioHorario.creadoEn,
        },
      });
    } catch (error: any) {
      this.manejarError(error, res);
    }
  }

  /**
   * Elimina un ServicioHorario
   * DELETE /api/servicios-horarios/:servicioId/:horarioId
   */
  async eliminar(req: Request, res: Response): Promise<void> {
    try {
      const { servicioId, horarioId } = req.params;

      await this.gestionarServicioHorariosUseCase.eliminar(
        Number(servicioId),
        Number(horarioId)
      );

      res.status(200).json({
        success: true,
        message: 'ServicioHorario eliminado exitosamente',
      });
    } catch (error: any) {
      this.manejarError(error, res);
    }
  }

  /**
   * Lista todos los ServiciosHorarios con paginación y filtros
   * GET /api/servicios-horarios
   */
  async listar(req: Request, res: Response): Promise<void> {
    try {
      const filtros: FiltroServiciosHorariosDto = {
        servicioId: req.query.servicioId ? Number(req.query.servicioId) : undefined,
        horarioId: req.query.horarioId ? Number(req.query.horarioId) : undefined,
        estado: req.query.estado as string | undefined,
        pagina: req.query.pagina ? Number(req.query.pagina) : 1,
        limite: req.query.limite ? Number(req.query.limite) : 10,
      };

      const { datos, total } =
        await this.gestionarServicioHorariosUseCase.listar(filtros);

      const totalPaginas = Math.ceil(total / (filtros.limite || 10));

      res.status(200).json({
        success: true,
        data: datos.map((sh: ServicioHorario) => ({
          servicioId: sh.servicioId,
          horarioId: sh.horarioId,
          estado: sh.estado,
          creadoEn: sh.creadoEn,
        })),
        paginacion: {
          total,
          pagina: filtros.pagina || 1,
          limite: filtros.limite || 10,
          totalPaginas,
        },
      });
    } catch (error: any) {
      this.manejarError(error, res);
    }
  }

  /**
   * Obtiene todos los horarios de un servicio
   * GET /api/servicios-horarios/servicio/:servicioId
   */
  async obtenerPorServicio(req: Request, res: Response): Promise<void> {
    try {
      const { servicioId } = req.params;

      const serviciosHorarios =
        await this.gestionarServicioHorariosUseCase.obtenerPorServicio(
          Number(servicioId)
        );

      res.status(200).json({
        success: true,
        datos: serviciosHorarios.map((sh: ServicioHorario) => ({
          servicioId: sh.servicioId,
          horarioId: sh.horarioId,
          estado: sh.estado,
          creadoEn: sh.creadoEn,
        })),
      });
    } catch (error: any) {
      this.manejarError(error, res);
    }
  }

  /**
   * Obtiene todos los servicios de un horario
   * GET /api/servicios-horarios/horario/:horarioId
   */
  async obtenerPorHorario(req: Request, res: Response): Promise<void> {
    try {
      const { horarioId } = req.params;

      const serviciosHorarios =
        await this.gestionarServicioHorariosUseCase.obtenerPorHorario(
          Number(horarioId)
        );

      res.status(200).json({
        success: true,
        datos: serviciosHorarios.map((sh: ServicioHorario) => ({
          servicioId: sh.servicioId,
          horarioId: sh.horarioId,
          estado: sh.estado,
          creadoEn: sh.creadoEn,
        })),
      });
    } catch (error: any) {
      this.manejarError(error, res);
    }
  }

  /**
   * Obtiene todas las relaciones ServicioHorario filtradas por estado
   * GET /api/servicios-horarios/estado/:estado
   */
  async obtenerPorEstado(req: Request, res: Response): Promise<void> {
    try {
      const { estado } = req.params;
      const pagina = req.query.pagina ? Number(req.query.pagina) : 1;
      const limite = req.query.limite ? Number(req.query.limite) : 10;

      // Validar que el estado sea válido
      const estadosValidos = ['Activo', 'Inactivo', 'Eliminado'];
      if (!estadosValidos.includes(estado as string)) {
        res.status(400).json({
          success: false,
          mensaje: `El estado debe ser uno de: ${estadosValidos.join(', ')}`,
        });
        return;
      }

      console.log('Estado recibido:', estado);
      const filtros: FiltroServiciosHorariosDto = {
        estado: estado as string,
        pagina,
        limite,
      };

      const { datos, total } =
        await this.gestionarServicioHorariosUseCase.listar(filtros);

      const totalPaginas = Math.ceil(total / (limite || 10));

      res.status(200).json({
        success: true,
        datos: datos.map((sh: ServicioHorario) => ({
          servicioId: sh.servicioId,
          horarioId: sh.horarioId,
          estado: sh.estado,
          creadoEn: sh.creadoEn,
        })),
        paginacion: {
          total,
          pagina,
          limite,
          totalPaginas,
        },
      });
    } catch (error: any) {
      this.manejarError(error, res);
    }
  }

  /**
   * Maneja los errores y devuelve respuestas apropiadas
   */
  private manejarError(error: any, res: Response): void {
    // Errores de validación de ServicioHorario
    if (error.name === 'ServicioHorarioInvalidoError') {
      res.status(400).json({
        success: false,
        mensaje: error.message || 'Datos de ServicioHorario inválidos',
      });
      return;
    }

    // Errores de recurso ya existe
    if (error.name === 'ServicioHorarioYaExisteError') {
      res.status(409).json({
        success: false,
        mensaje: error.message || 'La relación ServicioHorario ya existe',
      });
      return;
    }

    // Errores de recurso no encontrado
    if (error.name === 'ServicioHorarioNoEncontradoError') {
      res.status(404).json({
        success: false,
        mensaje: error.message || 'La relación ServicioHorario no fue encontrada',
      });
      return;
    }

    // Errores de validación generales (mensajes personalizados)
    if (error.message) {
      const mensaje = error.message.toLowerCase();

      // Validar IDs inválidos
      if (
        mensaje.includes('debe ser un número entero') ||
        mensaje.includes('debe estar entre') ||
        mensaje.includes('debe ser mayor a')
      ) {
        res.status(400).json({
          success: false,
          mensaje: error.message,
        });
        return;
      }

      // Recurso no existe
      if (
        mensaje.includes('no existe') ||
        mensaje.includes('no encontrad') ||
        mensaje.includes('no se encontró')
      ) {
        res.status(404).json({
          success: false,
          mensaje: error.message,
        });
        return;
      }

      // Relación duplicada
      if (mensaje.includes('ya existe')) {
        res.status(409).json({
          success: false,
          mensaje: error.message,
        });
        return;
      }

      // Otros errores de validación
      if (
        mensaje.includes('debe') ||
        mensaje.includes('inválid') ||
        mensaje.includes('campo')
      ) {
        res.status(400).json({
          success: false,
          mensaje: error.message,
        });
        return;
      }
    }

    // Error interno del servidor (por defecto)
    console.error('Error no manejado:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error interno del servidor',
    });
  }
}
