export class Doctor {
    constructor(
        public id: number,
        public usuarioId: number,
        public nombre: string,
        public apellido: string,
        public tipoDocIdentificacion: string,
        public numeroDocumentoIdentificacion: string,
        public fechaNacimiento: Date,
        public genero: string,
        public nacionalidad: string | null,
        public exequatur: string,
        public biografia: string | null,
        public anosExperiencia: number | null,
        public estadoVerificacion: string,
        public calificacionPromedio: number | null,
        public estado: string,
        public creadoEn: Date,
        public actualizadoEn: Date | null,
        public duracionCitaPromedio: number,
        public tarifas: number | null
    ) { }
}
