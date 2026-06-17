// Configuración de datos de la empresa para facturas
export const companyConfig = {
    name: "UNIDENTAL",
    address: "Dirección de la empresa",
    phone: "Teléfono de contacto",
    email: "email@empresa.com",
    nit: "NIT: XXXXXXXXX-X",
    website: "www.unidental.com",

    // Información adicional para facturas
    slogan: "Tu sonrisa es nuestra prioridad",
    businessType: "Suministros Dentales",

    // Configuración de facturación
    invoicePrefix: "FAC",
    receiptPrefix: "REC",
    orderPrefix: "OC",

    // Configuración de impresión
    logoUrl: null, // Se puede agregar una URL de logo después

    // Términos y condiciones básicos
    terms: [
        "Garantía de 30 días en productos defectuosos de fábrica",
        "No se aceptan devoluciones de productos personalizados",
        "Productos sujetos a disponibilidad",
    ],
};

export default companyConfig;
