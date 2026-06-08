import { prisma } from '../database/prisma/client';
import { injectable } from 'tsyringe';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { Usuario } from '../../domain/entities/Usuario';

@injectable()
export class PrismaUsuarioRepository implements IUsuarioRepository {

  async crear(usuario: any): Promise<any> {
    return await prisma.usuario.create({ data: usuario });
  }

  async buscarPorEmail(email: string): Promise<any | null> {
    // Buscar email de forma case-insensitive para evitar problemas de coincidencia
    // Normalizamos el email y usamos una búsqueda insensible a mayúsculas.
    try {
      return await prisma.usuario.findFirst({
        where: { email: { equals: email.trim(), mode: 'insensitive' } },
      });
    } catch (error) {
      // En caso de que el proveedor de la BD no soporte 'mode', caemos
      // a la búsqueda por email normal (no sensible a mayúsculas).
      return await prisma.usuario.findUnique({ where: { email: email.trim() } });
    }
  }

  async buscarPorId(id: number): Promise<any | null> {
    return await prisma.usuario.findUnique({ where: { id } });
  }

  async actualizar(id: number, datos: any): Promise<any> {
    return await prisma.usuario.update({ where: { id }, data: datos });
  }

  async eliminar(id: number): Promise<void> {
    await prisma.usuario.update({ where: { id }, data: { estado: 'Eliminado' } });
  }

  /**
   * Guarda un Paciente con su perfil en una transacción atómica
   */
  async savePaciente(data: any): Promise<any> {
    return await prisma.$transaction(async (tx) => {
      // 1. CREAR O REACTIVAR USUARIO
      const usuarioEliminado = await tx.usuario.findFirst({
        where: {
          email: {
            equals: data.email,
            mode: 'insensitive'
          },
          estado: 'Eliminado',
        },
      });

      let usuario;
      if (usuarioEliminado) {
        // Reactivar usuario eliminado
        usuario = await tx.usuario.update({
          where: { id: usuarioEliminado.id },
          data: {
            password: data.password,
            rol: 'Paciente',
            estado: 'Activo',
            emailVerificado: true,
            fotoPerfil: data.paciente.foto_perfil ?? null,
            actualizadoEn: new Date(),
          },
        });
      } else {
        // Crear nuevo usuario
        usuario = await tx.usuario.create({
          data: {
            email: data.email,
            password: data.password,
            rol: 'Paciente',
            estado: 'Activo',
            emailVerificado: true,
            fotoPerfil: data.paciente.foto_perfil ?? null,
            creadoEn: new Date(),
          },
        });
      }

      // 2. CREAR O REACTIVAR PACIENTE
      const pacienteEliminado = await tx.paciente.findFirst({
        where: { usuarioId: usuario.id },
      });

      if (pacienteEliminado) {
        // Reactivar perfil de paciente
        await tx.paciente.update({
          where: { usuarioId: usuario.id },
          data: {
            nombre: data.paciente.nombre,
            apellido: data.paciente.apellido,
            tipoDocIdentificacion: data.paciente.tipo_documento_identificacion,
            numero_documento_identificacion: data.paciente.numero_documento_identificacion,
            foto_documento: data.paciente.foto_documento ?? null,
            fechaNacimiento: data.paciente.fecha_nacimiento || new Date(),
            genero: data.paciente.genero || 'O',
            altura: data.paciente.altura || null,
            peso: data.paciente.peso || null,
            tipoSangre: data.paciente.tipo_sangre || null,
            estado: 'Activo',
            actualizadoEn: new Date(),
          },
        });
      } else {
        // Crear nuevo paciente
        await tx.paciente.create({
          data: {
            usuarioId: usuario.id,
            nombre: data.paciente.nombre,
            apellido: data.paciente.apellido,
            tipoDocIdentificacion: data.paciente.tipo_documento_identificacion,
            numero_documento_identificacion: data.paciente.numero_documento_identificacion,
            foto_documento: data.paciente.foto_documento ?? null,
            fechaNacimiento: data.paciente.fecha_nacimiento || new Date(),
            genero: data.paciente.genero || 'O',
            altura: data.paciente.altura || null,
            peso: data.paciente.peso || null,
            tipoSangre: data.paciente.tipo_sangre || null,
            estado: 'Activo',
            creadoEn: new Date(),
          },
        });
      }

      return usuario;
    });
  }

  /**
   * Guarda un Doctor con toda su estructura relacional (transacción de 5 pasos)
   */
  async saveDoctor(data: any): Promise<any> {
    return await prisma.$transaction(async (tx) => {

      // 1. CREAR USUARIO
      const usuario = await tx.usuario.create({
        data: {
          email: data.email,
          password: data.password,
          rol: 'Doctor',
          estado: 'Activo',
          emailVerificado: true,
          telefono: data.doctor.telefono,
          fotoPerfil: data.doctor.foto_perfil,
          creadoEn: new Date(),
        },
      });

      // 2. CREAR UBICACIÓN
      const ubicacion = await tx.ubicacion.create({
        data: {
          direccion: data.ubicacion.direccion,
          barrioId: Number(data.ubicacion.id_barrio),
          estado: 'Activo',
          creadoEn: new Date(),
        },
      });

      // 3. CREAR PERFIL DOCTOR
      // Nota: al usar usuarioId (escalar) debemos usar ubicacionId (escalar) para mantener tipo unchecked consistente
      await tx.doctor.create({
        data: {
          usuarioId: usuario.id,
          nombre: data.doctor.nombre,
          apellido: data.doctor.apellido,
          tipoDocIdentificacion: data.doctor.tipo_documento_identificacion,
          numeroDocumentoIdentificacion: data.doctor.numero_documento_identificacion,
          fechaNacimiento: data.doctor.fecha_nacimiento,
          genero: data.doctor.genero,
          nacionalidad: data.doctor.nacionalidad,
          exequatur: data.doctor.exequatur,
          biografia: data.doctor.biografia || null,
          anosExperiencia: data.doctor.anos_experiencia || null,
          estadoVerificacion: 'En revisión',
          calificacionPromedio: 0.00,
          estado: 'Activo',
          creadoEn: new Date(),
        },
      });

      // 4. CREAR FORMACIONES ACADÉMICAS (usando connect para relaciones)
      // La BD solo permite estado IN ('Activo','Inactivo','Eliminado'); mapeamos los del DTO.
      const mapEstadoFormacion = (estado: string): string => {
        if (estado === 'Finalizado') return 'Inactivo';
        if (estado === 'En curso') return 'Activo';
        return estado === 'Inactivo' || estado === 'Eliminado' ? estado : 'Activo';
      };
      if (data.formaciones && data.formaciones.length > 0) {
        await Promise.all(
          data.formaciones.map((f: any) =>
            tx.formacionAcademica.create({
              data: {
                doctorId: usuario.id,
                universidadId: Number(f.id_universidad),
                nombre: f.nombre || 'Sin especificar',
                fecha_inicio: new Date(f.fecha_inicio),
                fecha_finalizacion: f.fecha_finalizacion ? new Date(f.fecha_finalizacion) : null,
                enCurso: f.en_curso || false,
                estado: mapEstadoFormacion(f.estado || 'Activo'),
                creadoEn: new Date(),
              },
            })
          )
        );
      }

      // 4.5. CREAR ESPECIALIDADES DEL DOCTOR
      // Especialidad Principal (obligatoria)
      await tx.doctorEspecialidad.create({
        data: {
          id_doctor: usuario.id,
          id_especialidad: data.id_especialidad_principal,
          es_principal: true,
          estado: 'Activo',
          creado_en: new Date(),
        },
      });

      // Especialidades Secundarias (opcionales)
      if (data.ids_especialidades_secundarias && data.ids_especialidades_secundarias.length > 0) {
        await Promise.all(
          data.ids_especialidades_secundarias.map((idEspecialidad: number) =>
            tx.doctorEspecialidad.create({
              data: {
                id_doctor: usuario.id,
                id_especialidad: idEspecialidad,
                es_principal: false,
                estado: 'Activo',
                creado_en: new Date(),
              },
            })
          )
        );
      }

      // 5. CREAR ACCIÓN DE AUDITORÍA
      const tipoAccion = await tx.tipoAccion.findFirst({
        where: { nombre: 'Solicitud Registro Doctor' },
      });

      if (!tipoAccion) {
        throw new Error('CONFIGURACIÓN ERROR: Tipo de acción "Solicitud Registro Doctor" no existe');
      }

      await tx.accion.create({
        data: {
          emisor: {
            connect: { id: usuario.id } // Usuario.id es la PK
          },
          tipoAccion: {
            connect: { id: tipoAccion.id } // TipoAccion.id es la PK
          },
          estado: 'Pendiente',
          detalle: `Solicitud de registro: Dr(a). ${data.doctor.nombre} ${data.doctor.apellido} - Exequatur: ${data.doctor.exequatur}`,
          fechaEmision: new Date(),
          fechaVencimiento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        },
      });

      return usuario;
    });
  }

  async buscarPorCuentaSocial(proveedor: string, uid: string): Promise<any | null> {
    const cuenta = await prisma.cuentaSocial.findUnique({
      where: {
        proveedor_uidProveedor: { proveedor, uidProveedor: uid },
      },
      include: { usuario: true },
    });
    return cuenta?.usuario ?? null;
  }

  async vincularCuentaSocial(idUsuario: number, proveedor: string, uid: string): Promise<void> {
    await prisma.cuentaSocial.create({
      data: {
        usuarioId: idUsuario,
        proveedor,
        uidProveedor: uid,
      },
    });
  }

  async crearUsuarioBasico(datos: {
    email: string;
    password: string;
    nombre: string;
    apellido: string;
    foto: string;
  }): Promise<any> {
    return await prisma.usuario.create({
      data: {
        email: datos.email,
        password: datos.password,
        rol: 'Paciente',
        estado: 'Activo',
        emailVerificado: true,
        fotoPerfil: datos.foto || '',
        creadoEn: new Date(),
      },
    });
  }

  async buscarPerfilDetalladoPorId(id: number): Promise<any | null> {
    const usuario = await (prisma.usuario as any).findUnique({
      where: { id },
      include: {
        paciente: {
          include: {
            usuario: {
              select: {
                email: true,
                telefono: true,
                fotoPerfil: true,
                rol: true,
              },
            },
            seguros: {
              where: { estado: { not: 'Eliminado' } },
              include: {
                seguro: true,
                tipoSeguro: true,
              },
              orderBy: { creadoEn: 'desc' },
            },
            caracteristicas: {
              where: { estado: { not: 'Eliminado' } },
              include: {
                condicion: true,
              },
              orderBy: { registradoEn: 'desc' },
            },
          },
        },
        doctor: {
          include: {
            usuario: {
              select: {
                email: true,
                telefono: true,
                fotoPerfil: true,
                emailVerificado: true,
              },
            },
            ubicaciones: true,
            formaciones: {
              where: {
                estado: 'Activo',
              },
              include: {
                universidad: true,
              },
              orderBy: {
                creadoEn: 'desc',
              },
            },
            experiencias: {
              where: {
                estado: 'Activo',
              },
              orderBy: {
                creadoEn: 'desc',
              },
            },
            especialidades: {
              include: {
                especialidades: true,
              },
            },
            documentos: {
              where: {
                estado: 'Activo',
              },
              include: {
                acciones: {
                  where: {
                    comentarioAdmin: { not: null }
                  },
                  orderBy: {
                    fechaResolucion: 'desc'
                  },
                  take: 1,
                  select: {
                    comentarioAdmin: true,
                    estado: true,
                    fechaResolucion: true
                  }
                }
              },
              orderBy: {
                creadoEn: 'desc',
              },
            },
            horarios: {
              where: {
                estado: 'Activo',
              },
              include: {
                horarios_dias: { select: { dia_semana: true } },
              },
              orderBy: {
                creadoEn: 'asc',
              },
            },
            servicios: {
              where: {
                estado: 'Activo',
              },
            },
            segurosAceptados: {
              include: {
                seguro: true,
              },
            },
            idiomas: {
              where: {
                estado: 'Activo',
              },
              orderBy: {
                creadoEn: 'desc',
              },
            },
          },
        },
        centroSalud: true,
      },
    }) as any;

    // If doctor exists, fetch general verification comment and process documents
    if (usuario?.doctor) {
      const accionVerificacion = await prisma.accion.findFirst({
        where: {
          emisorId: id,
          documentoId: null,
          comentarioAdmin: { not: null }
        },
        orderBy: {
          fechaResolucion: 'desc'
        },
        select: {
          comentarioAdmin: true,
          estado: true,
          fechaResolucion: true
        }
      });

      // Always add verification comment fields (null if not found)
      (usuario.doctor as any).comentarioVerificacion = accionVerificacion?.comentarioAdmin || null;
      (usuario.doctor as any).estadoAccionVerificacion = accionVerificacion?.estado || null;
      (usuario.doctor as any).fechaResolucionVerificacion = accionVerificacion?.fechaResolucion || null;

      // Process documents to always include comentarioAdmin field
      if (usuario.doctor.documentos && Array.isArray(usuario.doctor.documentos)) {
        (usuario.doctor as any).documentos = usuario.doctor.documentos.map((doc: any) => {
          const comentarioAdmin = doc.acciones?.[0]?.comentarioAdmin || null;
          const estadoAccion = doc.acciones?.[0]?.estado || null;
          const fechaResolucion = doc.acciones?.[0]?.fechaResolucion || null;

          // Remove acciones array and add flat fields
          const { acciones, ...docSinAcciones } = doc;
          return {
            ...docSinAcciones,
            comentarioAdmin,
            estadoAccion,
            fechaResolucionAccion: fechaResolucion
          };
        });
      }
    }

    return usuario;
  }

  async updateProfilePhoto(usuarioId: number, fotoPerfilUrl: string): Promise<void> {
    await prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        fotoPerfil: fotoPerfilUrl,
        actualizadoEn: new Date(),
      },
    });
  }

  async updateBanner(usuarioId: number, bannerUrl: string): Promise<void> {
    await prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        banner: bannerUrl,
        actualizadoEn: new Date(),
      },
    });
  }

  async existeDoctorConNumeroDocumento(numeroDocumento: string): Promise<boolean> {
    const doctor = await prisma.doctor.findFirst({
      where: {
        numeroDocumentoIdentificacion: numeroDocumento,
        estado: 'Activo',
      },
    });
    return doctor !== null;
  }

  /**
   * Elimina (soft delete) la cuenta del usuario y todas sus entidades relacionadas
   */
  async eliminarCuenta(usuarioId: number): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // 1. Marcar usuario como eliminado
      await tx.usuario.update({
        where: { id: usuarioId },
        data: {
          estado: 'Eliminado',
          actualizadoEn: new Date(),
        },
      });

      // 2. Verificar si es Paciente
      const paciente = await tx.paciente.findUnique({
        where: { usuarioId },
      });

      // 3. Verificar si es Doctor
      const doctor = await tx.doctor.findUnique({
        where: { usuarioId },
      });

      // 4. Verificar si es Centro de Salud
      const centro = await tx.centroSalud.findUnique({
        where: { usuarioId },
      });

      // 5. Si es Paciente, eliminar sus datos
      if (paciente) {
        // Marcar paciente como eliminado
        await tx.paciente.update({
          where: { usuarioId },
          data: { estado: 'Eliminado', actualizadoEn: new Date() },
        });

        // Marcar condiciones médicas/alergias como eliminadas
        await tx.caracteristicaEspecial.updateMany({
          where: { pacienteId: usuarioId },
          data: { estado: 'Eliminado', actualizadoEn: new Date() },
        });

        // Cancelar citas activas del paciente
        await tx.cita.updateMany({
          where: {
            pacienteId: usuarioId,
            estado: { in: ['Programada', 'Confirmada'] },
          },
          data: { estado: 'Cancelada', actualizadoEn: new Date() },
        });

        // Marcar citas pasadas como eliminadas
        await tx.cita.updateMany({
          where: {
            pacienteId: usuarioId,
            estado: { notIn: ['Programada', 'Confirmada'] },
          },
          data: { estado: 'Eliminado', actualizadoEn: new Date() },
        });

        // Nota: HistorialConsulta no tiene campo estado, se mantiene el historial

        // Marcar seguros del paciente como eliminados
        await tx.pacienteSeguro.updateMany({
          where: { pacienteId: usuarioId },
          data: { estado: 'Eliminado', actualizadoEn: new Date() },
        });

        // Marcar doctores favoritos como eliminados
        await tx.doctorFavorito.updateMany({
          where: { pacienteId: usuarioId },
          data: { estado: 'Eliminado' },
        });

        // Marcar reseñas como eliminadas
        await tx.resena.updateMany({
          where: { pacienteId: usuarioId },
          data: { estado: 'Eliminado', actualizadoEn: new Date() },
        });
      }

      // 6. Si es Doctor, eliminar sus datos
      if (doctor) {
        // Marcar doctor como eliminado
        await tx.doctor.update({
          where: { usuarioId },
          data: { estado: 'Eliminado', actualizadoEn: new Date() },
        });

        // Cancelar citas activas del doctor
        await tx.cita.updateMany({
          where: {
            doctorUsuarioId: usuarioId,
            estado: { in: ['Programada', 'Confirmada'] },
          },
          data: { estado: 'Cancelada', actualizadoEn: new Date() },
        });

        // Marcar citas pasadas como eliminadas
        await tx.cita.updateMany({
          where: {
            doctorUsuarioId: usuarioId,
            estado: { notIn: ['Programada', 'Confirmada'] },
          },
          data: { estado: 'Eliminado', actualizadoEn: new Date() },
        });

        // Marcar formaciones académicas como eliminadas
        await tx.formacionAcademica.updateMany({
          where: { doctorId: usuarioId },
          data: { estado: 'Eliminado', actualizadoEn: new Date() },
        });

        // Marcar especialidades como eliminadas
        await tx.doctorEspecialidad.updateMany({
          where: { id_doctor: usuarioId },
          data: { estado: 'Eliminado', actualizado_en: new Date() },
        });

        // Marcar documentos del doctor como eliminados
        await tx.documentoDoctor.updateMany({
          where: { doctorId: usuarioId },
          data: { estado: 'Eliminado', actualizadoEn: new Date() },
        });

        // Marcar experiencias laborales como eliminadas
        await tx.experienciaLaboral.updateMany({
          where: { doctorId: usuarioId },
          data: { estado: 'Eliminado', actualizadoEn: new Date() },
        });

        // Marcar seguros aceptados como eliminados
        await tx.doctorSeguro.updateMany({
          where: { doctorId: usuarioId },
          data: { estado: 'Eliminado', actualizadoEn: new Date() },
        });

        // Marcar solicitudes de alianza como eliminadas
        await tx.solicitudAlianza.updateMany({
          where: { doctorId: usuarioId },
          data: { estado: 'Eliminado', actualizadoEn: new Date() },
        });

        // Nota: HistorialConsulta no tiene campo doctorId ni estado
      }

      // 7. Si es Centro de Salud, eliminar sus datos
      if (centro) {
        // Marcar centro como eliminado
        await tx.centroSalud.update({
          where: { usuarioId },
          data: { estado: 'Eliminado', actualizadoEn: new Date() },
        });

        // Marcar solicitudes de alianza del centro como eliminadas
        await tx.solicitudAlianza.updateMany({
          where: { centroSaludId: usuarioId },
          data: { estado: 'Eliminado', actualizadoEn: new Date() },
        });
      }

      // 8. Marcar conversaciones como eliminadas
      await tx.conversacion.updateMany({
        where: {
          OR: [
            { emisorId: usuarioId },
            { receptorId: usuarioId },
          ],
        },
        data: { estado: 'Eliminado', actualizadoEn: new Date() },
      });

      // 9. Marcar notificaciones como eliminadas
      await tx.notificacion.updateMany({
        where: { usuarioId },
        data: { estado: 'Eliminado' },
      });

      // 10. Marcar acciones del usuario como eliminadas
      await tx.accion.updateMany({
        where: { emisorId: usuarioId },
        data: { estado: 'Eliminado', actualizadoEn: new Date() },
      });
    });
  }

  /**
   * Verifica si existe un email registrado con estado activo
   */
  async existeEmailActivo(email: string): Promise<boolean> {
    const usuario = await prisma.usuario.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive'
        },
        estado: 'Activo',
      },
    });
    return usuario !== null;
  }

  /**
   * Busca un usuario por email incluyendo los eliminados
   */
  async findByEmailIncludingDeleted(email: string): Promise<Usuario | null> {
    const usuarioPrisma = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuarioPrisma) {
      return null;
    }

    return new Usuario(
      usuarioPrisma.id,
      usuarioPrisma.email,
      usuarioPrisma.rol,
      usuarioPrisma.estado,
      usuarioPrisma.fotoPerfil ?? undefined,
      usuarioPrisma.telefono ?? undefined,
      usuarioPrisma.password,
      usuarioPrisma.emailVerificado,
      usuarioPrisma.creadoEn,
      usuarioPrisma.actualizadoEn ?? undefined,
      usuarioPrisma.banner ?? undefined
    );
  }

  async existeDoctorConExequatur(exequatur: string): Promise<boolean> {
    const doctor = await prisma.doctor.findFirst({
      where: {
        exequatur: exequatur,
        estado: { not: 'Eliminado' }
      }
    });
    return doctor !== null;
  }

  async verificarDocumentoExistente(numeroDocumento: string): Promise<{
    existe: boolean;
    tipo?: 'Doctor' | 'Paciente';
  }> {
    // Buscar en doctores
    const doctor = await prisma.doctor.findFirst({
      where: {
        numeroDocumentoIdentificacion: numeroDocumento,
        estado: { not: 'Eliminado' }
      }
    });

    if (doctor) {
      return { existe: true, tipo: 'Doctor' };
    }

    // Buscar en pacientes
    const paciente = await prisma.paciente.findFirst({
      where: {
        numero_documento_identificacion: numeroDocumento,
        estado: { not: 'Eliminado' }
      }
    });

    if (paciente) {
      return { existe: true, tipo: 'Paciente' };
    }

    return { existe: false };
  }

  async buscarUsuarioInvitadoPorDocumento(numeroDocumento: string): Promise<{ id: number; estado: string } | null> {
    const paciente = await prisma.paciente.findFirst({
      where: {
        numero_documento_identificacion: numeroDocumento,
        estado: { not: 'Eliminado' }
      },
      include: {
        usuario: true
      }
    });

    if (paciente && paciente.usuario.estado === 'Invitado') {
      return { id: paciente.usuario.id, estado: paciente.usuario.estado };
    }
    return null;
  }

  async reclamarPacienteShadow(usuarioId: number, data: {
    email: string;
    password: string;
    paciente: {
      nombre: string;
      apellido: string;
      numero_documento_identificacion: string;
      tipo_documento_identificacion: string;
      foto_documento?: string | null;
      foto_perfil?: string | null;
      fecha_nacimiento?: Date;
      genero?: string;
      altura?: number;
      peso?: number;
      tipo_sangre?: string;
    };
  }): Promise<Usuario> {
    return await prisma.$transaction(async (tx) => {
      // 1. Actualizar Usuario
      const usuario = await tx.usuario.update({
        where: { id: usuarioId },
        data: {
          email: data.email,
          password: data.password,
          estado: 'Activo',
          emailVerificado: true,
          fotoPerfil: data.paciente.foto_perfil,
          actualizadoEn: new Date(),
        },
      });

      // 2. Actualizar Paciente
      await tx.paciente.update({
        where: { usuarioId: usuarioId },
        data: {
          nombre: data.paciente.nombre,
          apellido: data.paciente.apellido,
          numero_documento_identificacion: data.paciente.numero_documento_identificacion,
          tipoDocIdentificacion: data.paciente.tipo_documento_identificacion,
          foto_documento: data.paciente.foto_documento,
          fechaNacimiento: data.paciente.fecha_nacimiento,
          genero: data.paciente.genero,
          altura: data.paciente.altura,
          peso: data.paciente.peso,
          tipoSangre: data.paciente.tipo_sangre,
          estado: 'Activo',
          actualizadoEn: new Date(),
        },
      });

      return new Usuario(
        usuario.id,
        usuario.email,
        usuario.rol,
        usuario.estado,
        usuario.fotoPerfil ?? undefined,
        usuario.telefono ?? undefined,
        usuario.password,
        usuario.emailVerificado,
        usuario.creadoEn,
        usuario.actualizadoEn ?? undefined,
        usuario.banner ?? undefined
      );
    });
  }

  /**
   * Guarda un Doctor con documentos múltiples (transacción de 6 pasos)
   */
  async saveDoctorWithDocuments(data: any): Promise<any> {
    return await prisma.$transaction(async (tx) => {

      // 1. CREAR O REACTIVAR USUARIO
      // Primero verificar si existe un usuario eliminado con este email
      const usuarioEliminado = await tx.usuario.findFirst({
        where: {
          email: {
            equals: data.email,
            mode: 'insensitive'
          },
          estado: 'Eliminado',
        },
      });

      let usuario;
      if (usuarioEliminado) {
        // Reactivar usuario eliminado
        usuario = await tx.usuario.update({
          where: { id: usuarioEliminado.id },
          data: {
            password: data.password,
            rol: 'Doctor',
            estado: 'Activo',
            emailVerificado: true,
            telefono: data.doctor.telefono,
            fotoPerfil: data.doctor.foto_perfil,
            actualizadoEn: new Date(),
          },
        });
      } else {
        // Crear nuevo usuario
        usuario = await tx.usuario.create({
          data: {
            email: data.email,
            password: data.password,
            rol: 'Doctor',
            estado: 'Activo',
            emailVerificado: true,
            telefono: data.doctor.telefono,
            fotoPerfil: data.doctor.foto_perfil,
            creadoEn: new Date(),
          },
        });
      }

      // 2. CREAR UBICACIÓN (OPCIONAL)
      let ubicacionId: number | null = null;
      if (data.ubicacion) {
        const ubicacion = await (tx.ubicacion as any).create({
          data: {
            direccion: data.ubicacion.direccion,
            barrioId: Number(data.ubicacion.id_barrio),
            estado: 'Activo',
            creadoEn: new Date(),
            id_doctor: usuario.id,
          },
        });
        // ubicacionId ya no está en Doctor — la ubicación referencia al doctor
      }

      // 3. CREAR O REACTIVAR PERFIL DOCTOR
      const doctorEliminado = await tx.doctor.findFirst({
        where: {
          usuarioId: usuario.id,
        },
      });

      if (doctorEliminado) {
        // Reactivar perfil de doctor eliminado
        await tx.doctor.update({
          where: { usuarioId: usuario.id },
          data: {
            nombre: data.doctor.nombre,
            apellido: data.doctor.apellido,
            tipoDocIdentificacion: data.doctor.tipo_documento_identificacion,
            numeroDocumentoIdentificacion: data.doctor.numero_documento_identificacion,
            fechaNacimiento: data.doctor.fecha_nacimiento,
            genero: data.doctor.genero,
            nacionalidad: data.doctor.nacionalidad,
            exequatur: data.doctor.exequatur,
            biografia: data.doctor.biografia || null,
            estadoVerificacion: 'En revisión',
            estado: 'Activo',
            actualizadoEn: new Date(),
          },
        });
      } else {
        // Crear nuevo perfil de doctor
        await tx.doctor.create({
          data: {
            usuarioId: usuario.id,
            nombre: data.doctor.nombre,
            apellido: data.doctor.apellido,
            tipoDocIdentificacion: data.doctor.tipo_documento_identificacion,
            numeroDocumentoIdentificacion: data.doctor.numero_documento_identificacion,
            fechaNacimiento: data.doctor.fecha_nacimiento,
            genero: data.doctor.genero,
            nacionalidad: data.doctor.nacionalidad,
            exequatur: data.doctor.exequatur,
            biografia: data.doctor.biografia || null,
            estadoVerificacion: 'En revisión',
            calificacionPromedio: 0.00,
            estado: 'Activo',
            creadoEn: new Date(),
          },
        });
      }

      // 4. CREAR DOCUMENTOS (múltiples por tipo) Y ACCIONES DE REVISIÓN
      const documentosCreados: any[] = [];
      if (data.documentos && data.documentos.length > 0) {
        for (const doc of data.documentos) {
          const documentoCreado = await tx.documentoDoctor.create({
            data: {
              doctorId: usuario.id,
              tipoDocumento: doc.tipo_documento,
              urlArchivo: doc.url_archivo,
              nombreOriginal: doc.nombre_original || null,
              tipoMime: doc.tipo_mime || null,
              descripcion: doc.descripcion || null,
              estadoRevision: 'Pendiente',
              estado: 'Activo',
              creadoEn: new Date(),
            },
          });
          documentosCreados.push(documentoCreado);

          // Crear tipo de acción si no existe
          let tipoAccion = await tx.tipoAccion.findFirst({
            where: { nombre: `Revisión ${doc.tipo_documento}` },
          });

          if (!tipoAccion) {
            tipoAccion = await tx.tipoAccion.create({
              data: {
                nombre: `Revisión ${doc.tipo_documento}`,
                estado: 'Activo',
              },
            });
          }

          // Crear acción de revisión para este documento
          await tx.accion.create({
            data: {
              tipoAccionId: tipoAccion.id,
              emisorId: usuario.id,
              documentoId: documentoCreado.id,
              detalle: `Revisión de ${doc.tipo_documento}: ${data.doctor.nombre} ${data.doctor.apellido} - Exequatur: ${data.doctor.exequatur}`,
              comentarioEmisor: doc.descripcion || `Documento ${doc.tipo_documento} para revisión`,
              estado: 'Pendiente',
              fechaEmision: new Date(),
            },
          });
        }
      }

      // 5. CREAR FORMACIONES ACADÉMICAS
      const mapEstadoFormacion = (estado: string): string => {
        if (estado === 'Finalizado') return 'Inactivo';
        if (estado === 'En curso') return 'Activo';
        return estado === 'Inactivo' || estado === 'Eliminado' ? estado : 'Activo';
      };
      if (data.formaciones && data.formaciones.length > 0) {
        await Promise.all(
          data.formaciones.map((f: any) =>
            tx.formacionAcademica.create({
              data: {
                doctorId: usuario.id,
                universidadId: Number(f.id_universidad),
                nombre: f.nombre || 'Sin especificar',
                fecha_inicio: new Date(f.fecha_inicio),
                fecha_finalizacion: f.fecha_finalizacion ? new Date(f.fecha_finalizacion) : null,
                enCurso: f.en_curso || false,
                estado: mapEstadoFormacion(f.estado || 'Activo'),
                creadoEn: new Date(),
              },
            })
          )
        );
      }

      // 6. CREAR ESPECIALIDADES DEL DOCTOR
      // Si el doctor ya existía, eliminar especialidades anteriores
      if (doctorEliminado) {
        await tx.doctorEspecialidad.deleteMany({
          where: {
            id_doctor: usuario.id
          }
        });
      }

      // Especialidad Principal (obligatoria)
      await tx.doctorEspecialidad.create({
        data: {
          id_doctor: usuario.id,
          id_especialidad: data.id_especialidad_principal,
          es_principal: true,
          estado: 'Activo',
          creado_en: new Date(),
        },
      });

      // Especialidades Secundarias (opcionales)
      if (data.ids_especialidades_secundarias && data.ids_especialidades_secundarias.length > 0) {
        await Promise.all(
          data.ids_especialidades_secundarias.map((idEspecialidad: number) =>
            tx.doctorEspecialidad.create({
              data: {
                id_doctor: usuario.id,
                id_especialidad: idEspecialidad,
                es_principal: false,
                estado: 'Activo',
                creado_en: new Date(),
              },
            })
          )
        );
      }

      // 7. CREAR ACCIÓN DE AUDITORÍA
      const tipoAccion = await tx.tipoAccion.findFirst({
        where: { nombre: 'Solicitud Registro Doctor' },
      });

      if (!tipoAccion) {
        throw new Error('CONFIGURACIÓN ERROR: Tipo de acción "Solicitud Registro Doctor" no existe');
      }

      await tx.accion.create({
        data: {
          emisor: {
            connect: { id: usuario.id }
          },
          tipoAccion: {
            connect: { id: tipoAccion.id }
          },
          estado: 'Pendiente',
          detalle: `Solicitud de registro: Dr(a). ${data.doctor.nombre} ${data.doctor.apellido} - Exequatur: ${data.doctor.exequatur}`,
          fechaEmision: new Date(),
          fechaVencimiento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        },
      });

      return usuario;
    });
  }

  async resolverIdPerfilAUsuario(idSospechoso: number): Promise<number> {
    // Intento 1: ¿Es un Paciente?
    const paciente = await prisma.paciente.findFirst({ where: { usuarioId: idSospechoso } });
    if (paciente) {
      console.warn(`[CHAT SEC] Sustituido perfil Paciente -> usuarioId: ${paciente.usuarioId}`);
      return paciente.usuarioId;
    }

    // Intento 2: ¿Es un Doctor?
    const doctor = await prisma.doctor.findFirst({ where: { usuarioId: idSospechoso } });
    if (doctor) {
      console.warn(`[CHAT SEC] Sustituido perfil Doctor -> usuarioId: ${doctor.usuarioId}`);
      return doctor.usuarioId;
    }

    // Intento 3: ¿Es un CentroSalud?
    const centro = await prisma.centroSalud.findFirst({ where: { usuarioId: idSospechoso } });
    if (centro) {
      console.warn(`[CHAT SEC] Sustituido perfil CentroSalud -> usuarioId: ${centro.usuarioId}`);
      return centro.usuarioId;
    }

    // Si no se encontró ningún cruce, devolvemos el ID original
    return idSospechoso;
  }
}