import { inject, injectable } from 'tsyringe';
import { ISeguroMedicoRepository } from '../../../domain/repositories/ISeguroMedicoRepository';
import { AgregarSeguroPacienteDto } from '../../dtos/SeguroMedicoDtos';

@injectable()
export class AgregarSeguroPacienteUseCase {
    constructor(
        @inject('SeguroMedicoRepository') private repository: ISeguroMedicoRepository
    ) { }

    async execute(pacienteId: number, dto: AgregarSeguroPacienteDto): Promise<any> {
        // Validar que el seguro existe
        const seguro = await this.repository.obtenerPorId(dto.idSeguro);
        if (!seguro) {
            throw new Error(`El seguro con ID ${dto.idSeguro} no existe`);
        }

        // Validar que el seguro esté activo
        if (seguro.estado !== 'Activo') {
            throw new Error('El seguro seleccionado no está disponible');
        }

        // Validar que el paciente no tenga ya este seguro
        const yaExiste = await this.repository.verificarSeguroExistentePaciente(pacienteId, dto.idSeguro);
        if (yaExiste) {
            throw new Error('Ya tienes este seguro registrado');
        }

        // Validar que el paciente no tenga más de 3 seguros activos
        const conteoActual = await this.repository.contarSegurosActivosPaciente(pacienteId);
        if (conteoActual >= 3) {
            throw new Error('Ya tienes el máximo de 3 seguros registrados. Elimina uno para agregar otro.');
        }

        return await this.repository.agregarSeguroPaciente(pacienteId, dto);
    }
}
