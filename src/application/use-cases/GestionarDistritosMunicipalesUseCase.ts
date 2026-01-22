import { IDistritosMunicipalesRepository } from '../../domain/repositories/IDistritosMunicipalesRepository';
import { CrearDistritoMunicipalDto, ActualizarDistritoMunicipalDto } from '../dtos/DistritoMunicipalDtos';
import { inject } from 'tsyringe';
import { DistritoMunicipalValidator } from '../../domain/validators/DistritosMunicipales/DistritoMunicipalValidator';
import { EstadoValidator } from '../../domain/validators/Estados/EstadoValidator';

export class GestionarDistritosMunicipalesUseCase {
  constructor(
    private distritosRepo: IDistritosMunicipalesRepository,
    @inject(DistritoMunicipalValidator) private validator: DistritoMunicipalValidator,
    @inject(EstadoValidator) private estadoValidator: EstadoValidator
  ) {}

  async listar() {
    return await this.distritosRepo.listarTodas();
  }

  async crear(dto: CrearDistritoMunicipalDto) {
    await this.validator.validarCreacion(dto.nombre, dto.municipioId);
    return await this.distritosRepo.crear(dto.municipioId, dto.nombre);
  }

  async buscarPorId(id: number) {
    return await this.distritosRepo.buscarPorId(id);
  }

  async listarPorMunicipio(municipioId: number) {
    return await this.distritosRepo.listarPorMunicipio(municipioId);
  }

  async buscarPorNombre(nombre: string, municipioId: number, estado: string) {
    return await this.distritosRepo.buscarPorNombre(nombre, municipioId, estado);
  }

  async buscarPorEstado(estado: string) {
    return await this.distritosRepo.buscarPorEstado(estado);
  }

  async actualizar(dto: ActualizarDistritoMunicipalDto) {
    // Validar nombre solo si se proporciona
    if (dto.nombre && dto.municipioId) {
      await this.validator.validarCreacion(dto.nombre, dto.municipioId);
    }

    // Validar estado solo si se proporciona
    if (dto.estado) {
      await this.estadoValidator.validarEstado(dto.estado, ['Activo', 'Inactivo', 'Eliminado']);
    }

    return await this.distritosRepo.actualizar(dto.id, dto.municipioId, dto.nombre, dto.estado);
  }

  async eliminar(id: number) {
    return await this.distritosRepo.eliminar(id);
  }
}
