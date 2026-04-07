export class Paciente {
    constructor(
        public id: number,
        public usuarioId: number,
        public nombre: string,
        public apellido: string,
        public tipoDocIdentificacion: string,
        public numeroDocumentoIdentificacion: string,
        public fotoDocumento: string | null,
        public fechaNacimiento: Date,
        public genero: string,
        public altura: number | null,
        public peso: number | null,
        public tipoSangre: string | null,
        public ubicacionId: number | null,
        public estado: string,
        public creadoEn: Date,
        public actualizadoEn: Date | null
    ) { }
}
