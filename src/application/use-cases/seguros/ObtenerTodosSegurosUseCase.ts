import { inject, injectable } from 'tsyringe';
import { ISeguroMedicoRepository } from '../../../domain/repositories/ISeguroMedicoRepository';
import { FiltroSegurosDto } from '../../dtos/SeguroMedicoDtos';
import { SeguroMedico } from '../../../domain/entities/SeguroMedico';

@injectable()
export class ObtenerTodosSegurosUseCase {
    constructor(
        @inject('SeguroMedicoRepository') private repository: ISeguroMedicoRepository
    ) { }

    async execute(filtros: FiltroSegurosDto): Promise<{ datos: SeguroMedico[]; total: number }> {
        return await this.repository.obtenerTodos(filtros);
    }
}
