import { prisma } from '../database/prisma/client';
import { injectable } from 'tsyringe';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';

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
      // 1. Crear Usuario
      const usuario = await tx.usuario.create({
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

      // 2. Crear Paciente con documento
      // Nota: usuarioId es la clave primaria, por lo que se asigna directamente
      await tx.paciente.create({
        data: {
          usuarioId: usuario.id, // PK, se asigna directamente
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
          subBarrioId: data.ubicacion.id_sub_barrio ? Number(data.ubicacion.id_sub_barrio) : null,
          estado: 'Activo',
          creadoEn: new Date(),
        },
      });

      // 3. CREAR PERFIL DOCTOR
      // Nota: al usar usuarioId (escalar) debemos usar ubicacionId (escalar) para mantener tipo unchecked consistente
      await tx.doctor.create({
        data: {
          usuarioId: usuario.id,
          ubicacionId: ubicacion.id,
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
                doctor: {
                  connect: { usuarioId: usuario.id }
                },
                universidad: {
                  connect: { id: Number(f.id_universidad) }
                },
                especialidad: {
                  connect: { id: Number(f.id_especialidad) }
                },
                fecha_inicio: new Date(f.fecha_inicio),
                fecha_finalizacion: f.fecha_finalizacion ? new Date(f.fecha_finalizacion) : null,
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
    return await prisma.usuario.findUnique({
      where: { id },
      include: {
        paciente: true,
        doctor: {
          include: {
            ubicacion: true,
            formaciones: {
              include: {
                especialidad: true,
                universidad: true,
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
              orderBy: {
                creadoEn: 'desc',
              },
            },
          },
        },
        centroSalud: true,
      },
    });
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

  async existeDoctorConNumeroDocumento(numeroDocumento: string): Promise<boolean> {
    const doctor = await prisma.doctor.findFirst({
      where: {
        numeroDocumentoIdentificacion: numeroDocumento,
        estado: { not: 'Eliminado' }
      }
    });
    return doctor !== null;
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

  /**
   * Guarda un Doctor con documentos múltiples (transacción de 6 pasos)
   */
  async saveDoctorWithDocuments(data: any): Promise<any> {
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
          subBarrioId: data.ubicacion.id_sub_barrio ? Number(data.ubicacion.id_sub_barrio) : null,
          estado: 'Activo',
          creadoEn: new Date(),
        },
      });

      // 3. CREAR PERFIL DOCTOR
      await tx.doctor.create({
        data: {
          usuarioId: usuario.id,
          ubicacionId: ubicacion.id,
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

      // 4. CREAR DOCUMENTOS (múltiples por tipo)
      if (data.documentos && data.documentos.length > 0) {
        await Promise.all(
          data.documentos.map((doc: any) =>
            tx.documentoDoctor.create({
              data: {
                doctorId: usuario.id,
                tipoDocumento: doc.tipo_documento,
                urlArchivo: doc.url_archivo,
                nombreOriginal: doc.nombre_original || null,
                tipoMime: doc.tipo_mime || null,
                descripcion: doc.descripcion || null,
                estado: 'Activo',
                creadoEn: new Date(),
              },
            })
          )
        );
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
                doctor: {
                  connect: { usuarioId: usuario.id }
                },
                universidad: {
                  connect: { id: Number(f.id_universidad) }
                },
                especialidad: {
                  connect: { id: Number(f.id_especialidad) }
                },
                fecha_inicio: new Date(f.fecha_inicio),
                fecha_finalizacion: f.fecha_finalizacion ? new Date(f.fecha_finalizacion) : null,
                estado: mapEstadoFormacion(f.estado || 'Activo'),
                creadoEn: new Date(),
              },
            })
          )
        );
      }

      // 6. CREAR ESPECIALIDADES DEL DOCTOR
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
}