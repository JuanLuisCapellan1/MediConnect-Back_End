import { injectable } from 'tsyringe';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { AuthService } from '../../infrastructure/external-services/AuthService';
import { IPasswordHasher } from '../interfaces/IPasswordHasher';
import { LoginDto } from '../dtos/LoginDto';

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  usuario: {
    id: number;
    email: string;
    rol: string;
    fotoPerfil?: string | null;
    banner?: string | null;
    paciente?: any | null;
    doctor?: any | null;
    centroSalud?: any | null;
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
  ) { }

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

    // Cargar perfil detallado (paciente/doctor/centro, etc.)
    const usuarioDetallado = await this.usuarioRepository.buscarPerfilDetalladoPorId(usuario.id);
    const base = (usuarioDetallado as any) ?? (usuario as any);

    const { accessToken, refreshToken } = this.authService.generarTokensSesion(
      base.id,
      base.email,
      base.rol
    );
    const fotoPerfil = base.fotoPerfil ?? base.foto_perfil ?? undefined;
    const banner = base.banner ?? undefined;

    return {
      accessToken,
      refreshToken,
      usuario: {
        id: base.id,
        email: base.email,
        rol: base.rol,
        fotoPerfil: fotoPerfil ?? null,
        banner: banner ?? null,
        paciente: base.paciente ?? null,
        doctor: base.doctor ?? null,
        centroSalud: base.centroSalud ?? null,
      },
    };
  }
}
