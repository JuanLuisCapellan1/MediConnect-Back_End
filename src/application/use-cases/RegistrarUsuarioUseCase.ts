import { inject, injectable } from 'tsyringe';
import { Usuario } from '../../domain/entities/Usuario';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { IPasswordHasher } from '../interfaces/IPasswordHasher';
import { RegistrarUsuarioDto } from '../dtos/RegistrarUsuarioDto';

@injectable()
export class RegistrarUsuarioUseCase {
  constructor(
    @inject('UsuarioRepository') private usuarioRepository: IUsuarioRepository,
    @inject('PasswordHasher') private passwordHasher: IPasswordHasher
  ) {}

  async execute(dto: RegistrarUsuarioDto): Promise<Usuario> {
    // 1. Validar Regla de Negocio: ¿El usuario ya existe?
    const usuarioExistente = await this.usuarioRepository.buscarPorEmail(dto.email);
    if (usuarioExistente) {
      throw new Error('El correo electrónico ya está registrado.'); 
      // Nota: En un proyecto real, usarías una clase personalizada 'UserAlreadyExistsError'
    }

    // 2. Encriptar la contraseña (si existe)
    let passwordHashed = '';
    if (dto.password) {
      passwordHashed = await this.passwordHasher.hash(dto.password);
    }

    // 3. Crear la Entidad de Dominio
    // Nota: El ID es 0 o undefined porque la DB lo generará.
    const nuevoUsuario = new Usuario(
      0, // ID temporal
      dto.email,
      dto.rol,
      'Activo', // Estado inicial
      passwordHashed
    );

    // 4. Guardar en Base de Datos
    const usuarioCreado = await this.usuarioRepository.crear(nuevoUsuario);

    // 5. Retornar (Sin la contraseña por seguridad, aunque la entidad la tenga)
    // Aquí podrías retornar un UserResponseDto si quieres ser más estricto
    return usuarioCreado;
  }
}