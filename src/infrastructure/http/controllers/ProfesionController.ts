import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { GestionarProfesionesUseCase } from '../../../application/use-cases/GestionarProfesionesUseCase';
import { CrearProfesionDto, ActualizarProfesionDto, FiltroProfesionesDto } from '../../../application/dtos/ProfesionDtos';
import { ProfesionYaExisteError } from '../../../domain/errors/Profesiones/ProfesionYaExisteError';
import { ProfesionNoEncontradaError } from '../../../domain/errors/Profesiones/ProfesionNoEncontradaError';

@injectable()
export class ProfesionController {
  constructor(
    @inject('GestionarProfesionesUseCase')
    private gestionarProfesionesUseCase: GestionarProfesionesUseCase
  ) {}

  crear = async (req: Request, res: Response): Promise<void> => {
    try {
      const dto: CrearProfesionDto = req.body;
      const profesion = await this.gestionarProfesionesUseCase.crear(dto);
      res.status(201).json({
        message: 'Profesión creada exitosamente',
        success: true,
        data: profesion
      });
    } catch (error: any) {
      if (error instanceof ProfesionYaExisteError) {
        res.status(409).json({ 
            success: false,
            message: error.message 
        });
      } else if (error.message.includes('requerido') || error.message.includes('inválido')) {
        res.status(400).json({ 
            success: false,
            message: error.message 
        });
      } else {
        console.error('Error al crear profesión:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error interno del servidor' 
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
            message: 'ID inválido' 
        });
        return;
      }

      const profesion = await this.gestionarProfesionesUseCase.obtenerPorId(id);
      res.status(200).json({
        message: 'Profesión obtenida exitosamente',
        success: true,
        data: profesion
      });
    } catch (error: any) {
      if (error instanceof ProfesionNoEncontradaError) {
        res.status(404).json({ 
            success: false,    
            message: error.message 
        });
      } else {
        console.error('Error al obtener profesión:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error interno del servidor' 
        });
      }
    }
  };

  obtenerTodos = async (req: Request, res: Response): Promise<void> => {
    try {
      const filtro: FiltroProfesionesDto = {
        estado: req.query.estado as string,
        busqueda: req.query.busqueda as string,
        pagina: req.query.pagina ? parseInt(req.query.pagina as string) : undefined,
        limite: req.query.limite ? parseInt(req.query.limite as string) : undefined,
      };

      const resultado = await this.gestionarProfesionesUseCase.obtenerTodos(filtro);
      res.status(200).json({
        message: 'Profesiones obtenidas exitosamente',
        success: true,
        data: resultado
      });
    } catch (error: any) {
      if (error.message.includes('inválido')) {
        res.status(400).json({ 
            success: false,
            message: error.message 
        });
      } else {
        console.error('Error al obtener profesiones:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error interno del servidor' 
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
            message: 'ID inválido' 
        });
        return;
      }

      const dto: ActualizarProfesionDto = req.body;
      const profesion = await this.gestionarProfesionesUseCase.actualizar(id, dto);
      res.status(200).json({
        message: 'Profesión actualizada exitosamente',
        success: true,
        data: profesion
      });
    } catch (error: any) {
      if (error instanceof ProfesionNoEncontradaError) {
        res.status(404).json({ 
            success: false,
            message: error.message 
        });
      } else if (error instanceof ProfesionYaExisteError) {
        res.status(409).json({ 
            success: false,
            message: error.message 
        });
      } else if (error.message.includes('requerido') || error.message.includes('inválido')) {
        res.status(400).json({ 
            success: false,
            message: error.message 
        });
      } else {
        console.error('Error al actualizar profesión:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error interno del servidor' 
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
            message: 'ID inválido' 
        });
        return;
      }

      await this.gestionarProfesionesUseCase.eliminar(id);
      res.status(200).json({
        message: 'Profesión eliminada exitosamente',
        success: true
      });
    } catch (error: any) {
      if (error instanceof ProfesionNoEncontradaError) {
        res.status(404).json({ 
            success: false,
            message: error.message 
        });
      } else {
        console.error('Error al eliminar profesión:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error interno del servidor' 
        });
      }
    }
  };
}
