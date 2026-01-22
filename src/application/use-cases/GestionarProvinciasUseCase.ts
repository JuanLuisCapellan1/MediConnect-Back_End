import { IProvinciasRepository } from '../../domain/repositories/IProvinciasRepository';
import { CrearProvinciaDto, ActualizarProvinciaDto} from '../dtos/ProvinciaDtos';
import { inject } from 'tsyringe';
import { ProvinciaValidator } from '../../domain/validators/Provincias/ProvinciaValidator';
import { EstadoValidator } from '../../domain/validators/Estados/EstadoValidator';

export class GestionarProvinciasUseCase {
  constructor(private provinciaRepo: IProvinciasRepository, @inject(ProvinciaValidator) private validator: ProvinciaValidator, @inject(EstadoValidator) private estadoValidator: EstadoValidator) {}

  async listar() {
    return await this.provinciaRepo.listarTodas();
  }

  async crear(dto: CrearProvinciaDto) {
    await this.validator.validarCreacion(dto.nombre);
    return await this.provinciaRepo.crear(dto.nombre);
  }
  
  async buscarPorId(id: number) {
    return await this.provinciaRepo.buscarPorId(id);
  }

  async buscarPorNombre(nombre: string, estado: string) {
    return await this.provinciaRepo.buscarPorNombre(nombre, estado);
  }

  async buscarPorEstado(estado: string) {
    return await this.provinciaRepo.buscarPorEstado(estado);
  }

  async actualizar(dto: ActualizarProvinciaDto) {
    // Validar nombre solo si se proporciona
    if (dto.nombre) {
      await this.validator.validarCreacion(dto.nombre);
    }

    // Validar estado solo si se proporciona
    if (dto.estado) {
      await this.estadoValidator.validarEstado(dto.estado, ['Activo', 'Inactivo', 'Eliminado']);
    }

    return await this.provinciaRepo.actualizar(dto.id, dto.nombre, dto.estado);
  }

  async eliminar(id: number) {
    return await this.provinciaRepo.eliminar(id);
  }
}