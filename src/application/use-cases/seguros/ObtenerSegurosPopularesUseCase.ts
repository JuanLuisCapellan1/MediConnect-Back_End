import { injectable, inject } from 'tsyringe';
import { ISeguroMedicoRepository } from '../../../domain/repositories/ISeguroMedicoRepository';

@injectable()
export class ObtenerSegurosPopularesUseCase {
    constructor(
        @inject('SeguroMedicoRepository')
        private seguroRepository: ISeguroMedicoRepository
    ) { }

    /**
     * Devuelve los seguros más utilizados por pacientes activos,
     * ordenados de mayor a menor número de pacientes.
     * @param limite - Número máximo de resultados (default: 10, max: 50)
     */
    async ejecutar(limite: number = 10): Promise<any[]> {
        const limiteValido = Math.min(Math.max(1, limite), 50);
        return this.seguroRepository.obtenerMasUtilizadosPorPacientes(limiteValido);
    }
}
