// src/data/mockInventoryData.js

const mockInventoryItems = [
  {
    id: "item1_loc1", // Un ID único para el mock item, puede ser combinación de SKU y sede
    codigo: "RES001", // Product.sku
    nombre: "Resina Compuesta Universal A2", // Product.name
    marca: "3M Filtek", // PurchaseOption.brand
    categoria: "Resinas", // Category.name
    cantidad_disponible: 20, // InventoryStock.quantity
    proveedor: "DentalPro S.A.", // Supplier.name
    precio_compra: 55.0, // PurchaseOption.purchase_price
    precio_venta: 75.0, // Asumido, no directo en schema para esta vista
    sede: "Consultorio Centro", // Location.name
  },
  {
    id: "item2_loc1",
    codigo: "ANE001",
    nombre: "Lidocaína 2% con Epinefrina",
    marca: "Xylestesin",
    categoria: "Anestésicos",
    cantidad_disponible: 50,
    proveedor: "OdontoSupply Ltda.",
    precio_compra: 30.5,
    precio_venta: 45.0,
    sede: "Consultorio Centro",
  },
  {
    id: "item1_loc2", // Mismo producto RES001 pero en otra sede
    codigo: "RES001",
    nombre: "Resina Compuesta Universal A2",
    marca: "3M Filtek",
    categoria: "Resinas",
    cantidad_disponible: 15,
    proveedor: "DentalPro S.A.",
    precio_compra: 55.0,
    precio_venta: 75.0,
    sede: "Clínica Norte",
  },
  {
    id: "item3_loc1",
    codigo: "INS001",
    nombre: "Kit Explorador Dental Básico (Sonda, Espejo, Pinza)",
    marca: "Hu-Friedy",
    categoria: "Instrumental",
    cantidad_disponible: 5,
    proveedor: "DentalPro S.A.",
    precio_compra: 120.0,
    precio_venta: 180.0,
    sede: "Consultorio Centro",
  },
  {
    id: "item4_loc2",
    codigo: "FRE001",
    nombre: "Fresa Diamantada Cilíndrica #201",
    marca: "Komet",
    categoria: "Fresas y Pulidores",
    cantidad_disponible: 100,
    proveedor: "OdontoSupply Ltda.",
    precio_compra: 2.5,
    precio_venta: 4.0,
    sede: "Clínica Norte",
  },
  {
    id: "item5_loc1",
    codigo: "GUA001",
    nombre: "Guantes de Nitrilo Talla M (Caja x100)",
    marca: "MedSafe",
    categoria: "Material Descartable",
    cantidad_disponible: 30,
    proveedor: "DentalPro S.A.",
    precio_compra: 8.0,
    precio_venta: 12.5,
    sede: "Consultorio Centro",
  },
];

export default mockInventoryItems;
