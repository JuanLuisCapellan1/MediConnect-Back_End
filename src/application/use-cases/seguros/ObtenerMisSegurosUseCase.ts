import { inject, injectable } from 'tsyringe';
import { ISeguroMedicoRepository } from '../../../domain/repositories/ISeguroMedicoRepository';

@injectable()
export class ObtenerMisSegurosUseCase {
    constructor(
        @inject('SeguroMedicoRepository') private repository: ISeguroMedicoRepository
    ) { }

    async execute(pacienteId: number, incluirHistorial: boolean = false): Promise<any[]> {
        return await this.repository.obtenerSegurosPaciente(pacienteId, incluirHistorial);
    }
}
