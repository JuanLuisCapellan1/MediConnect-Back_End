import { inject, injectable } from 'tsyringe';
import { ITipoSeguroRepository } from '../../../domain/repositories/ITipoSeguroRepository';
import { FiltroTiposSegurosDto } from '../../dtos/TipoSeguroDtos';

@injectable()
export class ObtenerTodosTiposSegurosUseCase {
    constructor(
        @inject('TipoSeguroRepository') private repository: ITipoSeguroRepository
    ) { }

    async execute(filtros: FiltroTiposSegurosDto) {
        return await this.repository.obtenerTodos(filtros);
    }
}
