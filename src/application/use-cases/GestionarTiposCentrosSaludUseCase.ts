import { inject, injectable } from 'tsyringe';
import { ITipoCentroSaludRepository } from '../../domain/repositories/ITipoCentroSaludRepository';
import { TipoCentroSaludValidator } from '../../domain/validators/TiposCentrosSalud/TipoCentroSaludValidator';
import {
  CrearTipoCentroSaludDto,
  ActualizarTipoCentroSaludDto,
  FiltroTiposCentrosSaludDto,
} from '../dtos/TipoCentroSaludDtos';
import { TipoCentroSaludNoEncontradoError } from '../../domain/errors/TiposCentrosSalud/TipoCentroSaludNoEncontradoError';
import { EstadoValidator } from '../../domain/validators/Estados/EstadoValidator';

@injectable()
export class GestionarTiposCentrosSaludUseCase {
  constructor(
    @inject('TipoCentroSaludRepository')
    private tipoCentroSaludRepository: ITipoCentroSaludRepository,
    @inject(TipoCentroSaludValidator)
    private validator: TipoCentroSaludValidator,
    @inject(EstadoValidator)
    private estadoValidator: EstadoValidator
  ) {}

  async crear(dto: CrearTipoCentroSaludDto) {
    if (dto.estado) {
      dto.estado = this.normalizarEstado(dto.estado);
      await this.estadoValidator.validarEstado(dto.estado, ['Activo', 'Inactivo']);
    }
    await this.validator.validarCreacion(dto.nombre);
    return await this.tipoCentroSaludRepository.crear(dto);
  }

  async obtenerPorId(id: number) {
    const encontrado = await this.tipoCentroSaludRepository.obtenerPorId(id);
    if (!encontrado) {
      throw new TipoCentroSaludNoEncontradoError(id);
    }
    return encontrado;
  }

  async listar(filtros: FiltroTiposCentrosSaludDto) {
    if (filtros.estado) {
      filtros.estado = this.normalizarEstado(filtros.estado);
    }
    return await this.tipoCentroSaludRepository.obtenerTodos(filtros);
  }

  async actualizar(id: number, dto: ActualizarTipoCentroSaludDto) {
    const existente = await this.tipoCentroSaludRepository.obtenerPorId(id);
    if (!existente) {
      throw new TipoCentroSaludNoEncontradoError(id);
    }

    if (dto.nombre) {
      await this.validator.validarActualizacion(id, dto.nombre);
    }

    if (dto.estado) {
      dto.estado = this.normalizarEstado(dto.estado);
      await this.estadoValidator.validarEstado(dto.estado, ['Activo', 'Inactivo', 'Eliminado']);
    }

    return await this.tipoCentroSaludRepository.actualizar(id, dto);
  }

  async eliminar(id: number) {
    const existente = await this.tipoCentroSaludRepository.obtenerPorId(id);
    if (!existente) {
      throw new TipoCentroSaludNoEncontradoError(id);
    }
    return await this.tipoCentroSaludRepository.eliminar(id);
  }

  private normalizarEstado(estado: string): string {
    if (!estado) return estado;
    return estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase();
  }
}
