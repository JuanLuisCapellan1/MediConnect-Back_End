export interface ISolicitudAlianzaRepository {
    crear(datos: {
        doctorId: number;
        centroSaludId: number;
        mensaje?: string;
        iniciadaPor: 'Doctor' | 'Centro';
    }): Promise<any>;

    buscarPorId(id: number): Promise<any | null>;

    buscarExistente(doctorId: number, centroSaludId: number): Promise<any | null>;

    listarPorCentro(centroSaludId: number): Promise<any[]>;

    listarPorDoctor(doctorId: number): Promise<any[]>;

    actualizar(id: number, datos: {
        estado?: string;
        motivoRechazo?: string | null;
    }): Promise<any>;
}
