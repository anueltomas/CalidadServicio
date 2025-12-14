<div class="comparacion-container" style="padding: 20px; min-height: 100vh;">
    <div class="header-section" style="
        background: linear-gradient(135deg, #B8A279 0%, #D4C19C 100%);
        color: white;
        padding: 20px 30px;
        border-radius: 8px;
        margin-bottom: 30px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    ">
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <h2 style="margin: 0; font-weight: 600;">
                <i class="fas fa-chart-bar"></i> Comparación de Asesores - {{oficinaNombre}}
            </h2>
            <button data-action="volver" class="btn btn-default" style="
                background: #666666;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                font-weight: 600;
                cursor: pointer;
            ">
                <i class="fas fa-arrow-left"></i> Volver
            </button>
        </div>
    </div>

    {{#if cargando}}
        <div style="text-align: center; padding: 60px;">
            <div class="spinner"></div>
            <p style="margin-top: 20px; color: #7f8c8d;">Cargando datos de comparación...</p>
        </div>
    {{else}}
        {{#if asesores.length}}
            <!-- Gráfico -->
            <div class="grafico-section" style="
                background: white;
                border-radius: 12px;
                padding: 30px;
                margin-bottom: 30px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.08);
            ">
                <h3 style="text-align: center; margin-bottom: 30px; color: #2c3e50;">
                    Gráfico de Comparación
                </h3>
                <div style="height: 500px;">
                    <canvas id="chart-comparacion-asesores"></canvas>
                </div>
            </div>

            <!-- Tabla -->
            <div class="tabla-section" style="
                background: white;
                border-radius: 12px;
                padding: 30px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.08);
            ">
                <h3 style="text-align: center; margin-bottom: 30px; color: #2c3e50;">
                    Detalles de Comparación
                </h3>
                <table class="table" style="width: 100%;">
                    <thead style="background: linear-gradient(135deg, #B8A279 0%, #D4C19C 100%); color: white;">
                        <tr>
                            <th style="padding: 15px;">#</th>
                            <th style="padding: 15px;">Asesor</th>
                            <th style="padding: 15px;">Total Encuestas</th>
                            <th style="padding: 15px;">Promedio</th>
                            <th style="padding: 15px;">% Desempeño</th>
                        </tr>
                    </thead>
                    <tbody>
                        {{#each asesores}}
                        <tr style="border-bottom: 1px solid #f0f0f0;">
                            <td style="padding: 12px;">{{@index}}</td>
                            <td style="padding: 12px; font-weight: 600;">{{nombre}}</td>
                            <td style="padding: 12px; text-align: center;">{{totalEncuestas}}</td>
                            <td style="padding: 12px; text-align: center;">{{promedioGeneral}}</td>
                            <td style="padding: 12px; text-align: center;">
                                <span style="
                                    background: {{#if (gte porcentaje 80)}}#9D8B64{{else}}{{#if (gte porcentaje 60)}}#A89968{{else}}#999999{{/if}}{{/if}};
                                    color: white;
                                    padding: 4px 12px;
                                    border-radius: 20px;
                                    font-weight: 700;
                                ">
                                    {{porcentaje}}%
                                </span>
                            </td>
                        </tr>
                        {{/each}}
                    </tbody>
                </table>
            </div>
        {{else}}
            <div style="text-align: center; padding: 60px;">
                <i class="fas fa-info-circle" style="font-size: 48px; color: #95a5a6;"></i>
                <p style="margin-top: 20px; color: #7f8c8d;">No hay datos disponibles</p>
            </div>
        {{/if}}
    {{/if}}
</div>