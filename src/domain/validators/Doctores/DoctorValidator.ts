import { inject, injectable } from 'tsyringe';
import { IDoctorRepository } from '../../repositories/IDoctorRepository';
import { ExequaturYaExisteError } from '../../errors/Doctores/ExequaturYaExisteError';
import { DocumentoDoctorYaExisteError } from '../../errors/Doctores/DocumentoDoctorYaExisteError';

@injectable()
export class DoctorValidator {
    constructor(
        @inject('DoctorRepository')
        private doctorRepository: IDoctorRepository
    ) { }

    async validarActualizacion(
        usuarioId: number,
        exequatur?: string,
        numeroDocumento?: string
    ): Promise<void> {
        if (exequatur) {
            const existeExequatur = await this.doctorRepository.existePorExequatur(exequatur, usuarioId);
            if (existeExequatur) {
                throw new ExequaturYaExisteError(exequatur);
            }
        }

        if (numeroDocumento) {
            const existeDocumento = await this.doctorRepository.existePorDocumento(numeroDocumento, usuarioId);
            if (existeDocumento) {
                throw new DocumentoDoctorYaExisteError(numeroDocumento);
            }
        }
    }
}
