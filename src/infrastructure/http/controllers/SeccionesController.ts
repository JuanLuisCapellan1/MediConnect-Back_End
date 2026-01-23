import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { GestionarSeccionesUseCase } from '../../../application/use-cases/GestionarSeccionesUseCase';
import { CrearSeccionDto, ActualizarSeccionDto } from '../../../application/dtos/SeccionDtos';
import { SeccionYaExisteError } from '../../../domain/errors/Secciones/SeccionYaExisteError';
import { VerificarValor } from '../../../domain/errors/Estados/VerificarValor';

export class SeccionesController {
  private gestionarSeccionesUseCase: GestionarSeccionesUseCase;

  constructor() {
    this.gestionarSeccionesUseCase = container.resolve(GestionarSeccionesUseCase);
  }

  async obtenerTodas(req: Request, res: Response): Promise<void> {
    try {
      const { estado } = req.params;
      const secciones = await this.gestionarSeccionesUseCase.obtenerTodas(
        typeof estado === 'string' ? estado : undefined
      );
      res.status(200).json({
        success : true,
        data: secciones,
        count: secciones.length,
        message: 'Secciones obtenidas exitosamente'
      });
    } catch (error) {
      this.manejarError(error, res);
    }
  }

  async obtenerPorId(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);

      // Validar que el ID sea un número válido
      if (isNaN(id) || id <= 0) {
        res.status(400).json({
          success: false,
          message: 'El ID debe ser un número positivo'
        });
        return;
      }

      const seccion = await this.gestionarSeccionesUseCase.obtenerPorId(id);

      if (!seccion) {
        res.status(404).json({
          success: false,
          message: `Sección con ID ${id} no encontrada`
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: seccion,
        message: 'Sección obtenida exitosamente'
      });

    } catch (error) {
      this.manejarError(error, res);
    }
  }

  async obtenerPorDistrito(req: Request, res: Response): Promise<void> {
    try {
      const { distritoMunicipalId } = req.params;

      const { estado } = req.params;
      
      const secciones = await this.gestionarSeccionesUseCase.obtenerPorDistrito(
        parseInt(distritoMunicipalId as string),
        typeof estado === 'string' ? estado : undefined
      );

      res.status(200).json({
        success: true,
        data: secciones,
        count: secciones.length,
        message: 'Secciones del distrito municipal obtenidas exitosamente'
      });

    } catch (error) {
      this.manejarError(error, res);
    }
  }

  async buscarPorNombre(req: Request, res: Response): Promise<void> {
    try {
      const { nombre, distritoMunicipalId } = req.query;
      const { estado } = req.query;

      if (!nombre) {
        res.status(400).json({
          success: false,
          message: 'El parámetro nombre es requerido'
        });
        return;
      }

      if(distritoMunicipalId && (isNaN(parseInt(distritoMunicipalId as string)) || parseInt(distritoMunicipalId as string) <= 0) ) {
        res.status(400).json({
          success: false,
          message: 'El parámetro distritoMunicipalId debe ser un número positivo'
        });
        return;
      }

      if(!estado || (typeof estado === 'string' && estado.trim().length === 0)) {
        res.status(400).json({
          success: false,
          message: 'El parámetro estado es requerido'
        });
        return;
      }

      const seccion = await this.gestionarSeccionesUseCase.buscarPorNombre(
        nombre as string,
        distritoMunicipalId ? parseInt(distritoMunicipalId as string) : undefined,
        typeof estado === 'string' ? estado : undefined
      );

      res.status(200).json({
        success: true,
        data: seccion,
        count: seccion.length,
        message: 'Secciones encontradas exitosamente'
      });

    } catch (error) {
      this.manejarError(error, res);
    }
  }

  async buscarPorEstado(req: Request, res: Response): Promise<void> {
    try {
      const { estado } = req.query;

      if (!estado || (typeof estado === 'string' && estado.trim().length === 0)) {
        res.status(400).json({
          success: false,
          message: 'El parámetro estado es requerido'
        });
        return;
      }

      const secciones = await this.gestionarSeccionesUseCase.obtenerTodas(
        estado as string
      );

      res.status(200).json({
        success: true,
        data: secciones,
        count: secciones.length,
        message: 'Secciones por estado obtenidas exitosamente'
      });

    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async crear(req: Request, res: Response): Promise<void> {
    try {
      const dto: CrearSeccionDto = req.body;

      if (!dto.nombre) {
        res.status(400).json({
          success: false,
          message: 'El campo nombre es requerido'
        })
        return;
      }

      if(dto.distritoMunicipalId && (isNaN(dto.distritoMunicipalId) || dto.distritoMunicipalId <= 0) ) {
        res.status(400).json({
          success: false,
          message: 'El parámetro distritoMunicipalId debe ser un número positivo'
        });
        return;
      }

      const seccion = await this.gestionarSeccionesUseCase.crear(dto);

      res.status(201).json({
        success: true,
        data: seccion,
        message: 'Sección creada exitosamente'
      });
    } catch (error) {
      this.manejarError(error, res);
    }
  }

  async actualizar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const dto: ActualizarSeccionDto = req.body;

      if(isNaN(parseInt(id as string)) || parseInt(id as string) <= 0) {
        res.status(400).json({
          success: false,
          message: 'El ID debe ser un número positivo'
        });
        return;
      }

      if(dto.distritoMunicipalId && (isNaN(dto.distritoMunicipalId) || dto.distritoMunicipalId <= 0) ) {
        res.status(400).json({
          success: false,
          message: 'El parámetro distritoMunicipalId debe ser un número positivo'
        });
        return;
      }

      const seccion = await this.gestionarSeccionesUseCase.actualizar(
        parseInt(id as string),
        dto
      );
      res.status(200).json({
        success: true,
        data: seccion,
        message: 'Sección actualizada exitosamente'
      });

    } catch (error) {
      this.manejarError(error, res);
    }
  }

  async eliminar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if(isNaN(parseInt(id as string)) || parseInt(id as string) <= 0) {
        res.status(400).json({
          success: false,
          message: 'El ID debe ser un número positivo'
        });
        return;
      }

      const seccionEliminada = await this.gestionarSeccionesUseCase.eliminar(parseInt(id as string));

      res.status(200).json({
        success: true,
        data: seccionEliminada,
        message: 'Sección eliminada exitosamente'
      });
    } catch (error) {
      this.manejarError(error, res);
    }
  }

  /**
     * Maneja los errores que se lanzan en los métodos del controlador
     * @param error - El error lanzado
     * @param res - Response de Express
     */
    private manejarError(error: any, res: Response): void {
      if (error instanceof SeccionYaExisteError) {
        res.status(409).json({
          success: false,
          message: error.message
        });
      } else if (error instanceof VerificarValor) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: error.message || 'Error interno del servidor'
        });
      }
    }
}
