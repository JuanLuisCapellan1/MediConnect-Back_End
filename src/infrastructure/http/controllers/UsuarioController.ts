import { Request, Response } from 'express';
import { container } from 'tsyringe'; // El contenedor de inyección
import { RegistrarUsuarioUseCase } from '../../../application/use-cases/RegistrarUsuarioUseCase';
import { RegistrarUsuarioDto } from '../../../application/dtos/RegistrarUsuarioDto';

export class UsuarioController {
  
  async registrar(req: Request, res: Response): Promise<Response> {
    try {
      // 1. Extraer los datos del body
      // Nota: Aquí Express ya convirtió el JSON a objeto gracias a app.use(express.json())
      const datos: RegistrarUsuarioDto = req.body;
        console.log('Datos recibidos para registro:', req.body);
      // 2. Resolver el Caso de Uso usando el Contenedor
      // Tsyringe se encarga de instanciar el UseCase e inyectarle el Repositorio y el Hasher automáticamente.
      const registrarUsuario = container.resolve(RegistrarUsuarioUseCase);

      // 3. Ejecutar la lógica de negocio
      const usuarioCreado = await registrarUsuario.execute(datos);

      // 4. Responder al cliente (201 Created)
      return res.status(201).json({
        mensaje: 'Usuario registrado exitosamente',
        data: {
          id: usuarioCreado.id,
          email: usuarioCreado.email,
          rol: usuarioCreado.rol,
          estado: usuarioCreado.estado
        }
      });

    } catch (error: any) {
      // Manejo básico de errores
      if (error.message === 'El correo electrónico ya está registrado.') {
        return res.status(409).json({ error: error.message }); // 409 Conflict
      }

      console.error(error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}