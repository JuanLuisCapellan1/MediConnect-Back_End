import { Request, Response } from 'express';
import { container } from 'tsyringe';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

export class AuthController {
  /**
   * Login simple para pruebas
   * POST /api/auth/login
   * Body: { email: string, password: string }
   */
  async login(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ 
          error: 'Email y password son requeridos' 
        });
      }

      // Obtener usuario de la base de datos
      const prisma = container.resolve<PrismaClient>('PrismaClient');
      const usuario = await prisma.usuario.findUnique({
        where: { email }
      });

      if (!usuario) {
        return res.status(401).json({ 
          error: 'Credenciales inválidas' 
        });
      }

      // Verificar password
      const passwordValido = await bcrypt.compare(password, usuario.password);
      
      if (!passwordValido) {
        return res.status(401).json({ 
          error: 'Credenciales inválidas' 
        });
      }

      // Verificar que el usuario esté activo
      if (usuario.estado !== 'Activo') {
        return res.status(403).json({ 
          error: 'Usuario inactivo. Contacta al administrador' 
        });
      }

      // Generar token JWT
      const secreto = process.env.JWT_SECRET || 'secret-key-temporal';
      const token = jwt.sign(
        {
          userId: usuario.id,
          email: usuario.email,
          rol: usuario.rol
        },
        secreto,
        { expiresIn: '24h' }
      );

      return res.status(200).json({
        mensaje: 'Login exitoso',
        data: {
          token,
          usuario: {
            id: usuario.id,
            email: usuario.email,
            rol: usuario.rol,
            fotoPerfil: usuario.fotoPerfil
          }
        }
      });

    } catch (error: any) {
      console.error('Error en login:', error);
      return res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }

  /**
   * Login rápido para pruebas (sin password)
   * POST /api/auth/quick-login
   * Body: { email: string }
   */
  async quickLogin(req: Request, res: Response): Promise<Response> {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ 
          error: 'Email es requerido' 
        });
      }

      // Obtener usuario de la base de datos
      const prisma = container.resolve<PrismaClient>('PrismaClient');
      const usuario = await prisma.usuario.findUnique({
        where: { email }
      });

      if (!usuario) {
        return res.status(404).json({ 
          error: 'Usuario no encontrado' 
        });
      }

      // Generar token JWT sin verificar password (solo para pruebas)
      const secreto = process.env.JWT_SECRET || 'secret-key-temporal';
      const token = jwt.sign(
        {
          userId: usuario.id,
          email: usuario.email,
          rol: usuario.rol
        },
        secreto,
        { expiresIn: '24h' }
      );

      return res.status(200).json({
        mensaje: 'Quick login exitoso (solo para desarrollo)',
        data: {
          token,
          usuario: {
            id: usuario.id,
            email: usuario.email,
            rol: usuario.rol,
            fotoPerfil: usuario.fotoPerfil
          }
        }
      });

    } catch (error: any) {
      console.error('Error en quick login:', error);
      return res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }

  /**
   * Generar token para usuario específico (solo desarrollo)
   * POST /api/auth/generate-token
   * Body: { usuarioId: number }
   */
  async generateToken(req: Request, res: Response): Promise<Response> {
    try {
      const { usuarioId } = req.body;

      if (!usuarioId) {
        return res.status(400).json({ 
          error: 'usuarioId es requerido' 
        });
      }

      // Obtener usuario
      const prisma = container.resolve<PrismaClient>('PrismaClient');
      const usuario = await prisma.usuario.findUnique({
        where: { id: parseInt(usuarioId) }
      });

      if (!usuario) {
        return res.status(404).json({ 
          error: 'Usuario no encontrado' 
        });
      }

      // Generar token
      const secreto = process.env.JWT_SECRET || 'secret-key-temporal';
      const token = jwt.sign(
        {
          userId: usuario.id,
          email: usuario.email,
          rol: usuario.rol
        },
        secreto,
        { expiresIn: '24h' }
      );

      return res.status(200).json({
        mensaje: 'Token generado (solo para desarrollo)',
        data: {
          token,
          usuarioId: usuario.id,
          email: usuario.email,
          rol: usuario.rol
        }
      });

    } catch (error: any) {
      console.error('Error al generar token:', error);
      return res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }

  /**
   * Verificar token
   * POST /api/auth/verify
   * Body: { token: string }
   */
  async verifyToken(req: Request, res: Response): Promise<Response> {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ 
          error: 'Token es requerido' 
        });
      }

      const secreto = process.env.JWT_SECRET || 'secret-key-temporal';
      const decoded = jwt.verify(token, secreto) as any;

      return res.status(200).json({
        mensaje: 'Token válido',
        data: decoded
      });

    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Token expirado' 
        });
      }
      
      return res.status(401).json({ 
        error: 'Token inválido' 
      });
    }
  }

  /**
   * Obtener información del usuario autenticado
   * GET /api/auth/me
   * Header: Authorization: Bearer TOKEN
   */
  async me(req: Request, res: Response): Promise<Response> {
    try {
      const usuarioId = (req as any).usuarioId;

      if (!usuarioId) {
        return res.status(401).json({ 
          error: 'No autenticado' 
        });
      }

      const prisma = container.resolve<PrismaClient>('PrismaClient');
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: {
          id: true,
          email: true,
          rol: true,
          fotoPerfil: true,
          telefono: true,
          emailVerificado: true,
          estado: true,
          creadoEn: true
        }
      });

      if (!usuario) {
        return res.status(404).json({ 
          error: 'Usuario no encontrado' 
        });
      }

      return res.status(200).json({
        mensaje: 'Usuario autenticado',
        data: usuario
      });

    } catch (error: any) {
      console.error('Error al obtener usuario:', error);
      return res.status(500).json({ 
        error: 'Error interno del servidor' 
      });
    }
  }
}
