import { inject, injectable } from 'tsyringe';
import { ICondicionMedicaRepository } from '../../repositories/ICondicionMedicaRepository';
import { CondicionMedicaYaExisteError } from '../../errors/CondicionesMedicas/CondicionMedicaYaExisteError';

@injectable()
export class CondicionMedicaValidator {
    constructor(
        @inject('CondicionMedicaRepository')
        private condicionMedicaRepository: ICondicionMedicaRepository
    ) { }

    async validarCreacion(nombre: string): Promise<void> {
        const existe = await this.condicionMedicaRepository.existeNombre(nombre);
        if (existe) {
            throw new CondicionMedicaYaExisteError(nombre);
        }
    }

    async validarActualizacion(id: number, nombre: string): Promise<void> {
        const existe = await this.condicionMedicaRepository.existeNombre(nombre, id);
        if (existe) {
            throw new CondicionMedicaYaExisteError(nombre);
        }
    }
}
