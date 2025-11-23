<div class="calidad-servicio-principal">
    <div class="page-header">
        <div>
            <h3>
                <span class="fas fa-chart-line"></span>
                Panel de Calidad de Servicio
            </h3>
        </div>
    </div>

    <div class="file-input-section panel panel-default">
        <div class="panel-body">
            <div class="file-input-group">
                <label class="file-input-label" for="csv-file-input">
                    <input type="file" id="csv-file-input" accept=".csv" class="file-input-hidden">
                    <span class="file-input-custom">
                        <span class="fas fa-file-csv"></span>
                        Seleccionar archivo CSV
                    </span>
                </label>
                <span id="file-name" class="file-input-name">No se ha seleccionado ningún archivo</span>
            </div>
            
            <div class="action-buttons">
                <button class="btn btn-primary" data-action="import">
                    <span class="fas fa-upload"></span>
                    Importar Datos
                </button>
                <button class="btn btn-default" data-action="refresh">
                    <span class="fas fa-sync-alt"></span>
                    Actualizar Estadísticas
                </button>
            </div>
        </div>
    </div>

    <!-- Container dinámico donde se inyectará todo el contenido -->
    <div id="dynamic-content-container">
        <!-- Contenido se inyectará aquí dinámicamente -->
    </div>
</div>

<style>
.calidad-servicio-principal {
    padding: 20px;
    background: #f8f9fa;
    min-height: 100vh;
}

.page-header {
    background: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    margin-bottom: 20px;
}

.page-header h3 {
    margin: 0;
    color: #2c3e50;
    font-weight: 600;
}

.page-header .fas {
    color: #3498db;
    margin-right: 10px;
}

.file-input-section {
    background: white;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    margin-bottom: 20px;
    border: none;
}

.file-input-section .panel-body {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 15px;
    padding: 20px;
}

.file-input-group {
    display: flex;
    align-items: center;
    gap: 15px;
    flex: 1;
}

/* ✅ ESTILOS CORREGIDOS PARA OCULTAR INPUT FILE */
.file-input-hidden {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    position: absolute !important;
    width: 0 !important;
    height: 0 !important;
    overflow: hidden !important;
    pointer-events: none !important;
}

.file-input-label {
    display: inline-block;
    cursor: pointer;
    margin: 0;
    padding: 0;
    border: none;
    background: none;
}

.file-input-custom {
    display: inline-block;
    padding: 10px 20px;
    background: #3498db;
    color: white;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 500;
    border: none;
    text-align: center;
    min-width: 180px;
}

.file-input-custom:hover {
    background: #2980b9;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.file-input-name {
    color: #7f8c8d;
    font-style: italic;
    min-width: 200px;
    padding: 8px 12px;
    background: #f8f9fa;
    border-radius: 4px;
    border: 1px solid #e9ecef;
    flex: 1;
}

.file-input-name.has-file {
    color: #27ae60;
    font-weight: bold;
    font-style: normal;
    background: #f0fff4;
    border-color: #27ae60;
}

.action-buttons {
    display: flex;
    gap: 10px;
}

.btn {
    border-radius: 6px;
    padding: 10px 20px;
    font-weight: 500;
    transition: all 0.3s ease;
    border: none;
    cursor: pointer;
}

.btn-primary {
    background: #e74c3c;
    color: white;
}

.btn-primary:hover {
    background: #c0392b;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
}

.btn-default {
    background: #95a5a6;
    color: white;
}

.btn-default:hover {
    background: #7f8c8d;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(149, 165, 166, 0.3);
}

/* Estadísticas principales */
.estadisticas-principales {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
}

.estadistica-card {
    background: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    text-align: center;
    border-left: 4px solid #3498db;
    transition: transform 0.3s ease;
}

.estadistica-card:hover {
    transform: translateY(-5px);
}

.estadistica-card.verde {
    border-left-color: #27ae60;
}

.estadistica-card.naranja {
    border-left-color: #e67e22;
}

.estadistica-card.rojo {
    border-left-color: #e74c3c;
}

.estadistica-card.azul {
    border-left-color: #3498db;
}

.estadistica-valor {
    font-size: 2.5em;
    font-weight: 700;
    color: #2c3e50;
    margin: 10px 0;
}

.estadistica-label {
    color: #7f8c8d;
    font-size: 0.9em;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.estadistica-desc {
    color: #bdc3c7;
    font-size: 0.8em;
    margin-top: 5px;
}

/* Mini gauge para satisfacción */
.satisfaction-mini {
    margin-top: 10px;
}

.mini-gauge {
    width: 100%;
    height: 6px;
    background: #ecf0f1;
    border-radius: 3px;
    overflow: hidden;
}

.mini-gauge-fill {
    height: 100%;
    background: linear-gradient(90deg, #e74c3c, #f39c12, #27ae60);
    border-radius: 3px;
    transition: width 0.8s ease;
}

/* Sección de operaciones */
.operaciones-section {
    background: white;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    margin-bottom: 20px;
    overflow: hidden;
}

.operaciones-header {
    background: #34495e;
    color: white;
    padding: 20px;
    margin: 0;
}

.operaciones-header h4 {
    margin: 0;
    font-weight: 600;
}

.operaciones-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
}

.operaciones-lista {
    padding: 20px;
    border-right: 1px solid #ecf0f1;
}

.operaciones-lista table {
    width: 100%;
    border-collapse: collapse;
}

.operaciones-lista th {
    background: #f8f9fa;
    padding: 12px;
    text-align: left;
    font-weight: 600;
    color: #2c3e50;
    border-bottom: 2px solid #bdc3c7;
}

.operaciones-lista td {
    padding: 12px;
    border-bottom: 1px solid #ecf0f1;
}

.operaciones-lista tr:hover {
    background: #f8f9fa;
}

.operacion-cantidad, .operacion-porcentaje {
    font-weight: 600;
    text-align: center;
}

.operaciones-chart {
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.chart-container {
    width: 100%;
    height: 300px;
    position: relative;
}

/* Distribución de operaciones */
.distribucion-section {
    background: white;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    padding: 20px;
    margin-bottom: 20px;
}

.distribucion-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid #ecf0f1;
}

.distribucion-header h4 {
    margin: 0;
    color: #2c3e50;
    font-weight: 600;
}

.distribucion-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 20px;
    align-items: start;
}

.barras-distribucion {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.barra-item {
    display: flex;
    align-items: center;
    gap: 15px;
}

.barra-label {
    min-width: 80px;
    font-weight: 600;
    color: #2c3e50;
}

.barra-container {
    flex: 1;
    height: 30px;
    background: #ecf0f1;
    border-radius: 15px;
    overflow: hidden;
    position: relative;
}

.barra-fill {
    height: 100%;
    border-radius: 15px;
    transition: width 0.8s ease;
    position: relative;
}

.barra-fill.verde { background: linear-gradient(90deg, #27ae60, #2ecc71); }
.barra-fill.naranja { background: linear-gradient(90deg, #e67e22, #f39c12); }
.barra-fill.rojo { background: linear-gradient(90deg, #e74c3c, #c0392b); }

.barra-valor {
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: white;
    font-weight: 600;
    font-size: 0.9em;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
}

.barra-cantidad {
    min-width: 60px;
    text-align: right;
    font-weight: 600;
    color: #7f8c8d;
}

.porcentajes-distribucion {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.porcentaje-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
    border-left: 4px solid #3498db;
    transition: transform 0.3s ease;
}

.porcentaje-item:hover {
    transform: translateX(5px);
}

.porcentaje-item.verde { border-left-color: #27ae60; }
.porcentaje-item.naranja { border-left-color: #e67e22; }
.porcentaje-item.rojo { border-left-color: #e74c3c; }

.porcentaje-valor {
    font-size: 1.5em;
    font-weight: 700;
    color: #2c3e50;
    min-width: 60px;
}

.porcentaje-label {
    color: #2c3e50;
    font-weight: 600;
    flex: 1;
}

.porcentaje-cantidad {
    color: #7f8c8d;
    font-size: 0.8em;
}

/* Estados de carga y vacío */
.loading-alert, .empty-alert {
    background: white;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    padding: 40px;
    text-align: center;
    margin: 20px 0;
}

.spinner-large {
    width: 50px;
    height: 50px;
    border: 5px solid #f3f3f3;
    border-top: 5px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.empty-icon {
    font-size: 4em;
    color: #bdc3c7;
    margin-bottom: 20px;
}

/* Información del sistema */
.system-info {
    border: none;
    border-radius: 10px;
    padding: 20px;
}

.system-status {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
}

.status-indicator {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
}

.status-indicator.online {
    background: #27ae60;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
}

.system-details {
    color: #2c3e50;
    line-height: 1.5;
}

/* Placeholder para gráficos */
.chart-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #7f8c8d;
}

.placeholder-icon {
    font-size: 3em;
    margin-bottom: 15px;
    opacity: 0.5;
}

/* Responsive */
@media (max-width: 768px) {
    .calidad-servicio-principal {
        padding: 10px;
    }
    
    .file-input-section .panel-body {
        flex-direction: column;
        align-items: stretch;
    }
    
    .file-input-group {
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
    }
    
    .file-input-name {
        text-align: center;
    }
    
    .action-buttons {
        justify-content: center;
        width: 100%;
    }
    
    .operaciones-grid {
        grid-template-columns: 1fr;
    }
    
    .operaciones-lista {
        border-right: none;
        border-bottom: 1px solid #ecf0f1;
    }
    
    .distribucion-grid {
        grid-template-columns: 1fr;
    }
    
    .estadisticas-principales {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .distribucion-header {
        flex-direction: column;
        gap: 10px;
        text-align: center;
    }
}

/* Mejoras visuales adicionales */
.operacion-total {
    background: #34495e;
    color: white;
    font-weight: 600;
}

.badge-operacion {
    display: inline-block;
    padding: 6px 12px;
    border-radius: 15px;
    font-size: 0.8em;
    font-weight: 600;
    color: white;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.badge-verde { background: #27ae60; }
.badge-naranja { background: #e67e22; }
.badge-rojo { background: #e74c3c; }
.badge-azul { background: #3498db; }

.section-divider {
    height: 2px;
    background: linear-gradient(90deg, #3498db, #e74c3c);
    margin: 25px 0;
    border: none;
    opacity: 0.6;
}

.alert {
    border: none;
    border-radius: 10px;
    padding: 20px;
}

.alert-warning {
    background: #fff3cd;
    color: #856404;
}

.alert-success {
    background: #d4edda;
    color: #155724;
}

.empty-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
}
</style>