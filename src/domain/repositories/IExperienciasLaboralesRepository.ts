import { ExperienciaLaboral } from '../entities/ExperienciaLaboral';

export interface IExperienciasLaboralesRepository {
  crear(
    doctorId: number,
    profesionId: number,
    descripcionCargo: string,
    fechaInicio: Date,
    trabajaActualmente: boolean,
    estado: string,
    centroSaludId?: number,
    institucionExterna?: string,
    fechaFinalizacion?: Date
  ): Promise<ExperienciaLaboral>;

  obtenerPorId(id: number): Promise<ExperienciaLaboral | null>;

  obtenerTodos(
    doctorId?: number,
    centroSaludId?: number,
    profesionId?: number,
    trabajaActualmente?: boolean,
    estado?: string,
    busqueda?: string,
    pagina?: number,
    limite?: number
  ): Promise<{ experiencias: ExperienciaLaboral[]; total: number }>;

  obtenerPorDoctor(
    doctorId: number,
    pagina?: number,
    limite?: number
  ): Promise<{ experiencias: ExperienciaLaboral[]; total: number }>;

  actualizar(
    id: number,
    centroSaludId?: number,
    institucionExterna?: string,
    profesionId?: number,
    descripcionCargo?: string,
    fechaInicio?: Date,
    fechaFinalizacion?: Date,
    trabajaActualmente?: boolean,
    estado?: string
  ): Promise<ExperienciaLaboral>;

  eliminar(id: number): Promise<void>;

  verificarDoctorExiste(doctorId: number): Promise<boolean>;
  verificarCentroSaludExiste(centroSaludId: number): Promise<boolean>;
  verificarProfesionExiste(profesionId: number): Promise<boolean>;
}
