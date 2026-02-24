-- ============================================================
-- SCRIPT DE MIGRACIÓN: Eliminar sub_barrios de la base de datos
-- Fecha: 2026-02-24
-- 
-- Este script:
--  1. Elimina la FK id_sub_barrio de la tabla ubicaciones
--  2. Elimina la columna id_sub_barrio de ubicaciones
--  3. Elimina la tabla sub_barrios
--
-- IMPORTANTE: Ejecutar en una transacción y con backup previo.
-- ============================================================

BEGIN;

-- ────────────────────────────────────────────────────────────
-- PASO 1: Eliminar la foreign key de ubicaciones → sub_barrios
-- (el nombre de la constraint puede variar; se muestra el patrón estándar)
-- ────────────────────────────────────────────────────────────

ALTER TABLE ubicaciones
  DROP CONSTRAINT IF EXISTS ubicaciones_id_sub_barrio_fkey;

-- Si la constraint tiene un nombre distinto, ejecuta primero esto para encontrarla:
-- SELECT conname FROM pg_constraint WHERE conrelid = 'ubicaciones'::regclass AND contype = 'f';

-- ────────────────────────────────────────────────────────────
-- PASO 2: Eliminar la columna id_sub_barrio de ubicaciones
-- ────────────────────────────────────────────────────────────

ALTER TABLE ubicaciones
  DROP COLUMN IF EXISTS id_sub_barrio;

-- ────────────────────────────────────────────────────────────
-- PASO 3: Eliminar la tabla sub_barrios
-- (CASCADE elimina también cualquier FK residual)
-- ────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS sub_barrios CASCADE;

-- ────────────────────────────────────────────────────────────
-- VERIFICACIÓN (opcional — ejecutar antes del COMMIT)
-- ────────────────────────────────────────────────────────────

-- Confirmar que sub_barrios ya no existe:
-- SELECT to_regclass('public.sub_barrios');  -- debe retornar NULL

-- Confirmar que id_sub_barrio ya no está en ubicaciones:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'ubicaciones' AND column_name = 'id_sub_barrio';
-- (debe retornar 0 filas)

COMMIT;
