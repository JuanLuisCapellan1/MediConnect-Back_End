import { inject, injectable } from 'tsyringe';
import { ISeguroMedicoRepository } from '../../../domain/repositories/ISeguroMedicoRepository';
import { ActualizarSeguroMedicoDto } from '../../dtos/SeguroMedicoDtos';
import { SeguroMedico } from '../../../domain/entities/SeguroMedico';

@injectable()
export class ActualizarSeguroMedicoUseCase {
    constructor(
        @inject('SeguroMedicoRepository') private repository: ISeguroMedicoRepository
    ) { }

    async execute(id: number, dto: ActualizarSeguroMedicoDto): Promise<SeguroMedico> {
        // Verificar que el seguro existe
        const seguroExistente = await this.repository.obtenerPorId(id);
        if (!seguroExistente) {
            throw new Error(`El seguro con ID ${id} no existe`);
        }

        // Si se está actualizando el nombre, validar que no exista otro con ese nombre
        if (dto.nombre) {
            const nombreExiste = await this.repository.existeNombre(dto.nombre, id);
            if (nombreExiste) {
                throw new Error(`Ya existe otro seguro con el nombre "${dto.nombre}"`);
            }
        }

        return await this.repository.actualizar(id, dto);
    }
}
