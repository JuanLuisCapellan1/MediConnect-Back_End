import { prisma } from '../database/prisma/client';
import { injectable } from 'tsyringe'; // Para inyección de dependencias
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { Usuario } from '../../domain/entities/Usuario';

@injectable()
export class PrismaUsuarioRepository implements IUsuarioRepository {
  
  async crear(usuario: Usuario): Promise<Usuario> {
    // Mapeamos de Entidad Dominio -> Prisma Input
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        email: usuario.email,
        password: usuario.password || '', // Manejo básico
        rol: usuario.rol,
        estado: usuario.estado,
        emailVerificado: usuario.emailVerificado
      }
    });

    // Mapeamos de Prisma Output -> Entidad Dominio
    return this.mapToDomain(nuevoUsuario);
  }

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    const usuarioPrisma = await prisma.usuario.findUnique({
      where: { email }
    });

    if (!usuarioPrisma) return null;
    return this.mapToDomain(usuarioPrisma);
  }

  async buscarPorId(id: number): Promise<Usuario | null> {
    const usuarioPrisma = await prisma.usuario.findUnique({
      where: { id }
    });

    if (!usuarioPrisma) return null;
    return this.mapToDomain(usuarioPrisma);
  }

  async actualizar(id: number, datos: Partial<Usuario>): Promise<Usuario> {
    const usuarioActualizado = await prisma.usuario.update({
      where: { id },
      data: {
        ...datos, // Prisma es inteligente y solo actualiza lo que envíes
        actualizadoEn: new Date()
      }
    });
    return this.mapToDomain(usuarioActualizado);
  }


  async eliminar(id: number): Promise<void> {
    await prisma.usuario.delete({
      where: { id }
    });
  }

  // Helper privado para convertir datos "crudos" de DB a tu Clase limpia
  private mapToDomain(prismaUser: any): Usuario {
    return new Usuario(
      prismaUser.id,
      prismaUser.email,
      prismaUser.rol,
      prismaUser.estado,
      prismaUser.password || undefined,
      prismaUser.emailVerificado,
      prismaUser.creadoEn,
      prismaUser.actualizadoEn || undefined
    );
  }
}