import { inject, injectable } from 'tsyringe';
import { ISeguroMedicoRepository } from '../../../domain/repositories/ISeguroMedicoRepository';
import { CrearSeguroMedicoDto } from '../../dtos/SeguroMedicoDtos';
import { SeguroMedico } from '../../../domain/entities/SeguroMedico';

@injectable()
export class CrearSeguroMedicoUseCase {
    constructor(
        @inject('SeguroMedicoRepository') private repository: ISeguroMedicoRepository
    ) { }

    async execute(dto: CrearSeguroMedicoDto): Promise<SeguroMedico> {
        // Validar que no exista un seguro con el mismo nombre
        const nombreExiste = await this.repository.existeNombre(dto.nombre);
        if (nombreExiste) {
            throw new Error(`Ya existe un seguro con el nombre "${dto.nombre}"`);
        }

        return await this.repository.crear(dto);
    }
}
