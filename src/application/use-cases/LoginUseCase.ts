import { injectable } from 'tsyringe';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { AuthService } from '../../infrastructure/external-services/AuthService';
import { IPasswordHasher } from '../interfaces/IPasswordHasher';
import { LoginDto } from '../dtos/LoginDto';

export interface LoginResult {
  token: string;
  usuario: {
    id: number;
    email: string;
    rol: string;
    fotoPerfil?: string | null;
  };
}

const CREDENCIALES_INVALIDAS = 'Credenciales inválidas';
const USUARIO_INACTIVO = 'Usuario inactivo o bloqueado';

@injectable()
export class LoginUseCase {
  constructor(
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly authService: AuthService
  ) {}

  async execute(dto: LoginDto): Promise<LoginResult> {
    const usuario = await this.usuarioRepository.buscarPorEmail(dto.email);
    if (!usuario) {
      throw new Error(CREDENCIALES_INVALIDAS);
    }

    const hashedPassword = (usuario as any).password ?? usuario.password;
    if (!hashedPassword) {
      throw new Error(CREDENCIALES_INVALIDAS);
    }
    const passwordCorrecta = await this.passwordHasher.compare(dto.password, hashedPassword);
    if (!passwordCorrecta) {
      throw new Error(CREDENCIALES_INVALIDAS);
    }

    const estado = (usuario as any).estado ?? usuario.estado;
    if (estado !== 'Activo') {
      throw new Error(USUARIO_INACTIVO);
    }

    const token = this.authService.generarTokenSesion(usuario.id, usuario.email, usuario.rol);
    const fotoPerfil = (usuario as any).fotoPerfil ?? (usuario as any).foto_perfil ?? undefined;
    return {
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
        fotoPerfil: fotoPerfil ?? null,
      },
    };
  }
}
