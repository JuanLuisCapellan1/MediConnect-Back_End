import { inject, injectable } from 'tsyringe';
import { ISeguroMedicoRepository } from '../../../domain/repositories/ISeguroMedicoRepository';

@injectable()
export class EliminarSeguroMedicoUseCase {
    constructor(
        @inject('SeguroMedicoRepository') private repository: ISeguroMedicoRepository
    ) { }

    async execute(id: number): Promise<void> {
        // Verificar que el seguro existe
        const seguroExistente = await this.repository.obtenerPorId(id);
        if (!seguroExistente) {
            throw new Error(`El seguro con ID ${id} no existe`);
        }

        await this.repository.eliminar(id);
    }
}
