<div class="calidad-servicio-principal">
    <div class="page-header">
        <div>
            <h3>
                <span class="fas fa-chart-line"></span>
                Panel de Control de Calidad de Servicio
            </h3>
        </div>
    </div>

    <div class="file-input-section panel panel-default">
        <div class="panel-body">
            <div class="file-input-group">
                <label class="file-input-label">
                    <input type="file" id="csv-file-input" accept=".csv" class="file-input-visible">
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
                    Importar Datos CSV
                </button>
                <button class="btn btn-default" data-action="refresh">
                    <span class="fas fa-sync-alt"></span>
                    Actualizar Estadísticas
                </button>
            </div>
        </div>
    </div>

    <!-- Container dinámico donde se inyectará todo el contenido -->
    <div id="dynamic-content-container"></div>
</div>