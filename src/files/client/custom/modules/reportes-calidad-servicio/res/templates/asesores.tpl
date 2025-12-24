<div class="container-fluid">
    <div class="row mb-4">
        <div class="col-md-12">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h1 class="h3 mb-0">
                        <i class="fas fa-user-tie me-2" style="color: #B8A279;"></i>
                        Comparación de Asesores
                    </h1>
                    <p class="mb-0" style="color: #666666;">
                        <i class="fas fa-building me-1" style="color: #363438;"></i> 
                        Oficina: <strong id="nombre-oficina" style="color: #363438;">[Cargando...]</strong>
                        <span id="nombre-cla" style="color: #666666; margin-left: 15px;"></span>
                    </p>
                </div>
                <div>
                    <button class="btn btn-default btn-sm me-2" data-action="volver" style="border-color: #E6E6E6; color: #363438;">
                        <i class="fas fa-arrow-left me-1"></i> Volver
                    </button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Selector de oficina (SIN BOTÓN - CAMBIO AUTOMÁTICO) -->
    <div class="row mb-3">
        <div class="col-md-12">
            <div class="panel panel-default" style="border-color: #E6E6E6; background-color: white;">
                <div class="panel-body p-2">
                    <div class="row">
                        <div class="col-md-12">
                            <div class="form-group mb-0">
                                <label class="control-label small" style="color: #363438; font-weight: 600;">
                                    <i class="fas fa-exchange-alt me-1" style="color: #B8A279;"></i>
                                    Cambiar a otra oficina del CLA:
                                </label>
                                <select class="form-control input-sm" id="selector-oficina" style="max-width: 400px; border-color: #E6E6E6; color: #363438; margin-top: 8px;">
                                    <option value="">Cargando oficinas...</option>
                                </select>
                                <small class="text-muted" style="color: #999999; display: block; margin-top: 5px;">
                                    <i class="fas fa-info-circle me-1"></i>
                                    La vista se actualizará automáticamente al seleccionar una oficina
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div id="asesores-container">
        <!-- Contenido dinámico -->
    </div>
</div>

<style>
.asesor-row:hover {
    background-color: #F5F5F5 !important;
    transform: translateY(-1px);
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(184, 162, 121, 0.15);
}

.badge {
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 12px;
}

.progress {
    border-radius: 10px;
    overflow: hidden;
    box-shadow: inset 0 1px 2px rgba(54, 52, 56, 0.1);
    background-color: #E6E6E6;
}

.progress-bar {
    transition: width 0.6s ease;
}

/* Animación de carga */
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

.asesor-row {
    animation: fadeIn 0.3s ease-out;
}

/* Colores de la paleta ACTUALIZADA */
.bg-primary {
    background-color: #B8A279 !important;
    color: white !important;
}

.bg-secondary {
    background-color: #363438 !important;
    color: white !important;
}

.text-primary {
    color: #B8A279 !important;
}

.text-secondary {
    color: #363438 !important;
}

.text-medium {
    color: #666666 !important;
}

.text-light {
    color: #E6E6E6 !important;
}

.badge-primary {
    background-color: #B8A279 !important;
    color: white !important;
}

.badge-secondary {
    background-color: #363438 !important;
    color: white !important;
}

/* Panel estilos */
.panel {
    background-color: white;
    border: 1px solid #E6E6E6;
    border-radius: 4px;
}

.panel-default {
    border-color: #E6E6E6;
}

.panel-body {
    padding: 15px;
}

/* Botones actualizados */
.btn-default {
    background-color: white;
    border-color: #E6E6E6;
    color: #363438;
}

.btn-default:hover {
    background-color: #F5F5F5;
    border-color: #666666;
    color: #B8A279;
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(184, 162, 121, 0.2);
}

.btn-success {
    background-color: #B8A279;
    border-color: #B8A279;
    color: white;
}

.btn-success:hover {
    background-color: #9D8B5F;
    border-color: #9D8B5F;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(184, 162, 121, 0.3);
}

/* Select mejorado */
#selector-oficina {
    transition: all 0.3s ease;
    font-weight: 500;
}

#selector-oficina:focus {
    border-color: #B8A279;
    outline: none;
    box-shadow: 0 0 0 3px rgba(184, 162, 121, 0.1);
}

#selector-oficina:hover:not(:disabled) {
    border-color: #B8A279;
}

#selector-oficina:disabled {
    background-color: #F5F5F5;
    cursor: not-allowed;
    opacity: 0.6;
}

/* Responsive */
@media (max-width: 768px) {
    .d-flex.justify-content-between.align-items-center {
        flex-direction: column;
        align-items: flex-start !important;
    }
    
    .d-flex.justify-content-between.align-items-center > div:last-child {
        margin-top: 10px;
        width: 100%;
    }
    
    .d-flex.justify-content-between.align-items-center > div:last-child .btn {
        width: 100%;
        margin-bottom: 5px;
    }
    
    #selector-oficina {
        max-width: 100% !important;
    }
}

/* Spinner de carga actualizado */
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

/* Mejoras visuales adicionales */
.panel-heading {
    border-radius: 4px 4px 0 0;
}

.panel-footer {
    border-radius: 0 0 4px 4px;
}

/* Estilo para el label del selector */
.control-label {
    display: block;
    margin-bottom: 8px;
}

/* Hover effect para filas */
.table-hover tbody tr:hover {
    background-color: rgba(184, 162, 121, 0.05) !important;
}

/* Estilos para enlaces de nombres de asesores */
.nombre-asesor-link {
    transition: all 0.2s ease;
}

.nombre-asesor-link:hover {
    transform: translateX(3px);
}

.nombre-asesor-link i.fa-external-link-alt {
    transition: all 0.2s ease;
    opacity: 0.7;
}

.nombre-asesor-link:hover i.fa-external-link-alt {
    opacity: 1;
    transform: translateX(2px);
    color: ${this.colors.primary} !important;
}

.asesor-propio {
    border-left: 3px solid #B8A279 !important;
    background-color: rgba(184, 162, 121, 0.08) !important;
}

.asesor-propio:hover {
    background-color: rgba(184, 162, 121, 0.15) !important;
}

.badge-propio {
    background: linear-gradient(135deg, #B8A279, #363438) !important;
    color: white !important;
    font-weight: 700 !important;
    padding: 4px 8px !important;
    border-radius: 12px !important;
    font-size: 10px !important;
}

.cursor-permitido {
    cursor: pointer !important;
}

.cursor-denegado {
    cursor: not-allowed !important;
}

.info-permisos {
    background: linear-gradient(135deg, rgba(184, 162, 121, 0.1), rgba(54, 52, 56, 0.1));
    border-left: 4px solid #B8A279;
    padding: 10px 15px;
    border-radius: 8px;
    margin-bottom: 15px;
    font-size: 13px;
}

.info-permisos i {
    color: #B8A279;
}
</style>