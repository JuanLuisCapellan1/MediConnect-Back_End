# 🏥 MediConnect Back-end

API RESTful para la gestión integral de servicios médicos (MediConnect). Este sistema está desarrollado con **Node.js** y **TypeScript**, siguiendo estrictamente los principios de **Clean Architecture** para garantizar escalabilidad y mantenibilidad.

El proyecto implementa una infraestructura moderna con servicios contenerizados (**Docker**) para traducción automática privada (sin APIs de terceros) y caché de alto rendimiento.

---

## 🚀 Tecnologías y Stack

* **Lenguaje:** TypeScript / Node.js (v20+)
* **Framework Web:** Express.js
* **Base de Datos:** PostgreSQL (NeonDB / Cloud)
* **ORM:** Prisma
* **Arquitectura:** Clean Architecture (Domain-Driven Design concepts)
* **Inyección de Dependencias:** Tsyringe
* **Servicios Externos (Dockerizados):**
    * **LibreTranslate:** Motor de traducción Open Source (Self-hosted para privacidad de datos).
    * **Redis:** Base de datos en memoria para caché de traducciones y sesiones.

---

## 📋 Prerrequisitos

Para ejecutar este proyecto localmente necesitas tener instalado:

1.  **Node.js** (v18 o superior)
2.  **Docker Desktop** (Debe estar en ejecución para levantar Redis y el Traductor)
3.  **Git**

---

## 🛠️ Guía de Instalación y Configuración

Sigue estos pasos para levantar el entorno de desarrollo:

### 1. Clonar el repositorio
```bash
git clone https://github.com/JuanLuisCapellan1/MediConnect-Back_End
cd MediConnect-Back_End
```
---

### 2. Instalar dependencias
```bash
npm install
```
---

### 3. Configurar Variables de Entorno

Crea un archivo .env en la raíz del proyecto. Puedes usar el siguiente contenido como plantilla:

#### Configuración del Servidor
```bash
PORT=3000
NODE_ENV=development
```

#### Base de Datos (Prisma)
##### Reemplaza con tus credenciales locales o la URL de tu proveedor cloud (ej. Neon)
```bash
DATABASE_URL="postgresql://postgres:contraseña@localhost:5432/nombredb"
```

#### Seguridad
```bash
JWT_SECRET="cambiar_esto_por_un_secreto_seguro"
```

#### Servicios Docker (Infraestructura Local)
##### URL interna para conectar con el contenedor de traducción
```bash
TRANSLATION_API_URL="http://localhost:5001"
```

##### URL de conexión para Redis Cache
```bash
REDIS_URL="redis://localhost:6379"
```

---

### 4. Levantar Servicios Auxiliares (Docker)

Este comando descargará y ejecutará los contenedores de LibreTranslate (IA) y Redis (Caché).

```bash
docker-compose up -d
```

#### ⚠️ Nota Importante:

La primera vez que ejecutes este comando, LibreTranslate tardará unos minutos en descargar los modelos de idioma (Español e Inglés). Puedes verificar cuando esté listo ejecutando 

```bash
docker logs -f mediconnect-translator
```

---

### 5. Sincronizar Base de Datos

Genera el cliente de Prisma y aplica la estructura a tu base de datos:

```bash
npx prisma generate
```

---

## ▶️ Ejecución del Proyecto

### Modo Desarrollo (con Hot-Reload)

```bash
npm run dev
```
El servidor estará disponible en: http://localhost:3000

### Modo Producción (Build)
```bash
npm run build
npm start
```

---

## 🏗️ Arquitectura del Proyecto

El código está organizado en capas concéntricas para desacoplar la lógica de negocio de los detalles de implementación.
```bash
src/
├── application/         # 🧠 Lógica de Aplicación
│   ├── dtos/            # Data Transfer Objects (Validación de entrada)
│   ├── interfaces/      # Contratos (Interfaces para servicios externos)
│   ├── services/        # Servicios de orquestación (ej. TranslationHelper)
│   └── use-cases/       # Casos de uso puros (Lógica de negocio)
│
├── domain/              # 💎 Núcleo (Core)
│   ├── entities/        # Entidades del dominio
│   └── repositories/    # Interfaces de repositorios
│
├── infrastructure/      # ⚙️ Detalles Técnicos (Frameworks & Drivers)
│   ├── database/        # Configuración de Prisma y conexión DB
│   ├── external-services/ # Implementación de interfaces (LibreTranslate, Redis)
│   ├── http/            # Controllers, Routes, Middlewares
│   └── repositories/    # Implementación concreta de repositorios (Prisma)
│
└── shared/              # 📦 Utilidades y Configuración Global
    └── container/       # Configuración de Inyección de Dependencias (Tsyringe)
```

---

## 📄 Licencia

Este proyecto es de uso privado para MediConnect.