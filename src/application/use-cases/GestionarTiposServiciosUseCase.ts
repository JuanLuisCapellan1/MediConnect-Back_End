import { inject, injectable } from 'tsyringe';
import { ITipoServicioRepository } from '../../domain/repositories/ITipoServicioRepository';
import { TipoServicioValidator } from '../../domain/validators/TiposServicios/TipoServicioValidator';
import {
  CrearTipoServicioDto,
  ActualizarTipoServicioDto,
  FiltroTiposServiciosDto,
} from '../dtos/TipoServicioDtos';
import { TipoServicioNoEncontradoError } from '../../domain/errors/TiposServicios/TipoServicioNoEncontradoError';
import { EstadoValidator } from '../../domain/validators/Estados/EstadoValidator';

@injectable()
export class GestionarTiposServiciosUseCase {
  constructor(
    @inject('TipoServicioRepository')
    private tipoServicioRepository: ITipoServicioRepository,
    @inject(TipoServicioValidator)
    private validator: TipoServicioValidator,
    @inject(EstadoValidator)
    private estadoValidator: EstadoValidator
  ) {}

  async crear(dto: CrearTipoServicioDto) {
    if (dto.estado) {
        dto.estado = this.normalizarEstado(dto.estado);
        await this.estadoValidator.validarEstado(dto.estado, ['Activo', 'Inactivo']);
    }
    await this.validator.validarCreacion(dto.nombre);
    return await this.tipoServicioRepository.crear(dto);
  }

  async obtenerPorId(id: number) {
    const encontrado = await this.tipoServicioRepository.obtenerPorId(id);
    if (!encontrado) {
      throw new TipoServicioNoEncontradoError(id);
    }
    return encontrado;
  }

  async listar(filtros: FiltroTiposServiciosDto) {
    if (filtros.estado) {
         filtros.estado = this.normalizarEstado(filtros.estado);
    }
    return await this.tipoServicioRepository.obtenerTodas(filtros);
  }

  async actualizar(id: number, dto: ActualizarTipoServicioDto) {
    const existente = await this.tipoServicioRepository.obtenerPorId(id);
    if (!existente) {
      throw new TipoServicioNoEncontradoError(id);
    }

    if (dto.nombre) {
      await this.validator.validarActualizacion(id, dto.nombre);
    }
    
    if (dto.estado) {
         dto.estado = this.normalizarEstado(dto.estado);
         await this.estadoValidator.validarEstado(dto.estado, ['Activo', 'Inactivo', 'Eliminado']);
    }

    return await this.tipoServicioRepository.actualizar(id, dto);
  }

  async eliminar(id: number) {
    const existente = await this.tipoServicioRepository.obtenerPorId(id);
    if (!existente) {
      throw new TipoServicioNoEncontradoError(id);
    }
    return await this.tipoServicioRepository.eliminar(id);
  }

  private normalizarEstado(estado: string): string {
    if (!estado) return estado;
    return estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase();
  }
}
