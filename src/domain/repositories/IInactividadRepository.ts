export interface IInactividadRepository {
    crear(datos: {
        doctorId: number;
        fechaInicio: Date;
        fechaFin: Date;
        motivo?: string;
    }): Promise<any>;

    buscarPorId(id: number): Promise<any | null>;

    listarPorDoctor(doctorId: number): Promise<any[]>;

    cancelar(id: number): Promise<any>;

    buscarSolapantes(doctorId: number, desde: Date, hasta: Date): Promise<any[]>;
}
