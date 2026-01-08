-- Crear la tabla utilizando estándares modernos de PostgreSQL
CREATE TABLE provincias (
    id_provincia INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, --En lugar de SERIAL, usamos el estándar moderno SQL. Esto previene que alguien inserte manualmente un ID por error, garantizando la integridad de la secuencia.
    nombre VARCHAR(80) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Restricciones de integridad 
    CONSTRAINT uq_provincias_nombre UNIQUE (nombre),
    CONSTRAINT chk_provincias_estado CHECK (estado IN ('Activo', 'Inactivo', 'Eliminado'))
);

-- Índices para mejorar el performance de búsquedas
CREATE INDEX idx_provincias_estado ON provincias(estado);

-- Comentarios para documentación viva en la base de datos (Data Dictionary in-db)
COMMENT ON TABLE provincias IS 'Catálogo de provincias geográficas para el sistema MediConnect';
COMMENT ON COLUMN provincias.id_provincia IS 'Identificador único auto-incremental (Identity)';




CREATE TABLE municipios (
    id_municipio INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_provincia INTEGER NOT NULL,
    nombre VARCHAR(80) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Restricción de Llave Foránea (Foreign Key)
    CONSTRAINT fk_municipios_provincia
        FOREIGN KEY (id_provincia)
        REFERENCES provincias(id_provincia)
        ON DELETE RESTRICT,

    -- Restricciones de Integridad
    CONSTRAINT chk_municipios_estado CHECK (estado IN ('Activo', 'Inactivo', 'Eliminado')),
    -- Integridad compuesta: No pueden existir dos municipios con el mismo nombre en la misma provincia
    CONSTRAINT uq_municipios_provincia_nombre UNIQUE (id_provincia, nombre)
);

-- Índices de Rendimiento (Performance)
CREATE INDEX idx_municipios_provincia ON municipios(id_provincia);

-- Índice para filtrado frecuente por estado
CREATE INDEX idx_municipios_estado ON municipios(estado);

-- Documentación del Diccionario de Datos
COMMENT ON TABLE municipios IS 'División administrativa de segundo nivel (Municipios) para MediConnect';
COMMENT ON COLUMN municipios.id_provincia IS 'Referencia a la provincia a la que pertenece el municipio';




CREATE TABLE distritos_municipales (
    id_distrito_municipal INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_municipio INTEGER NOT NULL,
    nombre VARCHAR(80) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Restricción de Llave Foránea (Relación con Municipios)
    CONSTRAINT fk_distritos_municipios
        FOREIGN KEY (id_municipio)
        REFERENCES municipios(id_municipio)
        ON DELETE RESTRICT,

    -- Restricciones de Integridad
    CONSTRAINT chk_distritos_estado CHECK (estado IN ('Activo', 'Inactivo', 'Eliminado')),
    -- Integridad compuesta: Nombre único dentro del mismo municipio
    CONSTRAINT uq_distritos_municipio_nombre UNIQUE (id_municipio, nombre)
);

-- Índices de Rendimiento
-- Índice para optimizar JOINS con la tabla municipios
CREATE INDEX idx_distritos_municipio ON distritos_municipales(id_municipio);

-- Índice para filtrado frecuente
CREATE INDEX idx_distritos_estado ON distritos_municipales(estado);

-- Documentación del Diccionario de Datos
COMMENT ON TABLE distritos_municipales IS 'Entidad sub-municipal (Distritos Municipales) para la segmentación geográfica en MediConnect';
COMMENT ON COLUMN distritos_municipales.id_municipio IS 'Referencia al municipio padre al que pertenece este distrito';





CREATE TABLE secciones (
    id_seccion INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_distrito_municipal INTEGER NOT NULL,
    nombre VARCHAR(80) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Restricción de Llave Foránea (Relación con Distritos Municipales)
    CONSTRAINT fk_secciones_distrito_municipal
        FOREIGN KEY (id_distrito_municipal)
        REFERENCES distritos_municipales(id_distrito_municipal)
        ON DELETE RESTRICT,

    -- Restricciones de Integridad
    CONSTRAINT chk_secciones_estado CHECK (estado IN ('Activo', 'Inactivo', 'Eliminado')),
    -- Integridad compuesta: Nombre único dentro del mismo distrito municipal
    CONSTRAINT uq_secciones_distrito_nombre UNIQUE (id_distrito_municipal, nombre)
);

-- Índices de Rendimiento
-- Índice para optimizar los JOINs con la tabla padre
CREATE INDEX idx_secciones_distrito ON secciones(id_distrito_municipal);

-- Índice para filtrado frecuente por estado
CREATE INDEX idx_secciones_estado ON secciones(estado);

-- Documentación del Diccionario de Datos
COMMENT ON TABLE secciones IS 'División territorial rural (Secciones) perteneciente a un Distrito Municipal';
COMMENT ON COLUMN secciones.id_distrito_municipal IS 'Referencia al Distrito Municipal al que pertenece esta sección';





CREATE TABLE barrios (
    id_barrio INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_seccion INTEGER NOT NULL,
    nombre VARCHAR(80) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Restricción de Llave Foránea (Relación con Secciones)
    CONSTRAINT fk_barrios_seccion
        FOREIGN KEY (id_seccion)
        REFERENCES secciones(id_seccion)
        ON DELETE RESTRICT,

    -- Restricciones de Integridad
    CONSTRAINT chk_barrios_estado CHECK (estado IN ('Activo', 'Inactivo', 'Eliminado')),
    -- Integridad compuesta: Nombre único dentro de la misma sección
    CONSTRAINT uq_barrios_seccion_nombre UNIQUE (id_seccion, nombre)
);

-- Índices de Rendimiento
-- Índice para optimizar los JOINs con la tabla secciones
CREATE INDEX idx_barrios_seccion ON barrios(id_seccion);

-- Índice para búsquedas rápidas por nombre (útil para autocompletado en frontend)
CREATE INDEX idx_barrios_nombre ON barrios(nombre); 

-- Índice para filtrado por estado
CREATE INDEX idx_barrios_estado ON barrios(estado);

-- Documentación del Diccionario de Datos
COMMENT ON TABLE barrios IS 'Unidad mínima de división territorial (Barrios/Parajes) para ubicaciones en MediConnect';
COMMENT ON COLUMN barrios.id_seccion IS 'Referencia a la sección a la que pertenece el barrio';




CREATE TABLE sub_barrios (
    id_sub_barrio INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_barrio INTEGER NOT NULL,
    nombre VARCHAR(80) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Restricción de Llave Foránea (Relación con Barrios)
    CONSTRAINT fk_sub_barrios_barrio
        FOREIGN KEY (id_barrio)
        REFERENCES barrios(id_barrio)
        ON DELETE RESTRICT,

    -- Restricciones de Integridad
    CONSTRAINT chk_sub_barrios_estado CHECK (estado IN ('Activo', 'Inactivo', 'Eliminado')),
    -- Integridad compuesta: Nombre único dentro del mismo barrio
    CONSTRAINT uq_sub_barrios_barrio_nombre UNIQUE (id_barrio, nombre)
);

-- Índices de Rendimiento
-- Índice para optimizar los JOINs con la tabla barrios
CREATE INDEX idx_sub_barrios_barrio ON sub_barrios(id_barrio);

-- Índice para búsquedas por nombre (útil si el usuario busca "Sector A")
CREATE INDEX idx_sub_barrios_nombre ON sub_barrios(nombre);

-- Índice para filtrado por estado
CREATE INDEX idx_sub_barrios_estado ON sub_barrios(estado);

-- Documentación del Diccionario de Datos
COMMENT ON TABLE sub_barrios IS 'Sub-división urbana (Sectores/Manzanas) dentro de un Barrio para ubicación precisa en MediConnect';
COMMENT ON COLUMN sub_barrios.id_barrio IS 'Referencia al Barrio padre al que pertenece este sub-barrio o sector';



-- Es necesario activar esto para usar el tipo de dato GEOGRAPHY
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE ubicaciones (
    id_ubicacion INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    -- La referencia principal es el Barrio (Obligatorio)
    id_barrio INTEGER NOT NULL,
    
    -- El Sub-barrio es opcional (puede ser NULL)
    id_sub_barrio INTEGER,
    
    -- Nuevo campo para la dirección física textual
    direccion VARCHAR(255) NOT NULL,
    
    codigo_postal VARCHAR(10),
    punto_geografico GEOGRAPHY(Point, 4326),
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Restricciones de Llaves Foráneas (FKs)
    CONSTRAINT fk_ubicaciones_barrio
        FOREIGN KEY (id_barrio)
        REFERENCES barrios(id_barrio)
        ON DELETE RESTRICT,

    CONSTRAINT fk_ubicaciones_sub_barrio
        FOREIGN KEY (id_sub_barrio)
        REFERENCES sub_barrios(id_sub_barrio)
        ON DELETE RESTRICT,

    -- Restricciones de Integridad
    CONSTRAINT chk_ubicaciones_estado CHECK (estado IN ('Activo', 'Inactivo', 'Eliminado'))
);

-- ÍNDICES

-- Índice Espacial (Vital para mapas)
CREATE INDEX idx_ubicaciones_geo ON ubicaciones USING GIST (punto_geografico);

-- Índices para FKs (Mejora rendimiento de JOINS)
CREATE INDEX idx_ubicaciones_barrio ON ubicaciones(id_barrio);
CREATE INDEX idx_ubicaciones_sub_barrio ON ubicaciones(id_sub_barrio);

-- Índice para búsquedas parciales de dirección (Ej. buscar "Calle Sol")
CREATE INDEX idx_ubicaciones_direccion ON ubicaciones(direccion);

-- Documentación
COMMENT ON TABLE ubicaciones IS 'Repositorio central de direcciones y geolocalización para pacientes, doctores y centros de salud';
COMMENT ON TABLE ubicaciones.id_barrio IS 'Obligatorio.Se llena siempre ya que toda dirección minimamente pertenece a un barrio';
COMMENT ON COLUMN ubicaciones.direccion IS 'Descripción textual de la calle, número de casa, edificio y apartamento';
COMMENT ON COLUMN ubicaciones.id_sub_barrio IS 'Opcional. Solo se llena si la dirección pertenece a un sector específico dentro del barrio';




-- Función para actualizar automáticamente la fecha de modificación
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;




CREATE TABLE conversaciones (
    id_conversacion INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_emisor INTEGER NOT NULL,
    id_receptor INTEGER NOT NULL,
    
    silenciado BOOLEAN NOT NULL DEFAULT FALSE,
    estado VARCHAR(20) NOT NULL DEFAULT 'Activa',
    
    -- Auditoría
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ, -- Importante para ordenar la bandeja de entrada por "último mensaje"

    -- Restricciones de Llaves Foráneas (Usuarios)
    CONSTRAINT fk_conversaciones_emisor
        FOREIGN KEY (id_emisor)
        REFERENCES usuarios(id_usuario)
        ON DELETE RESTRICT, -- Si se borra un usuario, no borramos el historial del chat inmediatamente

    CONSTRAINT fk_conversaciones_receptor
        FOREIGN KEY (id_receptor)
        REFERENCES usuarios(id_usuario)
        ON DELETE RESTRICT,

    -- Restricciones Lógicas
    CONSTRAINT chk_conversaciones_no_self_chat CHECK (id_emisor <> id_receptor), -- Un usuario no puede chatear consigo mismo 
    CONSTRAINT chk_conversaciones_estado CHECK (estado IN ('Activa', 'Archivada', 'Bloqueada', 'Silenciada', 'Eliminada'))
);

-- Trigger para mantener actualizado_en 
-- Esto servirá para que cuando haya un nuevo mensaje, actualicemos esta fecha y el chat suba al inicio de la lista.
CREATE TRIGGER trg_conversaciones_updated_at
BEFORE UPDATE ON conversaciones
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- ÍNDICES DE RENDIMIENTO E INTEGRIDAD

-- Índice de Unicidad Bidireccional
-- Esto evita tener dos filas para la misma pareja, sin importar quién inició el chat.
-- Asegura que solo exista UNA conversación entre el Usuario 1 y el Usuario 2 y no sea necesario crear otro registro para el Usuario 2 y Usuario 1
CREATE UNIQUE INDEX idx_conversaciones_pareja_unica 
ON conversaciones (LEAST(id_emisor, id_receptor), GREATEST(id_emisor, id_receptor));

-- Índices para buscar "Mis Conversaciones" rápidamente
-- Necesitamos buscar tanto donde soy emisor como donde soy receptor
CREATE INDEX idx_conversaciones_emisor ON conversaciones(id_emisor);
CREATE INDEX idx_conversaciones_receptor ON conversaciones(id_receptor);

-- Índice por estado (para filtrar archivadas)
CREATE INDEX idx_conversaciones_estado ON conversaciones(estado);

-- Documentación
COMMENT ON TABLE conversaciones IS 'Cabecera de las salas de chat privadas entre dos usuarios';
COMMENT ON COLUMN conversaciones.silenciado IS 'Indica si las notificaciones de este chat están desactivadas (Nota: En este modelo simple, el silencio afecta a ambas vistas de los usuario.)'; --OJO: Esto puede que se cambie




CREATE TABLE media (
    id_media INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    -- Usamos TEXT porque las URLs firmadas (con tokens) suelen exceder los 255 caracteres
    archivo TEXT NOT NULL, 
    
    nombre VARCHAR(255), -- Aumentado para soportar nombres de archivo largos
    
    -- Metadatos útiles para el Frontend (Agregado por buena práctica)
    tipo_mime VARCHAR(100), -- Ej: 'image/png', 'application/pdf'. Ayuda al navegador a saber qué es.
    tamanio_bytes BIGINT,   -- Para saber cuánto pesa el archivo sin tener que descargarlo.
    
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
    fecha_subida TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Restricciones de Integridad
    CONSTRAINT chk_media_estado CHECK (estado IN ('Activo', 'Eliminado', 'Archivado'))
);

-- ÍNDICES

-- Índice por estado para tareas de limpieza (ej. borrar archivos lógicos eliminados)
CREATE INDEX idx_media_estado ON media(estado);

-- Documentación
COMMENT ON TABLE media IS 'Repositorio de metadatos de archivos adjuntos (imágenes, recetas, audios)';
COMMENT ON COLUMN media.archivo IS 'URL completa o ruta relativa al almacenamiento de objetos (S3/Blob Storage)';
COMMENT ON COLUMN media.tipo_mime IS 'Formato del archivo (MIME Type) para renderizado correcto en frontend';





CREATE TABLE mensajes (
    id_mensaje INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_conversacion INTEGER NOT NULL,
    id_remitente INTEGER NOT NULL,
    
    -- El contenido es TEXT para no limitar la longitud del mensaje. 
    -- Puede ser NULL si el mensaje es solo una imagen o audio.
    contenido TEXT, 
    
    tipo_mensaje VARCHAR(20) NOT NULL DEFAULT 'texto',
    
    -- Referencia a la tabla Media (Archivos adjuntos)
    id_media INTEGER, 
    
    estado VARCHAR(20) NOT NULL DEFAULT 'Enviado',
    enviado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    leido_en TIMESTAMPTZ, -- Fundamental para saber CUÁNDO se leyó (Doble check azul)

    -- Restricciones de Llaves Foráneas
    CONSTRAINT fk_mensajes_conversacion
        FOREIGN KEY (id_conversacion)
        REFERENCES conversaciones(id_conversacion)
        ON DELETE RESTRICT, -- Protegemos el historial médico. No se borra en cascada.

    CONSTRAINT fk_mensajes_remitente
        FOREIGN KEY (id_remitente)
        REFERENCES usuarios(id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT fk_mensajes_media
        FOREIGN KEY (id_media)
        REFERENCES media(id_media)
        ON DELETE SET NULL,  -- Si se borra el archivo de la tabla media, el mensaje permanece pero el adjunto desaparece (SET NULL).
    
    -- Validaciones de Integridad
    CONSTRAINT chk_mensajes_tipo CHECK (tipo_mensaje IN ('texto', 'imagen', 'audio', 'video', 'archivo', 'otro')),
    CONSTRAINT chk_mensajes_estado CHECK (estado IN ('Enviado', 'Eliminado', 'Leido')),
    
    -- Regla de Negocio Crítica: Un mensaje no puede estar vacío. 
    -- Debe tener texto O debe tener un archivo adjunto.
    CONSTRAINT chk_mensajes_contenido_valido CHECK (contenido IS NOT NULL OR id_media IS NOT NULL)
);

-- ÍNDICES DE ALTO RENDIMIENTO

-- Índice Compuesto (El más importante del chat)
-- Este índice permite hacer "SELECT * FROM mensajes WHERE id_conversacion = X ORDER BY enviado_en DESC LIMIT 50"
-- de manera instantánea, sin ordenar toda la tabla cada vez.
CREATE INDEX idx_mensajes_historial ON mensajes(id_conversacion, enviado_en DESC);

-- Índice para conteo de mensajes no leídos
-- Ayuda a mostrar el globito rojo de notificaciones: "Tienes 3 mensajes sin leer"
CREATE INDEX idx_mensajes_no_leidos ON mensajes(id_conversacion, estado) 
WHERE estado != 'Leido';

-- Documentación
COMMENT ON TABLE mensajes IS 'Historial transaccional de los mensajes intercambiados';
COMMENT ON COLUMN mensajes.leido_en IS 'Fecha exacta de lectura. NULL si no ha sido leído aún.';






CREATE TABLE lecturas_conversacion (
    -- Usamos una Llave Primaria Compuesta. 
    -- Un usuario solo puede tener UN registro de "hasta dónde leí" por conversación.
    id_conversacion INTEGER NOT NULL,
    id_usuario INTEGER NOT NULL,
    
    id_ultimo_mensaje_leido INTEGER, -- Puede ser NULL si acaba de entrar y no ha leído nada
    
    leido_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Cuándo ocurrió la lectura

    -- Definición de la Primary Key Compuesta
    PRIMARY KEY (id_conversacion, id_usuario),

    -- Restricciones de Llaves Foráneas
    CONSTRAINT fk_lecturas_conversacion
        FOREIGN KEY (id_conversacion)
        REFERENCES conversaciones(id_conversacion)
        ON DELETE RESTRICT, 


    CONSTRAINT fk_lecturas_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT fk_lecturas_ultimo_mensaje
        FOREIGN KEY (id_ultimo_mensaje_leido)
        REFERENCES mensajes(id_mensaje)
        ON DELETE RESTRICT
);

-- ÍNDICES DE RENDIMIENTO

-- Este índice es vital para calcular el "badge" de notificaciones (ej. "Tienes 5 mensajes nuevos")
-- Ayuda a comparar rápidamente el último mensaje de la tabla 'mensajes' vs este cursor.
CREATE INDEX idx_lecturas_comparacion ON lecturas_conversacion(id_conversacion, id_usuario, id_ultimo_mensaje_leido);






CREATE TABLE tipos_acciones (
    id_tipo_accion INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL,
    
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Restricciones de Integridad
    CONSTRAINT uq_tipos_acciones_nombre UNIQUE (nombre), -- No queremos dos tipos "Login"
    CONSTRAINT chk_tipos_acciones_estado CHECK (estado IN ('Activo', 'Inactivo', 'Eliminado'))
);

-- ÍNDICES

-- Índice para búsquedas rápidas (útil si cargas este catálogo en caché al iniciar la API)
CREATE INDEX idx_tipos_acciones_nombre ON tipos_acciones(nombre);

-- Documentación
COMMENT ON TABLE tipos_acciones IS 'Catálogo maestro de los tipos de eventos auditables en el sistema (Login, Update, Delete, etc.)';





CREATE TABLE acciones (
    id_accion INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    -- ¿Qué tipo de solicitud es? (Ej. "Verificación de Identidad", "Reporte de Usuario")
    id_tipo_accion INTEGER NOT NULL,
    
    -- Actores del proceso
    id_emisor INTEGER NOT NULL,        -- Quién inicia la solicitud (Ej. El Doctor que se registra)
    id_usuario_afectado INTEGER,       -- A quién se reporta o afecta (Puede ser NULL si es una solicitud propia)
    id_admin_revisor INTEGER,          -- Quién atiende el caso (NULL al inicio, se llena cuando un admin toma el caso)
    
    -- Detalles y Evidencia
    detalle TEXT NOT NULL,             -- Título o resumen: "Solicitud de exequátur #999"
    comentario_emisor TEXT,            -- "Adjunto mis documentos en PDF..."
    
   
    -- Respuesta Administrativa
    comentario_admin TEXT,             -- Feedback: "La foto del exequátur está borrosa, favor subirla de nuevo."
    
    -- Tiempos y Plazos
    fecha_emision TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_vencimiento TIMESTAMPTZ,     -- Útil si la solicitud expira (ej. tienes 7 días para corregir)
    fecha_resolucion TIMESTAMPTZ,      -- Cuándo se cerró el caso
    actualizado_en TIMESTAMPTZ,        -- Para el trigger automático
    
    estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente',

    -- RELACIONES (Foreign Keys)
    CONSTRAINT fk_acciones_tipo
        FOREIGN KEY (id_tipo_accion)
        REFERENCES tipos_acciones(id_tipo_accion)
        ON DELETE RESTRICT,

    CONSTRAINT fk_acciones_emisor
        FOREIGN KEY (id_emisor)
        REFERENCES usuarios(id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT fk_acciones_afectado
        FOREIGN KEY (id_usuario_afectado)
        REFERENCES usuarios(id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT fk_acciones_admin
        FOREIGN KEY (id_admin_revisor)
        REFERENCES usuarios(id_usuario)
        ON DELETE RESTRICT,

    -- REGLAS DE NEGOCIO (Constraints)
    
    -- Estado: Definimos el ciclo de vida de una solicitud
    CONSTRAINT chk_acciones_estado CHECK (estado IN ('Pendiente', 'En Revision', 'Aprobada', 'Rechazada', 'Vencida')),
    
    -- El admin que aprueba NO puede ser el mismo usuario que emite la solicitud.
    -- Esto previene que un admin malintencionado se "auto-verifique" o se "auto-apruebe" permisos.
    CONSTRAINT chk_acciones_no_auto_revision CHECK (id_emisor <> id_admin_revisor),
    
    -- La fecha de vencimiento no puede ser anterior a la de emisión.
    CONSTRAINT chk_acciones_fechas_logicas CHECK (fecha_vencimiento > fecha_emision)
);

-- TRIGGER DE ACTUALIZACIÓN
CREATE TRIGGER trg_acciones_updated_at
BEFORE UPDATE ON acciones
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- ÍNDICES PARA EL DASHBOARD DE ADMINISTRACIÓN

-- "Bandeja de Entrada": Para que los admins vean rápido lo que está "Pendiente"
CREATE INDEX idx_acciones_pendientes ON acciones(estado, fecha_emision) 
WHERE estado = 'Pendiente';

-- Historial por Usuario: "Muéstrame todas las solicitudes de este doctor"
CREATE INDEX idx_acciones_emisor ON acciones(id_emisor);

-- Productividad de Admins: "Cuántos casos ha cerrado el Admin X"
CREATE INDEX idx_acciones_admin ON acciones(id_admin_revisor);

-- Documentación
COMMENT ON TABLE acciones IS 'Cola de solicitudes administrativas (Validación de doctores, reportes, tickets)';
COMMENT ON COLUMN acciones.id_admin_revisor IS 'Usuario con rol Admin que procesó la solicitud. NULL si está en cola.';
COMMENT ON COLUMN acciones.comentario_admin IS 'Feedback visible para el usuario en caso de rechazo o corrección';




CREATE TABLE archivos_adjuntos_acciones (
    -- Esta tabla usa una LLAVE PRIMARIA COMPUESTA.
    -- La combinación de Acción + Archivo debe ser única.
    id_accion INTEGER NOT NULL,
    id_media INTEGER NOT NULL,
    
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Definición de la PK Compuesta
    PRIMARY KEY (id_accion, id_media),

    -- Restricciones de Llaves Foráneas
    CONSTRAINT fk_archivos_acciones_accion
        FOREIGN KEY (id_accion)
        REFERENCES acciones(id_accion)
        ON DELETE RESTRICT, 

    CONSTRAINT fk_archivos_acciones_media
        FOREIGN KEY (id_media)
        REFERENCES media(id_media)
        ON DELETE RESTRICT
        
);

-- ÍNDICES

-- Índice inverso: Vital para buscar "¿En qué acciones se usó este archivo?"
-- (El índice directo por id_accion ya lo crea la Primary Key automáticamente)
CREATE INDEX idx_archivos_acciones_media ON archivos_adjuntos_acciones(id_media);

-- Documentación
COMMENT ON TABLE archivos_adjuntos_acciones IS 'Tabla de vinculación para adjuntar múltiples documentos probatorios a una solicitud o acción';




CREATE TABLE usuarios (
    id_usuario INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    email VARCHAR(120) NOT NULL,
    contrasena VARCHAR(255) NOT NULL, -- Almacenará el Hash (ej. Bcrypt/Argon2), NUNCA texto plano
    
    -- Foto de perfil: Puede ser NULL si el usuario es nuevo o no ha subido alguna foto a su perfil
    foto_perfil VARCHAR(255),
    
    -- Teléfono: Cambio a VARCHAR(20) para soportar formato internacional (+1 809...)
    telefono VARCHAR(20),
    
    rol VARCHAR(30) NOT NULL,
    
    email_verificado BOOLEAN NOT NULL DEFAULT FALSE,
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
    
    -- Auditoría temporal
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ,

    -- Restricciones de Integridad y Seguridad
    CONSTRAINT uq_usuarios_email UNIQUE (email),
    CONSTRAINT chk_usuarios_estado CHECK (estado IN ('Activo', 'Inactivo', 'Suspendido', 'Pendiente', 'Eliminado')),
    CONSTRAINT chk_usuarios_rol CHECK (rol IN ('Paciente', 'Doctor', 'Centro de salud', 'Administrador', 'Soporte TI'))
);

-- Trigger para mantener actualizado_en
CREATE TRIGGER trg_usuarios_updated_at
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- ÍNDICES DE RENDIMIENTO

-- Índice único para el login (búsqueda ultra rápida por email)
-- Nota: Lower() ayuda si quieres que 'Juan@gmail.com' sea igual a 'juan@gmail.com'
CREATE UNIQUE INDEX idx_usuarios_email_lower ON usuarios (lower(email));

-- Índice para filtrar usuarios por rol (útil para paneles administrativos)
CREATE INDEX idx_usuarios_rol ON usuarios(rol);

-- Índice para estado (para excluir usuarios inactivos en el login)
CREATE INDEX idx_usuarios_estado ON usuarios(estado);

-- Documentación
COMMENT ON TABLE usuarios IS 'Tabla maestra de autenticación y autorización para todos los actores del sistema';
COMMENT ON COLUMN usuarios.contrasena IS 'Hash de seguridad.';
COMMENT ON COLUMN usuarios.rol IS 'Define el nivel de acceso y el tipo de perfil (Paciente, Doctor, etc.)';






CREATE TABLE pacientes (
    -- Relación 1:1 con Usuarios. 
    -- No es autoincremental porque hereda el ID de la tabla usuarios.
    id_usuario INTEGER PRIMARY KEY,
    
    -- Información Personal
    nombre VARCHAR(80) NOT NULL,
    apellido VARCHAR(80) NOT NULL,
    
    -- Identificación Civil
    tipo_documento_identificacion VARCHAR(20) NOT NULL,
    documento_identificacion VARCHAR(40) NOT NULL,
    
    fecha_nacimiento DATE NOT NULL,
    genero CHAR(1) NOT NULL,
    
    -- Datos Médicos Base (Biométricos actuales)
    -- Nota: El peso cambia con el tiempo, estos campos sirven como "último registro conocido"
    altura DECIMAL(4,2), -- En metros (ej. 1.75)
    peso DECIMAL(5,2),   -- En Kilogramos (ej. 80.50)
    tipo_sangre VARCHAR(5),
    
    -- Integración con el módulo de Ubicación (Puede ser NULL al registrarse inicialmente)
    id_ubicacion INTEGER,
    
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
    
    -- Auditoría
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ,

  
    -- RESTRICCIONES (CONSTRAINTS)
    -- Vinculación con Usuario
    CONSTRAINT fk_pacientes_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE RESTRICT, 

    -- Vinculación con Ubicación (Dirección)
    CONSTRAINT fk_pacientes_ubicacion
        FOREIGN KEY (id_ubicacion)
        REFERENCES ubicaciones(id_ubicacion)
        ON DELETE SET NULL,

    -- Unicidad de Documento (Evitar doble registro de la misma persona real)
    CONSTRAINT uq_pacientes_documento UNIQUE (documento_identificacion),

    -- Validaciones de Datos (Check Constraints)
    CONSTRAINT chk_pacientes_tipo_doc CHECK (tipo_documento_identificacion IN ('Cédula', 'Pasaporte')),
    CONSTRAINT chk_pacientes_genero CHECK (genero IN ('M', 'F', 'O')), -- M: Masculino, F: Femenino, O: Otro
    CONSTRAINT chk_pacientes_sangre CHECK (tipo_sangre IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    CONSTRAINT chk_pacientes_estado CHECK (estado IN ('Activo', 'Inactivo', 'Fallecido', 'Eliminado'))
);

-- Trigger para mantener actualizado_en
CREATE TRIGGER trg_pacientes_updated_at
BEFORE UPDATE ON pacientes
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- ÍNDICES DE RENDIMIENTO

-- Búsqueda por Cédula/Pasaporte 
CREATE INDEX idx_pacientes_documento ON pacientes(documento_identificacion);

-- Búsqueda por Nombre y Apellido (Para el buscador de doctores)
-- Usamos un índice compuesto para soportar "Buscar por Apellido, Nombre"
CREATE INDEX idx_pacientes_nombre_completo ON pacientes(apellido, nombre);


-- Documentación
COMMENT ON TABLE pacientes IS 'Perfil demográfico y clínico básico de los usuarios tipo Paciente';
COMMENT ON COLUMN pacientes.id_usuario IS 'Llave primaria y foránea. Vincula este perfil con las credenciales de acceso.';
COMMENT ON COLUMN pacientes.id_ubicacion IS 'Referencia a la dirección física actual del paciente.';






CREATE TABLE condiciones_medicas (
    id_condicion INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT, -- Agregado: Útil para describir síntomas breves o códigos CIE-10
    
    -- Agregado: Para filtrar entre 'Alergia', 'Enfermedad', etc.
    tipo VARCHAR(30) NOT NULL DEFAULT 'Enfermedad', 
    
    estado VARCHAR(20) NOT NULL DEFAULT 'Activa',
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Restricciones
    CONSTRAINT uq_condiciones_nombre UNIQUE (nombre),
    CONSTRAINT chk_condiciones_estado CHECK (estado IN ('Activa', 'Inactiva')),
    CONSTRAINT chk_condiciones_tipo CHECK (tipo IN ('Enfermedad', 'Alergia', 'Discapacidad', 'Antecedente'))
);

-- ÍNDICES

-- Búsqueda rápida para autocompletado (ej. Doctor escribe "Diab..." y sale "Diabetes Tipo 2")
CREATE INDEX idx_condiciones_nombre ON condiciones_medicas(nombre);
CREATE INDEX idx_condiciones_tipo ON condiciones_medicas(tipo);

-- Ejemplo
-- INSERT INTO condiciones_medicas (nombre, tipo) VALUES 
-- ('Hipertensión Arterial', 'Enfermedad'), 
-- ('Diabetes Mellitus Tipo 2', 'Enfermedad'), 
-- ('Penicilina', 'Alergia');



CREATE TABLE caracteristicas_especiales (
    id_usuario INTEGER NOT NULL,
    id_condicion INTEGER NOT NULL,
    
    notas TEXT,
    
    -- El estado es vital para el soft delete
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
    
    registrado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ, -- Agregado para saber cuándo se "borró" (soft delete)

    PRIMARY KEY (id_usuario, id_condicion),

    -- RELACIONES (Foreign Keys)
    CONSTRAINT fk_caracteristicas_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES pacientes(id_usuario)
        ON DELETE RESTRICT, 
 

    CONSTRAINT fk_caracteristicas_condicion
        FOREIGN KEY (id_condicion)
        REFERENCES condiciones_medicas(id_condicion)
        ON DELETE RESTRICT,

    CONSTRAINT chk_caracteristicas_estado CHECK (estado IN ('Activo', 'Inactivo', 'Eliminado'))
);

-- Trigger para mantener actualizado_en 
CREATE TRIGGER trg_caracteristicas_updated_at
BEFORE UPDATE ON caracteristicas_especiales
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();


CREATE INDEX idx_caracteristicas_estado ON caracteristicas_especiales(estado);







CREATE TABLE seguros_medicos (
    id_seguro INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    nombre VARCHAR(120) NOT NULL,
    
    -- URL del logo de la ARS 
    url_image TEXT, 
    
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Restricciones
    CONSTRAINT uq_seguros_nombre UNIQUE (nombre),
    CONSTRAINT chk_seguros_estado CHECK (estado IN ('Activo', 'Inactivo', 'Eliminado'))
);

-- ÍNDICES
CREATE INDEX idx_seguros_nombre ON seguros_medicos(nombre);
CREATE INDEX idx_seguros_estado ON seguros_medicos(estado);

-- Datos Semilla (Seed Data) Sugeridos
-- INSERT INTO seguros_medicos (nombre) VALUES ('ARS Humano'), ('ARS Palic'), ('Senasa'), ('Universal');






CREATE TABLE tipos_seguros (
    id_tipo_seguro INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    nombre VARCHAR(80) NOT NULL,
    descripcion TEXT, -- Agregado: Útil para describir qué cubre a grandes rasgos
    
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Restricciones
    CONSTRAINT uq_tipos_seguros_nombre UNIQUE (nombre),
    CONSTRAINT chk_tipos_seguros_estado CHECK (estado IN ('Activo', 'Inactivo', 'Eliminado'))
);

-- ÍNDICES
CREATE INDEX idx_tipos_seguros_estado ON tipos_seguros(estado);

-- Datos Semilla (Seed Data) para el contexto de RD
-- INSERT INTO tipos_seguros (nombre) VALUES ('Plan Básico de Salud (PDSS)'), ('Complementario'), ('Voluntario'), ('Internacional');





CREATE TABLE pacientes_seguros (
    -- Un paciente puede tener varios seguros, pero la combinación Usuario + Seguro debe ser única
    id_usuario INTEGER NOT NULL,
    id_seguro INTEGER NOT NULL,
    id_tipo_seguro INTEGER NOT NULL,
  
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ,

    -- Llave Primaria Compuesta
    PRIMARY KEY (id_usuario, id_seguro),

    -- RELACIONES
    
    -- Vinculación con el Paciente
    CONSTRAINT fk_pacientes_seguros_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES pacientes(id_usuario)
        ON DELETE RESTRICT,

    -- Vinculación con la ARS (Aseguradora)
    CONSTRAINT fk_pacientes_seguros_seguro
        FOREIGN KEY (id_seguro)
        REFERENCES seguros_medicos(id_seguro)
        ON DELETE RESTRICT,

    -- Vinculación con el Tipo de Plan
    CONSTRAINT fk_pacientes_seguros_tipo
        FOREIGN KEY (id_tipo_seguro)
        REFERENCES tipos_seguros(id_tipo_seguro)
        ON DELETE RESTRICT,

    -- Validaciones
    CONSTRAINT chk_pacientes_seguros_estado CHECK (estado IN ('Activo', 'Inactivo', 'Eliminado'))
);

-- Trigger para auditoría
CREATE TRIGGER trg_pacientes_seguros_updated_at
BEFORE UPDATE ON pacientes_seguros
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- ÍNDICES
CREATE INDEX idx_pacientes_seguros ON pacientes_seguros(estado);




CREATE TABLE paises (
    id_pais INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    nombre VARCHAR(80) NOT NULL,
    
    
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Restricciones
    CONSTRAINT uq_paises_nombre UNIQUE (nombre),
    CONSTRAINT chk_paises_estado CHECK (estado IN ('Activo', 'Inactivo', 'Eliminado'))
);

-- ÍNDICE
CREATE INDEX idx_paises_nombre ON paises(nombre);

-- Datos Semilla (Ejemplo)
-- INSERT INTO paises (nombre, codigo_iso) VALUES ('República Dominicana', 'DO'), ('Estados Unidos', 'US');



CREATE TABLE universidades (
    id_universidad INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    -- Relación con País (Una universidad pertenece a un país)
    id_pais INTEGER NOT NULL,
    
    nombre VARCHAR(120) NOT NULL,

    estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- RELACIONES
    CONSTRAINT fk_universidades_pais
        FOREIGN KEY (id_pais)
        REFERENCES paises(id_pais)
        ON DELETE RESTRICT, 

    -- VALIDACIONES
    CONSTRAINT chk_universidades_estado CHECK (estado IN ('Activo', 'Inactivo', 'Eliminado')),
    
    -- Evitar duplicados dentro del mismo país (ej. No dos "UASD" en RD)
    CONSTRAINT uq_universidades_nombre_pais UNIQUE (nombre, id_pais)
);

-- ÍNDICES
-- Búsqueda rápida: "Dame todas las universidades de RD"
CREATE INDEX idx_universidades_pais ON universidades(id_pais);





CREATE TABLE profesiones (
    id_profesion INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    -- Nombre de la profesión (Ej. "Médico General", "Enfermero", "Bioanalista")
    nombre VARCHAR(80) NOT NULL,
    
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Restricciones
    CONSTRAINT uq_profesiones_nombre UNIQUE (nombre), -- Evita duplicados como "Medico" y "Médico"
    CONSTRAINT chk_profesiones_estado CHECK (estado IN ('Activo', 'Inactivo', 'Eliminado'))
);

-- ÍNDICES
-- Búsqueda rápida para listas desplegables en el Frontend
CREATE INDEX idx_profesiones_nombre ON profesiones(nombre);

-- Datos Semilla (Seed Data) sugeridos según tu imagen
-- INSERT INTO profesiones (nombre) VALUES ('Médico General'), ('Especialista'), ('Enfermería'), ('Técnico');



CREATE TABLE especialidades (
    id_especialidad INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    nombre VARCHAR(80) NOT NULL,
    descripcion TEXT, -- Opcional: Para explicar qué trata la especialidad
    
    
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Restricciones
    CONSTRAINT uq_especialidades_nombre UNIQUE (nombre),
    CONSTRAINT chk_especialidades_estado CHECK (estado IN ('Activo', 'Inactivo', 'Eliminado'))
);

-- ÍNDICES
CREATE INDEX idx_especialidades_nombre ON especialidades(nombre);
CREATE INDEX idx_especialidades_estado ON especialidades(estado);




CREATE TABLE doctores (

    id_usuario INTEGER PRIMARY KEY,
    
    -- DATOS PERSONALES
    nombre VARCHAR(80) NOT NULL,
    apellido VARCHAR(80) NOT NULL,
    
    tipo_documento_identificacion VARCHAR(20) NOT NULL,
    documento_identificacion VARCHAR(40) NOT NULL,
    
    fecha_nacimiento DATE NOT NULL,
    genero CHAR(1) NOT NULL,
    nacionalidad VARCHAR(50),
    
    -- PERFIL PROFESIONAL
    exequatur VARCHAR(40) NOT NULL,
    biografia TEXT,
    anos_experiencia INTEGER,
    
    -- GESTIÓN Y ESTADO
    estado_verificacion VARCHAR(20) NOT NULL DEFAULT 'En revisión', -- Vital para el flujo de aprobación
    calificacion_promedio DECIMAL(3, 2) DEFAULT 0.00, -- Ej: 4.85
    
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
    
    -- Auditoría
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ,

    -- RELACIONES (CONSTRAINTS)
    
    -- Vinculación con Usuario (Login)
    CONSTRAINT fk_doctores_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE RESTRICT,

    -- VALIDACIONES
    CONSTRAINT uq_doctores_documento UNIQUE (documento_identificacion),
    CONSTRAINT uq_doctores_exequatur UNIQUE (exequatur),
    
    CONSTRAINT chk_doctores_genero CHECK (genero IN ('M', 'F', 'O')),
    CONSTRAINT chk_doctores_tipo_doc CHECK (tipo_documento_identificacion IN ('Cédula', 'Pasaporte')),
    
    CONSTRAINT chk_doctores_verificacion CHECK (estado_verificacion IN ('Verificado', 'En revisión', 'Rechazado')),
    CONSTRAINT chk_doctores_estado CHECK (estado IN ('Activo', 'Inactivo', 'Suspendido'))
);

-- Trigger de actualización
CREATE TRIGGER trg_doctores_updated_at
BEFORE UPDATE ON doctores
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- ÍNDICES DE RENDIMIENTO

-- Búsqueda rápida de doctores por nombre (para el buscador de la app)
CREATE INDEX idx_doctores_nombre_completo ON doctores(apellido, nombre);

-- Filtro rápido: "Solo mostrar doctores VERIFICADOS" (Muy usado en el Home)
CREATE INDEX idx_doctores_verificados ON doctores(estado_verificacion) 
WHERE estado_verificacion = 'Verificado';

-- Ranking: Ordenar por calificación
CREATE INDEX idx_doctores_ranking ON doctores(calificacion_promedio DESC);



CREATE TABLE formaciones_academicas (
    id_formacion INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    -- EL DOCTOR (Dueño del currículum)
    id_doctor INTEGER NOT NULL,
    
    -- LA INSTITUCIÓN (¿Dónde estudió?)
    id_universidad INTEGER NOT NULL,
    
    -- EL ÁREA (¿Qué estudió?)
    id_especialidad INTEGER NOT NULL,
    
    -- EL TÍTULO OBTENIDO (¿Qué grado obtuvo? Ej. Médico, Licenciado, Magister)
    id_profesion INTEGER NOT NULL,
    
    -- DETALLES DEL TÍTULO
    -- Ej: "Doctor en Medicina, Magna Cum Laude"
    nota VARCHAR(100), 
    
    fecha_obtencion DATE NOT NULL, -- Cuándo se graduó
    
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ,

    -- RELACIONES
    
    CONSTRAINT fk_formacion_doctor
        FOREIGN KEY (id_doctor)
        REFERENCES doctores(id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT fk_formacion_universidad
        FOREIGN KEY (id_universidad)
        REFERENCES universidades(id_universidad)
        ON DELETE RESTRICT,

    CONSTRAINT fk_formacion_especialidad
        FOREIGN KEY (id_especialidad)
        REFERENCES especialidades(id_especialidad)
        ON DELETE RESTRICT,

    CONSTRAINT fk_formacion_profesion
        FOREIGN KEY (id_profesion)
        REFERENCES profesiones(id_profesion)
        ON DELETE RESTRICT,

    -- RESTRICCIONES LÓGICAS
    
    -- Evitar duplicados exactos: Un doctor no puede registrar 
    -- el mismo título, de la misma U, en la misma especialidad dos veces.
    CONSTRAINT uq_formacion_detalle UNIQUE (id_doctor, id_universidad, id_especialidad, id_profesion),
    
    CONSTRAINT chk_formacion_estado CHECK (estado IN ('Activo', 'Inactivo', 'Eliminado'))
);

-- TRIGGER DE AUDITORÍA
CREATE TRIGGER trg_formacion_updated_at
BEFORE UPDATE ON formaciones_academicas
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- ÍNDICES PARA EL PERFIL DEL DOCTOR

-- "Mostrar el CV del Doctor": Consulta más frecuente
CREATE INDEX idx_formacion_doctor ON formaciones_academicas(id_doctor);

-- Filtrado por Especialidad: "Ver todos los doctores que estudiaron Cardiología"
CREATE INDEX idx_formacion_especialidad ON formaciones_academicas(id_especialidad);







CREATE TABLE doctores_seguros (
    -- El Doctor (FK a la tabla doctores)
    id_usuario INTEGER NOT NULL,
    
    -- La Aseguradora (ARS Humano, Palic, etc.)
    id_seguro INTEGER NOT NULL,
    
    -- El Nivel del Plan (Básico, Complementario, Privado)
    -- Este campo es vital. Un doctor puede aceptar ARS Humano en plan Privado pero NO en Básico.
    id_tipo_seguro INTEGER NOT NULL,
    
    -- Control de disponibilidad
    -- Un doctor puede dejar de aceptar un seguro temporalmente sin borrar el registro.
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
    
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ,

    -- LLAVE PRIMARIA COMPUESTA
    -- Evita duplicados: Un doctor no puede registrar la misma combinación ARS+Plan dos veces.
    PRIMARY KEY (id_usuario, id_seguro, id_tipo_seguro),

    -- RELACIONES (Protegidas contra borrado físico)
    
    CONSTRAINT fk_doctores_seguros_doctor
        FOREIGN KEY (id_usuario)
        REFERENCES doctores(id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT fk_doctores_seguros_seguro
        FOREIGN KEY (id_seguro)
        REFERENCES seguros_medicos(id_seguro)
        ON DELETE RESTRICT,

    CONSTRAINT fk_doctores_seguros_tipo
        FOREIGN KEY (id_tipo_seguro)
        REFERENCES tipos_seguros(id_tipo_seguro)
        ON DELETE RESTRICT,

    -- Validaciones
    CONSTRAINT chk_doctores_seguros_estado CHECK (estado IN ('Activo', 'Inactivo', 'Eliminado'))
);

-- Trigger para mantener actualizado_en
CREATE TRIGGER trg_doctores_seguros_updated_at
BEFORE UPDATE ON doctores_seguros
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- ÍNDICES DE RENDIMIENTO

-- Búsqueda de Pacientes: "Busco un Cardiólogo que acepte ARS Senasa (id_seguro=5)"
CREATE INDEX idx_doctores_seguros_filtro ON doctores_seguros(id_seguro, id_tipo_seguro);

-- Documentación
COMMENT ON TABLE doctores_seguros IS 'Matriz de afiliación que define qué planes y seguros acepta cada doctor';






CREATE TABLE doctores_favoritos (
    -- El Paciente que da el "Like"
    id_paciente INTEGER NOT NULL,
    
    -- El Doctor que recibe el "Like"
    id_doctor INTEGER NOT NULL,
    
    -- Fecha de Agregado (Estandarizado a TIMESTAMPTZ)
    agregado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Estado
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo',

    -- Un paciente solo puede tener al mismo doctor como favorito UNA vez.
    PRIMARY KEY (id_paciente, id_doctor),

    -- RELACIONES
    
    -- Validamos que el "id_paciente" exista realmente en la tabla PACIENTES
    CONSTRAINT fk_favoritos_paciente
        FOREIGN KEY (id_paciente)
        REFERENCES pacientes(id_usuario)
        ON DELETE RESTRICT,

    -- Validamos que el "id_doctor" exista realmente en la tabla DOCTORES
    CONSTRAINT fk_favoritos_doctor
        FOREIGN KEY (id_doctor)
        REFERENCES doctores(id_usuario)
        ON DELETE RESTRICT,

    -- VALIDACIONES DE NEGOCIO
    
    CONSTRAINT chk_favoritos_estado CHECK (estado IN ('Activo', 'Eliminado')),
    
    -- Regla de Sanidad: Un usuario no debería poder agregarse a sí mismo como favorito
    -- (Aunque sea Doctor y Paciente a la vez, es una práctica rara en UX)
    CONSTRAINT chk_favoritos_no_self_like CHECK (id_paciente <> id_doctor)
);

-- ÍNDICES DE RENDIMIENTO


-- Métricas para el Doctor: "¿Cuántos pacientes me tienen en favoritos?"
-- Útil para ordenar doctores por popularidad en el buscador.
CREATE INDEX idx_favoritos_doctor ON doctores_favoritos(id_doctor);

-- Filtrado de doctores favoritos activos
CREATE INDEX idx_favoritos_estado ON doctores_favoritos(estado);

-- Documentación
COMMENT ON TABLE doctores_favoritos IS 'Relación de marcadores o bookmarks donde los pacientes guardan a sus doctores frecuentes';






CREATE TABLE tipos_centros_salud (
    id_tipo_centro_salud INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    -- Nombre del tipo (Ej. "Hospital", "Clínica Privada", "Laboratorio", "Consultorio")
    nombre VARCHAR(80) NOT NULL,
    
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Restricciones de Integridad
    CONSTRAINT uq_tipos_centros_nombre UNIQUE (nombre),
    CONSTRAINT chk_tipos_centros_estado CHECK (estado IN ('Activo', 'Inactivo', 'Eliminado'))
);

-- ÍNDICES
-- Búsqueda rápida para desplegables en el Frontend
CREATE INDEX idx_tipos_centros_nombre ON tipos_centros_salud(nombre);

-- Datos Semilla (Seed Data) Sugeridos
-- INSERT INTO tipos_centros_salud (nombre) VALUES 
-- ('Hospital Público'), ('Clínica Privada'), ('Centro de Atención Primaria'), 
-- ('Laboratorio Clínico'), ('Centro de Imágenes'), ('Consultorio Independiente');





CREATE TABLE centros_salud (
    -- PK / FK a Usuarios (El centro TIENE un login)
    id_usuario INTEGER PRIMARY KEY,
    
    -- DATOS COMERCIALES
    nombre_comercial VARCHAR(120) NOT NULL,
    rnc VARCHAR(20) NOT NULL, -- Registro Nacional de Contribuyente 
    
    -- CLASIFICACIÓN
    id_tipo_centro INTEGER NOT NULL, 
    
    -- UBICACIÓN FÍSICA
    -- FK a la tabla de direcciones geográficas
    id_ubicacion INTEGER NOT NULL,
    
    -- IMAGEN CORPORATIVA
    foto_perfil VARCHAR(255), -- URL del logo
    
    -- ESTADOS
    estado_verificacion VARCHAR(20) NOT NULL DEFAULT 'En revisión',
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
    
    -- AUDITORÍA
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ,

    -- RELACIONES 
    
    CONSTRAINT fk_centros_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT fk_centros_tipo
        FOREIGN KEY (id_tipo_centro)
        REFERENCES tipos_centros_salud(id_tipo_centro_salud)
        ON DELETE RESTRICT,

    CONSTRAINT fk_centros_ubicacion
        FOREIGN KEY (id_ubicacion)
        REFERENCES ubicaciones(id_ubicacion)
        ON DELETE RESTRICT,

    -- VALIDACIONES DE NEGOCIO
    
    -- El RNC es único. No pueden existir dos clínicas con el mismo impuesto.
    CONSTRAINT uq_centros_rnc UNIQUE (rnc),
    
    -- Un usuario solo puede ser un centro (redundante por PK, pero aclara la lógica 1:1)
    CONSTRAINT uq_centros_usuario UNIQUE (id_usuario),

    CONSTRAINT chk_centros_verificacion CHECK (estado_verificacion IN ('Verificado', 'En revisión', 'Rechazado')),
    CONSTRAINT chk_centros_estado CHECK (estado IN ('Activo', 'Inactivo', 'Suspendido', 'Eliminado'))
);

-- TRIGGER DE ACTUALIZACIÓN
CREATE TRIGGER trg_centros_updated_at
BEFORE UPDATE ON centros_salud
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- ÍNDICES DE ALTO RENDIMIENTO

-- Búsqueda por Nombre (El más usado por pacientes: "Centro Médico UCE")
CREATE INDEX idx_centros_nombre ON centros_salud(nombre_comercial);

-- Filtro por Tipo: "Mostrar solo Laboratorios"
CREATE INDEX idx_centros_tipo ON centros_salud(id_tipo_centro);

-- Mapa: Filtro geográfico (Optimiza búsquedas por zona)
CREATE INDEX idx_centros_ubicacion ON centros_salud(id_ubicacion);

-- Confianza: Mostrar primero los Verificados
CREATE INDEX idx_centros_verificados ON centros_salud(estado_verificacion) 
WHERE estado_verificacion = 'Verificado';






CREATE TABLE experiencias_laborales (
    id_experiencia INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    id_doctor INTEGER NOT NULL,

    -- Solo se llena si el centro existe registrado en MediConnect.
    id_centro_salud INTEGER, 
    
    -- Nuevo campo para hospitales externos/extranjeros.
    -- Ej: "Hospital Mount Sinai, New York" o "Consultorio Privado Dr. Pérez"
    institucion_externa VARCHAR(150),
    
    id_profesion INTEGER NOT NULL,
    descripcion_cargo VARCHAR(200) NOT NULL, -- Ej: "Jefe de Cirugía"
    
    fecha_inicio DATE NOT NULL,
    fecha_finalizacion DATE,
    trabaja_actualmente BOOLEAN NOT NULL DEFAULT FALSE,
    
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ,

    -- RELACIONES
    CONSTRAINT fk_experiencia_doctor
        FOREIGN KEY (id_doctor)
        REFERENCES doctores(id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT fk_experiencia_centro
        FOREIGN KEY (id_centro_salud)
        REFERENCES centros_salud(id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT fk_experiencia_profesion
        FOREIGN KEY (id_profesion)
        REFERENCES profesiones(id_profesion)
        ON DELETE RESTRICT,

    -- VALIDACIONES DE LÓGICA DE NEGOCIO
    

    -- El doctor debe especificar de dónde viene la experiencia. 
    -- O selecciona un centro de la lista (id_centro_salud) O escribe el nombre (institucion_externa).
    CONSTRAINT chk_experiencia_origen CHECK (
        (id_centro_salud IS NOT NULL) OR (institucion_externa IS NOT NULL)
    ),

    -- Validaciones de Fechas (Igual que antes)
    CONSTRAINT chk_experiencia_fechas CHECK (fecha_finalizacion IS NULL OR fecha_finalizacion >= fecha_inicio),
    
    CONSTRAINT chk_experiencia_actual CHECK (
        (trabaja_actualmente = TRUE AND fecha_finalizacion IS NULL) OR 
        (trabaja_actualmente = FALSE)
    ),
    
    CONSTRAINT chk_experiencia_estado CHECK (estado IN ('Activo', 'Inactivo', 'Eliminado'))
);

-- Trigger de auditoría
CREATE TRIGGER trg_experiencia_updated_at
BEFORE UPDATE ON experiencias_laborales
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- ÍNDICES

CREATE INDEX idx_experiencia_doctor ON experiencias_laborales(id_doctor);
CREATE INDEX idx_experiencia_centro ON experiencias_laborales(id_centro_salud);






CREATE TABLE solicitudes_alianza (
    id_solicitud INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    -- QUIÉN SOLICITA (El Doctor)
    id_doctor INTEGER NOT NULL,
    
    -- A QUIÉN SOLICITA (El Centro)
    id_centro_salud INTEGER NOT NULL,
    
    -- DETALLES
    mensaje VARCHAR(255), -- "Hola, soy el Dr. Pérez, me gustaría activar mi perfil en su clínica."
    
    -- Estado del flujo
    estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
    
    -- Respuesta del Centro (Opcional, para dar feedback si rechazan)
    motivo_rechazo TEXT,
    
    -- AUDITORÍA
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, -- FechaDeSolicitud
    actualizado_en TIMESTAMPTZ, -- FechaDeActualización

    -- RELACIONES
    
    CONSTRAINT fk_alianza_doctor
        FOREIGN KEY (id_doctor)
        REFERENCES doctores(id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT fk_alianza_centro
        FOREIGN KEY (id_centro_salud)
        REFERENCES centros_salud(id_usuario)
        ON DELETE RESTRICT,

    -- RESTRICCIONES DE NEGOCIO
    
    -- Evitar Spam: Un doctor no puede tener dos solicitudes 'Pendientes' al mismo centro.
    -- Debe esperar a que le respondan la primera.
    CONSTRAINT uq_alianza_activa UNIQUE NULLS NOT DISTINCT (id_doctor, id_centro_salud, estado),
    
    -- Estados Validos
    CONSTRAINT chk_alianza_estado CHECK (estado IN ('Pendiente', 'Aceptada', 'Rechazada', 'Cancelada'))
);

-- TRIGGER DE ACTUALIZACIÓN
CREATE TRIGGER trg_alianza_updated_at
BEFORE UPDATE ON solicitudes_alianza
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- ÍNDICES ESTRATÉGICOS

-- Panel del Centro: "Ver solicitudes entrantes"
CREATE INDEX idx_alianza_centro_pendientes ON solicitudes_alianza(id_centro_salud) 
WHERE estado = 'Pendiente';

-- Panel del Doctor: "Ver estado de mis solicitudes"
CREATE INDEX idx_alianza_doctor ON solicitudes_alianza(id_doctor);

-- Regla Anti-Spam (Índice Único Parcial):
-- Garantiza que solo exista UNA solicitud pendiente por par Doctor-Centro.
CREATE UNIQUE INDEX idx_alianza_no_spam 
ON solicitudes_alianza(id_doctor, id_centro_salud) 
WHERE estado = 'Pendiente';






CREATE TABLE horarios (
    id_horario INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    -- EL DOCTOR (Dueño de la agenda)
    id_usuario INTEGER NOT NULL, 
    
    -- DESCRIPCIÓN DEL BLOQUE
    -- Ej: "Consulta Matutina - Clínica Corazones", "Tanda Vespertina"
    nombre VARCHAR(100) NOT NULL,
    
    -- DÍA Y HORA (Normalizado para búsquedas rápidas)
    -- Usamos un entero estándar ISO: 0=Domingo, 1=Lunes, ... 6=Sábado
    dia_semana INTEGER NOT NULL,
    
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    
    -- UBICACIÓN FÍSICA ESPECÍFICA PARA ESTE HORARIO
    id_ubicacion INTEGER NOT NULL,
    
    -- Estado para Soft Delete (Activo, Inactivo, Eliminado)
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
    
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ,

    -- RELACIONES (Integridad Referencial con Soft Delete Restrict)
    
    CONSTRAINT fk_horarios_doctor
        FOREIGN KEY (id_usuario)
        REFERENCES doctores(id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT fk_horarios_ubicacion
        FOREIGN KEY (id_ubicacion)
        REFERENCES ubicaciones(id_ubicacion)
        ON DELETE RESTRICT,

    -- VALIDACIONES DE LÓGICA DE NEGOCIO
    
    -- Validez del día (0 a 6)
    CONSTRAINT chk_horarios_dia CHECK (dia_semana BETWEEN 0 AND 6),
    
    -- Coherencia temporal: La hora de fin debe ser mayor a la de inicio
    CONSTRAINT chk_horarios_tiempo CHECK (hora_fin > hora_inicio),
    
    CONSTRAINT chk_horarios_estado CHECK (estado IN ('Activo', 'Inactivo', 'Eliminado')),
    
    -- PREVENCIÓN DE SOLAPAMIENTO
    -- Un doctor no puede tener dos horarios chocando el mismo día.
    CONSTRAINT uq_horario_conflicto UNIQUE (id_usuario, dia_semana, hora_inicio)
);

-- TRIGGER DE ACTUALIZACIÓN
CREATE TRIGGER trg_horarios_updated_at
BEFORE UPDATE ON horarios
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- ÍNDICES DE ALTO RENDIMIENTO (Vitales para el Agendamiento)

-- "Buscar doctores disponibles HOY (ej. Lunes=1) en la tarde"
CREATE INDEX idx_horarios_disponibilidad ON horarios(dia_semana, hora_inicio);

-- "Ver la agenda completa de un doctor"
CREATE INDEX idx_horarios_doctor ON horarios(id_usuario);

-- Documentación
COMMENT ON COLUMN horarios.dia_semana IS 'Día de la semana: 0=Domingo, 1=Lunes, ..., 6=Sábado';
COMMENT ON COLUMN horarios.id_ubicacion IS 'Ubicación específica donde el doctor atiende en este bloque horario';





CREATE TABLE notificaciones (
    id_notificacion INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    -- DESTINATARIO (¿A quién le avisamos?)
    -- Puede ser un Paciente, Doctor o Administrador (todos están en la tabla usuarios)
    id_usuario INTEGER NOT NULL,
    
    -- CONTENIDO VISUAL
    titulo VARCHAR(100) NOT NULL, -- Ej: "Cita Cancelada"
    mensaje TEXT NOT NULL,        -- Ej: "El Dr. Pérez ha cancelado la cita por emergencia..."
    
    -- Tipo de aviso (Para mostrar íconos o colores en la App: Info, Alerta, Éxito)
    tipo_alerta VARCHAR(20) DEFAULT 'Informacion', 
    
    -- ENLACE INTELIGENTE (Polimorfismo)
    -- Esto permite que al tocar la notificación, la App sepa a dónde navegar.
    -- Ej: tipo_entidad = 'CITA', id_entidad = 504 (Redirige a la pantalla de la cita 504)
    tipo_entidad VARCHAR(50), 
    id_entidad INTEGER,
    
    -- ESTADO DE LECTURA
    -- Si es NULL, no se ha leído. Si tiene fecha, ya se leyó.
    leida_en TIMESTAMPTZ, 
    
    -- Estado del registro
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- RELACIONES
    CONSTRAINT fk_notificaciones_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE RESTRICT,

    -- VALIDACIONES
    CONSTRAINT chk_notificaciones_tipo CHECK (tipo_alerta IN ('Informacion', 'Exito', 'Advertencia', 'Error')),
    CONSTRAINT chk_notificaciones_estado CHECK (estado IN ('Activo', 'Eliminado'))
);

-- ÍNDICES DE ALTO RENDIMIENTO

-- Bandeja de Entrada: "Dame todas las notificaciones de Juan, ordenadas por fecha"
CREATE INDEX idx_notificaciones_usuario ON notificaciones(id_usuario, creado_en DESC);

-- Contador de No Leídos: "Muéstrame el numerito rojo en la campana (badge)"
CREATE INDEX idx_notificaciones_no_leidas ON notificaciones(id_usuario) 
WHERE leida_en IS NULL AND estado = 'Activo';






CREATE TABLE tipos_servicios (
    id_tipo_servicio INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    nombre VARCHAR(80) NOT NULL,
    descripcion TEXT, -- Agregado opcional para detallar qué abarca
    
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Restricciones
    CONSTRAINT uq_tipos_servicios_nombre UNIQUE (nombre),
    CONSTRAINT chk_tipos_servicios_estado CHECK (estado IN ('Activo', 'Inactivo', 'Eliminado'))
);

-- ÍNDICES
CREATE INDEX idx_tipos_servicios_nombre ON tipos_servicios(nombre);

-- Seed Data (Ejemplos)
-- INSERT INTO tipos_servicios (nombre) VALUES ('Consulta Médica'), ('Procedimiento Ambulatorio'), ('Telemedicina'), ('Visita Domiciliaria');






CREATE TABLE servicios (
    id_servicio INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    -- PROPIETARIO DEL SERVICIO
    id_doctor INTEGER NOT NULL,
    
    -- CLASIFICACIÓN
    id_tipo_servicio INTEGER NOT NULL,
    
    -- Vinculamos con una especialidad (Vital: Un cardiólogo puede ofrecer servicios de Medicina General también)
    id_especialidad INTEGER NOT NULL, 
    
    -- DETALLES COMERCIALES
    nombre VARCHAR(120) NOT NULL, -- Ej: "Consulta Cardiovascular Inicial"
    descripcion TEXT,
    
    precio DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    duracion_minutos INTEGER NOT NULL DEFAULT 30, -- Vital para calcular huecos en la agenda
    
    -- LIMITACIONES
    max_pacientes_dia INTEGER, -- Límite de cupos diarios para este servicio específico
    
    -- REPUTACIÓN DEL SERVICIO
    -- Promedio de calificación específico para este servicio (se actualiza vía triggers con las reseñas)
    calificacion_promedio DECIMAL(3, 2) DEFAULT 0.00,
    
    -- ESTADOS
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ,

    -- RELACIONES
    
    CONSTRAINT fk_servicios_doctor
        FOREIGN KEY (id_doctor)
        REFERENCES doctores(id_usuario)
        ON DELETE RESTRICT,

    CONSTRAINT fk_servicios_tipo
        FOREIGN KEY (id_tipo_servicio)
        REFERENCES tipos_servicios(id_tipo_servicio)
        ON DELETE RESTRICT,

    CONSTRAINT fk_servicios_especialidad
        FOREIGN KEY (id_especialidad)
        REFERENCES especialidades(id_especialidad)
        ON DELETE RESTRICT,

    -- VALIDACIONES DE NEGOCIO
    
    CONSTRAINT chk_servicios_precio CHECK (precio >= 0),
    CONSTRAINT chk_servicios_duracion CHECK (duracion_minutos > 0),
    CONSTRAINT chk_servicios_estado CHECK (estado IN ('Activo', 'Inactivo', 'Eliminado'))
);

-- TRIGGER DE AUDITORÍA
CREATE TRIGGER trg_servicios_updated_at
BEFORE UPDATE ON servicios
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- ÍNDICES PARA EL AGENDAMIENTO Y BÚSQUEDA

-- 1. "Ver menú de servicios del Doctor X"
CREATE INDEX idx_servicios_doctor ON servicios(id_doctor);

-- 2. "Buscar servicios por precio" (Ej. Filtro "Menos de $2000")
CREATE INDEX idx_servicios_precio ON servicios(precio);

-- 3. "Buscar por especialidad"
CREATE INDEX idx_servicios_especialidad ON servicios(id_especialidad);




CREATE TABLE servicios_horarios (
    -- Vinculamos el Servicio (Ej. "Consulta General")
    id_servicio INTEGER NOT NULL,
    
    -- Vinculamos el Horario (Ej. "Lunes 8:00-12:00 en Clínica X")
    id_horario INTEGER NOT NULL,
  
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- LLAVE PRIMARIA COMPUESTA
    PRIMARY KEY (id_servicio, id_horario),

    -- RELACIONES
    CONSTRAINT fk_servicios_horarios_servicio
        FOREIGN KEY (id_servicio)
        REFERENCES servicios(id_servicio)
        ON DELETE RESTRICT, 

    CONSTRAINT fk_servicios_horarios_horario
        FOREIGN KEY (id_horario)
        REFERENCES horarios(id_horario)
        ON DELETE RESTRICT, 

    -- VALIDACIONES
    CONSTRAINT chk_servicios_horarios_estado CHECK (estado IN ('Activo', 'Inactivo', 'Eliminado'))
);

-- ÍNDICE DE BÚSQUEDA RÁPIDA
-- "Cliente busca: ¿En qué horarios puedo hacerme una 'Limpieza Dental' (id_servicio=50)?"
CREATE INDEX idx_servicios_horarios_busqueda ON servicios_horarios(id_servicio);






CREATE TABLE citas (
    id_cita INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    -- VINCULACIÓN DEL SERVICIO (Lo que define precio y doctor)
    id_servicio INTEGER NOT NULL,
    
    -- PACIENTE (Quién reserva)
    id_usuario INTEGER NOT NULL,
    
    -- TIEMPO
    fecha_hora_inicio TIMESTAMPTZ NOT NULL,
    fecha_hora_fin TIMESTAMPTZ NOT NULL, -- Calculado (inicio + duración del servicio)
    
    -- UBICACIÓN (RECOMENDADO)
    -- Vital para saber a qué clínica ir. Se llena automáticamente cruzando la fecha con la tabla 'horarios'.
    id_ubicacion INTEGER, 
    
    -- DETALLES FINANCIEROS
    -- Guardamos el precio AQUÍ. Si mañana el doctor sube el precio del servicio,
    -- las citas viejas deben mantener el precio original al que se reservaron.
    total_a_pagar DECIMAL(10, 2) NOT NULL,
    
    -- DATOS DEL PACIENTE/MOTIVO
    motivo_consulta_paciente VARCHAR(200), -- Ej: "Dolor de cabeza"
    comentario VARCHAR(200),               -- Ej: "Primera visita"
  
    
    -- ESTADOS
    estado VARCHAR(20) NOT NULL DEFAULT 'Programada',
    
    -- AUDITORÍA
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ,

    -- RELACIONES
    
    CONSTRAINT fk_citas_servicio
        FOREIGN KEY (id_servicio)
        REFERENCES servicios(id_servicio)
        ON DELETE RESTRICT,

    CONSTRAINT fk_citas_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES pacientes(id_usuario)
        ON DELETE RESTRICT,
        
    CONSTRAINT fk_citas_ubicacion
        FOREIGN KEY (id_ubicacion)
        REFERENCES ubicaciones(id_ubicacion)
        ON DELETE RESTRICT,

    -- VALIDACIONES
    
    -- Coherencia temporal
    CONSTRAINT chk_citas_fechas CHECK (fecha_hora_fin > fecha_hora_inicio),
    
    -- Estados permitidos
    CONSTRAINT chk_citas_estado CHECK (estado IN ('Programada', 'Confirmada', 'En Progreso', 'Completada', 'Cancelada', 'No Asistio', 'Eliminada'))
);

-- TRIGGER DE ACTUALIZACIÓN
CREATE TRIGGER trg_citas_updated_at
BEFORE UPDATE ON citas
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- ÍNDICES PARA EL CALENDARIO (Agendamiento rápido)

-- "Ver mi agenda como Doctor"
CREATE INDEX idx_citas_servicio_fecha ON citas(id_servicio, fecha_hora_inicio);

-- "Mis citas como Paciente"
CREATE INDEX idx_citas_usuario ON citas(id_usuario, fecha_hora_inicio DESC);





CREATE TABLE resenas (
    id_resena INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    -- Una reseña pertenece a una cita específica.
    id_cita INTEGER NOT NULL,
    
    -- ACTORES (Desnormalización controlada para rendimiento)
    id_paciente INTEGER NOT NULL, -- El usuario que opina
    id_doctor INTEGER NOT NULL,   -- El doctor calificado (Copiado de la cita)
    
    -- CALIFICACIÓN
    calificacion INTEGER NOT NULL, -- Estrellas (1 a 5)
    comentario TEXT,               -- Opinión escrita (Opcional o requerida según decidas)
    
    -- ESTADO
    -- 'Publicada': Visible para todos.
    -- 'Oculta': El admin la bajó por lenguaje inapropiado.
    -- 'Eliminada': El usuario la borró.
    estado VARCHAR(20) NOT NULL DEFAULT 'Publicada',
    
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ,

    -- RELACIONES
    
    CONSTRAINT fk_resenas_cita 
        FOREIGN KEY (id_cita) 
        REFERENCES citas(id_cita) 
        ON DELETE RESTRICT,
        
    CONSTRAINT fk_resenas_paciente
        FOREIGN KEY (id_paciente) 
        REFERENCES pacientes(id_usuario) 
        ON DELETE RESTRICT,
        
    CONSTRAINT fk_resenas_doctor
        FOREIGN KEY (id_doctor) 
        REFERENCES doctores(id_usuario) 
        ON DELETE RESTRICT,

    -- VALIDACIONES DE NEGOCIO
    
    -- Rango de estrellas: Solo permitimos valores del 1 al 5.
    CONSTRAINT chk_resenas_calificacion CHECK (calificacion BETWEEN 1 AND 5),
    
    -- Unicidad: Un paciente no puede dejar 2 reseñas para la MISMA cita.
    CONSTRAINT uq_resenas_cita UNIQUE (id_cita),
    
    CONSTRAINT chk_resenas_estado CHECK (estado IN ('Publicada', 'Oculta', 'Eliminada'))
);

-- TRIGGER DE ACTUALIZACIÓN
CREATE TRIGGER trg_resenas_updated_at
BEFORE UPDATE ON resenas
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- ÍNDICES DE ALTO RENDIMIENTO (Vitales para el perfil del doctor)

-- Calcular promedio del doctor: "SELECT AVG(calificacion) FROM resenas WHERE id_doctor = X"
CREATE INDEX idx_resenas_doctor_ranking ON resenas(id_doctor, calificacion);

-- Mostrar reseñas en el perfil (Las más recientes primero)
CREATE INDEX idx_resenas_doctor_fecha ON resenas(id_doctor, creado_en DESC);




CREATE TABLE log_teleconsultas (
    id_log INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    -- VINCULACIÓN CON LA CITA
    id_cita INTEGER NOT NULL,

  -- VINCULACIÓN CON LA Conversación
    id_conversacion INTEGER NOT NULL,
    
    -- DATOS DE TIEMPO (Metadatos de la llamada)
    fecha_hora_inicio TIMESTAMPTZ NOT NULL,
    fecha_hora_fin TIMESTAMPTZ, -- Puede ser NULL si la llamada se cortó abruptamente
    
    duracion_minutos INTEGER, -- Calculado al finalizar
    
    -- DATOS TÉCNICOS
    id_sala_reunion VARCHAR(100), -- ID externo de Twilio/Zoom/Jitsi
    estado VARCHAR(20) NOT NULL DEFAULT 'Iniciada',
    
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- RELACIONES
    CONSTRAINT fk_log_cita
        FOREIGN KEY (id_cita)
        REFERENCES citas(id_cita)
        ON DELETE RESTRICT,

    CONSTRAINT fk_log_conversacion
        FOREIGN KEY (id_conversacion)
        REFERENCES conversaciones(id_conversacion)
        ON DELETE RESTRICT,

    -- VALIDACIONES
    CONSTRAINT chk_log_fechas CHECK (fecha_hora_fin IS NULL OR fecha_hora_fin >= fecha_hora_inicio),
    CONSTRAINT chk_log_estado CHECK (estado IN ('Iniciada', 'Finalizada', 'Fallida', 'Reconectada', 'Eliminada'))
);

-- ÍNDICE
-- Para mostrar "Historial de videollamadas de esta cita"
CREATE INDEX idx_log_cita ON log_teleconsultas(id_cita);

-- Para mostrar "Conversaciones de esta cita"
CREATE INDEX idx_log_teleconsultas_mensajes ON log_teleconsultas(id_conversacion);






CREATE TABLE cuentas_sociales (
    id_cuenta_social INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    -- VINCULACIÓN CON USUARIO
    id_usuario INTEGER NOT NULL,
    
    -- PROVEEDOR (ej. 'google', 'facebook', 'apple')
    proveedor VARCHAR(50) NOT NULL,
    
    -- EL ID ÚNICO QUE DA EL PROVEEDOR (Subject ID)
    uid_proveedor VARCHAR(255) NOT NULL,
    
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- RELACIONES
    CONSTRAINT fk_social_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE RESTRICT, -- Si borras el usuario, se borran sus accesos sociales

    -- RESTRICCIONES
    -- Evitar duplicados de identidad externa
    CONSTRAINT uq_social_proveedor_uid UNIQUE (proveedor, uid_proveedor),

    
    CONSTRAINT chk_socialproveedor CHECK (proveedor IN ('Google', 'Meta', 'Github', 'Apple', 'Microsoft')),
  
    -- Un usuario no debería tener dos cuentas de Google vinculadas a la vez
    CONSTRAINT uq_social_usuario_proveedor UNIQUE (id_usuario, proveedor)
);

-- ÍNDICE VITAL PARA EL LOGIN
-- Cuando Google te responda "Usuario ID 12345", buscarás aquí instantáneamente.
CREATE INDEX idx_social_login ON cuentas_sociales(proveedor, uid_proveedor);





CREATE TABLE historial_consultas (
    id_historial INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    
    -- VINCULACIÓN AL EVENTO
    -- Una cita solo genera UNA entrada en el historial.
    id_cita INTEGER NOT NULL UNIQUE, 
    
    -- SUJETO DE ATENCIÓN
    -- Guardamos el ID del paciente directamente para búsquedas rápidas en el expediente.
    id_paciente INTEGER NOT NULL,
    
    -- DATOS CLÍNICOS
    resumen_consulta TEXT NOT NULL,      -- "Paciente llega con dolor..." (Anamnesis)
    
    diagnostico TEXT NOT NULL,           -- "Cefalea Tensional / CIE-10: G44.2"
    
    tratamiento_sugerido TEXT,           -- Indicaciones generales ("Reposo, hidratación...")
                                         -- Nota: Los medicamentos específicos irán en la tabla 'recetas'
    
    observacion TEXT,                    -- Notas internas o contexto adicional
    
    -- METADATOS Y AUDITORÍA
    -- Es vital saber cuándo se escribió esto, por temas legales.
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ,          -- Si el doctor corrige algo post-consulta

    -- RELACIONES
    CONSTRAINT fk_historial_cita
        FOREIGN KEY (id_cita)
        REFERENCES citas(id_cita)
        ON DELETE RESTRICT,

    CONSTRAINT fk_historial_paciente
        FOREIGN KEY (id_paciente)
        REFERENCES pacientes(id_usuario)
        ON DELETE RESTRICT
);

-- TRIGGER DE AUDITORÍA
CREATE TRIGGER trg_historial_updated_at
BEFORE UPDATE ON historial_consultas
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- ÍNDICES DE ALTO RENDIMIENTO

-- "Ver expediente completo del paciente Juan" (El más importante)
CREATE INDEX idx_historial_paciente_fecha ON historial_consultas(id_paciente, creado_en DESC);

-- Búsqueda de diagnósticos (Para estadísticas: "¿Cuántos casos de Dengue tuvimos?")
-- Nota: Para esto ser muy efectivo, se suele usar Full Text Search, pero un índice estándar ayuda.
CREATE INDEX idx_historial_diagnostico ON historial_consultas(diagnostico);





CREATE TABLE archivos_adjuntos_historial_clinico (
    -- CLAVES FORÁNEAS QUE FORMAN LA LLAVE PRIMARIA COMPUESTA
    id_media INTEGER NOT NULL,
    id_historial INTEGER NOT NULL,
    
    agregado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- DEFINICIÓN DE LA LLAVE PRIMARIA COMPUESTA (PK)
    PRIMARY KEY (id_media, id_historial),

    -- RELACIONES (Integridad Referencial)
    CONSTRAINT fk_adjuntos_medio
        FOREIGN KEY (id_media)
        REFERENCES media(id_media)
        ON DELETE RESTRICT, 

    CONSTRAINT fk_adjuntos_historial
        FOREIGN KEY (id_historial)
        REFERENCES historial_consultas(id_historial)
        ON DELETE RESTRICT 
);

-- ÍNDICE
-- "Dame todos los archivos del historial #12001"
CREATE INDEX idx_adjuntos_historial ON archivos_adjuntos_historial_clinico(id_historial);