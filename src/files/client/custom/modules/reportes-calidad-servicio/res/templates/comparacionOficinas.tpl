<div class="comparacion-container" style="padding: 20px; min-height: 100vh; background: #f5f5f5;">
    <!-- Header -->
    <div class="header-section" style="
        background: linear-gradient(135deg, #B8A279 0%, #D4C19C 100%);
        color: white;
        padding: 20px 30px;
        border-radius: 8px;
        margin-bottom: 30px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    ">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
            <div>
                <h2 style="margin: 0; font-weight: 600; font-size: 1.5em;">
                    <i class="fas fa-building"></i> Comparación de Oficinas - {{claNombre}}
                </h2>
                <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 0.95em;">
                    Oficinas ordenadas por evaluación
                </p>
            </div>
            <button data-action="volver" class="btn btn-default" style="
                background: #666666;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 8px;
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(102, 102, 102, 0.4)';" 
            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                <i class="fas fa-arrow-left"></i> Volver
            </button>
        </div>
    </div>

    {{#if cargando}}
        <!-- Estado de carga -->
        <div style="
            background: white;
            border-radius: 12px;
            padding: 80px 40px;
            text-align: center;
            box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        ">
            <div class="spinner-large" style="
                width: 60px;
                height: 60px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #B8A279;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 25px;
            "></div>
            <h4 style="color: #2c3e50; margin: 0 0 10px 0;">Cargando datos de comparación...</h4>
            <p style="color: #7f8c8d; margin: 0;">Obteniendo estadísticas de las oficinas</p>
        </div>
    {{else}}
        {{#if oficinas.length}}
            <!-- Gráfico de Comparación -->
            <div class="grafico-section" style="
                background: white;
                border-radius: 12px;
                padding: 30px;
                margin-bottom: 30px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.08);
                border: 1px solid #f0f0f0;
            ">
                <h3 style="
                    text-align: center;
                    margin: 0 0 30px 0;
                    color: #2c3e50;
                    font-size: 1.3em;
                    font-weight: 600;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #B8A279;
                ">
                    <i class="fas fa-chart-line"></i> Gráfico de Comparación
                </h3>
                <div style="height: 500px; padding: 20px;">
                    <canvas id="chart-comparacion-oficinas"></canvas>
                </div>
            </div>

            <!-- Tabla de Detalles -->
            <div class="tabla-section" style="
                background: white;
                border-radius: 12px;
                padding: 30px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.08);
                border: 1px solid #f0f0f0;
            ">
                <h3 style="
                    text-align: center;
                    margin: 0 0 30px 0;
                    color: #2c3e50;
                    font-size: 1.3em;
                    font-weight: 600;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #B8A279;
                ">
                    <i class="fas fa-table"></i> Detalles de Comparación
                </h3>
                
                <div style="overflow-x: auto;">
                    <table style="
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 14px;
                    ">
                        <thead>
                            <tr style="
                                background: linear-gradient(135deg, #B8A279 0%, #D4C19C 100%);
                                color: white;
                            ">
                                <th style="padding: 15px; text-align: left; font-weight: 600; border-radius: 8px 0 0 0;">#</th>
                                <th style="padding: 15px; text-align: left; font-weight: 600;">Oficina</th>
                                <th style="padding: 15px; text-align: center; font-weight: 600;">Total Encuestas</th>
                                <th style="padding: 15px; text-align: center; font-weight: 600;">Satisfacción Promedio</th>
                                <th style="padding: 15px; text-align: center; font-weight: 600; border-radius: 0 8px 0 0;">% Evaluación</th>
                            </tr>
                        </thead>
                        <tbody>
                            {{#each oficinas}}
                            <tr style="
                                border-bottom: 1px solid #f0f0f0;
                                transition: background 0.3s ease;
                            " onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='white'">
                                <td style="padding: 15px; font-weight: 600; color: #2c3e50;">
                                    {{increment @index}}
                                </td>
                                <td style="padding: 15px; font-weight: 600; color: #2c3e50;">
                                    <i class="fas fa-building" style="color: #B8A279; margin-right: 8px;"></i>
                                    {{nombre}}
                                </td>
                                <td style="padding: 15px; text-align: center;">
                                    <span style="
                                        display: inline-block;
                                        background: #f8f9fa;
                                        padding: 4px 12px;
                                        border-radius: 20px;
                                        font-weight: 600;
                                        color: #2c3e50;
                                    ">
                                        {{totalEncuestas}}
                                    </span>
                                </td>
                                <td style="padding: 15px; text-align: center; font-weight: 600;">
                                    {{satisfaccionPromedio}} / 5
                                </td>
                                <td style="padding: 15px; text-align: center;">
                                    <span style="
                                        display: inline-block;
                                        background: {{#if (gte porcentaje 80)}}rgba(157, 139, 100, 0.2){{else}}{{#if (gte porcentaje 60)}}rgba(168, 153, 104, 0.2){{else}}rgba(102, 102, 102, 0.1){{/if}}{{/if}};
                                        color: {{#if (gte porcentaje 80)}}#9D8B64{{else}}{{#if (gte porcentaje 60)}}#A89968{{else}}#666666{{/if}}{{/if}};
                                        padding: 6px 16px;
                                        border-radius: 20px;
                                        font-weight: 700;
                                        min-width: 70px;
                                        font-size: 15px;
                                    ">
                                        {{porcentaje}}%
                                    </span>
                                </td>
                            </tr>
                            {{/each}}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Botones de acción inferiores -->
            <div style="
                display: flex;
                justify-content: center;
                gap: 15px;
                margin-top: 40px;
                padding-top: 30px;
                border-top: 1px solid #e9ecef;
            ">
                <button data-action="volver" class="btn btn-default" style="
                    background: #666666;
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(102, 102, 102, 0.4)';" 
                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                    <i class="fas fa-arrow-left"></i> Volver al Panel
                </button>
                
                <button onclick="window.print();" class="btn btn-primary" style="
                    background: linear-gradient(135deg, #B8A279 0%, #D4C19C 100%);
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(184, 162, 121, 0.4)';" 
                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                    <i class="fas fa-print"></i> Imprimir Reporte
                </button>
            </div>
        {{else}}
            <!-- Sin datos -->
            <div style="
                background: white;
                border-radius: 12px;
                padding: 80px 40px;
                text-align: center;
                box-shadow: 0 4px 15px rgba(0,0,0,0.08);
            ">
                <i class="fas fa-info-circle" style="font-size: 64px; color: #bdc3c7; margin-bottom: 20px;"></i>
                <h3 style="color: #2c3e50; margin: 0 0 10px 0;">No hay datos disponibles</h3>
                <p style="color: #7f8c8d; margin: 0 0 30px 0;">No se encontraron oficinas para comparar en este CLA</p>
                <button data-action="volver" class="btn btn-default" style="
                    background: #666666;
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                ">
                    <i class="fas fa-arrow-left"></i> Volver
                </button>
            </div>
        {{/if}}
    {{/if}}
</div>

<style>
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

@media print {
    .header-section button,
    .tabla-section + div {
        display: none !important;
    }
}

@media (max-width: 768px) {
    .comparacion-container {
        padding: 10px !important;
    }
    
    .header-section {
        padding: 15px !important;
    }
    
    .header-section h2 {
        font-size: 1.2em !important;
    }
    
    .grafico-section,
    .tabla-section {
        padding: 15px !important;
    }
    
    table {
        font-size: 12px !important;
    }
    
    table th,
    table td {
        padding: 10px 8px !important;
    }
}
</style>