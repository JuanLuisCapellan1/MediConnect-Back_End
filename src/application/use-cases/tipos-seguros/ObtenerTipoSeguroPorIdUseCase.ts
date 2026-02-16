import { inject, injectable } from 'tsyringe';
import { ITipoSeguroRepository } from '../../../domain/repositories/ITipoSeguroRepository';
import { TipoSeguro } from '../../../domain/entities/TipoSeguro';

@injectable()
export class ObtenerTipoSeguroPorIdUseCase {
    constructor(
        @inject('TipoSeguroRepository') private repository: ITipoSeguroRepository
    ) { }

    async execute(id: number): Promise<TipoSeguro> {
        const tipoSeguro = await this.repository.obtenerPorId(id);

        if (!tipoSeguro) {
            throw new Error(`El tipo de seguro con ID ${id} no fue encontrado.`);
        }

        return tipoSeguro;
    }
}
