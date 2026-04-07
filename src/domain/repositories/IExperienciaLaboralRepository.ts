import { ExperienciaLaboral } from '../entities/ExperienciaLaboral';

export interface IExperienciaLaboralRepository {
    /**
     * Crea una nueva experiencia laboral
     */
    crear(experiencia: ExperienciaLaboral): Promise<ExperienciaLaboral>;

    /**
     * Obtiene una experiencia laboral por su ID
     */
    obtenerPorId(id: number): Promise<ExperienciaLaboral | null>;

    /**
     * Obtiene todas las experiencias laborales con filtros opcionales
     */
    obtenerTodos(
        doctorId?: number,
        estado?: string,
        busqueda?: string,
        pagina?: number,
        limite?: number
    ): Promise<{ experiencias: ExperienciaLaboral[]; total: number }>;

    /**
     * Actualiza una experiencia laboral existente
     */
    actualizar(id: number, experiencia: Partial<ExperienciaLaboral>): Promise<ExperienciaLaboral>;

    /**
     * Elimina (soft delete) una experiencia laboral
     */
    eliminar(id: number): Promise<void>;

    /**
     * Verifica si un doctor existe
     */
    verificarDoctorExiste(doctorId: number): Promise<boolean>;
}
