import { inject, injectable } from 'tsyringe';
import { ISeguroMedicoRepository } from '../../../domain/repositories/ISeguroMedicoRepository';

@injectable()
export class EliminarSeguroAceptadoUseCase {
    constructor(
        @inject('SeguroMedicoRepository') private repository: ISeguroMedicoRepository
    ) { }

    async execute(doctorId: number, seguroId: number, tipoSeguroId: number): Promise<void> {
        // Verificar que el doctor tiene este seguro
        const tieneSeguro = await this.repository.verificarSeguroExistenteDoctor(
            doctorId,
            seguroId,
            tipoSeguroId
        );
        if (!tieneSeguro) {
            throw new Error('No tienes este seguro registrado');
        }

        await this.repository.eliminarSeguroDoctor(doctorId, seguroId, tipoSeguroId);
    }
}
