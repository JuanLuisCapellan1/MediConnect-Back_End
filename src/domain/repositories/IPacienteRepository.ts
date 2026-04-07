import { Paciente } from '../entities/Paciente';
import { ActualizarPacienteDto, FiltroPacientesDto } from '../../application/dtos/PacienteDtos';

export interface IPacienteRepository {
    obtenerPorId(id: number): Promise<Paciente | null>;
    obtenerPorUsuarioId(usuarioId: number): Promise<Paciente | null>;
    obtenerTodos(filtros: FiltroPacientesDto): Promise<{ datos: Paciente[]; total: number }>;
    actualizar(usuarioId: number, datos: ActualizarPacienteDto): Promise<Paciente>;
    eliminar(usuarioId: number): Promise<void>;
    existePorDocumento(numeroDocumento: string, excluirUsuarioId?: number): Promise<boolean>;
}
