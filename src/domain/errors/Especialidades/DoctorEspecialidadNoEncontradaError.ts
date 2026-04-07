export class DoctorEspecialidadNoEncontradaError extends Error {
    constructor(idEspecialidad: number) {
        super(`La especialidad con ID ${idEspecialidad} no está asociada a este doctor.`);
        this.name = 'DoctorEspecialidadNoEncontradaError';
    }
}
