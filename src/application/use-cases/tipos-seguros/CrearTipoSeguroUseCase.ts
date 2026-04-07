import { inject, injectable } from 'tsyringe';
import { ITipoSeguroRepository } from '../../../domain/repositories/ITipoSeguroRepository';
import { CrearTipoSeguroDto } from '../../dtos/TipoSeguroDtos';
import { TipoSeguro } from '../../../domain/entities/TipoSeguro';

@injectable()
export class CrearTipoSeguroUseCase {
    constructor(
        @inject('TipoSeguroRepository') private repository: ITipoSeguroRepository
    ) { }

    async execute(dto: CrearTipoSeguroDto): Promise<TipoSeguro> {
        // Validar que el nombre no exista
        const existe = await this.repository.existeNombre(dto.nombre);
        if (existe) {
            throw new Error(`El tipo de seguro "${dto.nombre}" ya existe en el sistema.`);
        }

        return await this.repository.crear(dto);
    }
}
