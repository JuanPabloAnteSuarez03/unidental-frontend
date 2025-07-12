import React from "react";

const ReportesStyles = () => {
    return (
        <style>
            {`
                .custom-loader {
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #3498db;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                    margin: 0 auto;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .reportes-container {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 24px;
                }

                .reportes-info {
                    margin-top: 20px;
                    padding: 16px;
                    background-color: #ecf0f1;
                    border-radius: 8px;
                    font-size: 14px;
                    color: #666;
                }

                .reportes-info h4 {
                    margin: 0 0 8px 0;
                    font-weight: bold;
                }

                .reportes-info ul {
                    margin: 0;
                    padding-left: 20px;
                }

                .reportes-info li {
                    margin-bottom: 4px;
                }
            `}
        </style>
    );
};

export default ReportesStyles;
