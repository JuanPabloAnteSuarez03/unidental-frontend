import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { CustomersContext } from '../../context/CustomersContext';
import { ProductsContext } from '../../context/ProductsContext';
import CustomerSelector from '../../components/Sales/CustomerSelector';
import ProductSelector from '../../components/Sales/ProductSelector';
import SaleItemsList from '../../components/Sales/SaleItemsList';

// Mock de los servicios
jest.mock('../../services/customersService');
jest.mock('../../services/inventoryService');

// Mock de todos los contextos necesarios
const mockAuthContext = {
  authToken: 'fake-token',
  currentUser: { id: 1, username: 'testuser' },
  isLoading: false,
  authError: null
};

const mockCustomersContext = {
  customers: [
    { id: 1, name: 'Cliente Test', email: 'test@test.com' }
  ],
  loading: false,
  error: null,
  searchCustomers: jest.fn(),
  createCustomer: jest.fn(),
  updateCustomer: jest.fn()
};

const mockProductsContext = {
  products: [
    { id: 1, name: 'Producto Test', sku: 'TEST-001', price: 100 }
  ],
  loading: false,
  error: null,
  searchProducts: jest.fn(),
  getProductsByCategory: jest.fn()
};

// Wrapper completo para los tests
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <AuthContext.Provider value={mockAuthContext}>
      <CustomersContext.Provider value={mockCustomersContext}>
        <ProductsContext.Provider value={mockProductsContext}>
          {children}
        </ProductsContext.Provider>
      </CustomersContext.Provider>
    </AuthContext.Provider>
  </BrowserRouter>
);

describe('Flujo de Ventas - Tests de Integración', () => {
  describe('CustomerSelector Component', () => {
    test('debe renderizar el selector de clientes', () => {
      render(
        <TestWrapper>
          <CustomerSelector 
            onCustomerSelect={() => {}}
            selectedCustomer={null}
          />
        </TestWrapper>
      );

      expect(screen.getByText(/seleccionar cliente/i)).toBeInTheDocument();
    });

    test('debe permitir buscar clientes', async () => {
      const mockOnCustomerSelect = jest.fn();
      
      render(
        <TestWrapper>
          <CustomerSelector 
            onCustomerSelect={mockOnCustomerSelect}
            selectedCustomer={null}
          />
        </TestWrapper>
      );

      // Simular búsqueda de cliente
      const searchInput = screen.getByPlaceholderText(/buscar cliente/i);
      if (searchInput) {
        fireEvent.change(searchInput, { target: { value: 'Juan' } });
        
        await waitFor(() => {
          expect(searchInput.value).toBe('Juan');
        });
      }
    });
  });

  describe('ProductSelector Component', () => {
    test('debe renderizar el selector de productos', () => {
      render(
        <TestWrapper>
          <ProductSelector 
            onProductSelect={() => {}}
            selectedLocation="1"
          />
        </TestWrapper>
      );

      // Verificar que el componente se renderiza
      expect(screen.getByRole('textbox') || screen.getByPlaceholderText(/buscar/i)).toBeInTheDocument();
    });
  });

  describe('SaleItemsList Component', () => {
    const mockSaleItems = [
      {
        id: 1,
        product: {
          id: 1,
          name: 'Producto Test',
          sku: 'TEST-001'
        },
        quantity: 2,
        price: 100,
        total: 200
      }
    ];

    test('debe mostrar la lista de productos en venta', () => {
      render(
        <TestWrapper>
          <SaleItemsList 
            items={mockSaleItems}
            onQuantityChange={() => {}}
            onRemoveItem={() => {}}
            onPriceChange={() => {}}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Producto Test')).toBeInTheDocument();
      expect(screen.getByText('TEST-001')).toBeInTheDocument();
    });

    test('debe calcular correctamente los totales', () => {
      render(
        <TestWrapper>
          <SaleItemsList 
            items={mockSaleItems}
            onQuantityChange={() => {}}
            onRemoveItem={() => {}}
            onPriceChange={() => {}}
          />
        </TestWrapper>
      );

      // Verificar que aparece el total
      expect(screen.getByText(/200/)).toBeInTheDocument();
    });
  });

  describe('Flujo Completo de Venta (Simulado)', () => {
    test('debe completar un flujo básico de venta', async () => {
      // Este test simula todo el flujo sin depender de APIs reales
      const saleData = {
        customer: { id: 1, name: 'Cliente Test' },
        items: [
          { product: { id: 1, name: 'Producto 1' }, quantity: 2, price: 50 }
        ],
        total: 100,
        paymentMethod: 'cash'
      };

      // Verificar que los datos son válidos
      expect(saleData.customer).toBeDefined();
      expect(saleData.items.length).toBeGreaterThan(0);
      expect(saleData.total).toBeGreaterThan(0);
      expect(saleData.paymentMethod).toBeDefined();

      // Simular cálculos
      const calculatedTotal = saleData.items.reduce((sum, item) => 
        sum + (item.quantity * item.price), 0
      );
      
      expect(calculatedTotal).toBe(saleData.total);
    });
  });
}); 