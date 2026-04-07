import { inject, injectable } from 'tsyringe';
import { IPacienteRepository } from '../../repositories/IPacienteRepository';
import { DocumentoPacienteYaExisteError } from '../../errors/Pacientes/DocumentoPacienteYaExisteError';

@injectable()
export class PacienteValidator {
    constructor(
        @inject('PacienteRepository')
        private pacienteRepository: IPacienteRepository
    ) { }

    async validarActualizacion(usuarioId: number, numeroDocumento?: string): Promise<void> {
        if (numeroDocumento) {
            const existe = await this.pacienteRepository.existePorDocumento(numeroDocumento, usuarioId);
            if (existe) {
                throw new DocumentoPacienteYaExisteError(numeroDocumento);
            }
        }
    }
}
