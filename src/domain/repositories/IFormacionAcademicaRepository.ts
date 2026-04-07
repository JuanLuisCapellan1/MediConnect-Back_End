import { FormacionAcademica } from '../entities/FormacionAcademica';

export interface IFormacionAcademicaRepository {
    crear(
        doctorId: number,
        universidadId: number,
        nombre: string,
        fechaInicio: Date,
        estado: string,
        enCurso: boolean,
        fechaFinalizacion?: Date
    ): Promise<FormacionAcademica>;

    obtenerPorId(id: number): Promise<FormacionAcademica | null>;

    obtenerTodos(
        doctorId?: number,
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
        nombre?: string,
        fechaInicio?: Date,
        fechaFinalizacion?: Date,
        enCurso?: boolean,
        estado?: string
    ): Promise<FormacionAcademica>;

    eliminar(id: number): Promise<void>;

    verificarDoctorExiste(doctorId: number): Promise<boolean>;
    verificarUniversidadExiste(universidadId: number): Promise<boolean>;
    verificarFormacionDuplicada(
        doctorId: number,
        universidadId: number,
        nombre: string,
        idExcluir?: number
    ): Promise<boolean>;
}
