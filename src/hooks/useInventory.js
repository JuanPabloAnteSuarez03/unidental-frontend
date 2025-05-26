// src/hooks/useInventory.js
import { useState, useMemo } from "react";
import mockInventoryItems from "../data/mockInventoryData";

const useInventory = () => {
  // Estados para los términos de búsqueda
  const [searchText, setSearchText] = useState("");
  const [searchCode, setSearchCode] = useState("");
  const [searchCategory, setSearchCategory] = useState("");

  // Estado para la configuración de ordenamiento
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  // Lógica de filtrado y ordenamiento usando useMemo para optimizar rendimiento
  const filteredAndSortedProducts = useMemo(() => {
    // Primero filtramos
    let filtered = mockInventoryItems.filter((item) => {
      // Filtro por texto (nombre y marca)
      const matchesText =
        searchText === "" ||
        item.nombre.toLowerCase().includes(searchText.toLowerCase()) ||
        item.marca.toLowerCase().includes(searchText.toLowerCase());

      // Filtro por código
      const matchesCode =
        searchCode === "" ||
        item.codigo.toLowerCase().includes(searchCode.toLowerCase());

      // Filtro por categoría
      const matchesCategory =
        searchCategory === "" ||
        item.categoria.toLowerCase().includes(searchCategory.toLowerCase());

      return matchesText && matchesCode && matchesCategory;
    });

    // Luego ordenamos si hay una configuración de ordenamiento
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Manejar diferentes tipos de datos
        if (typeof aValue === "string") {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        // Comparación
        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [searchText, searchCode, searchCategory, sortConfig]);

  // Función para cambiar el ordenamiento
  const handleSort = (key) => {
    setSortConfig((prevConfig) => {
      // Si es la misma columna, cambiar dirección
      if (prevConfig.key === key) {
        return {
          key,
          direction:
            prevConfig.direction === "ascending" ? "descending" : "ascending",
        };
      }
      // Si es una columna diferente, ordenar ascendente por defecto
      return {
        key,
        direction: "ascending",
      };
    });
  };

  // Funciones para actualizar los estados de búsqueda
  const updateSearchText = (text) => setSearchText(text);
  const updateSearchCode = (code) => setSearchCode(code);
  const updateSearchCategory = (category) => setSearchCategory(category);

  // Función para limpiar todos los filtros y el ordenamiento
  const clearFilters = () => {
    setSearchText("");
    setSearchCode("");
    setSearchCategory("");
    setSortConfig({ key: null, direction: "ascending" });
  };

  // Retornamos todo lo que necesitan los componentes
  return {
    // Estados de búsqueda
    searchText,
    searchCode,
    searchCategory,

    // Estado de ordenamiento
    sortConfig,

    // Funciones para actualizar estados
    updateSearchText,
    updateSearchCode,
    updateSearchCategory,
    handleSort,
    clearFilters,

    // Datos procesados
    filteredProducts: filteredAndSortedProducts,
    totalProducts: mockInventoryItems.length,
    filteredCount: filteredAndSortedProducts.length,
  };
};

export default useInventory;
