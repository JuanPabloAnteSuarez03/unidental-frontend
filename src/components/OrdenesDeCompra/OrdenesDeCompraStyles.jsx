import React from "react";

const OrdenesDeCompraStyles = () => {
    return (
        <style>
            {`
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.8); }
                    to { opacity: 1; transform: scale(1); }
                }
                
                @keyframes slideIn {
                    from { transform: translateX(-10px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                @keyframes slideInRight {
                    from { transform: translateX(100px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }

                /* Responsivo para órdenes */
                .ordenes-table-container {
                    overflow-x: auto;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }

                .ordenes-table {
                    width: 100%;
                    border-collapse: collapse;
                    background: white;
                    font-size: 14px;
                }

                .ordenes-table th {
                    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
                    color: white;
                    padding: 16px 12px;
                    text-align: left;
                    font-weight: 600;
                    border: none;
                }

                .ordenes-table td {
                    padding: 12px;
                    border-bottom: 1px solid #f1f1f1;
                    color: #2c3e50;
                }

                .ordenes-table tr:hover {
                    background-color: #f8f9fa;
                }

                /* Estilo para botones pequeños */
                .btn-small {
                    padding: 6px 12px;
                    border-radius: 4px;
                    border: none;
                    font-size: 12px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .btn-success {
                    background-color: #28a745;
                    color: white;
                }

                .btn-success:hover {
                    background-color: #218838;
                }

                .btn-danger {
                    background-color: #dc3545;
                    color: white;
                }

                .btn-danger:hover {
                    background-color: #c82333;
                }

                .btn-primary {
                    background-color: #007bff;
                    color: white;
                }

                .btn-primary:hover {
                    background-color: #0069d9;
                }

                /* Loader personalizado */
                .custom-loader {
                    border: 3px solid #f3f3f3;
                    border-top: 3px solid #2c3e50;
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    animation: spin 1s linear infinite;
                    margin: 0 auto;
                }

                /* Estilo para cards */
                .order-card {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
                    border: 1px solid #e3eaf3;
                    transition: all 0.3s ease;
                }

                .order-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
                }

                /* Responsive design */
                @media (max-width: 1200px) {
                    .ordenes-table {
                        font-size: 13px;
                    }
                    
                    .ordenes-table th,
                    .ordenes-table td {
                        padding: 10px 8px;
                    }
                }
                
                @media (max-width: 768px) {
                    .ordenes-table {
                        font-size: 12px;
                    }
                    
                    .ordenes-table th,
                    .ordenes-table td {
                        padding: 8px 6px;
                    }
                    
                    .order-card {
                        padding: 16px;
                        margin: 8px 0;
                    }
                }

                /* Estilo para el selector de proveedor */
                .supplier-selector {
                    position: relative;
                }

                .supplier-selector select {
                    width: 100%;
                    padding: 12px 16px;
                    border-radius: 8px;
                    border: 2px solid #e3eaf3;
                    font-size: 14px;
                    font-weight: 500;
                    color: #2c3e50;
                    background: white;
                    outline: none;
                    transition: all 0.2s ease;
                    appearance: none;
                    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
                    background-position: right 12px center;
                    background-repeat: no-repeat;
                    background-size: 16px;
                    padding-right: 40px;
                }

                .supplier-selector select:focus {
                    border-color: #2c3e50;
                    box-shadow: 0 0 0 3px rgba(44, 62, 80, 0.1);
                }

                /* Estados de badge */
                .status-badge {
                    display: inline-block;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .status-pending {
                    background-color: #fff3cd;
                    color: #856404;
                    border: 1px solid #ffeaa7;
                }

                .status-approved {
                    background-color: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }

                .status-completed {
                    background-color: #d1ecf1;
                    color: #0c5460;
                    border: 1px solid #bee5eb;
                }

                .status-cancelled {
                    background-color: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }
            `}
        </style>
    );
};

export default OrdenesDeCompraStyles;
