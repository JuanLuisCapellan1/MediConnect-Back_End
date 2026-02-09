import jwt, { SignOptions } from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { injectable } from 'tsyringe';

export interface GoogleTokenPayload {
  email: string;
  googleId: string;
  nombre: string;
  apellido: string;
  foto: string;
}

@injectable()
export class AuthService {
  private readonly jwtSecret = process.env.JWT_SECRET || 'default_secret';

  private getGoogleClient(): OAuth2Client {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error('GOOGLE_CLIENT_ID no está configurado en el entorno.');
    }
    return new OAuth2Client(clientId);
  }

  /**
   * Verifica el idToken de Google y devuelve email, googleId, nombre, apellido y foto.
   */
  async verificarGoogleToken(idToken: string): Promise<GoogleTokenPayload> {
    const client = this.getGoogleClient();
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) {
      throw new Error('Token de Google inválido: faltan email o sub.');
    }
    const nombre = payload.given_name ?? payload.name ?? '';
    const apellido = payload.family_name ?? '';
    const foto = payload.picture ?? '';
    return {
      email: payload.email,
      googleId: payload.sub,
      nombre,
      apellido,
      foto,
    };
  }

  /**
   * Genera un par de tokens (access + refresh) para sesión de usuario.
   * - accessToken: corto plazo (ej. 4h) para llamadas a la API
   * - refreshToken: más largo (ej. 3d) solo para renovar accessToken
   */
  generarTokensSesion(usuarioId: number, email: string, rol: string): { accessToken: string; refreshToken: string } {
    const accessToken = this.generarAccessToken(usuarioId, email, rol);
    const refreshToken = this.generarRefreshToken(usuarioId, email, rol);
    return { accessToken, refreshToken };
  }

  /**
   * Token de acceso de corta duración.
   * Por defecto 4h, configurable con ACCESS_TOKEN_EXPIRES_IN.
   */
  generarAccessToken(usuarioId: number, email: string, rol: string): string {
    const payload = { userId: usuarioId, email, rol, scope: 'access' };
    const expiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || '4h';
    const options: SignOptions = { expiresIn: expiresIn as any };
    return jwt.sign(payload, this.jwtSecret, options);
  }

  /**
   * Token de refresh de mayor duración.
   * Por defecto 3d, configurable con REFRESH_TOKEN_EXPIRES_IN.
   */
  generarRefreshToken(usuarioId: number, email: string, rol: string): string {
    const payload = { userId: usuarioId, email, rol, scope: 'refresh' };
    const expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '3d';
    const options: SignOptions = { expiresIn: expiresIn as any };
    return jwt.sign(payload, this.jwtSecret, options);
  }

  /**
   * Verifica un refresh token y devuelve payload básico si es válido y de tipo refresh.
   */
  verificarRefreshToken(token: string): { userId: number; email: string; rol: string } | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as {
        userId: number;
        email: string;
        rol: string;
        scope?: string;
      };

      if (decoded.scope !== 'refresh') {
        return null;
      }

      return { userId: decoded.userId, email: decoded.email, rol: decoded.rol };
    } catch {
      return null;
    }
  }

  generarTokenRegistro(email: string): string {
    const payload = { email, scope: 'registro_completo' };
    const options: SignOptions = { expiresIn: '1h' }; // Token válido por 1 hora

    return jwt.sign(payload, this.jwtSecret, options);
  }

  validateRegistrationToken(token: string): string | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as { email: string; scope: string };
      
      if (decoded.scope === 'registro_completo') {
        return decoded.email;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Genera un token temporal para cambio de contraseña.
   */
  generarTokenRecuperacionPassword(email: string): string {
    const payload = { email, scope: 'reset_password' };
    const options: SignOptions = { expiresIn: '30m' }; // 30 minutos por defecto
    return jwt.sign(payload, this.jwtSecret, options);
  }

  validatePasswordResetToken(token: string): string | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as { email: string; scope: string };
      if (decoded.scope === 'reset_password') {
        return decoded.email;
      }
      return null;
    } catch {
      return null;
    }
  }
}