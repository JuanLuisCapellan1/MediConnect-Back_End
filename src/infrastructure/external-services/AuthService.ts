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
   * Genera un JWT de sesión para el usuario (login / vincular / registro rápido).
   */
  generarTokenSesion(usuarioId: number, email: string, rol: string): string {
    const payload = { userId: usuarioId, email, rol, scope: 'sesion' };
    const secret = process.env.JWT_SECRET || 'default_secret';
    const options: SignOptions = { expiresIn: '7d' };
    return jwt.sign(payload, secret, options);
  }

  generarTokenRegistro(email: string): string {
    const payload = { email, scope: 'registro_completo' };
    const secret = process.env.JWT_SECRET || 'default_secret';
    const options: SignOptions = { expiresIn: '1h' }; // Token válido por 1 hora

    return jwt.sign(payload, secret, options);
  }

  validateRegistrationToken(token: string): string | null {
    try {
      const secret = process.env.JWT_SECRET || 'default_secret';
      const decoded = jwt.verify(token, secret) as { email: string; scope: string };
      
      if (decoded.scope === 'registro_completo') {
        return decoded.email;
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}