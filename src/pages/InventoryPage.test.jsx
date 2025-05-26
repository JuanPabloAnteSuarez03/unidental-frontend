// src/pages/InventoryPage.test.jsx

import React from "react";
import { render, screen } from "@testing-library/react";
import InventoryPage from "./InventoryPage";

describe("InventoryPage", () => {
  test("renderiza el título de la página", () => {
    render(<InventoryPage />);
    const titulo = screen.getByText(/Gestión de Inventario/i);
    expect(titulo).toBeInTheDocument();
  });

  test("renderiza el subtítulo de la página", () => {
    render(<InventoryPage />);
    const subtitulo = screen.getByText(
      /Administra y consulta el inventario de productos/i
    );
    expect(subtitulo).toBeInTheDocument();
  });

  test("renderiza el componente SearchBar", () => {
    render(<InventoryPage />);
    const searchBar = screen.getByPlaceholderText(/Buscar por nombre/i);
    expect(searchBar).toBeInTheDocument();
  });

  test("renderiza el componente InventoryTable", () => {
    render(<InventoryPage />);
    const tabla = screen.getByRole("table");
    expect(tabla).toBeInTheDocument();
  });
});
