export class DoctorIdioma {
    constructor(
        readonly id: number,
        readonly doctorId: number,
        readonly nombre: string,
        readonly nivel: string,
        readonly estado: string,
        readonly creadoEn: Date,
        readonly actualizadoEn: Date | null
    ) { }
}
