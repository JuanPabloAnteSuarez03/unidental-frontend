-- Script completo de debug y creación de lotes

-- PASO 1: Ver todos los productos disponibles
SELECT 'TODOS LOS PRODUCTOS:' as info;
SELECT id, name, sku, requires_batch_control, product_type 
FROM catalogs_product 
ORDER BY name;

-- PASO 2: Ver estructura de la tabla de lotes
SELECT 'ESTRUCTURA TABLA LOTES:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'catalogs_productbatch' 
ORDER BY ordinal_position;

-- PASO 3: Ver productos con control de lotes
SELECT 'PRODUCTOS CON CONTROL DE LOTES:' as info;
SELECT id, name, sku, requires_batch_control 
FROM catalogs_product 
WHERE requires_batch_control = true;

-- PASO 4: Ver lotes existentes
SELECT 'LOTES EXISTENTES:' as info;
SELECT pb.*, p.name as product_name, p.sku as product_sku
FROM catalogs_productbatch pb
JOIN catalogs_product p ON pb.product_id = p.id;

-- PASO 5: Activar control de lotes para el producto Ibuprofeno
UPDATE catalogs_product 
SET requires_batch_control = true 
WHERE name LIKE '%Ibuprofeno%' OR name LIKE '%Blister%';

-- PASO 6: Crear lotes (usando el ID específico que encontraste)
-- IMPORTANTE: Reemplaza XXXX con el ID real del producto

-- Obtener el ID del producto
SELECT @product_id := id FROM catalogs_product WHERE name LIKE '%Ibuprofeno%' LIMIT 1;

-- Crear lotes con diferentes estados de vencimiento
INSERT INTO catalogs_productbatch (
    product_id, 
    batch_number, 
    expiry_date, 
    manufacturing_date,
    supplier_reference,
    notes,
    created_at, 
    updated_at
) VALUES 
-- Lote próximo a vencer (rojo)
((SELECT id FROM catalogs_product WHERE name LIKE '%Ibuprofeno%' LIMIT 1), 'IBU-001-RED', '2024-10-25', '2023-10-25', 'PROV-001', 'Lote próximo a vencer', NOW(), NOW()),
-- Lote vencimiento intermedio (naranja)
((SELECT id FROM catalogs_product WHERE name LIKE '%Ibuprofeno%' LIMIT 1), 'IBU-002-ORANGE', '2024-12-20', '2023-12-20', 'PROV-002', 'Lote vencimiento intermedio', NOW(), NOW()),
-- Lote con buena fecha (verde)
((SELECT id FROM catalogs_product WHERE name LIKE '%Ibuprofeno%' LIMIT 1), 'IBU-003-GREEN', '2025-09-15', '2024-09-15', 'PROV-003', 'Lote en buen estado', NOW(), NOW());

-- PASO 7: Verificar resultados
SELECT 'VERIFICACIÓN FINAL:' as info;
SELECT 
    p.name as producto,
    p.sku,
    p.requires_batch_control,
    pb.id as lote_id,
    pb.batch_number,
    pb.expiry_date,
    pb.is_expired,
    pb.days_to_expiry,
    pb.notes
FROM catalogs_product p
LEFT JOIN catalogs_productbatch pb ON p.id = pb.product_id
WHERE p.name LIKE '%Ibuprofeno%'
ORDER BY pb.expiry_date;

-- PASO 8: Si hay problemas, limpiar y empezar de nuevo
/*
DELETE FROM catalogs_productbatch 
WHERE product_id IN (SELECT id FROM catalogs_product WHERE name LIKE '%Ibuprofeno%');
*/ 