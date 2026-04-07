import { inject, injectable } from 'tsyringe';
import { ITipoSeguroRepository } from '../../../domain/repositories/ITipoSeguroRepository';
import { TipoSeguro } from '../../../domain/entities/TipoSeguro';

@injectable()
export class ObtenerTiposActivosUseCase {
    constructor(
        @inject('TipoSeguroRepository') private repository: ITipoSeguroRepository
    ) { }

    async execute(): Promise<TipoSeguro[]> {
        return await this.repository.obtenerActivos();
    }
}
