// Configuración de datos de la empresa para facturas
export const companyConfig = {
    name: "UNIDENTAL",
    address: "Calle Principal #123, Ciudad",
    phone: "+57 (1) 234-5678",
    email: "contacto@unidental.com",
    nit: "NIT: 900123456-7",
    website: "www.unidental.com",
    
    // Información adicional para facturas
    slogan: "Tu sonrisa es nuestra prioridad",
    businessType: "Suministros Dentales",
    
    // Configuración de facturación
    invoicePrefix: "FAC",
    receiptPrefix: "REC",
    
    // Configuración de impresión
    logoUrl: null, // Se puede agregar una URL de logo después
    
    // Términos y condiciones básicos
    terms: [
        "Garantía de 30 días en productos defectuosos de fábrica",
        "No se aceptan devoluciones de productos personalizados",
        "Productos sujetos a disponibilidad"
    ]
};

export default companyConfig; 