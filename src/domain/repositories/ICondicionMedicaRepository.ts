/**
 * Interfaz del Repositorio para CondicionMedica
 */
import { CondicionMedica } from '../entities/CondicionMedica';
import { CaracteristicaEspecial } from '../entities/CaracteristicaEspecial';
import {
    CrearCondicionMedicaDto,
    ActualizarCondicionMedicaDto,
    FiltroCondicionesMedicasDto,
    AsignarCondicionPacienteDto,
    ActualizarCondicionPacienteDto,
    FiltroCondicionesPacienteDto,
    AgregarAlergiaPersonalDto,
    CrearCondicionPersonalDto,
    ActualizarMiCondicionDto,
    FiltroMisCondicionesDto,
    BuscarAlergiasDto,
} from '../../application/dtos/CondicionMedicaDtos';

export interface ICondicionMedicaRepository {
    // CRUD de Condiciones Médicas
    crear(datos: CrearCondicionMedicaDto): Promise<CondicionMedica>;
    obtenerPorId(id: number): Promise<CondicionMedica | null>;
    obtenerTodas(
        filtros: FiltroCondicionesMedicasDto
    ): Promise<{ datos: CondicionMedica[]; total: number }>;
    actualizar(
        id: number,
        datos: ActualizarCondicionMedicaDto
    ): Promise<CondicionMedica>;
    eliminar(id: number): Promise<void>;
    existeNombre(nombre: string, excluirId?: number): Promise<boolean>;

    // Gestión de Condiciones de Pacientes (para Doctores)
    asignarAPaciente(datos: AsignarCondicionPacienteDto): Promise<CaracteristicaEspecial>;
    obtenerCondicionesPaciente(
        pacienteId: number,
        filtros: FiltroCondicionesPacienteDto
    ): Promise<CaracteristicaEspecial[]>;
    actualizarCondicionPaciente(
        pacienteId: number,
        condicionId: number,
        datos: ActualizarCondicionPacienteDto
    ): Promise<CaracteristicaEspecial>;
    removerCondicionPaciente(
        pacienteId: number,
        condicionId: number
    ): Promise<void>;
    existeCondicionPaciente(
        pacienteId: number,
        condicionId: number
    ): Promise<boolean>;

    // Métodos para Pacientes
    obtenerAlergias(filtros?: any): Promise<{ datos: CondicionMedica[], total: number }>;
    buscarAlergias(dto: BuscarAlergiasDto): Promise<CondicionMedica[]>;
    agregarMiAlergia(
        pacienteId: number,
        dto: AgregarAlergiaPersonalDto
    ): Promise<CaracteristicaEspecial>;
    actualizarMiAlergia(
        pacienteId: number,
        condicionId: number,
        dto: ActualizarMiCondicionDto
    ): Promise<CondicionMedica>;
    eliminarMiAlergia(
        pacienteId: number,
        condicionId: number
    ): Promise<void>;
    crearMiCondicion(
        pacienteId: number,
        dto: CrearCondicionPersonalDto
    ): Promise<CondicionMedica>;
    obtenerMisCondiciones(
        pacienteId: number,
        filtros: FiltroMisCondicionesDto
    ): Promise<CondicionMedica[]>;
    actualizarMiCondicion(
        pacienteId: number,
        condicionId: number,
        dto: ActualizarMiCondicionDto
    ): Promise<CondicionMedica>;
    eliminarMiCondicion(
        pacienteId: number,
        condicionId: number
    ): Promise<void>;
}
