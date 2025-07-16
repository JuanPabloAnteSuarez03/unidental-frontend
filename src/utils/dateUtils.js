/**
 * Utilidades para manejo de fechas en el sistema
 * Resuelve problemas de zona horaria entre frontend y backend
 */

/**
 * Obtener la fecha actual en formato YYYY-MM-DD en zona horaria local
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const getCurrentDateLocal = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

/**
 * Obtener la fecha actual en formato YYYY-MM-DD en UTC
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const getCurrentDateUTC = () => {
    const now = new Date();
    return now.toISOString().split("T")[0];
};

/**
 * Convertir fecha UTC a fecha local
 * @param {string} utcDateString - Fecha en formato YYYY-MM-DD o ISO string
 * @returns {string} Fecha local en formato YYYY-MM-DD
 */
export const convertUTCToLocalDate = (utcDateString) => {
    if (!utcDateString) return null;
    
    try {
        // Si ya es solo fecha (YYYY-MM-DD), agregar tiempo para crear objeto Date
        const dateString = utcDateString.includes('T') ? utcDateString : `${utcDateString}T00:00:00.000Z`;
        const date = new Date(dateString);
        
        // Obtener fecha local
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        
        return `${year}-${month}-${day}`;
    } catch (error) {
        console.error("Error convirtiendo fecha UTC a local:", error);
        return utcDateString; // Retornar original si hay error
    }
};

/**
 * Convertir fecha local a UTC
 * @param {string} localDateString - Fecha local en formato YYYY-MM-DD
 * @returns {string} Fecha UTC en formato YYYY-MM-DD
 */
export const convertLocalToUTCDate = (localDateString) => {
    if (!localDateString) return null;
    
    try {
        const date = new Date(`${localDateString}T00:00:00`);
        return date.toISOString().split("T")[0];
    } catch (error) {
        console.error("Error convirtiendo fecha local a UTC:", error);
        return localDateString; // Retornar original si hay error
    }
};

/**
 * Formatear fecha para mostrar en la UI
 * @param {string} dateString - Fecha en cualquier formato
 * @param {string} locale - Locale para formateo (default: 'es-ES')
 * @returns {string} Fecha formateada
 */
export const formatDateForDisplay = (dateString, locale = 'es-ES') => {
    if (!dateString) return "Fecha no disponible";
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString(locale, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch (error) {
        console.error("Error formateando fecha:", error);
        return "Fecha inválida";
    }
};

/**
 * Verificar si una fecha es hoy
 * @param {string} dateString - Fecha a verificar
 * @returns {boolean} True si es hoy
 */
export const isToday = (dateString) => {
    if (!dateString) return false;
    
    try {
        const today = getCurrentDateLocal();
        const dateToCheck = convertUTCToLocalDate(dateString);
        return today === dateToCheck;
    } catch (error) {
        console.error("Error verificando si es hoy:", error);
        return false;
    }
};

/**
 * Debug: Mostrar información detallada de una fecha
 * @param {string} dateString - Fecha a debuggear
 * @param {string} label - Etiqueta para el log
 */
export const debugDate = (dateString, label = "Fecha") => {
    if (!dateString) {
        console.log(`🔍 ${label}: null/undefined`);
        return;
    }

    try {
        const date = new Date(dateString);
        const utcString = date.toISOString();
        const localString = date.toLocaleDateString();
        const utcDateOnly = utcString.split("T")[0];
        const localDateOnly = getCurrentDateLocal();

        console.log(`🔍 ${label}:`, {
            original: dateString,
            utc: utcString,
            local: localString,
            utcDateOnly,
            localDateOnly,
            timestamp: date.getTime(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
    } catch (error) {
        console.error(`❌ Error debuggeando ${label}:`, dateString, error);
    }
}; 