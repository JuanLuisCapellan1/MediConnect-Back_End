import { inject, injectable } from 'tsyringe';
import { IEspecialidadRepository } from '../../repositories/IEspecialidadRepository';
import { EspecialidadYaExisteError } from '../../errors/Especialidades/EspecialidadYaExisteError';

@injectable()
export class EspecialidadValidator {
    constructor(
        @inject('EspecialidadRepository')
        private especialidadRepository: IEspecialidadRepository
    ) { }

    async validarCreacion(nombre: string): Promise<void> {
        const existe = await this.especialidadRepository.existeNombre(nombre);
        if (existe) {
            throw new EspecialidadYaExisteError(nombre);
        }
    }

    async validarActualizacion(id: number, nombre: string): Promise<void> {
        const existe = await this.especialidadRepository.existeNombre(nombre, id);
        if (existe) {
            throw new EspecialidadYaExisteError(nombre);
        }
    }
}
