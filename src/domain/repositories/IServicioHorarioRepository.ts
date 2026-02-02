/**
 * Interfaz del Repositorio para ServicioHorario
 * Define el contrato que debe cumplir cualquier implementación
 */
import { ServicioHorario } from '../entities/ServicioHorario';
import {
  CrearServicioHorarioDto,
  ActualizarServicioHorarioDto,
  FiltroServiciosHorariosDto,
} from '../../application/dtos/ServicioHorarioDtos';

export interface IServicioHorarioRepository {
  /**
   * Crea una nueva relación ServicioHorario
   */
  crear(datos: CrearServicioHorarioDto): Promise<ServicioHorario>;

  /**
   * Obtiene una relación por servicioId y horarioId
   */
  obtenerPorIds(servicioId: number, horarioId: number): Promise<ServicioHorario | null>;

  /**
   * Obtiene todas las relaciones de un servicio
   */
  obtenerPorServicio(servicioId: number): Promise<ServicioHorario[]>;

  /**
   * Obtiene todas las relaciones de un horario
   */
  obtenerPorHorario(horarioId: number): Promise<ServicioHorario[]>;

  /**
   * Obtiene todas las relaciones con filtros y paginación
   */
  obtenerTodas(
    filtros: FiltroServiciosHorariosDto
  ): Promise<{ datos: ServicioHorario[]; total: number }>;

  /**
   * Actualiza una relación ServicioHorario
   * Puede cambiar la combinación servicioId/horarioId si se proporcionan nuevos valores
   */
  actualizar(
    servicioId: number,
    horarioId: number,
    datos: ActualizarServicioHorarioDto
  ): Promise<ServicioHorario>;

  /**
   * Elimina una relación ServicioHorario
   */
  eliminar(servicioId: number, horarioId: number): Promise<void>;

  /**
   * Verifica si una relación existe
   */
  existe(servicioId: number, horarioId: number): Promise<boolean>;

  /**
   * Cuenta el total de relaciones
   */
  contar(): Promise<number>;
}
