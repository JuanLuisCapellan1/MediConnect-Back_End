import { FormacionAcademica } from '../entities/FormacionAcademica';

export interface IFormacionAcademicaRepository {
    crear(
        doctorId: number,
        universidadId: number,
        especialidadId: number,
        fechaInicio: Date,
        estado: string,
        fechaFinalizacion?: Date
    ): Promise<FormacionAcademica>;

    obtenerPorId(id: number): Promise<FormacionAcademica | null>;

    obtenerTodos(
        doctorId?: number,
        universidadId?: number,
        especialidadId?: number,
        estado?: string,
        busqueda?: string,
        pagina?: number,
        limite?: number
    ): Promise<{ formaciones: FormacionAcademica[]; total: number }>;

    obtenerPorDoctor(
        doctorId: number,
        pagina?: number,
        limite?: number
    ): Promise<{ formaciones: FormacionAcademica[]; total: number }>;

    actualizar(
        id: number,
        universidadId?: number,
        especialidadId?: number,
        fechaInicio?: Date,
        fechaFinalizacion?: Date,
        estado?: string
    ): Promise<FormacionAcademica>;

    eliminar(id: number): Promise<void>;

    verificarDoctorExiste(doctorId: number): Promise<boolean>;
    verificarUniversidadExiste(universidadId: number): Promise<boolean>;
    verificarEspecialidadExiste(especialidadId: number): Promise<boolean>;
    verificarFormacionDuplicada(
        doctorId: number,
        universidadId: number,
        especialidadId: number,
        idExcluir?: number
    ): Promise<boolean>;
}
