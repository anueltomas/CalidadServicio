<div class="container-fluid">
    <!-- Header -->
    <div class="row mb-4">
        <div class="col-md-12">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h1 class="h3 mb-0">
                        <i class="fas fa-building text-primary me-2"></i>
                        Comparación de Oficinas
                    </h1>
                    <p class="text-muted mb-0">
                        Análisis comparativo del desempeño de oficinas
                        {{#if filtros.cla}}para el CLA: {{filtros.cla}}{{/if}}
                    </p>
                </div>
                <div>
                    <button class="btn btn-outline-secondary me-2" data-action="volver">
                        <i class="fas fa-arrow-left me-1"></i> Volver
                    </button>
                    <button class="btn btn-success" data-action="exportar">
                        <i class="fas fa-file-excel me-1"></i> Exportar Excel
                    </button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Filtros principales -->
    <div class="row mb-4">
        <div class="col-md-12">
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0"><i class="fas fa-filter me-2"></i>Parámetros de Comparación</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-3">
                            <div class="mb-3">
                                <label class="form-label">CLA</label>
                                <input type="text" class="form-control" value="{{filtros.cla}}" readonly>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="mb-3">
                                <label class="form-label">Año</label>
                                <input type="text" class="form-control" value="{{filtros.anio}}" readonly>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="mb-3">
                                <label class="form-label">Oficina</label>
                                <input type="text" class="form-control" value="{{filtros.oficina}}" readonly>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="mb-3">
                                <label class="form-label">Usuario</label>
                                <input type="text" class="form-control" value="{{filtros.usuario}}" readonly>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Contenido dinámico -->
    <div id="oficinas-container">
        <!-- Los datos se cargarán aquí dinámicamente -->
    </div>
    
    <!-- Mensaje de no datos -->
    {{#unless isLoading}}
        {{#unless datosOficinas.length}}
            <div class="row">
                <div class="col-md-12">
                    <div class="card">
                        <div class="card-body text-center py-5">
                            <i class="fas fa-building fa-4x text-muted mb-3"></i>
                            <h4 class="text-muted">No hay datos de oficinas disponibles</h4>
                            <p class="text-muted">No se encontraron datos para los filtros seleccionados.</p>
                            <button class="btn btn-primary mt-2" data-action="volver">
                                <i class="fas fa-arrow-left me-1"></i> Volver y cambiar filtros
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        {{/unless}}
    {{/unless}}
</div>

<!-- Estilos adicionales -->
<style>
    .progress {
        border-radius: 10px;
        overflow: hidden;
    }
    
    .progress-bar {
        border-radius: 10px;
        font-size: 12px;
        line-height: 20px;
    }
    
    .table th {
        background-color: #f8f9fa;
        font-weight: 600;
    }
    
    .card {
        border: none;
        box-shadow: 0 2px 10px rgba(0,0,0,0.08);
        border-radius: 10px;
        margin-bottom: 20px;
    }
    
    .card-header {
        border-radius: 10px 10px 0 0 !important;
        padding: 15px 20px;
    }
    
    .btn-outline-primary:hover {
        transform: translateY(-2px);
        transition: all 0.3s ease;
    }
    
    .badge {
        font-size: 0.9em;
        padding: 6px 12px;
        border-radius: 20px;
    }
</style>