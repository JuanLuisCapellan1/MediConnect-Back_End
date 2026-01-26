import { ISeccionesRepository} from '../../repositories/ISeccionesRepository';
import { SeccionYaExisteError } from '../../errors/Secciones/SeccionYaExisteError';
import { IDistritosMunicipalesRepository } from '../../repositories/IDistritosMunicipalesRepository';
import { IMunicipiosRepository } from '../../repositories/IMunicipiosRepository';

export class SeccionValidator {
  constructor(
    private seccionesRepository: ISeccionesRepository,
    private distritosRepository: IDistritosMunicipalesRepository,
    private municipiosRepository: IMunicipiosRepository
    ) {}

  async validar( nombre: string, distritoMunicipalId?: number | null ): Promise<void> {

    // Validar nombre
    if (!nombre || nombre.trim().length === 0) {
      throw new Error('El nombre de la sección es requerido');
    }

    // Validar distrito municipal solo si se proporciona
    if (distritoMunicipalId && distritoMunicipalId > 0) {
      const distrito = await this.distritosRepository.buscarPorId(distritoMunicipalId);
      if (!distrito) {
        throw new Error(`El distrito municipal con ID ${distritoMunicipalId} no existe`);
      }

      // Validar que el nombre no exista en el mismo distrito
      const seccionesEnDistritoMunicipal = await this.seccionesRepository.obtenerPorDistrito(
        distritoMunicipalId
      );

      const seccionExistente = seccionesEnDistritoMunicipal.some(
        s => s.nombre.toLowerCase().trim() === nombre.toLowerCase().trim()
      );

      if (seccionExistente) {
        throw new SeccionYaExisteError(nombre, distritoMunicipalId);
      }
    }
  }

  async validarActualizacionDistrito(distritoMunicipalId: number, seccionId: number): Promise<void> {
    // Validar que el ID de la sección sea válido
    if (!seccionId || seccionId <= 0) {
      throw new Error('El ID de la sección es requerido y debe ser válido');
    }
    // Verificar que la sección exista
    const seccion = await this.seccionesRepository.obtenerPorId(seccionId);
    if (!seccion) {
      throw new Error(`La sección con ID ${seccionId} no existe`);
    }

    // Validar distrito municipal
    if (distritoMunicipalId && distritoMunicipalId > 0) {
      const distrito = await this.distritosRepository.buscarPorId(distritoMunicipalId);
      if (!distrito) {
        throw new Error(`El distrito municipal con ID ${distritoMunicipalId} no existe`);
      }
      // Validar que no exista otra sección con el mismo nombre en el nuevo distrito
      const seccionesEnDistritoMunicipal = await this.seccionesRepository.obtenerPorDistrito(
        distritoMunicipalId
      );
      const seccionExistente = seccionesEnDistritoMunicipal.some(
        s => s.nombre.toLowerCase().trim() === seccion.nombre.toLowerCase().trim() && s.id !== seccionId
      );

      if (seccionExistente) {
        throw new SeccionYaExisteError(seccion.nombre, distritoMunicipalId);
      }
    }
  }
}
