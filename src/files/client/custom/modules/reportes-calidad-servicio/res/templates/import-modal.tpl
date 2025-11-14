<div class="import-modal-content">
    <div class="panel panel-default">
        <div class="panel-body">
            <div class="row">
                <div class="col-md-12">
                    <div class="form-group">
                        <label>
                            <span class="fas fa-file-csv"></span>
                            Seleccionar archivo CSV
                        </label>
                        <input 
                            type="file" 
                            name="csvFile" 
                            accept=".csv" 
                            class="form-control"
                        />
                        <small class="text-muted">
                            El archivo debe contener las columnas requeridas del formato de encuestas de satisfacción
                        </small>
                    </div>
                </div>
            </div>

            {{#if hasFile}}
            <div class="row">
                <div class="col-md-12">
                    <div class="file-info alert alert-info">
                        <i class="fas fa-file"></i>
                        <strong>Archivo seleccionado:</strong>
                        {{fileName}}
                    </div>
                </div>
            </div>
            {{/if}}

            <div class="row">
                <div class="col-md-12">
                    <div class="validation-info"></div>
                </div>
            </div>

            <div class="row">
                <div class="col-md-12">
                    <div class="progress" style="display: none;">
                        <div class="progress-bar progress-bar-striped active" 
                             role="progressbar" 
                             style="width: 0%">
                        </div>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-md-12">
                    <div class="alert alert-warning">
                        <strong><i class="fas fa-info-circle"></i> Importante:</strong>
                        <ul class="mb-0 mt-2">
                            <li>El archivo CSV debe estar codificado en UTF-8</li>
                            <li>Las calificaciones deben estar en el rango de 1 a 5</li>
                            <li>Los campos requeridos son: Oficina, Tipo de Operación, Nombre del Asesor</li>
                            <li>Se omitirán las filas con errores de validación</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
.import-modal-content {
    padding: 10px;
}

.import-modal-content .panel {
    margin-bottom: 0;
}

.import-modal-content .form-group label {
    font-weight: bold;
    margin-bottom: 10px;
}

.import-modal-content .file-info {
    margin-top: 15px;
}

.import-modal-content .validation-info {
    margin-top: 15px;
}

.import-modal-content .progress {
    margin-top: 15px;
    height: 25px;
}

.import-modal-content .progress-bar {
    line-height: 25px;
    font-size: 14px;
}

.import-modal-content .alert ul {
    margin-bottom: 0;
    margin-top: 10px;
    padding-left: 20px;
}

.import-modal-content .alert ul li {
    margin-bottom: 5px;
}
</style>