import { inject, injectable } from 'tsyringe';
import { ISeguroMedicoRepository } from '../../../domain/repositories/ISeguroMedicoRepository';
import { AgregarSeguroDoctorDto } from '../../dtos/SeguroMedicoDtos';

@injectable()
export class AgregarSeguroDoctorUseCase {
    constructor(
        @inject('SeguroMedicoRepository') private repository: ISeguroMedicoRepository
    ) { }

    async execute(doctorId: number, dto: AgregarSeguroDoctorDto): Promise<any> {
        // Validar que el seguro existe
        const seguro = await this.repository.obtenerPorId(dto.idSeguro);
        if (!seguro) {
            throw new Error(`El seguro con ID ${dto.idSeguro} no existe`);
        }

        // Validar que el seguro esté activo
        if (seguro.estado !== 'Activo') {
            throw new Error('El seguro seleccionado no está disponible');
        }

        // Validar que el doctor no tenga ya este seguro con este tipo
        const yaExiste = await this.repository.verificarSeguroExistenteDoctor(
            doctorId,
            dto.idSeguro,
            dto.idTipoSeguro
        );
        if (yaExiste) {
            throw new Error('Ya tienes este seguro y tipo de seguro registrado');
        }

        return await this.repository.agregarSeguroDoctor(doctorId, dto);
    }
}
