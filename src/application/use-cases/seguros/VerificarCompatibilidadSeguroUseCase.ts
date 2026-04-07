import { injectable, inject } from 'tsyringe';
import { ISeguroMedicoRepository } from '../../../domain/repositories/ISeguroMedicoRepository';

@injectable()
export class VerificarCompatibilidadSeguroUseCase {
    constructor(
        @inject('SeguroMedicoRepository')
        private readonly seguroRepo: ISeguroMedicoRepository,
    ) { }

    /**
     * Verifica si un seguro específico (seguroId + tipoSeguroId) es aceptado por
     * el doctor Y está registrado activo en el paciente autenticado.
     *
     * @param seguroId      - ID del seguro médico (ej: ARS Humano)
     * @param tipoSeguroId  - ID del tipo/plan de seguro (ej: Plan Familiar)
     * @param doctorId      - usuarioId del doctor a consultar
     * @param pacienteId    - usuarioId del paciente autenticado
     */
    async execute(seguroId: number, tipoSeguroId: number, doctorId: number, pacienteId: number) {
        return await this.seguroRepo.verificarCompatibilidadSeguro(seguroId, tipoSeguroId, doctorId, pacienteId);
    }
}
