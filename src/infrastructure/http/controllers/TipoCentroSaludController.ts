import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { GestionarTiposCentrosSaludUseCase } from '../../../application/use-cases/GestionarTiposCentrosSaludUseCase';
import { FiltroTiposCentrosSaludDto } from '../../../application/dtos/TipoCentroSaludDtos';

@injectable()
export class TipoCentroSaludController {
  constructor(
    @inject(GestionarTiposCentrosSaludUseCase)
    private useCase: GestionarTiposCentrosSaludUseCase
  ) {}

  async crear(req: Request, res: Response): Promise<void> {
    try {
      const { nombre, estado } = req.body;
      const datos = await this.useCase.crear({ nombre, estado });
      res.status(201).json({
        success: true,
        message: 'Tipo de centro de salud creado exitosamente.',
        data: datos,
      });
    } catch (error: any) {
      this.manejarError(error, res);
    }
  }

  async obtener(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const datos = await this.useCase.obtenerPorId(Number(id));
      res.status(200).json({
        success: true,
        data: datos,
      });
    } catch (error: any) {
      this.manejarError(error, res);
    }
  }

  async listar(req: Request, res: Response): Promise<void> {
    try {
      const filtros: FiltroTiposCentrosSaludDto = {
        nombre: req.query.nombre as string,
        estado: req.query.estado as string,
        pagina: req.query.pagina ? Number(req.query.pagina) : 1,
        limite: req.query.limite ? Number(req.query.limite) : 10,
      };

      const { datos, total } = await this.useCase.listar(filtros);
      const totalPaginas = Math.ceil(total / (filtros.limite || 10));

      res.status(200).json({
        success: true,
        data: datos,
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

  async actualizar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { nombre, estado } = req.body;
      const datos = await this.useCase.actualizar(Number(id), {
        nombre,
        estado,
      });
      res.status(200).json({
        success: true,
        message: 'Tipo de centro de salud actualizado exitosamente.',
        data: datos,
      });
    } catch (error: any) {
      this.manejarError(error, res);
    }
  }

  async eliminar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.useCase.eliminar(Number(id));
      res.status(200).json({
        success: true,
        message: 'Tipo de centro de salud eliminado exitosamente.',
      });
    } catch (error: any) {
      this.manejarError(error, res);
    }
  }

  private manejarError(error: any, res: Response): void {
    if (error.name === 'TipoCentroSaludYaExisteError') {
      res.status(409).json({ success: false, message: error.message });
    } else if (error.name === 'TipoCentroSaludNoEncontradoError') {
      res.status(404).json({ success: false, message: error.message });
    } else if (error.name === 'VerificarValor') {
      res.status(400).json({ success: false, message: error.message });
    } else {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Ocurrió un error interno en el servidor.',
      });
    }
  }
}
