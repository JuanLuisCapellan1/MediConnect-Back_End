import { IsNotEmpty } from 'class-validator';

/**
 * DTO para actualizar la foto de perfil de un usuario
 * El archivo viene en req.file via multer
 */
export class ActualizarFotoPerfilDto {
    // No requiere campos - la validación se hace en el controller
    // El archivo viene en req.file y el usuarioId viene del JWT
}
