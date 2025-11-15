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
            grid-template-columns: 1fr 1fr;
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
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .info-card-rcs:hover {
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
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
            transition: transform 0.3s ease;
        }
        
        .chart-card-rcs:hover {
            transform: translateY(-5px);
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
            transition: transform 0.3s ease;
        }
        
        .percentage-item-rcs:hover {
            transform: scale(1.1);
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
        
        /* Gráfico circular mejorado con CSS */
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
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
            animation: rotate-in 1s ease-out;
        }
        
        @keyframes rotate-in {
            from { transform: rotate(-180deg) scale(0.8); opacity: 0; }
            to { transform: rotate(0) scale(1); opacity: 1; }
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
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
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
        
        /* Gráfico de barras mejorado con separación */
        .bar-chart-rcs {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            height: 180px;
            padding: 0 20px;
            position: relative;
            gap: 20px; /* Separación entre barras */
        }
        
        .bar-container-rcs {
            display: flex;
            flex-direction: column;
            align-items: center;
            height: 100%;
            flex: 1; /* Hace que cada barra ocupe el mismo espacio */
            max-width: 80px; /* Ancho máximo para evitar que se expandan demasiado */
        }
        
        .bar-rcs {
            width: 50px; /* Ancho ligeramente mayor para mejor visibilidad */
            border-radius: 6px 6px 0 0;
            position: relative;
            transition: height 0.5s ease;
            animation: grow-up 1s ease-out;
            box-shadow: 0 3px 8px rgba(0,0,0,0.15);
            margin-bottom: 10px;
        }
        
        @keyframes grow-up {
            from { height: 0 !important; }
        }
        
        .bar-label-rcs {
            margin-top: 8px;
            font-size: 14px;
            font-weight: 600;
            text-align: center;
        }
        
        .bar-value-rcs {
            position: absolute;
            top: -30px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 14px;
            font-weight: bold;
            color: #2c3e50;
            background: rgba(255, 255, 255, 0.95);
            padding: 4px 8px;
            border-radius: 6px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            border: 1px solid #e0e0e0;
        }
        
        .bar-axis-rcs {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: #95a5a6;
        }
        
        /* Indicadores de porcentaje mejorados */
        .percentage-indicators-rcs {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
            padding: 0 10px;
        }
        
        .percentage-indicator-rcs {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
        }
        
        .indicator-circle-rcs {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 8px;
            font-weight: bold;
            color: white;
            box-shadow: 0 3px 6px rgba(0,0,0,0.1);
        }
        
        .indicator-label-rcs {
            font-size: 12px;
            color: #7f8c8d;
        }
        
        /* Estilos para la sección de calidad de servicio */
        .calidad-servicio-principal {
            padding: 20px;
        }
        
        .page-header {
            border-bottom: 1px solid #e7eaec;
            padding-bottom: 15px;
            margin-bottom: 25px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
        }
        
        .page-header h3 {
            margin: 0;
            color: #333;
            display: inline-block;
        }
        
        .page-header h3 .fas {
            margin-right: 10px;
            color: #3498db;
        }
        
        .file-input-group {
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 10px 0;
        }
        
        .file-input-container {
            position: relative;
            display: inline-block;
            overflow: hidden;
        }
        
        .file-input-container input[type="file"] {
            position: absolute;
            left: 0;
            top: 0;
            opacity: 0;
            width: 100%;
            height: 100%;
            cursor: pointer;
        }
        
        .file-input-button {
            display: inline-block;
            padding: 8px 16px;
            background-color: #f8f9fa;
            border: 1px solid #ddd;
            border-radius: 4px;
            color: #495057;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .file-input-button:hover {
            background-color: #e9ecef;
            border-color: #adb5bd;
        }
        
        .file-input-name {
            margin-left: 10px;
            font-size: 14px;
            color: #6c757d;
        }
        
        .btn {
            display: inline-block;
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s;
            text-decoration: none;
            text-align: center;
        }
        
        .btn-primary {
            background-color: #3498db;
            color: white;
        }
        
        .btn-primary:hover {
            background-color: #2980b9;
        }
        
        .btn-default {
            background-color: #f8f9fa;
            color: #495057;
            border: 1px solid #ddd;
        }
        
        .btn-default:hover {
            background-color: #e9ecef;
        }
        
        .btn-lg {
            padding: 10px 20px;
            font-size: 16px;
        }
        
        .text-right {
            text-align: right;
        }
        
        .statistics-cards {
            margin-bottom: 25px;
        }
        
        .stat-card {
            transition: transform 0.2s, box-shadow 0.2s;
            margin-bottom: 20px;
            border: none;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .stat-card .panel-body {
            padding: 25px 15px;
        }
        
        .stat-number {
            font-size: 2.5em;
            font-weight: bold;
            margin: 10px 0;
            color: #333;
        }
        
        .stat-label {
            color: #777;
            margin: 0;
            font-size: 14px;
            font-weight: 500;
        }
        
        .stat-icon {
            margin-bottom: 10px;
            opacity: 0.7;
        }
        
        .satisfaction-gauge {
            margin-top: 15px;
            padding: 0 20px;
        }
        
        .gauge-background {
            width: 100%;
            height: 10px;
            background-color: #e9ecef;
            border-radius: 5px;
            overflow: hidden;
        }
        
        .gauge-fill {
            height: 100%;
            transition: width 1s ease-in-out, background-color 0.3s;
            border-radius: 5px;
        }
        
        .empty-state {
            display: none; /* Ocultar el estado vacío */
        }
        
        .panel-title {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
        }
        
        .panel-title .fas {
            margin-right: 8px;
            color: #3498db;
        }
        
        .table > thead > tr > th {
            border-bottom: 2px solid #ddd;
            font-weight: 600;
            background-color: #f8f9fa;
        }
        
        .table > tbody > tr:hover {
            background-color: #f5f5f5;
        }
        
        .badge {
            padding: 5px 10px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .label {
            padding: 5px 10px;
            font-size: 11px;
            font-weight: 600;
        }
        
        .badge-primary {
            background-color: #3498db;
        }
        
        .badge-warning {
            background-color: #f39c12;
        }
        
        /* Mejoras responsive */
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
            
            .bar-chart-rcs {
                height: 150px;
                gap: 15px; /* Menor separación en móviles */
            }
            
            .bar-rcs {
                width: 40px; /* Barras más estrechas en móviles */
            }
            
            .bar-value-rcs {
                top: -25px;
                font-size: 12px;
                padding: 3px 6px;
            }
            
            .percentage-display-rcs {
                flex-direction: column;
                gap: 15px;
            }
            
            .percentage-indicators-rcs {
                flex-direction: column;
                gap: 15px;
            }
            
            .percentage-indicator-rcs {
                flex-direction: row;
                justify-content: flex-start;
                gap: 10px;
            }
            
            .indicator-circle-rcs {
                width: 40px;
                height: 40px;
                font-size: 14px;
                margin-bottom: 0;
            }
            
            .page-header {
                flex-direction: column;
                align-items: flex-start;
            }
            
            .text-right {
                text-align: left;
                margin-top: 15px;
            }
        }
        
        @media (max-width: 480px) {
            .header-rcs {
                padding: 15px 20px;
            }
            
            .h1-rcs {
                font-size: 22px;
            }
            
            .filters-section-rcs, .content-rcs {
                padding: 15px 20px;
            }
            
            .chart-card-rcs {
                padding: 15px;
            }
            
            .chart-title-rcs {
                font-size: 16px;
            }
            
            .operations-table-rcs th, .operations-table-rcs td {
                padding: 8px 10px;
                font-size: 14px;
            }
            
            .percentage-value-rcs {
                font-size: 20px;
            }
            
            .bar-chart-rcs {
                gap: 10px; /* Separación mínima en pantallas muy pequeñas */
                padding: 0 10px;
            }
            
            .bar-rcs {
                width: 35px; /* Barras aún más estrechas */
            }
            
            .bar-value-rcs {
                font-size: 11px;
                padding: 2px 4px;
            }
        }
    </style>
</head>
<body>
    <div class="container-rcs">
        <header class="header-rcs">
            <h1 class="h1-rcs">Información de Encuesta</h1>
            <p class="subtitle-rcs">Resultados de calidad de servicio</p>
        </header>

        <div class="calidad-servicio-principal">
            <!-- Header con acciones -->
            <div class="page-header">
                <div>
                    <h3>
                        <span class="fas fa-chart-line"></span>
                        Panel de Calidad de Servicio
                    </h3>
                </div>
                <div class="file-input-group">
                    <div class="file-input-container">
                        <input type="file" id="csv-file-input" accept=".csv" class="form-control">
                        <button class="file-input-button">
                            <span class="fas fa-folder-open"></span>
                            Examinar
                        </button>
                    </div>
                    <span id="file-name" class="file-input-name">No se ha seleccionado ningún archivo</span>
                </div>
                <div class="text-right">
                    <button class="btn btn-primary" data-action="import">
                        <span class="fas fa-upload"></span>
                        Importar Datos
                    </button>
                    <button class="btn btn-default" data-action="refresh">
                        <span class="fas fa-sync-alt"></span>
                    </button>
                </div>
            </div>

            <!-- Tarjetas de estadísticas -->
            <div class="row statistics-cards">
                <div class="col-md-3">
                    <div class="panel panel-default stat-card">
                        <div class="panel-body text-center">
                            <div class="stat-icon">
                                <span class="fas fa-clipboard-list fa-3x text-primary"></span>
                            </div>
                            <h2 class="stat-number">216</h2>
                            <p class="stat-label">Total Encuestas</p>
                        </div>
                    </div>
                </div>

                <div class="col-md-3">
                    <div class="panel panel-default stat-card">
                        <div class="panel-body text-center">
                            <div class="stat-icon">
                                <span class="fas fa-star fa-3x text-warning"></span>
                            </div>
                            <h2 class="stat-number">4.2</h2>
                            <p class="stat-label">Satisfacción Promedio</p>
                            <div class="satisfaction-gauge">
                                <div class="gauge-background">
                                    <div class="gauge-fill" style="width: 84%; background-color: #f39c12;"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-md-3">
                    <div class="panel panel-default stat-card">
                        <div class="panel-body text-center">
                            <div class="stat-icon">
                                <span class="fas fa-thumbs-up fa-3x text-success"></span>
                            </div>
                            <h2 class="stat-number">78%</h2>
                            <p class="stat-label">Recomendación</p>
                        </div>
                    </div>
                </div>

                <div class="col-md-3">
                    <div class="panel panel-default stat-card">
                        <div class="panel-body text-center">
                            <div class="stat-icon">
                                <span class="fas fa-building fa-3x text-info"></span>
                            </div>
                            <h2 class="stat-number">3</h2>
                            <p class="stat-label">Tipos de Operación</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tabla de asesores destacados -->
            <div class="row">
                <div class="col-md-12">
                    <div class="panel panel-default">
                        <div class="panel-heading">
                            <h4 class="panel-title">
                                <span class="fas fa-users"></span>
                                Asesores Destacados
                            </h4>
                        </div>
                        <div class="panel-body">
                            <table class="table table-striped table-hover">
                                <thead>
                                    <tr>
                                        <th>Asesor</th>
                                        <th class="text-center">Encuestas</th>
                                        <th class="text-center">Calificación Promedio</th>
                                        <th class="text-center">Nivel</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><strong>María González</strong></td>
                                        <td class="text-center">
                                            <span class="badge badge-primary">42</span>
                                        </td>
                                        <td class="text-center">
                                            <span class="badge badge-warning">
                                                4.8/5
                                            </span>
                                        </td>
                                        <td class="text-center">
                                            <span class="label label-success">Excelente</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td><strong>Carlos Rodríguez</strong></td>
                                        <td class="text-center">
                                            <span class="badge badge-primary">38</span>
                                        </td>
                                        <td class="text-center">
                                            <span class="badge badge-warning">
                                                4.6/5
                                            </span>
                                        </td>
                                        <td class="text-center">
                                            <span class="label label-success">Excelente</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td><strong>Ana Martínez</strong></td>
                                        <td class="text-center">
                                            <span class="badge badge-primary">35</span>
                                        </td>
                                        <td class="text-center">
                                            <span class="badge badge-warning">
                                                4.5/5
                                            </span>
                                        </td>
                                        <td class="text-center">
                                            <span class="label label-info">Muy Bueno</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td><strong>José López</strong></td>
                                        <td class="text-center">
                                            <span class="badge badge-primary">32</span>
                                        </td>
                                        <td class="text-center">
                                            <span class="badge badge-warning">
                                                4.3/5
                                            </span>
                                        </td>
                                        <td class="text-center">
                                            <span class="label label-info">Muy Bueno</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td><strong>Laura Sánchez</strong></td>
                                        <td class="text-center">
                                            <span class="badge badge-primary">28</span>
                                        </td>
                                        <td class="text-center">
                                            <span class="badge badge-warning">
                                                4.2/5
                                            </span>
                                        </td>
                                        <td class="text-center">
                                            <span class="label label-warning">Bueno</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
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
                    <p>216</p>
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
            
            <div class="percentage-indicators-rcs">
                <div class="percentage-indicator-rcs">
                    <div class="indicator-circle-rcs color-venta-rcs">44%</div>
                    <div class="indicator-label-rcs">Venta</div>
                </div>
                <div class="percentage-indicator-rcs">
                    <div class="indicator-circle-rcs color-compra-rcs">29%</div>
                    <div class="indicator-label-rcs">Compra</div>
                </div>
                <div class="percentage-indicator-rcs">
                    <div class="indicator-circle-rcs color-alquiler-rcs">27%</div>
                    <div class="indicator-label-rcs">Alquiler</div>
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
            console.log("CLA:", document.getElementById('cla').value);
            console.log("Oficinas:", document.getElementById('oficinas').value);
            
            // Simular cambio de datos (en una aplicación real, estos vendrían del servidor)
            // Por ahora, solo mostramos un mensaje
            alert("Filtros aplicados. En una implementación real, aquí se actualizarían los datos y gráficos.");
        }
        
        // Función para manejar la selección de archivos
        function setupFileInput() {
            const fileInput = document.getElementById('csv-file-input');
            const fileName = document.getElementById('file-name');
            
            fileInput.addEventListener('change', function() {
                if (this.files && this.files[0]) {
                    fileName.textContent = this.files[0].name;
                } else {
                    fileName.textContent = 'No se ha seleccionado ningún archivo';
                }
            });
        }
        
        // Inicializar event listeners cuando la página cargue
        document.addEventListener('DOMContentLoaded', function() {
            console.log("Página cargada correctamente");
            
            // Añadir event listeners a los selectores
            document.getElementById('cla').addEventListener('change', aplicarFiltros);
            document.getElementById('oficinas').addEventListener('change', aplicarFiltros);
            
            // Configurar el input de archivo
            setupFileInput();
            
            console.log("Event listeners configurados correctamente");
        });
    </script>
</body>
</html>