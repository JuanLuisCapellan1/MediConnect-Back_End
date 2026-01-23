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
}
