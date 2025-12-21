<div class="container-fluid">
    <div class="row mb-4">
        <div class="col-md-12">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h1 class="h3 mb-0">
                        <i class="fas fa-chart-bar me-2" style="color: {{colors.primario}};"></i>
                        Estadísticas Detalladas del Asesor
                    </h1>
                    <p class="mb-0" style="color: {{colors.grisMedio}};">
                        <i class="fas fa-user-tie me-1" style="color: {{colors.secundario}};"></i> 
                        Asesor: <strong id="nombre-asesor" style="color: {{colors.secundario}};">{{infoAsesor.nombre}}</strong>
                        {{#if infoAsesor.oficina}}
                            <span class="mx-2">•</span>
                            <i class="fas fa-building me-1" style="color: {{colors.primario}};"></i>
                            <span style="color: {{colors.grisMedio}};">{{infoAsesor.oficina}}</span>
                        {{/if}}
                        {{#if infoAsesor.cla}}
                            <span class="mx-2">•</span>
                            <i class="fas fa-users me-1" style="color: {{colors.primario}};"></i>
                            <span style="color: {{colors.grisMedio}};">{{infoAsesor.cla}}</span>
                        {{/if}}
                    </p>
                </div>
                <div>
                    <button class="btn btn-default btn-sm me-2" data-action="volver" style="border-color: {{colors.grisFondo}}; color: {{colors.secundario}};">
                        <i class="fas fa-arrow-left me-1"></i> Volver
                    </button>
                    <button class="btn btn-success btn-sm" data-action="exportar" style="background-color: {{colors.primario}}; border-color: {{colors.primario}};">
                        <i class="fas fa-file-excel me-1"></i> Exportar Reporte
                    </button>
                </div>
            </div>
        </div>
    </div>
    
    {{#if isLoading}}
        <div id="estadisticas-container">
            <div class="text-center" style="padding: 60px;">
                <div class="spinner-large" style="border-color: {{colors.grisFondo}}; border-top-color: {{colors.primario}};"></div>
                <h4 class="mt-3" style="color: {{colors.secundario}};">Cargando estadísticas del asesor...</h4>
                <p style="color: {{colors.grisMedio}};">Obteniendo información detallada</p>
            </div>
        </div>
    {{else}}
        {{#unless stats.totalEncuestas}}
            <div id="estadisticas-container">
                <div class="text-center" style="padding: 60px;">
                    <div style="color: {{colors.grisMedio}}; font-size: 48px; margin-bottom: 20px;">
                        <i class="fas fa-chart-bar"></i>
                    </div>
                    <h4 style="color: {{colors.secundario}};">No hay datos disponibles</h4>
                    <p style="color: {{colors.grisMedio}};">Este asesor no tiene encuestas registradas</p>
                </div>
            </div>
        {{else}}            
            <div id="graficos-container">
                <!-- Aquí se insertarán los gráficos dinámicamente desde JavaScript -->
                <div style="text-align: center; padding: 40px; color: {{colors.grisClaro}};">
                    <i class="fas fa-spinner fa-spin" style="font-size: 36px; margin-bottom: 15px;"></i>
                    <p style="font-size: 14px; margin: 0;">Cargando gráficos...</p>
                </div>
            </div>
            
            <div id="comentarios-container" class="comentarios-wrapper" style="min-height: 200px;">
                <div style="text-align: center; padding: 20px; color: {{colors.grisClaro}};">
                    <i class="fas fa-spinner fa-spin" style="font-size: 20px;"></i>
                    <p style="margin-top: 10px; font-size: 0.9em;">Cargando comentarios...</p>
                </div>
            </div>
        {{/unless}}
    {{/if}}
</div>

<style>
/* Estilos específicos para la vista de estadísticas de asesor */
.asesor-header-card {
    transition: all 0.3s ease;
}

.asesor-header-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(184, 162, 121, 0.15);
}

.info-badge {
    transition: all 0.3s ease;
}

.info-badge:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.stat-card {
    transition: all 0.3s ease;
}

.stat-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.1);
}

/* Responsive */
@media (max-width: 768px) {
    .asesor-header-card .row {
        flex-direction: column;
        text-align: center;
    }
    
    .asesor-avatar {
        margin-bottom: 20px;
    }
    
    .info-badge {
        margin-bottom: 10px;
    }
}

/* Spinner de carga */
.spinner-large {
    display: inline-block;
    width: 3rem;
    height: 3rem;
    border: 3px solid #E6E6E6;
    border-top: 3px solid #B8A279;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Contenedor de gráficos */
#graficos-container {
    padding: 20px;
}

.seccion-operaciones {
    background: white;
    border-radius: 12px;
    padding: 25px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    margin-bottom: 25px;
}

.grafico-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
    border: 1px solid #E6E6E6;
    height: 100%;
    margin-bottom: 25px;
}

.graficos-secundarios {
    margin-top: 30px;
}

.comentarios-wrapper {
    min-height: 200px;
    padding: 20px;
    background: #F9F9F9;
    border-radius: 8px;
    border: 1px solid #E6E6E6;
    margin-top: 30px;
}
</style>