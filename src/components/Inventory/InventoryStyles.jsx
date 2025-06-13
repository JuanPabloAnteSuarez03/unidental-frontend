import React from "react";

const InventoryStyles = () => {
  return (
    <style>
      {`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .inventory-container {
          animation: fadeIn 0.3s ease-out;
        }
        
        .inventory-card {
          transition: all 0.2s ease;
        }
        
        .inventory-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0,0,0,0.15) !important;
        }
        
        .inventory-section-header {
          animation: slideIn 0.4s ease-out;
        }
        
        @media (max-width: 1024px) {
          .inventory-container {
            padding: 15px !important;
          }
        }
        
        @media (max-width: 768px) {
          .inventory-header {
            padding: 20px !important;
          }
          
          .inventory-content {
            padding: 20px !important;
          }
          
          .inventory-title {
            font-size: 24px !important;
          }
          
          .inventory-section-title {
            font-size: 16px !important;
          }
        }
        
        @media (max-width: 480px) {
          .inventory-container {
            padding: 10px !important;
          }
          
          .inventory-header,
          .inventory-content {
            padding: 15px !important;
          }
        }
      `}
    </style>
  );
};

export default InventoryStyles;
