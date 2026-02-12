import { inject, injectable } from 'tsyringe';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';

@injectable()
export class VerificarDocumentoUseCase {
    constructor(
        @inject('UsuarioRepository')
        private usuarioRepository: IUsuarioRepository
    ) { }

    async execute(numeroDocumento: string): Promise<{
        disponible: boolean;
        tipoUsuario?: 'Doctor' | 'Paciente';
    }> {
        // Validar que el número de documento no esté vacío
        if (!numeroDocumento || numeroDocumento.trim() === '') {
            throw new Error('El número de documento es requerido');
        }

        // Verificar en la base de datos
        const resultado = await this.usuarioRepository.verificarDocumentoExistente(
            numeroDocumento.trim()
        );

        return {
            disponible: !resultado.existe,
            tipoUsuario: resultado.tipo,
        };
    }
}
