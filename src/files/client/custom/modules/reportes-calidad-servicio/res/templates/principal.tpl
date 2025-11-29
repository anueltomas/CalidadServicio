<div class="calidad-servicio-principal">
    <div class="page-header">
        <div>
            <h3>
                <span class="fas fa-chart-line"></span>
                Panel de Calidad de Servicio
            </h3>
        </div>
    </div>

    <div class="filter-section panel panel-default">
        <div class="panel-body">
            <div class="filters-container">
                <div class="filter-group">
                    <label for="cla-select">🏢 CLA</label>
                    <select id="cla-select" class="form-control" disabled>
                        <option value="">Cargando CLAs...</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label for="oficina-select">🏪 Oficina</label>
                    <select id="oficina-select" class="form-control" disabled>
                        <option value="">Seleccione un CLA primero</option>
                    </select>
                </div>
            </div>
        </div>
    </div>

    
    {{#if esAdmin}}
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
                <button class="btn btn-primary" data-action="import" style="
                    background-color: #B8A279; 
                    border-color: #9D8B5F; 
                    color: #1A1A1A;
                    font-weight: 600;
                    padding: 10px 20px;
                    border-width: 2px;
                    transition: all 0.3s ease;
                ">
                    <span class="fas fa-upload"></span>
                    Importar Datos
                </button>
                <button class="btn btn-default" data-action="refresh" style="
                    background-color: #E6E6E6; 
                    border-color: #666666; 
                    color: #1A1A1A;
                    font-weight: 600;
                    padding: 10px 20px;
                    border-width: 2px;
                    transition: all 0.3s ease;
                ">
                    <span class="fas fa-sync-alt"></span>
                    Actualizar Estadísticas
                </button>
            </div>
        </div>
    </div>
    {{/if}}

    <div id="dynamic-content-container">
        <!-- Contenido dinámico -->
    </div>
</div>

<style>

/*==================================
BOTON DE IMPORT Y REFRESCAR
==================================*/
    button[data-action="import"]:hover {
        background-color: #36342eff !important;
        border-color: #8A7A54 !important;
        color: #FFFFFF !important;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(154, 140, 95, 0.3);
    }

    button[data-action="import"]:active {
        transform: translateY(0);
        box-shadow: 0 2px 4px rgba(154, 140, 95, 0.3);
    }


    button[data-action="refresh"]:hover {
        background-color: #D4D4D4 !important;
        border-color: #5A5A5A !important;
        color: #1A1A1A !important;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(102, 102, 102, 0.2);
    }
    
    button[data-action="refresh"]:active {
        transform: translateY(0);
        box-shadow: 0 2px 4px rgba(102, 102, 102, 0.2);
    }

/* ===================================
   SECCIÓN DE FILTROS
   =================================== */
.filter-section {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin-bottom: 20px;
    border: none;
}

.filters-container {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
}

.filter-group {
    flex: 1;
    min-width: 250px;
}

.filter-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #2c3e50;
    font-size: 0.95em;
}

.filter-group .form-control {
    width: 100%;
    padding: 10px 15px;
    border: 2px solid #e9ecef;
    border-radius: 6px;
    font-size: 0.95em;
    transition: all 0.3s ease;
}

.filter-group .form-control:focus {
    border-color: #B8A279;
    outline: none;
    box-shadow: 0 0 0 3px rgba(184, 162, 121, 0.1);
}

.filter-group .form-control:disabled {
    background-color: #f8f9fa;
    cursor: not-allowed;
    opacity: 0.6;
}

/* ===================================
   ESTILOS GENERALES MEJORADOS
   =================================== */
.calidad-servicio-principal {
    padding: 20px;
    background: #f5f5f5;
    min-height: 100vh;
}

.page-header {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin-bottom: 20px;
}

.page-header h3 {
    margin: 0;
    color: #2c3e50;
    font-weight: 600;
    font-size: 1.5em;
}

.page-header .fas {
    color: #3498db;
    margin-right: 10px;
}

/* ===================================
   SECCIÓN DE ARCHIVO
   =================================== */
.file-input-section {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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

.file-input-hidden {
    display: none !important;
}

.file-input-label {
    display: inline-block;
    cursor: pointer;
    margin: 0;
}

.file-input-custom {
    display: inline-block;
    padding: 10px 20px;
    background: #4c4d4eff;
    color: white;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 500;
}

.file-input-custom:hover {
    background: #b39e78ff;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(52, 152, 219, 0.3);
}

.file-input-name {
    color: #7f8c8d;
    font-style: italic;
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
    box-shadow: 0 4px 8px rgba(231, 76, 60, 0.3);
}

.btn-default {
    background: #95a5a6;
    color: white;
}

.btn-default:hover {
    background: #7f8c8d;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(149, 165, 166, 0.3);
}

/* ===================================
   REPORTE CONTAINER MEJORADO
   =================================== */
.reporte-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

/* ===================================
   INFORMACIÓN DE ENCUESTA MEJORADA
   =================================== */
.info-encuesta-card {
    background: linear-gradient(135deg, #B8A279 0%, #D4C19C 100%);
    border-radius: 8px;
    padding: 25px;
    box-shadow: 0 4px 15px rgba(184, 162, 121, 0.3);
    color: white;
}

.info-title {
    margin: 0 0 20px 0;
    font-size: 1.3em;
    font-weight: 600;
    color: white;
    text-align: center;
}

.info-table {
    width: 100%;
    border-collapse: collapse;
}

.info-table tr {
    border-bottom: 1px solid rgba(255,255,255,0.2);
}

.info-table tr:last-child {
    border-bottom: none;
}

.info-table td {
    padding: 12px 15px;
}

.info-label {
    font-weight: 600;
    color: rgba(255,255,255,0.9);
}

.info-value {
    text-align: right;
    color: white;
    font-weight: 600;
}

/* ===================================
   SECCIÓN DE OPERACIONES MEJORADA
   =================================== */
.seccion-operaciones {
    background: white;
    border-radius: 8px;
    padding: 30px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.titulo-seccion {
    text-align: center;
    font-size: 1.8em;
    font-weight: 700;
    color: #2c3e50;
    margin: 0 0 30px 0;
    padding-bottom: 15px;
    border-bottom: 3px solid #B8A279;
}

/* ===================================
   TABLA DE OPERACIONES MEJORADA
   =================================== */
.tabla-operaciones-card {
    margin-bottom: 30px;
}

.tabla-operaciones {
    width: 100%;
    border-collapse: collapse;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    border-radius: 8px;
    overflow: hidden;
}

.tabla-operaciones thead {
    background: linear-gradient(135deg, #B8A279 0%, #D4C19C 100%);
    color: white;
}

.tabla-operaciones th {
    padding: 18px;
    text-align: left;
    font-weight: 600;
    font-size: 1.1em;
}

.tabla-operaciones tbody tr {
    background: white;
    border-bottom: 1px solid #f0f0f0;
    transition: background 0.3s ease;
}

.tabla-operaciones tbody tr:hover {
    background: #f8f9fa;
}

.tabla-operaciones tbody tr.total-row {
    background: #f8f9fa;
    font-weight: 700;
    border-top: 2px solid #B8A279;
}

.tabla-operaciones td {
    padding: 15px 18px;
}

/* ===================================
   GRÁFICOS PRINCIPALES
   =================================== */
.graficos-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    margin: 40px 0;
}

.grafico-card {
    background: white;
    border-radius: 12px;
    padding: 25px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
    transition: transform 0.3s, box-shadow 0.3s;
    border: 1px solid #f0f0f0;
}

.grafico-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.grafico-titulo {
    text-align: center;
    font-size: 1.2em;
    font-weight: 600;
    color: #2c3e50;
    margin: 0 0 20px 0;
    padding-bottom: 15px;
    border-bottom: 2px solid #B8A279;
}

.grafico-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    padding: 20px;
}

/* ===================================
   GRÁFICOS SECUNDARIOS (NUEVOS)
   =================================== */
.graficos-secundarios {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    margin-top: 40px;
}

.graficos-secundarios .grafico-card.grande {
    grid-column: span 2;
}

.graficos-secundarios .grafico-card:not(.grande) {
    grid-column: span 1;
}

/* ===================================
   LEYENDAS MEJORADAS
   =================================== */
.leyenda-donut {
    display: flex;
    justify-content: center;
    gap: 25px;
    margin-top: 20px;
    flex-wrap: wrap;
}

.leyenda-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 15px;
    background: #f8f9fa;
    border-radius: 20px;
    border: 1px solid #e9ecef;
}

.leyenda-color {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    display: inline-block;
}

.leyenda-texto {
    font-size: 0.9em;
    color: #2c3e50;
    font-weight: 500;
}

/* ===================================
   ESTADOS (LOADING, EMPTY) MEJORADOS
   =================================== */
.loading-alert, .empty-alert {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    padding: 60px 40px;
    text-align: center;
    margin: 40px 0;
}

.spinner-large {
    width: 60px;
    height: 60px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #B8A279;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 25px;
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

/* ===================================
   RESPONSIVE MEJORADO
   =================================== */
@media (max-width: 1400px) {
    .graficos-container,
    .graficos-secundarios {
        grid-template-columns: 1fr;
    }
    
    .graficos-secundarios .grafico-card.grande {
        grid-column: span 1;
    }
}

@media (max-width: 1024px) {
    .calidad-servicio-principal {
        padding: 15px;
    }
    
    .page-header h3 {
        font-size: 1.3em;
    }
    
    .filters-container {
        flex-direction: column;
    }
    
    .filter-group {
        min-width: 100%;
    }
    
    .info-encuesta-card {
        padding: 20px;
    }
    
    .info-title {
        font-size: 1.1em;
    }
    
    .seccion-operaciones {
        padding: 20px;
    }
    
    .titulo-seccion {
        font-size: 1.5em;
    }
    
    .tabla-operaciones {
        font-size: 0.9em;
    }
    
    .tabla-operaciones th,
    .tabla-operaciones td {
        padding: 12px;
    }
    
    .grafico-card {
        padding: 20px;
    }
    
    .grafico-titulo {
        font-size: 1.1em;
    }
}

@media (max-width: 768px) {
    .calidad-servicio-principal {
        padding: 10px;
    }
    
    .page-header {
        padding: 15px;
    }
    
    .page-header h3 {
        font-size: 1.1em;
    }
    
    .file-input-section .panel-body {
        flex-direction: column;
        align-items: stretch;
        padding: 15px;
    }
    
    .file-input-group {
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
    }
    
    .file-input-custom {
        width: 100%;
        text-align: center;
    }
    
    .file-input-name {
        font-size: 0.85em;
    }
    
    .action-buttons {
        flex-direction: column;
        width: 100%;
        gap: 10px;
    }
    
    .action-buttons .btn {
        width: 100%;
    }
    
    .info-encuesta-card {
        padding: 15px;
    }
    
    .info-title {
        font-size: 1em;
        margin-bottom: 15px;
    }
    
    .info-table td {
        padding: 10px;
        font-size: 0.9em;
    }
    
    .seccion-operaciones {
        padding: 15px;
    }
    
    .titulo-seccion {
        font-size: 1.3em;
        margin-bottom: 20px;
    }
    
    /* Tabla responsive con scroll horizontal */
    .tabla-operaciones-card {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
    }
    
    .tabla-operaciones {
        min-width: 500px;
        font-size: 0.85em;
    }
    
    .tabla-operaciones th,
    .tabla-operaciones td {
        padding: 10px 8px;
    }
    
    .graficos-container,
    .graficos-secundarios {
        grid-template-columns: 1fr;
        gap: 15px;
        margin: 20px 0;
    }
    
    .graficos-secundarios .grafico-card.grande {
        grid-column: span 1;
    }
    
    .grafico-card {
        padding: 15px;
    }
    
    .grafico-titulo {
        font-size: 1em;
        padding-bottom: 10px;
    }
    
    .grafico-wrapper {
        min-height: 250px;
        padding: 10px;
    }
    
    .leyenda-donut {
        flex-direction: column;
        align-items: center;
        gap: 8px;
    }
    
    .leyenda-item {
        width: 100%;
        justify-content: center;
    }
    
    /* Ajustar mensajes de loading/empty */
    .loading-alert,
    .empty-alert {
        padding: 40px 20px;
        margin: 20px 0;
    }
    
    .spinner-large {
        width: 50px;
        height: 50px;
    }
    
    .empty-icon {
        font-size: 3em;
    }
}

@media (max-width: 480px) {
    .calidad-servicio-principal {
        padding: 8px;
    }
    
    .page-header {
        padding: 12px;
        margin-bottom: 10px;
    }
    
    .page-header h3 {
        font-size: 1em;
    }
    
    .filter-section,
    .file-input-section {
        margin-bottom: 10px;
    }
    
    .filter-group label {
        font-size: 0.9em;
    }
    
    .filter-group .form-control {
        padding: 8px 12px;
        font-size: 0.9em;
    }
    
    .file-input-custom {
        padding: 8px 15px;
        font-size: 0.9em;
    }
    
    .btn {
        padding: 8px 15px;
        font-size: 0.9em;
    }
    
    .info-encuesta-card {
        padding: 12px;
    }
    
    .info-title {
        font-size: 0.95em;
    }
    
    .info-table td {
        padding: 8px;
        font-size: 0.85em;
    }
    
    .seccion-operaciones {
        padding: 12px;
    }
    
    .titulo-seccion {
        font-size: 1.1em;
        margin-bottom: 15px;
    }
    
    .tabla-operaciones {
        font-size: 0.8em;
    }
    
    .tabla-operaciones th,
    .tabla-operaciones td {
        padding: 8px 6px;
    }
    
    .grafico-card {
        padding: 12px;
    }
    
    .grafico-titulo {
        font-size: 0.95em;
    }
    
    .grafico-wrapper {
        min-height: 200px;
        padding: 8px;
    }
    
    .leyenda-texto {
        font-size: 0.85em;
    }
    
    .loading-alert,
    .empty-alert {
        padding: 30px 15px;
    }
    
    .loading-alert h4,
    .empty-alert h3 {
        font-size: 1.1em;
    }
    
    .loading-alert p,
    .empty-alert p {
        font-size: 0.9em;
    }
}

/* ===================================
   MEJORAS PARA TABLETS
   =================================== */
@media (min-width: 769px) and (max-width: 1024px) {
    .graficos-container,
    .graficos-secundarios {
        grid-template-columns: 1fr 1fr;
    }
    
    .graficos-secundarios .grafico-card.grande {
        grid-column: span 2;
    }
    
    .tabla-operaciones th,
    .tabla-operaciones td {
        font-size: 0.9em;
    }
}

/* ===================================
   CHART.JS RESPONSIVE
   =================================== */
@media (max-width: 768px) {
    #chart-donut,
    #chart-barras,
    #chart-radar,
    #chart-horizontal,
    #chart-distribution,
    #chart-recomendacion,
    #chart-medios-contacto,
    #chart-oficinas {
        max-width: 100% !important;
        max-height: 250px !important;
    }
}

/* ===================================
   ORIENTACIÓN LANDSCAPE EN MÓVILES
   =================================== */
@media (max-width: 768px) and (orientation: landscape) {
    .grafico-wrapper {
        min-height: 200px;
    }
    
    #chart-donut,
    #chart-barras,
    #chart-radar,
    #chart-horizontal,
    #chart-distribution,
    #chart-recomendacion,
    #chart-medios-contacto,
    #chart-oficinas {
        max-height: 200px !important;
    }
}


/* Mejoras visuales para los gráficos */
.chartjs-render-monitor {
    border-radius: 8px;
}
</style>