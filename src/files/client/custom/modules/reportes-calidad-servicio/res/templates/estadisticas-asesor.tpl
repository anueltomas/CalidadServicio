<div class="container-fluid">
    <div class="row mb-4">
        <div class="col-md-12">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h1 class="h3 mb-0">
                        <i class="fas fa-chart-bar me-2" style="color: #B8A279;"></i>
                        Estadísticas Detalladas del Asesor
                    </h1>
                    <p class="mb-0" style="color: #666666;">
                        <i class="fas fa-user-tie me-1" style="color: #363438;"></i> 
                        Asesor: <strong id="nombre-asesor" style="color: #363438;">{{infoAsesor.nombre}}</strong>
                    </p>
                </div>
                <div>
                    <button class="btn btn-default btn-sm me-2" data-action="volver" style="border-color: #E6E6E6; color: #363438;">
                        <i class="fas fa-arrow-left me-1"></i> Volver
                    </button>
                    <button class="btn btn-success btn-sm" data-action="exportar" style="background-color: #B8A279; border-color: #B8A279;">
                        <i class="fas fa-file-excel me-1"></i> Exportar Reporte
                    </button>
                </div>
            </div>
        </div>
    </div>
    
    <div id="estadisticas-container">
        <!-- Contenido dinámico -->
    </div>
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
</style>