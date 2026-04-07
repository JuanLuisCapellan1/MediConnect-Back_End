import { inject, injectable } from 'tsyringe';
import { ITipoSeguroRepository } from '../../../domain/repositories/ITipoSeguroRepository';

@injectable()
export class EliminarTipoSeguroUseCase {
    constructor(
        @inject('TipoSeguroRepository') private repository: ITipoSeguroRepository
    ) { }

    async execute(id: number): Promise<void> {
        // Verificar que el tipo de seguro existe
        const existe = await this.repository.obtenerPorId(id);
        if (!existe) {
            throw new Error(`El tipo de seguro con ID ${id} no fue encontrado.`);
        }

        // Verificar que no esté en uso
        const enUso = await this.repository.verificarEnUso(id);
        if (enUso) {
            throw new Error(
                'No se puede eliminar este tipo de seguro porque está siendo utilizado por pacientes o doctores activos.'
            );
        }

        await this.repository.eliminar(id);
    }
}
