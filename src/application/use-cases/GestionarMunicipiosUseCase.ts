import { IMunicipiosRepository } from '../../domain/repositories/IMunicipiosRepository';
import { CrearMunicipioDto, ActualizarMunicipioDto } from '../dtos/MunicipioDtos';
import { inject } from 'tsyringe';
import { MunicipioValidator } from '../../domain/validators/Municipios/MunicipioValidator';
import { EstadoValidator } from '../../domain/validators/Estados/EstadoValidator';

export class GestionarMunicipiosUseCase {
  constructor(
    private municipioRepo: IMunicipiosRepository,
    @inject(MunicipioValidator) private validator: MunicipioValidator,
    @inject(EstadoValidator) private estadoValidator: EstadoValidator
  ) {}

  async listar() {
    return await this.municipioRepo.listarTodas();
  }

  async crear(dto: CrearMunicipioDto) {
    await this.validator.validarCreacion(dto.nombre, dto.provinciaId);
    return await this.municipioRepo.crear(dto.provinciaId, dto.nombre);
  }

  async buscarPorId(id: number) {
    return await this.municipioRepo.buscarPorId(id);
  }

  async listarPorProvincia(provinciaId: number) {
    return await this.municipioRepo.listarPorProvincia(provinciaId);
  }

  async buscarPorNombre(nombre: string, provinciaId: number, estado: string) {
    return await this.municipioRepo.buscarPorNombre(nombre, provinciaId, estado);
  }

  async buscarPorEstado(estado: string) {
    return await this.municipioRepo.buscarPorEstado(estado);
  }

  async actualizar(dto: ActualizarMunicipioDto) {
    // Validar nombre solo si se proporciona
    if (dto.nombre && dto.provinciaId) {
      await this.validator.validarCreacion(dto.nombre, dto.provinciaId);
    }

    // Validar estado solo si se proporciona
    if (dto.estado) {
      await this.estadoValidator.validarEstado(dto.estado, ['Activo', 'Inactivo', 'Eliminado']);
    }

    return await this.municipioRepo.actualizar(dto.id, dto.provinciaId, dto.nombre, dto.estado);
  }

  async eliminar(id: number) {
    return await this.municipioRepo.eliminar(id);
  }
}
