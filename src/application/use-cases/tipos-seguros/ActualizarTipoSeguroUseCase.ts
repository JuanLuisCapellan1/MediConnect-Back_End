import { inject, injectable } from 'tsyringe';
import { ITipoSeguroRepository } from '../../../domain/repositories/ITipoSeguroRepository';
import { ActualizarTipoSeguroDto } from '../../dtos/TipoSeguroDtos';
import { TipoSeguro } from '../../../domain/entities/TipoSeguro';

@injectable()
export class ActualizarTipoSeguroUseCase {
    constructor(
        @inject('TipoSeguroRepository') private repository: ITipoSeguroRepository
    ) { }

    async execute(id: number, dto: ActualizarTipoSeguroDto): Promise<TipoSeguro> {
        // Verificar que el tipo de seguro existe
        const existe = await this.repository.obtenerPorId(id);
        if (!existe) {
            throw new Error(`El tipo de seguro con ID ${id} no fue encontrado.`);
        }

        // Si se está actualizando el nombre, verificar que no exista otro con ese nombre
        if (dto.nombre) {
            const nombreExiste = await this.repository.existeNombre(dto.nombre, id);
            if (nombreExiste) {
                throw new Error(`El tipo de seguro "${dto.nombre}" ya existe en el sistema.`);
            }
        }

        return await this.repository.actualizar(id, dto);
    }
}
