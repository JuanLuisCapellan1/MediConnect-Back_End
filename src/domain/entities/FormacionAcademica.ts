export class FormacionAcademica {
    constructor(
        public readonly id: number,
        public readonly doctorId: number,
        public readonly universidadId: number,
        public readonly nombre: string,
        public readonly fechaInicio: Date,
        public readonly estado: string,
        public readonly creadoEn: Date,
        public readonly fechaFinalizacion?: Date,
        public readonly enCurso?: boolean,
        public readonly actualizadoEn?: Date,
        // Objetos relacionados opcionales
        public readonly universidad?: { nombre: string; pais: { nombre: string } }
    ) { }
}
