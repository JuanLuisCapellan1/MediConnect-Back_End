import { SeguroMedico } from '../entities/SeguroMedico';
import {
    CrearSeguroMedicoDto,
    ActualizarSeguroMedicoDto,
    AgregarSeguroPacienteDto,
    AgregarSeguroDoctorDto,
    FiltroSegurosDto,
} from '../../application/dtos/SeguroMedicoDtos';

/**
 * Interfaz del Repositorio para Seguros Médicos
 */
export interface ISeguroMedicoRepository {
    // ============================================
    // Admin - CRUD completo
    // ============================================
    crear(datos: CrearSeguroMedicoDto): Promise<SeguroMedico>;
    obtenerPorId(id: number): Promise<SeguroMedico | null>;
    obtenerTodos(filtros: FiltroSegurosDto): Promise<{ datos: SeguroMedico[]; total: number }>;
    actualizar(id: number, datos: ActualizarSeguroMedicoDto): Promise<SeguroMedico>;
    eliminar(id: number): Promise<void>;

    // ============================================
    // Paciente - Gestión de seguros (máximo 3)
    // ============================================
    agregarSeguroPaciente(pacienteId: number, dto: AgregarSeguroPacienteDto): Promise<any>;
    obtenerSegurosPaciente(pacienteId: number, incluirHistorial?: boolean): Promise<any[]>;
    eliminarSeguroPaciente(pacienteId: number, seguroId: number): Promise<void>;
    contarSegurosActivosPaciente(pacienteId: number): Promise<number>;
    verificarSeguroExistentePaciente(pacienteId: number, seguroId: number): Promise<boolean>;

    // ============================================
    // Doctor - Gestión de seguros (ilimitado)
    // ============================================
    agregarSeguroDoctor(doctorId: number, dto: AgregarSeguroDoctorDto): Promise<any>;
    obtenerSegurosDoctor(doctorId: number): Promise<any[]>;
    eliminarSeguroDoctor(doctorId: number, seguroId: number, tipoSeguroId: number): Promise<void>;
    verificarSeguroExistenteDoctor(doctorId: number, seguroId: number, tipoSeguroId: number): Promise<boolean>;

    // ============================================
    // Utilidades
    // ============================================
    existeNombre(nombre: string, excluirId?: number): Promise<boolean>;
    obtenerMasUtilizadosPorPacientes(limite?: number): Promise<any[]>;
    verificarCompatibilidadSeguro(
        seguroId: number,
        tipoSeguroId: number,
        doctorId: number,
        pacienteId: number,
    ): Promise<{
        seguroNombre: string;
        tipoSeguroNombre: string;
        doctorAcepta: boolean;
        pacienteTiene: boolean;
        compatible: boolean;
        mensaje: string;
    }>;
}
