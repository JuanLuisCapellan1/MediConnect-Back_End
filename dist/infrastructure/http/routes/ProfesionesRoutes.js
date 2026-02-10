"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tsyringe_1 = require("tsyringe");
const ProfesionController_1 = require("../controllers/ProfesionController");
const router = (0, express_1.Router)();
const profesionController = tsyringe_1.container.resolve(ProfesionController_1.ProfesionController);
/**
 * @swagger
 * /api/profesiones:
 *   post:
 *     summary: Crear una nueva profesión
 *     tags: [Profesiones]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *             properties:
 *               nombre:
 *                 type: string
 *               estado:
 *                 type: string
 *     responses:
 *       201:
 *         description: Profesión creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: La profesión ya existe
 */
router.post('/', profesionController.crear);
/**
 * @swagger
 * /api/profesiones:
 *   get:
 *     summary: Obtener todas las profesiones
 *     tags: [Profesiones]
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *       - in: query
 *         name: busqueda
 *         schema:
 *           type: string
 *       - in: query
 *         name: pagina
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de profesiones
 */
router.get('/', profesionController.obtenerTodos);
/**
 * @swagger
 * /api/profesiones/{id}:
 *   get:
 *     summary: Obtener una profesión por ID
 *     tags: [Profesiones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Profesión encontrada
 *       404:
 *         description: Profesión no encontrada
 */
router.get('/:id', profesionController.obtenerPorId);
/**
 * @swagger
 * /api/profesiones/{id}:
 *   put:
 *     summary: Actualizar una profesión
 *     tags: [Profesiones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               estado:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profesión actualizada
 *       404:
 *         description: Profesión no encontrada
 */
router.put('/:id', profesionController.actualizar);
/**
 * @swagger
 * /api/profesiones/{id}:
 *   delete:
 *     summary: Eliminar una profesión (soft delete)
 *     tags: [Profesiones]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Profesión eliminada
 *       404:
 *         description: Profesión no encontrada
 */
router.delete('/:id', profesionController.eliminar);
exports.default = router;
