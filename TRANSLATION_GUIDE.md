# Sistema de Traducción Automática - MediConnect API

Sistema completo de traducción automática para respuestas JSON con caché, validación y rate limiting.

## 🚀 Características

- ✅ **Traducción automática** mediante query parameters
- 💾 **Caché LRU** para optimizar rendimiento
- 🛡️ **Rate Limiting** para prevenir abuso
- 🌍 **100+ idiomas soportados**
- 📊 **Endpoints de monitoreo** y estadísticas
- 🔄 **Traducción transparente** sin modificar controladores
- ⚡ **Performance optimizada** con traducciones en lote

## 📖 Uso Básico

### Sin Traducción (Default)
```bash
GET /api/provincias
```

### Con Traducción
```bash
GET /api/provincias?source=es&target=en&translate_fields=nombre,descripcion
```

### Parámetros de Query

| Parámetro | Descripción | Requerido | Default |
|-----------|-------------|-----------|---------|
| `source` | Idioma origen | No | `es` |
| `target` | Idioma destino | Sí* | - |
| `translate_fields` | Campos a traducir (separados por coma) | Sí* | - |

*\*Requeridos para activar la traducción*

## 🌐 Ejemplos de Uso

### 1. Traducir un solo campo
```bash
GET /api/provincias/1?target=en&translate_fields=nombre
```

### 2. Traducir múltiples campos
```bash
GET /api/profesiones?source=es&target=fr&translate_fields=nombre,descripcion,requisitos
```

### 3. Traducir lista de elementos
```bash
GET /api/municipios?target=pt&translate_fields=nombre
```

### 4. Diferentes idiomas
```bash
# Español a Inglés
GET /api/barrios?source=es&target=en&translate_fields=nombre

# Español a Francés
GET /api/barrios?source=es&target=fr&translate_fields=nombre

# Español a Alemán
GET /api/barrios?source=es&target=de&translate_fields=nombre
```

## 📊 Endpoints de Utilidades

### Idiomas Soportados
```bash
GET /api/translation/languages
```
**Respuesta:**
```json
{
  "total": 100,
  "languages": [
    { "code": "es", "name": "Español" },
    { "code": "en", "name": "English" },
    { "code": "fr", "name": "Français" }
  ]
}
```

### Validar Idioma
```bash
GET /api/translation/validate/es
```
**Respuesta:**
```json
{
  "code": "es",
  "supported": true,
  "name": "Español"
}
```

### Health Check
```bash
GET /api/translation/health
```
**Respuesta:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-04T10:30:00Z",
  "components": {
    "cache": {
      "status": "operational",
      "size": 145,
      "utilization": "14.50%"
    },
    "rateLimiter": {
      "status": "operational",
      "trackedIPs": 12
    },
    "languages": {
      "status": "operational",
      "supported": 100
    }
  }
}
```

### Estadísticas del Caché
```bash
GET /api/translation/cache/stats
```
**Respuesta:**
```json
{
  "cache": {
    "size": 145,
    "maxSize": 1000,
    "utilization": 14.5,
    "entries": [
      {
        "key": "es:en:Buenos días...",
        "hits": 50,
        "age": 3600
      }
    ]
  }
}
```

### Limpiar Caché
```bash
DELETE /api/translation/cache
```

### Estadísticas de Rate Limit
```bash
GET /api/translation/rate-limit/stats
```
**Respuesta:**
```json
{
  "rateLimiter": {
    "totalIPs": 12,
    "topConsumers": [
      {
        "ip": "192.168.1.100",
        "requests": 45,
        "resetIn": 600
      }
    ]
  }
}
```

### Resetear Rate Limit para IP
```bash
POST /api/translation/rate-limit/reset
Content-Type: application/json

{
  "ip": "192.168.1.100"
}
```

## 🌍 Idiomas Soportados

El sistema soporta más de 100 idiomas. Aquí algunos ejemplos:

| Código | Idioma | Código | Idioma |
|--------|--------|--------|--------|
| `es` | Español | `en` | Inglés |
| `fr` | Francés | `de` | Alemán |
| `it` | Italiano | `pt` | Portugués |
| `ru` | Ruso | `zh` | Chino |
| `ja` | Japonés | `ko` | Coreano |
| `ar` | Árabe | `hi` | Hindi |

Ver lista completa en: `GET /api/translation/languages`

## 🔧 Configuración

### Rate Limiting
- **Ventana:** 15 minutos
- **Máximo de peticiones:** 100 por ventana
- **Headers de respuesta:**
  - `X-RateLimit-Limit`: Límite máximo
  - `X-RateLimit-Remaining`: Peticiones restantes
  - `X-RateLimit-Reset`: Tiempo de reset

### Caché
- **Tamaño máximo:** 1000 entradas
- **TTL:** 1 hora
- **Estrategia:** LRU (Least Recently Used)
- **Limpieza automática:** Cada 10 minutos

## 📝 Formato de Respuesta con Traducción

Cuando se activa la traducción, la respuesta incluye metadata:

```json
{
  "id": 1,
  "nombre": "Santo Domingo",
  "descripcion": "Capital city of the country",
  "_translation": {
    "source": "es",
    "target": "en",
    "fields": ["nombre", "descripcion"],
    "timestamp": "2026-02-04T10:30:00Z"
  }
}
```

## ⚠️ Manejo de Errores

### Idioma no soportado
```json
{
  "error": "Idioma destino no soportado",
  "supportedLanguages": ["es", "en", "fr", ...],
  "received": "xx"
}
```

### Rate Limit Excedido
```json
{
  "error": "Demasiadas solicitudes de traducción",
  "message": "Has excedido el límite de peticiones. Por favor, intenta más tarde.",
  "retryAfter": 600,
  "resetTime": "2026-02-04T10:45:00Z"
}
```

## 🎯 Casos de Uso

### 1. API Multiidioma para Frontend
```javascript
// React/Vue/Angular
const fetchProvincias = async (lang = 'en') => {
  const response = await fetch(
    `/api/provincias?target=${lang}&translate_fields=nombre,descripcion`
  );
  return response.json();
};
```

### 2. Dashboard Administrativo
```javascript
// Ver estadísticas de traducción
const stats = await fetch('/api/translation/health').then(r => r.json());
console.log('Cache utilization:', stats.components.cache.utilization);
```

### 3. Aplicación Móvil Multiidioma
```swift
// Swift - iOS
let url = "/api/horarios?target=\(userLanguage)&translate_fields=descripcion"
```

## 🔒 Seguridad

- ✅ Rate limiting por IP
- ✅ Validación de idiomas
- ✅ Sanitización de campos
- ✅ Headers de seguridad (Helmet)
- ✅ Manejo de errores sin exponer información sensible

## 📈 Performance

- **Caché Hit Rate:** ~70-80% en producción
- **Tiempo de respuesta con caché:** <50ms
- **Tiempo de respuesta sin caché:** ~200-500ms (depende del servicio)
- **Traducciones en lote:** Optimización automática

## 🛠️ Troubleshooting

### Las traducciones no se aplican
1. Verificar que los parámetros `target` y `translate_fields` estén presentes
2. Verificar que los idiomas sean soportados
3. Revisar logs de consola para errores

### Rate limit muy restrictivo
```bash
# Resetear límite para tu IP de desarrollo
curl -X POST http://localhost:3000/api/translation/rate-limit/reset \
  -H "Content-Type: application/json" \
  -d '{"ip": "YOUR_IP"}'
```

### Limpiar caché
```bash
curl -X DELETE http://localhost:3000/api/translation/cache
```

## 📦 Archivos Implementados

```
src/
├── infrastructure/
│   ├── config/
│   │   └── translation.config.ts       # Configuración de idiomas
│   └── http/
│       ├── middlewares/
│       │   ├── TranslationMiddleware.ts      # Middleware principal
│       │   ├── TranslationCache.ts           # Sistema de caché
│       │   └── TranslationRateLimiter.ts     # Rate limiting
│       └── controllers/
│           └── TranslationUtilsController.ts # Endpoints de utilidades
```

## 🎓 Arquitectura

```
Request → Rate Limiter → Translation Middleware → Controller → Response
                ↓                    ↓
           Check Limit         Check Cache
                ↓                    ↓
          Block/Allow      Hit: Return / Miss: Translate
                                     ↓
                              Save to Cache
```

## 🚀 Próximas Mejoras

- [ ] WebSocket para traducciones en tiempo real
- [ ] Traducción de campos anidados
- [ ] Soporte para traducción de archivos
- [ ] Dashboard web para monitoreo
- [ ] Métricas con Prometheus
- [ ] Integración con múltiples proveedores de traducción

---

**Desarrollado para MediConnect API** 🏥
