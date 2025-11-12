<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Calidad de Servicio - Encuesta</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Arial, sans-serif;
        }
        
        body {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            color: #333;
            padding: 20px;
            min-height: 100vh;
        }
        
        .container-rcs {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        
        .header-rcs {
            background: linear-gradient(to right, #2c3e50, #3498db);
            color: white;
            padding: 25px 30px;
            text-align: center;
        }
        
        .h1-rcs {
            font-size: 28px;
            margin-bottom: 5px;
            font-weight: 600;
        }
        
        .subtitle-rcs {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .filters-section-rcs {
            background: #f8f9fa;
            padding: 20px 30px;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .filter-group-rcs {
            margin-bottom: 15px;
        }
        
        .filter-group-rcs label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #2c3e50;
        }
        
        .filter-select-rcs {
            width: 100%;
            padding: 10px 15px;
            border: 1px solid #ddd;
            border-radius: 6px;
            background-color: white;
            font-size: 14px;
            color: #333;
            transition: border-color 0.3s;
        }
        
        .filter-select-rcs:focus {
            outline: none;
            border-color: #3498db;
            box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
        }
        
        .filters-row-rcs {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
        }
        
        .content-rcs {
            padding: 25px 30px;
        }
        
        .info-grid-rcs {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .info-card-rcs {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 15px;
            border-left: 4px solid #3498db;
        }
        
        .info-card-rcs h3 {
            font-size: 16px;
            color: #7f8c8d;
            margin-bottom: 5px;
        }
        
        .info-card-rcs p {
            font-size: 20px;
            font-weight: 600;
            color: #2c3e50;
        }
        
        .operations-table-rcs {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0 30px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        
        .operations-table-rcs th, .operations-table-rcs td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .operations-table-rcs th {
            background-color: #3498db;
            color: white;
            font-weight: 600;
        }
        
        .operations-table-rcs tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        
        .operations-table-rcs tr:last-child {
            font-weight: bold;
            background-color: #ecf0f1;
        }
        
        .charts-container-rcs {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-top: 30px;
        }
        
        .chart-card-rcs {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.08);
            border: 1px solid #e0e0e0;
        }
        
        .chart-title-rcs {
            font-size: 18px;
            margin-bottom: 15px;
            color: #2c3e50;
            text-align: center;
            font-weight: 600;
        }
        
        .chart-wrapper-rcs {
            position: relative;
            height: 250px;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .legend-rcs {
            display: flex;
            justify-content: center;
            margin-top: 15px;
            flex-wrap: wrap;
            gap: 15px;
        }
        
        .legend-item-rcs {
            display: flex;
            align-items: center;
            font-size: 14px;
        }
        
        .legend-color-rcs {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 6px;
        }
        
        .percentage-display-rcs {
            display: flex;
            justify-content: space-around;
            margin-top: 20px;
        }
        
        .percentage-item-rcs {
            text-align: center;
        }
        
        .percentage-value-rcs {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .percentage-label-rcs {
            font-size: 14px;
            color: #7f8c8d;
        }
        
        .color-venta-rcs { background-color: #3498db; }
        .color-compra-rcs { background-color: #2ecc71; }
        .color-alquiler-rcs { background-color: #e74c3c; }
        
        /* Gráfico circular con CSS */
        .pie-chart-rcs {
            width: 200px;
            height: 200px;
            border-radius: 50%;
            background: conic-gradient(
                #3498db 0% 44%,
                #2ecc71 44% 73%,
                #e74c3c 73% 100%
            );
            position: relative;
        }
        
        .pie-center-rcs {
            position: absolute;
            width: 120px;
            height: 120px;
            background: white;
            border-radius: 50%;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }
        
        .pie-total-rcs {
            font-size: 16px;
            font-weight: bold;
            color: #2c3e50;
        }
        
        .pie-total-label-rcs {
            font-size: 12px;
            color: #7f8c8d;
        }
        
        /* Gráfico de barras con CSS */
        .bar-chart-rcs {
            display: flex;
            align-items: flex-end;
            justify-content: space-around;
            height: 180px;
            padding: 0 20px;
            position: relative;
        }
        
        .bar-container-rcs {
            display: flex;
            flex-direction: column;
            align-items: center;
            height: 100%;
        }
        
        .bar-rcs {
            width: 40px;
            border-radius: 4px 4px 0 0;
            position: relative;
            transition: height 0.5s ease;
        }
        
        .bar-label-rcs {
            margin-top: 8px;
            font-size: 14px;
            font-weight: 600;
        }
        
        .bar-value-rcs {
            position: absolute;
            top: -25px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 14px;
            font-weight: bold;
            color: #2c3e50;
        }
        
        .bar-axis-rcs {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: #95a5a6;
        }
        
        @media (max-width: 768px) {
            .filters-row-rcs {
                grid-template-columns: 1fr;
            }
            
            .info-grid-rcs, .charts-container-rcs {
                grid-template-columns: 1fr;
            }
            
            .chart-wrapper-rcs {
                height: 200px;
            }
            
            .pie-chart-rcs {
                width: 150px;
                height: 150px;
            }
            
            .pie-center-rcs {
                width: 90px;
                height: 90px;
            }
        }
    </style>
</head>
<body>
    <div class="container-rcs">
        <header class="header-rcs">
            <h1 class="h1-rcs">Información de Encuesta</h1>
            <p class="subtitle-rcs">Resultados de calidad de servicio/p>
        </header>
        
        <div class="filters-section-rcs">
            <div class="filters-row-rcs">
                
                <div class="filter-group-rcs">
                    <label for="cla">CLA</label>
                    <select id="cla" class="filter-select-rcs">
                        <option value="todos">Todos</option>
                        <option value="cla1">CLA Metropolitano</option>
                        <option value="cla2">CLA Norte</option>
                        <option value="cla3">CLA Sur</option>
                        <option value="cla4">CLA Central</option>
                        <option value="cla5">CLA Occidental</option>
                        <option value="cla6">CLA Oriental</option>
                        <option value="cla7">CLA Capital</option>
                        <option value="cla8">CLA Costa</option>
                        <option value="cla9">CLA Montaña</option>
                        <option value="cla10">CLA Frontera</option>
                    </select>
                </div>
                
                <div class="filter-group-rcs">
                    <label for="oficinas">Oficinas</label>
                    <select id="oficinas" class="filter-select-rcs">
                        <option value="todos">Todos</option>
                        <option value="of1">Oficina Central</option>
                        <option value="of2">Sucursal Norte</option>
                        <option value="of3">Sucursal Sur</option>
                        <option value="of4">Sucursal Este</option>
                        <option value="of5">Sucursal Oeste</option>
                        <option value="of6">Sucursal Centro</option>
                        <option value="of7">Sucursal Plaza</option>
                        <option value="of8">Sucursal Comercial</option>
                        <option value="of9">Sucursal Residencial</option>
                        <option value="of10">Sucursal Ejecutiva</option>
                    </select>
                </div>
            </div>
        </div>
        
        <div class="content-rcs">
            <div class="info-grid-rcs">
                <div class="info-card-rcs">
                    <h3>Total encuestados</h3>
                    <p>{{totalEncuestados}}</p>
                </div>
                <div class="info-card-rcs">
                    <h3>Fecha de Actualización</h3>
                    <p>lunes, 31 de marzo de 2025</p>
                </div>
            </div>
            
            <h2>¿Qué tipo de operación realizó?</h2>
            
            <table class="operations-table-rcs">
                <thead>
                    <tr>
                        <th>Opción</th>
                        <th>Cantidad</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Venta</td>
                        <td>95</td>
                    </tr>
                    <tr>
                        <td>Compra</td>
                        <td>63</td>
                    </tr>
                    <tr>
                        <td>Alquiler</td>
                        <td>58</td>
                    </tr>
                    <tr>
                        <td><strong>Total de Operaciones Individualmente:</strong></td>
                        <td><strong>216</strong></td>
                    </tr>
                </tbody>
            </table>
            
            <div class="percentage-display-rcs">
                <div class="percentage-item-rcs">
                    <div class="percentage-value-rcs">44%</div>
                    <div class="percentage-label-rcs">Venta</div>
                </div>
                <div class="percentage-item-rcs">
                    <div class="percentage-value-rcs">29%</div>
                    <div class="percentage-label-rcs">Compra</div>
                </div>
                <div class="percentage-item-rcs">
                    <div class="percentage-value-rcs">27%</div>
                    <div class="percentage-label-rcs">Alquiler</div>
                </div>
            </div>
            
            <div class="charts-container-rcs">
                <div class="chart-card-rcs">
                    <div class="chart-title-rcs">Distribución de Operaciones</div>
                    <div class="chart-wrapper-rcs">
                        <!-- Gráfico circular con CSS puro -->
                        <div class="pie-chart-rcs">
                            <div class="pie-center-rcs">
                                <div class="pie-total-rcs">216</div>
                                <div class="pie-total-label-rcs">Total</div>
                            </div>
                        </div>
                    </div>
                    <div class="legend-rcs">
                        <div class="legend-item-rcs">
                            <span class="legend-color-rcs color-venta-rcs"></span>
                            Venta (44%)
                        </div>
                        <div class="legend-item-rcs">
                            <span class="legend-color-rcs color-compra-rcs"></span>
                            Compra (29%)
                        </div>
                        <div class="legend-item-rcs">
                            <span class="legend-color-rcs color-alquiler-rcs"></span>
                            Alquiler (27%)
                        </div>
                    </div>
                </div>
                
                <div class="chart-card-rcs">
                    <div class="chart-title-rcs">Comparación de Operaciones</div>
                    <div class="chart-wrapper-rcs">
                        <!-- Gráfico de barras con CSS puro -->
                        <div class="bar-chart-rcs">
                            <div class="bar-axis-rcs"></div>
                            <div class="bar-container-rcs">
                                <div class="bar-rcs color-venta-rcs" style="height: 95px;">
                                    <div class="bar-value-rcs">95</div>
                                </div>
                                <div class="bar-label-rcs">Venta</div>
                            </div>
                            <div class="bar-container-rcs">
                                <div class="bar-rcs color-compra-rcs" style="height: 63px;">
                                    <div class="bar-value-rcs">63</div>
                                </div>
                                <div class="bar-label-rcs">Compra</div>
                            </div>
                            <div class="bar-container-rcs">
                                <div class="bar-rcs color-alquiler-rcs" style="height: 58px;">
                                    <div class="bar-value-rcs">58</div>
                                </div>
                                <div class="bar-label-rcs">Alquiler</div>
                            </div>
                        </div>
                    </div>
                    <div class="legend-rcs">
                        <div class="legend-item-rcs">
                            <span class="legend-color-rcs color-venta-rcs"></span>
                            Venta
                        </div>
                        <div class="legend-item-rcs">
                            <span class="legend-color-rcs color-compra-rcs"></span>
                            Compra
                        </div>
                        <div class="legend-item-rcs">
                            <span class="legend-color-rcs color-alquiler-rcs"></span>
                            Alquiler
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Datos de la encuesta
        const data = {
            venta: 95,
            compra: 63,
            alquiler: 58,
            total: 216
        };
        
        // Función para simular el filtrado de datos
        function aplicarFiltros() {
            // En una aplicación real, aquí se haría una llamada a una API
            // o se filtrarían los datos localmente según los selectores
            console.log("Filtros aplicados:");
            console.log("Territorio:", document.getElementById('territorio').value);
            console.log("CLA:", document.getElementById('cla').value);
            console.log("Oficinas:", document.getElementById('oficinas').value);
            
            // Simular cambio de datos (en una aplicación real, estos vendrían del servidor)
            // Por ahora, solo mostramos un mensaje
            alert("Filtros aplicados. En una implementación real, aquí se actualizarían los datos y gráficos.");
        }
        
        // Inicializar event listeners cuando la página cargue
        document.addEventListener('DOMContentLoaded', function() {
            console.log("Página cargada correctamente");
            
            // Añadir event listeners a los selectores
            document.getElementById('territorio').addEventListener('change', aplicarFiltros);
            document.getElementById('cla').addEventListener('change', aplicarFiltros);
            document.getElementById('oficinas').addEventListener('change', aplicarFiltros);
            
            console.log("Event listeners configurados correctamente");
        });
    </script>
</body>
</html>