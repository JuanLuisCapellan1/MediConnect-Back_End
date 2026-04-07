import { Router } from 'express';
import { container } from 'tsyringe';
import { CondicionMedicaController } from '../controllers/CondicionMedicaController';
import { requireRole } from '../middlewares/roleMiddleware';
import { autenticarJWT } from '../middlewares/autenticacion';

const condicionesMedicasRouter = Router();
const controller = container.resolve(CondicionMedicaController);

// ==========================================
// RUTAS PARA PACIENTES (AUTO-GESTIÓN)
// ==========================================
// IMPORTANTE: Estas rutas deben ir PRIMERO para evitar conflictos con /:id

// Listar alergias disponibles en el catálogo (Paciente y Administrador)
condicionesMedicasRouter.get(
    '/alergias/disponibles',
    autenticarJWT,
    requireRole('Paciente', 'Administrador'),
    (req, res) => controller.listarAlergiasDisponibles(req, res)
);

// Buscar alergias por nombre (Paciente y Administrador)
condicionesMedicasRouter.get(
    '/alergias/buscar',
    autenticarJWT,
    requireRole('Paciente', 'Administrador'),
    (req, res) => controller.buscarAlergias(req, res)
);

// Agregar una alergia del catálogo al perfil del paciente
condicionesMedicasRouter.post(
    '/mis-alergias',
    autenticarJWT,
    requireRole('Paciente'),
    (req, res) => controller.agregarMiAlergia(req, res)
);

// Actualizar una alergia del paciente
condicionesMedicasRouter.patch(
    '/mis-alergias/:id',
    autenticarJWT,
    requireRole('Paciente'),
    (req, res) => controller.actualizarMiAlergia(req, res)
);

// Eliminar una alergia del paciente
condicionesMedicasRouter.delete(
    '/mis-alergias/:id',
    autenticarJWT,
    requireRole('Paciente'),
    (req, res) => controller.eliminarMiAlergia(req, res)
);

// Obtener todas las condiciones médicas del paciente
condicionesMedicasRouter.get(
    '/mis-condiciones',
    autenticarJWT,
    requireRole('Paciente'),
    (req, res) => controller.obtenerMisCondiciones(req, res)
);

// Crear una condición médica personal
condicionesMedicasRouter.post(
    '/mis-condiciones',
    autenticarJWT,
    requireRole('Paciente'),
    (req, res) => controller.crearMiCondicion(req, res)
);

// Actualizar una condición médica del paciente
condicionesMedicasRouter.patch(
    '/mis-condiciones/:id',
    autenticarJWT,
    requireRole('Paciente'),
    (req, res) => controller.actualizarMiCondicion(req, res)
);

// Eliminar una condición médica del paciente
condicionesMedicasRouter.delete(
    '/mis-condiciones/:id',
    autenticarJWT,
    requireRole('Paciente'),
    (req, res) => controller.eliminarMiCondicion(req, res)
);



// ==========================================
// ADMIN - Visualización del catálogo de Alergias
// ==========================================

// Listar TODAS las alergias del catálogo (incluyendo inactivas/eliminadas)
// Usa ?estado=Activo|Inactivo|Eliminado&nombre=x&pagina=1&limite=10
condicionesMedicasRouter.get(
    '/admin/alergias',
    autenticarJWT,
    requireRole('Administrador'),
    (req, res) => {
        // Forzar tipo=Alergia y pasar el resto de filtros
        req.query.tipo = 'Alergia';
        return controller.listar(req, res);
    }
);

// ==========================================
// RUTAS DEL CATÁLOGO DE CONDICIONES MÉDICAS (SOLO ADMINISTRADOR)
// ==========================================
// IMPORTANTE: Estas rutas con /:id van AL FINAL para no capturar rutas específicas

// Listar condiciones: solo Administrador
condicionesMedicasRouter.get(
    '/',
    autenticarJWT,
    requireRole('Administrador'),
    (req, res) => controller.listar(req, res)
);

// Crear entrada en el catálogo: solo Administrador (únicamente Alergias)
condicionesMedicasRouter.post(
    '/',
    autenticarJWT,
    requireRole('Administrador'),
    (req, res) => controller.crear(req, res)
);

// Obtener por ID: solo Administrador
condicionesMedicasRouter.get(
    '/:id',
    autenticarJWT,
    requireRole('Administrador'),
    (req, res) => controller.obtener(req, res)
);

// Actualizar entrada del catálogo: solo Administrador (únicamente Alergias)
condicionesMedicasRouter.patch(
    '/:id',
    autenticarJWT,
    requireRole('Administrador'),
    (req, res) => controller.actualizar(req, res)
);

// Eliminar (soft delete) del catálogo: solo Administrador (únicamente Alergias)
condicionesMedicasRouter.delete(
    '/:id',
    autenticarJWT,
    requireRole('Administrador'),
    (req, res) => controller.eliminar(req, res)
);

export default condicionesMedicasRouter;
