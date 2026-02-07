import { inject, injectable } from 'tsyringe';
import { ISeccionesRepository } from '../../domain/repositories/ISeccionesRepository';
import { SeccionValidator } from '../../domain/validators/Secciones/SeccionValidator';
import { Seccion } from '../../domain/entities/Seccion';
import { CrearSeccionDto, ActualizarSeccionDto } from '../dtos/SeccionDtos';
import { EstadoValidator } from '../../domain/validators/Estados/EstadoValidator';

@injectable()
export class GestionarSeccionesUseCase {
  constructor(
    @inject('SeccionesRepository')
    private seccionesRepository: ISeccionesRepository,
    @inject('SeccionValidator')
    private validator: SeccionValidator,
    @inject('EstadoValidator')
    private estadoValidator: EstadoValidator
  ) {}

  async obtenerTodas(estado?: string) {
    return await this.seccionesRepository.obtenerTodas(estado);
  }

  async obtenerPorId(id: number) {
    const seccion = await this.seccionesRepository.obtenerPorId(id);
    if (!seccion) {
      throw new Error(`Sección con ID ${id} no encontrada`);
    }
    return seccion;
  }

  async obtenerPorDistrito(distritoMunicipalId: number, estado?: string) {
    return await this.seccionesRepository.obtenerPorDistrito(distritoMunicipalId, estado);
  }

  async buscarPorNombre(nombre: string, distritoMunicipalId?: number, estado?: string) {
    const seccion = await this.seccionesRepository.buscarPorNombre(
      nombre,
      distritoMunicipalId,
      estado
    );
    if (!seccion) {
      throw new Error(
        `No se encontró Sección con nombre "${nombre}" en el Distrito Municipal con ID ${distritoMunicipalId}`
      );
    }
    return seccion;
  }

  async crear(dto: CrearSeccionDto) {

    if(dto.distritoMunicipalId !== undefined) {
      await this.validator.validar(dto.nombre, dto.distritoMunicipalId);
    } else {
      await this.validator.validar(dto.nombre);
    }

    const seccionPorNombre = await this.seccionesRepository.buscarPorNombreSensitive(dto.nombre);

    if (seccionPorNombre.length > 0) {
      throw new Error(`Ya existe una sección con el nombre "${dto.nombre}"`);
    }

    const seccion = new Seccion(
      0,
      dto.distritoMunicipalId ?? null,
      dto.nombre,
      'Activo',
      new Date()
    );

    return await this.seccionesRepository.crear(seccion);
  }

  async actualizar(id: number, dto: ActualizarSeccionDto) {
    if ( dto.nombre !== undefined || dto.distritoMunicipalId !== undefined) {
      const seccionExistente = await this.obtenerPorId(id);

      const distritoFinal = dto.distritoMunicipalId !== undefined ? dto.distritoMunicipalId : seccionExistente.distritoMunicipalId;

      await this.validator.validar(
        dto.nombre || seccionExistente.nombre,
        distritoFinal
      );
    }

    if (dto.distritoMunicipalId !== undefined) {
      await this.validator.validarActualizacionDistrito(dto.distritoMunicipalId, id);
    }

     // Validar estado solo si se proporciona
    if (dto.estado) {
      await this.estadoValidator.validarEstado(dto.estado, ['Activo', 'Inactivo', 'Eliminado']);
    }

    return await this.seccionesRepository.actualizar(id, dto);
  }

  async eliminar(id: number) {
    await this.obtenerPorId(id); // Verifica que existe
    await this.seccionesRepository.eliminar(id);
  }
}
