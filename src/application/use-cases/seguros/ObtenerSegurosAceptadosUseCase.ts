import { inject, injectable } from 'tsyringe';
import { ISeguroMedicoRepository } from '../../../domain/repositories/ISeguroMedicoRepository';

@injectable()
export class ObtenerSegurosAceptadosUseCase {
    constructor(
        @inject('SeguroMedicoRepository') private repository: ISeguroMedicoRepository
    ) { }

    async execute(doctorId: number): Promise<any[]> {
        return await this.repository.obtenerSegurosDoctor(doctorId);
    }
}
