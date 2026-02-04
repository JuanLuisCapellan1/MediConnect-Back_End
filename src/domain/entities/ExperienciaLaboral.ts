export class ExperienciaLaboral {
  constructor(
    public readonly id: number,
    public readonly doctorId: number,
    public readonly profesionId: number,
    public readonly descripcionCargo: string,
    public readonly fechaInicio: Date,
    public readonly trabajaActualmente: boolean,
    public readonly estado: string,
    public readonly creadoEn: Date,
    public readonly centroSaludId?: number,
    public readonly institucionExterna?: string,
    public readonly fechaFinalizacion?: Date,
    public readonly actualizadoEn?: Date,
    // Objetos relacionados opcionales
    public readonly profesion?: { nombre: string },
    public readonly centroSalud?: { nombreComercial: string }
  ) {}
}
