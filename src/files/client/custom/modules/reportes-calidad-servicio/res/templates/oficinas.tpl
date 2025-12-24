<div class="container-fluid oficinas-comparacion-container">
    <!-- Header principal -->
    <div class="row mb-4">
        <div class="col-md-12">
            <div class="page-header-card">
                <div class="d-flex justify-content-between align-items-start flex-wrap">
                    <div class="header-left" style="flex: 1;">
                        <div class="header-icon">
                            <i class="fas fa-building"></i>
                        </div>
                        <div class="header-content">
                            <h1 class="page-title">Comparación de Oficinas</h1>
                            <p class="page-subtitle">
                                Análisis comparativo del desempeño por CLA
                            </p>
                        </div>
                    </div>
                    <div class="header-actions">
                        <button class="btn btn-volver" data-action="volver">
                            <i class="fas fa-arrow-left me-2"></i> Volver al Panel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Filtro CLA -->
    <div class="row mb-4">
        <div class="col-md-12">
            <div class="filtro-card">
                <div class="filtro-header">
                    <div class="filtro-title-wrapper">
                        <i class="fas fa-filter filtro-title-icon"></i>
                        <h3 class="filtro-title">Seleccionar CLA</h3>
                    </div>
                    <p class="filtro-description">
                        Elija un CLA para visualizar la comparación de satisfacción entre sus oficinas
                    </p>
                </div>
                <div class="filtro-body">
                    <div class="filtro-select-wrapper">
                        <select id="select-cla" class="filtro-select" {{#if isLoading}}disabled{{/if}}>
                            <option value="">Cargando CLAs...</option>
                        </select>
                        <div class="filtro-actions">
                            <button class="btn btn-action btn-refrescar" data-action="refrescar">
                                <i class="fas fa-sync-alt me-2"></i> Actualizar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Contenido dinámico -->
    <div id="oficinas-container">
        {{#if isLoading}}
        <!-- Loading State -->
        <div class="text-center" style="padding: 80px 20px;">
            <div class="spinner-large"></div>
            <h4 class="mt-4" style="color: #1A1A1A; font-weight: 600; margin-bottom: 10px;">
                Cargando comparación de oficinas...
            </h4>
            <p style="color: #666666; max-width: 500px; margin: 0 auto;">
                Obteniendo datos de satisfacción y recomendación de todas las oficinas
            </p>
        </div>
        {{else}}
            {{#if datosOficinas.length}}
                <!-- Los datos se cargarán aquí dinámicamente -->
            {{else}}
                <!-- No Data State -->
                <div class="no-data-card">
                    <div class="no-data-icon">
                        <i class="fas fa-building"></i>
                    </div>
                    <h3 class="no-data-title">No hay datos de oficinas disponibles</h3>
                    <p class="no-data-text">Seleccione un CLA para ver la comparación de oficinas</p>
                    <p class="no-data-hint">Asegúrese de que el CLA seleccionado tenga oficinas con encuestas completadas</p>
                </div>
            {{/if}}
        {{/if}}
    </div>
</div>

<!-- Tooltip personalizado para Chart.js -->
<div id="custom-tooltip" class="chart-custom-tooltip" style="display: none; position: absolute; background: white; border: 1px solid #E6E6E6; border-radius: 4px; padding: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); z-index: 1000; pointer-events: none;">
    <div class="tooltip-content"></div>
</div>

<!-- Estilos CSS integrados -->
<!-- Estilos CSS integrados - VERSIÓN UNIFICADA -->
<style>
    /* Estilos base */
    .oficinas-comparacion-container {
        padding: 30px;
        background-color: #F5F5F5;
        min-height: 100vh;
    }

    /* Estilos para tarjetas generales */
    .page-header-card,
    .filtro-card,
    .resumen-cla-card,
    .grafico-principal-card,
    .no-data-card {
        background: #FFFFFF;
        border-radius: 12px;
        padding: 30px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        border: 1px solid #E6E6E6;
        margin-bottom: 30px;
    }

    /* Header principal */
    .header-left {
        display: flex;
        align-items: center;
        gap: 20px;
        flex: 1;
    }

    .header-icon {
        width: 60px;
        height: 60px;
        background: #B8A279;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 28px;
    }

    .header-content {
        flex: 1;
    }

    .page-title {
        color: #1A1A1A;
        font-weight: 700;
        font-size: 32px;
        margin: 0 0 8px 0;
        line-height: 1.2;
    }

    .page-subtitle {
        color: #666666;
        font-size: 16px;
        margin: 12px 0 0 0;
        font-weight: 400;
    }

    .header-actions {
        align-self: flex-start;
    }

    /* Botones header */
    .btn-volver {
        background: #FFFFFF;
        color: #666666;
        border: 2px solid #E6E6E6;
        border-radius: 8px;
        padding: 12px 24px;
        font-weight: 600;
        font-size: 14px;
        transition: all 0.3s ease;
        display: inline-flex;
        align-items: center;
        cursor: pointer;
        white-space: nowrap;
    }

    .btn-volver:hover {
        background: #F5F5F5;
        border-color: #B8A279;
        color: #B8A279;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(184, 162, 121, 0.15);
    }

    /* Filtro card */
    .filtro-header {
        margin-bottom: 25px;
    }

    .filtro-title-wrapper {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 10px;
    }

    .filtro-title-icon {
        color: #B8A279;
        font-size: 20px;
    }

    .filtro-title {
        color: #1A1A1A;
        font-weight: 600;
        font-size: 20px;
        margin: 0;
    }

    .filtro-description {
        color: #666666;
        font-size: 15px;
        margin: 0;
        line-height: 1.5;
    }

    .filtro-body {
        padding-top: 20px;
        border-top: 1px solid #E6E6E6;
    }

    .filtro-select-wrapper {
        display: flex;
        gap: 15px;
        align-items: center;
    }

    .filtro-select {
        flex: 1;
        padding: 14px 18px;
        border: 2px solid #E6E6E6;
        border-radius: 8px;
        font-size: 15px;
        color: #1A1A1A;
        background: #FFFFFF;
        transition: all 0.3s ease;
        cursor: pointer;
        font-weight: 500;
    }

    .filtro-select:focus {
        border-color: #B8A279;
        outline: none;
        box-shadow: 0 0 0 3px rgba(184, 162, 121, 0.1);
    }

    .filtro-select:disabled {
        background: #F5F5F5;
        color: #999999;
        cursor: not-allowed;
    }

    .filtro-actions {
        display: flex;
        gap: 10px;
        flex-shrink: 0;
    }

    /* Botones de acción */
    .btn-action {
        border-radius: 8px;
        padding: 14px 24px;
        font-weight: 600;
        font-size: 14px;
        border: none;
        cursor: pointer;
        transition: all 0.3s ease;
        display: inline-flex;
        align-items: center;
        white-space: nowrap;
    }

    .btn-refrescar {
        background: #363438;
        color: white;
    }

    .btn-refrescar:hover {
        background: #2A2A2E;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(54, 52, 56, 0.2);
    }

    .btn-exportar {
        background: #B8A279;
        color: white;
    }

    .btn-exportar:hover {
        background: #9D8B5F;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(184, 162, 121, 0.2);
    }

    /* Loading State */
    .spinner-large {
        width: 60px;
        height: 60px;
        border: 4px solid #E6E6E6;
        border-top: 4px solid #B8A279;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    /* No Data State */
    .no-data-card {
        text-align: center;
        padding: 80px 40px;
    }

    .no-data-icon {
        font-size: 72px;
        color: #E6E6E6;
        margin-bottom: 30px;
    }

    .no-data-title {
        color: #666666;
        font-weight: 600;
        font-size: 24px;
        margin: 0 0 15px 0;
    }

    .no-data-text {
        color: #999999;
        font-size: 16px;
        margin: 0 0 10px 0;
        max-width: 500px;
        margin: 0 auto 10px;
    }

    .no-data-hint {
        color: #CCCCCC;
        font-size: 14px;
        margin: 0;
        font-style: italic;
    }

    /* Resumen CLA - CORRECCIONES PARA ALTURAS IGUALES */
    .resumen-cla-header {
        margin-bottom: 25px;
    }

    .resumen-cla-title {
        color: #1A1A1A;
        font-weight: 700;
        font-size: 24px;
        margin: 0 0 8px 0;
        display: flex;
        align-items: center;
    }

    .resumen-cla-subtitle {
        color: #666666;
        font-size: 16px;
        font-weight: 500;
    }

    .resumen-cla-body {
        padding-top: 20px;
        border-top: 1px solid #E6E6E6;
    }

    /* Contenedor de las columnas para igualar alturas */
    .resumen-cla-body .row {
        display: flex;
        flex-wrap: wrap;
    }

    .resumen-cla-body .col-md-3,
    .resumen-cla-body .col-sm-6 {
        display: flex;
        margin-bottom: 20px;
    }

    /* Elementos de estadísticas - ALTURAS IGUALES */
    .resumen-stat {
        background: #FFFFFF;
        border: 1px solid #E6E6E6;
        border-radius: 10px;
        padding: 20px;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 15px;
        flex: 1;
        min-height: 110px;
        width: 100%;
        box-sizing: border-box;
    }

    .resumen-stat:hover {
        border-color: #B8A279;
        transform: translateY(-3px);
        box-shadow: 0 4px 12px rgba(184, 162, 121, 0.1);
    }

    .resumen-stat-icon {
        width: 50px;
        height: 50px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .resumen-stat-content {
        flex: 1;
        min-width: 0;
        padding: 0 10px 0 0;
    }

    /* ✅ CORRECCIÓN: Asegurar que todos los elementos tengan el mismo padding */
    .resumen-stat-content:last-child {
        padding-right: 0;
    }

    .resumen-stat-value {
        color: #1A1A1A;
        font-weight: 700;
        font-size: 24px;
        margin-bottom: 5px;
        line-height: 1;
        word-break: break-word;
    }

    .resumen-stat-label {
        color: #666666;
        font-size: 14px;
        font-weight: 500;
        line-height: 1.3;
        margin-right: 10px;
        padding-right: 5px;
    }

    /* Gráfico principal - CORREGIDO */
    .grafico-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 30px;
        flex-wrap: wrap;
        gap: 20px;
    }

    .grafico-title {
        color: #1A1A1A;
        font-weight: 700;
        font-size: 22px;
        margin: 0 0 8px 0;
        display: flex;
        align-items: center;
    }

    /* ✅ CORRECCIÓN: Eliminado max-width: 500px que estaba cortando el texto */
    .grafico-subtitle {
        color: #666666;
        font-size: 15px;
        margin: 0;
        line-height: 1.4;
        word-break: break-word;
        overflow-wrap: break-word;
    }

    .grafico-legend {
        display: flex;
        gap: 15px;
        flex-wrap: wrap;
    }

    .legend-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        background: #F5F5F5;
        border-radius: 20px;
        border: 1px solid #E6E6E6;
    }

    .legend-color {
        width: 14px;
        height: 14px;
        border-radius: 3px;
        display: inline-block;
    }

    .legend-text {
        font-size: 12px;
        color: #666666;
        font-weight: 500;
        white-space: nowrap;
    }

    .grafico-body {
        padding-top: 20px;
        border-top: 1px solid #E6E6E6;
    }

    /* ✅ ESTILOS CORREGIDOS PARA EL GRÁFICO */
    .grafico-wrapper {
        height: 500px;
        position: relative;
        width: 100%;
    }

    .grafico-canvas-container {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        height: 100%;
        min-height: 400px;
        background: white;
        border-radius: 8px;
        overflow: hidden;
    }

    #grafico-barras-horizontales {
        width: 100% !important;
        height: 100% !important;
        display: block;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
        cursor: pointer;
    }

    /* Alternativa HTML para gráfico */
    .chart-alternative {
        padding: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        height: 100%;
        overflow-y: auto;
    }

    .alternative-header {
        margin-bottom: 20px;
    }

    .alternative-body {
        max-height: 400px;
        overflow-y: auto;
        padding-right: 10px;
    }

    .alternative-bar {
        margin-bottom: 15px;
        padding: 10px;
        background: #f9f9f9;
        border-radius: 6px;
        border: 1px solid #eee;
        cursor: pointer;
    }

    .bar-label {
        display: flex;
        justify-content: space-between;
        margin-bottom: 5px;
    }

    .bar-container {
        height: 30px;
        background: #E6E6E6;
        border-radius: 4px;
        overflow: hidden;
        position: relative;
    }

    .bar-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.5s ease;
    }

    .bar-value {
        margin-top: 5px;
        font-size: 11px;
        color: #999999;
        display: flex;
        justify-content: space-between;
    }

    /* Tooltip personalizado */
    .chart-custom-tooltip {
        background: #FFFFFF !important;
        border: 1px solid #E6E6E6 !important;
        border-radius: 4px !important;
        padding: 12px !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
        z-index: 1000 !important;
        pointer-events: none !important;
        font-size: 13px !important;
        line-height: 1.4 !important;
        max-width: 300px !important;
    }

    .chart-custom-tooltip .tooltip-content {
        color: #1A1A1A !important;
    }

    .chart-custom-tooltip .tooltip-content div {
        margin-bottom: 4px !important;
    }

    .chart-custom-tooltip .tooltip-content div:last-child {
        margin-bottom: 0 !important;
    }

    /* Responsive Design */
    @media (max-width: 1200px) {
        .grafico-wrapper {
            height: 450px;
        }
        
        .grafico-canvas-container {
            min-height: 350px;
        }
    }

    @media (max-width: 992px) {
        .oficinas-comparacion-container {
            padding: 20px;
        }
        
        .page-header-card,
        .filtro-card,
        .resumen-cla-card,
        .grafico-principal-card {
            padding: 25px;
        }
        
        .grafico-header {
            flex-direction: column;
            gap: 15px;
        }
        
        .grafico-legend {
            width: 100%;
            justify-content: flex-start;
        }
        
        .grafico-wrapper {
            height: 400px;
        }
        
        .grafico-canvas-container {
            min-height: 300px;
        }
        
        .alternative-body {
            max-height: 350px;
        }
        
        /* Ajustes para estadísticas en tablets */
        .resumen-stat {
            min-height: 100px;
            padding: 18px;
        }
        
        .resumen-stat-icon {
            width: 45px;
            height: 45px;
        }
        
        .resumen-stat-value {
            font-size: 22px;
        }
    }

    @media (max-width: 768px) {
        .oficinas-comparacion-container {
            padding: 15px;
        }
        
        .page-header-card,
        .filtro-card,
        .resumen-cla-card,
        .grafico-principal-card {
            padding: 20px;
        }
        
        .header-left {
            flex-direction: column;
            text-align: center;
            gap: 15px;
        }
        
        .header-content {
            text-align: center;
        }
        
        .page-title {
            font-size: 28px;
        }
        
        .filtro-select-wrapper {
            flex-direction: column;
            align-items: stretch;
        }
        
        .filtro-actions {
            width: 100%;
        }
        
        .btn-action {
            flex: 1;
            justify-content: center;
        }
        
        .resumen-stat {
            flex-direction: column;
            text-align: center;
            gap: 12px;
            padding: 15px;
        }
        
        .resumen-stat-content {
            padding: 0;
        }
        
        .grafico-title {
            font-size: 20px;
        }
        
        .grafico-wrapper {
            height: 350px;
        }
        
        .grafico-canvas-container {
            min-height: 250px;
        }
        
        .legend-item {
            padding: 5px 10px;
            font-size: 11px;
        }
        
        .alternative-body {
            max-height: 300px;
        }
    }

    @media (max-width: 576px) {
        .oficinas-comparacion-container {
            padding: 10px;
        }
        
        .page-header-card,
        .filtro-card,
        .resumen-cla-card,
        .grafico-principal-card {
            padding: 15px;
        }
        
        .page-title {
            font-size: 24px;
        }
        
        .header-icon {
            width: 50px;
            height: 50px;
            font-size: 24px;
        }
        
        .resumen-cla-title {
            font-size: 20px;
        }
        
        .resumen-stat-value {
            font-size: 20px;
        }
        
        .grafico-title {
            font-size: 18px;
        }
        
        .grafico-wrapper {
            height: 300px;
        }
        
        .grafico-canvas-container {
            min-height: 200px;
        }
        
        .legend-item {
            padding: 5px 8px;
        }
        
        .legend-text {
            font-size: 10px;
        }
        
        .alternative-body {
            max-height: 250px;
        }
    }

    @media (max-width: 480px) {
        .grafico-wrapper {
            height: 250px;
        }
        
        .grafico-canvas-container {
            min-height: 150px;
        }
        
        .resumen-stat-icon {
            width: 40px;
            height: 40px;
        }
        
        .resumen-stat-value {
            font-size: 18px;
        }
        
        .btn-volver,
        .btn-action {
            padding: 10px 16px;
            font-size: 13px;
        }
    }

    @media (max-width: 360px) {
        .grafico-wrapper {
            height: 200px;
        }
        
        .grafico-canvas-container {
            min-height: 120px;
        }
        
        .resumen-stat {
            padding: 12px;
        }
        
        .resumen-stat-icon {
            width: 35px;
            height: 35px;
        }
        
        .resumen-stat-value {
            font-size: 16px;
        }
        
        .resumen-stat-label {
            font-size: 12px;
        }
    }
</style>