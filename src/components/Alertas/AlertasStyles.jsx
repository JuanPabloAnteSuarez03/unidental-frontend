import React from "react";

const AlertasStyles = () => (
    <style jsx="true">{`
        .alertas-page {
            padding: 20px;
            max-width: 1400px;
            margin: 0 auto;
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8f9fa;
            min-height: calc(100vh - 140px);
        }

        .alertas-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .alertas-header h1 {
            font-size: 1.8rem;
            color: #333;
            margin: 0;
        }

        .alertas-header .btn-group {
            display: flex;
            gap: 10px;
        }

        .alertas-header button {
            padding: 8px 16px;
            border-radius: 4px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
        }

        .alertas-header .btn-primary {
            background-color: #3f51b5;
            color: white;
        }

        .alertas-header .btn-secondary {
            background-color: transparent;
            color: #5c6bc0;
            border: 1px solid #5c6bc0;
        }

        .alertas-header button:hover {
            opacity: 0.9;
        }

        .alertas-filters {
            background-color: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            margin-bottom: 20px;
        }

        .alertas-filters .filter-row {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin-bottom: 10px;
        }

        .alertas-filters .filter-group {
            flex: 1;
            min-width: 200px;
        }

        .alertas-filters label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
            color: #555;
        }

        .alertas-filters select,
        .alertas-filters input {
            width: 100%;
            padding: 8px 12px;
            border-radius: 4px;
            border: 1px solid #ddd;
            background-color: white;
        }

        .alertas-filters .categories-filter {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        .alertas-filters .category-chip {
            display: inline-block;
            padding: 5px 10px;
            background-color: #e8eaf6;
            color: #3f51b5;
            border-radius: 16px;
            font-size: 0.85rem;
            cursor: pointer;
            transition: all 0.2s;
        }

        .alertas-filters .category-chip.selected {
            background-color: #3f51b5;
            color: white;
        }

        .alertas-table-container {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            overflow: hidden;
            margin-bottom: 30px;
        }

        .alertas-table {
            width: 100%;
            border-collapse: collapse;
        }

        .alertas-table th {
            background-color: #f5f5f5;
            padding: 12px 15px;
            text-align: left;
            font-weight: 600;
            color: #333;
            border-bottom: 1px solid #ddd;
        }

        .alertas-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #eee;
        }

        .alertas-table tr:last-child td {
            border-bottom: none;
        }

        .alertas-table .actions-cell {
            display: flex;
            gap: 10px;
            justify-content: center;
        }

        .alertas-table .action-btn {
            background: none;
            border: none;
            cursor: pointer;
            color: #666;
            font-size: 1rem;
            padding: 5px;
            border-radius: 4px;
            transition: all 0.2s;
        }

        .alertas-table .action-btn:hover {
            background-color: #f0f0f0;
            color: #3f51b5;
        }

        .resumen-alertas {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }

        .resumen-card {
            background-color: white;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            display: flex;
            align-items: center;
            transition: all 0.3s ease;
        }

        .resumen-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .resumen-card .icon {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            margin-right: 15px;
            font-size: 1.2rem;
        }

        .resumen-card.total .icon {
            background-color: #e8f5e9;
            color: #4caf50;
        }

        .resumen-card.expirados .icon {
            background-color: #ffebee;
            color: #e53935;
        }

        .resumen-card.proximos .icon {
            background-color: #fff8e1;
            color: #ff9800;
        }

        .resumen-card.seis-meses .icon {
            background-color: #e3f2fd;
            color: #2196f3;
        }

        .resumen-card.un-anio .icon {
            background-color: #e8f5e9;
            color: #4caf50;
        }

        .resumen-card.pre-anio .icon {
            background-color: #f5f5f5;
            color: #757575;
        }

        .resumen-card .info h3 {
            margin: 0;
            font-size: 1.8rem;
            font-weight: 600;
            color: #333;
        }

        .resumen-card .info p {
            margin: 0;
            color: #666;
            font-size: 0.9rem;
        }

        .modal-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }

        .modal-content {
            background-color: white;
            border-radius: 8px;
            padding: 20px;
            width: 90%;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        }

        .modal-header h2 {
            margin: 0;
            font-size: 1.5rem;
            color: #333;
        }

        .modal-header .close-btn {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #999;
        }

        .modal-footer {
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #eee;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }

        .modal-footer button {
            padding: 8px 16px;
            border-radius: 4px;
            font-weight: 500;
            cursor: pointer;
            border: none;
        }

        .modal-footer .btn-primary {
            background-color: #3f51b5;
            color: white;
        }

        .modal-footer .btn-secondary {
            background-color: #f5f5f5;
            color: #333;
        }

        .form-group {
            margin-bottom: 15px;
        }

        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
            color: #555;
        }

        .form-group input,
        .form-group select {
            width: 100%;
            padding: 8px 12px;
            border-radius: 4px;
            border: 1px solid #ddd;
            background-color: white;
        }

        .form-check {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        }

        .form-check input {
            margin-right: 10px;
        }

        .no-alertas-message {
            text-align: center;
            padding: 30px;
            color: #666;
            font-size: 1.1rem;
        }

        /* Estilos para la sección de lotes */
        .lotes-section {
            margin-top: 30px;
        }

        .section-title {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            flex-wrap: wrap;
            gap: 10px;
        }

        .section-title h2 {
            font-size: 1.5rem;
            color: #333;
            margin: 0;
        }

        .button-group {
            display: flex;
            gap: 8px;
            align-items: center;
            flex-wrap: wrap;
        }

        .toggle-button {
            padding: 8px 16px;
            background-color: #f5f5f5;
            color: #666;
            border: 1px solid #ddd;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s;
            font-size: 0.9rem;
        }

        .toggle-button:hover {
            background-color: #e0e0e0;
        }

        .toggle-button.active {
            background-color: #3f51b5;
            color: white;
            border-color: #3f51b5;
            position: relative;
        }

        .toggle-button.active:after {
            content: "";
            position: absolute;
            bottom: -4px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 6px solid #3f51b5;
        }

        .toggle-button:disabled {
            background-color: #f5f5f5;
            color: #bdbdbd;
            cursor: not-allowed;
            opacity: 0.7;
        }

        .refresh-button {
            padding: 8px 16px;
            background-color: #3f51b5;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s;
            margin-left: 10px;
        }

        .refresh-button:hover {
            background-color: #303f9f;
        }

        .refresh-button:disabled {
            background-color: #bdbdbd;
            cursor: not-allowed;
        }

        .lotes-table-container {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            overflow: hidden;
            margin-bottom: 30px;
            transition: all 0.3s ease;
        }

        .lotes-table-container:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .lotes-table-title {
            padding: 15px 20px;
            margin: 0;
            font-size: 1.2rem;
            font-weight: 600;
            color: #333;
            border-bottom: 1px solid #eee;
        }

        .no-lotes-message {
            padding: 20px;
            text-align: center;
            color: #666;
            font-style: italic;
        }

        .no-data-message {
            padding: 30px;
            text-align: center;
            color: #666;
            font-style: italic;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .loading-message {
            padding: 20px;
            text-align: center;
            color: #666;
            font-style: italic;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .range-selector-container {
            background-color: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            margin-bottom: 20px;
        }

        .range-selector-title {
            font-size: 1rem;
            color: #666;
            margin-bottom: 10px;
            font-weight: 500;
        }
    `}</style>
);

export default AlertasStyles;
