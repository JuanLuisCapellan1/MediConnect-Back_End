import { inject, injectable } from 'tsyringe';
import { ISeguroMedicoRepository } from '../../../domain/repositories/ISeguroMedicoRepository';

@injectable()
export class EliminarMiSeguroUseCase {
    constructor(
        @inject('SeguroMedicoRepository') private repository: ISeguroMedicoRepository
    ) { }

    async execute(pacienteId: number, seguroId: number): Promise<void> {
        // Verificar que el paciente tiene este seguro
        const tieneSeguro = await this.repository.verificarSeguroExistentePaciente(pacienteId, seguroId);
        if (!tieneSeguro) {
            throw new Error('No tienes este seguro registrado');
        }

        await this.repository.eliminarSeguroPaciente(pacienteId, seguroId);
    }
}
