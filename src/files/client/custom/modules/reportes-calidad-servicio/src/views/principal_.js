define('reportes-calidad-servicio:views/principal', ['view'], function (Dep) {
    
    return Dep.extend({

        template: 'reportes-calidad-servicio:principal',

        data: function () {
            return {
                // Datos vacíos - no usaremos data-binding
            };
        },

        setup: function () {
            console.log('🚀 Iniciando vista de Calidad de Servicio');
            
            // Inicializar variables de estado
            this.hasData = false;
            this.isLoading = true;
            this.chartJsLoaded = false;
            this.charts = {};
            this.stats = {};
            
            // Cargar estadísticas inmediatamente
            this.loadStatistics();
            
            // Cargar Chart.js en segundo plano
            this.cargarChartJS();
        },

        afterRender: function () {
            console.log('✅ Vista renderizada');
            
            // Mostrar estado inicial de carga
            this.showLoadingState();
            
            // Configurar event listeners
            this.setupEventListeners();
        },

        setupEventListeners: function() {
            // Configurar el input de archivo
            const fileInput = this.$el.find('#csv-file-input')[0];
            const fileName = this.$el.find('#file-name')[0];
            
            if (fileInput && fileName) {
                fileInput.addEventListener('change', function() {
                    if (this.files && this.files[0]) {
                        fileName.textContent = this.files[0].name;
                        fileName.classList.add('has-file');
                        console.log('📁 Archivo seleccionado:', this.files[0].name);
                    } else {
                        fileName.textContent = 'No se ha seleccionado ningún archivo';
                        fileName.classList.remove('has-file');
                    }
                });
            }

            // Botón de importar
            this.$el.find('[data-action="import"]').off('click').on('click', () => {
                this.actionImport();
            });

            // Botón de actualizar
            this.$el.find('[data-action="refresh"]').off('click').on('click', () => {
                console.log('🔄 Actualizando estadísticas...');
                this.loadStatistics();
            });
        },

        cargarChartJS: function () {
            console.log('📦 Cargando Chart.js...');
            
            // Verificar si ya está cargado
            if (typeof Chart !== 'undefined') {
                console.log('✅ Chart.js ya está cargado');
                this.chartJsLoaded = true;
                return;
            }
            
            var script = document.createElement('script');
            script.src = 'client/custom/modules/reportes-calidad-servicio/lib/chart.min.js';
            script.onload = function() {
                console.log('✅ Chart.js cargado exitosamente');
                this.chartJsLoaded = true;
                
                // Si ya tenemos datos, renderizar gráficos
                if (this.hasData && !this.isLoading) {
                    this.safeRenderCharts();
                }
            }.bind(this);
            script.onerror = function() {
                console.error('❌ Error al cargar Chart.js');
                this.chartJsLoaded = false;
            }.bind(this);
            document.head.appendChild(script);
        },

        loadStatistics: function () {
            console.log('📞 Llamando a CCustomerSurvey/action/getStats...');
            
            this.isLoading = true;
            this.hasData = false;
            this.showLoadingState();

            Espo.Ajax.getRequest('CCustomerSurvey/action/getStats')
                .then((response) => {
                    console.log('✅ Respuesta recibida:', response);
                    
                    if (response.success && response.data) {
                        this.stats = response.data;
                        this.hasData = this.stats.totalEncuestas > 0;
                        
                        console.log('🎉 DATOS CARGADOS EXITOSAMENTE');
                        console.log('   - Total encuestas:', this.stats.totalEncuestas);
                        
                        // ✅ LÍNEA CRÍTICA AÑADIDA - Cambiar estado de carga
                        this.isLoading = false;
                        
                        // Actualizar UI manualmente
                        this.updateUI();
                        
                        // Mostrar notificación
                        if (this.hasData) {
                            Espo.Ui.success(`Sistema conectado - ${this.stats.totalEncuestas} encuestas cargadas`);
                        }
                    } else {
                        console.warn('⚠️ Respuesta sin datos válidos');
                        this.hasData = false;
                        this.isLoading = false;  // ✅ También aquí
                        this.updateUI();
                    }
                })
                .catch((error) => {
                    console.error('❌ Error cargando estadísticas:', error);
                    this.isLoading = false;
                    this.hasData = false;
                    this.updateUI();
                    Espo.Ui.error('Error al cargar estadísticas: ' + error.message);
                });
        },

        updateUI: function() {
            console.log('🎨 Actualizando UI COMPLETAMENTE manual...');
            
            const container = this.$el.find('#dynamic-content-container')[0];
            if (!container) {
                console.error('❌ No se encontró el contenedor dinámico');
                return;
            }

            if (this.isLoading) {
                container.innerHTML = this.getLoadingHTML();
            } else if (this.hasData) {
                container.innerHTML = this.getDataHTML();
                // Configurar event listeners después de injectar HTML
                setTimeout(() => this.setupDataEventListeners(), 100);
                // Renderizar gráficos después de que el DOM esté listo
                setTimeout(() => this.safeRenderCharts(), 200);
            } else {
                container.innerHTML = this.getEmptyHTML();
                // Configurar event listeners después de injectar HTML
                setTimeout(() => this.setupEmptyEventListeners(), 100);
            }
        },

        getLoadingHTML: function() {
            return `
                <div class="alert alert-info text-center loading-alert">
                    <div class="spinner-large"></div>
                    <h4>Cargando estadísticas desde la base de datos...</h4>
                    <p class="text-muted">Conectando con CCustomerSurvey...</p>
                </div>
            `;
        },

        getDataHTML: function() {
            const stats = this.stats;
            const distribucion = stats.distribucionOperaciones || {};
            const asesores = stats.asesoresDestacados || [];
            
            // Calcular porcentaje de satisfacción para el gauge
            const satisfaccionPorcentaje = ((stats.satisfaccionPromedio || 0) / 5) * 100;
            const satisfaccionColor = this.getRatingColor(stats.satisfaccionPromedio);
            const recomendacionText = this.getRecomendacionText(stats.porcentajeRecomendacion);
            const recomendacionClass = this.getRecomendacionClass(stats.porcentajeRecomendacion);
            
            // Encontrar operación principal
            let operacionPrincipal = 'Sin datos';
            if (Object.keys(distribucion).length > 0) {
                const topOperacion = Object.entries(distribucion).sort((a, b) => b[1] - a[1])[0];
                operacionPrincipal = `${topOperacion[0]}: ${topOperacion[1]} encuestas`;
            }

            return `
                <!-- Tarjetas de estadísticas -->
                <div class="row statistics-cards">
                    <div class="col-md-3 col-sm-6 col-xs-12">
                        <div class="panel panel-default stat-card">
                            <div class="panel-body text-center">
                                <div class="stat-icon">
                                    <span class="fas fa-clipboard-list fa-3x text-primary"></span>
                                </div>
                                <h2 class="stat-number">${stats.totalEncuestas || 0}</h2>
                                <p class="stat-label">Total Encuestas</p>
                                <div class="stat-trend">
                                    <span class="fas fa-chart-line text-success"></span>
                                    <small>Base de datos activa</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-3 col-sm-6 col-xs-12">
                        <div class="panel panel-default stat-card">
                            <div class="panel-body text-center">
                                <div class="stat-icon">
                                    <span class="fas fa-star fa-3x text-warning"></span>
                                </div>
                                <h2 class="stat-number">${stats.satisfaccionPromedio || 0}</h2>
                                <p class="stat-label">Satisfacción Promedio</p>
                                <div class="satisfaction-gauge">
                                    <div class="gauge-background">
                                        <div class="gauge-fill" style="width: ${satisfaccionPorcentaje}%; background-color: ${satisfaccionColor};"></div>
                                    </div>
                                    <div class="gauge-labels">
                                        <span>0</span>
                                        <span>5</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-3 col-sm-6 col-xs-12">
                        <div class="panel panel-default stat-card">
                            <div class="panel-body text-center">
                                <div class="stat-icon">
                                    <span class="fas fa-thumbs-up fa-3x text-success"></span>
                                </div>
                                <h2 class="stat-number">${stats.porcentajeRecomendacion || 0}%</h2>
                                <p class="stat-label">Recomendación</p>
                                <div class="recomendacion-badge">
                                    <span class="badge ${recomendacionClass}">${recomendacionText}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-3 col-sm-6 col-xs-12">
                        <div class="panel panel-default stat-card">
                            <div class="panel-body text-center">
                                <div class="stat-icon">
                                    <span class="fas fa-building fa-3x text-info"></span>
                                </div>
                                <h2 class="stat-number">${stats.tiposOperacion || 0}</h2>
                                <p class="stat-label">Tipos de Operación</p>
                                <div class="operaciones-info">
                                    <small>${operacionPrincipal}</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                ${asesores.length > 0 ? this.getAsesoresHTML(asesores) : ''}

                <!-- Gráficos -->
                <div class="charts-section">
                    <div class="charts-container-rcs">
                        <!-- Gráfico de Operaciones -->
                        <div class="chart-card-rcs">
                            <div class="chart-header">
                                <div class="chart-title-rcs">
                                    <span class="fas fa-chart-pie"></span>
                                    Distribución de Operaciones
                                </div>
                                <div class="chart-actions">
                                    <button class="btn btn-xs btn-default" data-chart="operaciones" data-action="refresh">
                                        <span class="fas fa-sync-alt"></span>
                                    </button>
                                </div>
                            </div>
                            <div class="chart-wrapper-rcs">
                                <div id="operaciones-chart-container" class="chart-container">
                                    <canvas id="operaciones-chart" width="400" height="300"></canvas>
                                </div>
                            </div>
                        </div>

                        <!-- Gráfico de Asesores -->
                        <div class="chart-card-rcs">
                            <div class="chart-header">
                                <div class="chart-title-rcs">
                                    <span class="fas fa-chart-bar"></span>
                                    Top 5 Asesores por Calificación
                                </div>
                                <div class="chart-actions">
                                    <button class="btn btn-xs btn-default" data-chart="asesores" data-action="refresh">
                                        <span class="fas fa-sync-alt"></span>
                                    </button>
                                </div>
                            </div>
                            <div class="chart-wrapper-rcs">
                                <div id="asesores-chart-container" class="chart-container">
                                    <canvas id="asesores-chart" width="400" height="300"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Información del sistema -->
                <div class="alert alert-success system-info">
                    <div class="system-status">
                        <span class="status-indicator online"></span>
                        <strong>✅ Sistema CCustomerSurvey Conectado</strong>
                    </div>
                    <div class="system-details">
                        Base de datos con <strong>${stats.totalEncuestas || 0}</strong> encuestas procesadas.
                        Última actualización: <span class="timestamp">${new Date().toLocaleString('es-ES')}</span>
                        <button class="btn btn-xs btn-link" id="force-refresh">
                            <span class="fas fa-bolt"></span> Actualizar ahora
                        </button>
                    </div>
                </div>
            `;
        },

        getAsesoresHTML: function(asesores) {
            const rows = asesores.map(asesor => {
                const porcentajeDesempeno = ((asesor.calificacionPromedio || 0) / 5) * 100;
                const nivelClass = this.getNivelClass(asesor.nivel);
                
                return `
                    <tr>
                        <td>
                            <strong>${asesor.nombre || 'N/A'}</strong>
                            ${asesor.email ? `<br><small class="text-muted">${asesor.email}</small>` : ''}
                        </td>
                        <td class="text-center">
                            <span class="badge badge-primary" style="font-size: 0.9em;">${asesor.totalEncuestas || 0}</span>
                        </td>
                        <td class="text-center">
                            <span class="badge badge-warning" style="font-size: 0.9em;">
                                ${(asesor.calificacionPromedio || 0).toFixed(1)}/5
                            </span>
                        </td>
                        <td class="text-center">
                            <span class="label ${nivelClass}">${asesor.nivel || 'N/A'}</span>
                        </td>
                        <td class="text-center">
                            <div class="performance-bar">
                                <div class="performance-fill" style="width: ${porcentajeDesempeno}%"></div>
                            </div>
                            <small class="text-muted">${porcentajeDesempeno.toFixed(1)}%</small>
                        </td>
                    </tr>
                `;
            }).join('');

            return `
                <!-- Tabla de asesores destacados -->
                <div class="asesores-section">
                    <div class="row">
                        <div class="col-md-12">
                            <div class="panel panel-default">
                                <div class="panel-heading">
                                    <h4 class="panel-title">
                                        <span class="fas fa-users"></span>
                                        Asesores Destacados
                                        <span class="badge badge-primary">${asesores.length}</span>
                                    </h4>
                                </div>
                                <div class="panel-body">
                                    <div class="table-responsive">
                                        <table class="table table-striped table-hover">
                                            <thead>
                                                <tr>
                                                    <th>Asesor</th>
                                                    <th class="text-center">Encuestas</th>
                                                    <th class="text-center">Calificación Promedio</th>
                                                    <th class="text-center">Nivel</th>
                                                    <th class="text-center">Desempeño</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${rows}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

        getEmptyHTML: function() {
            return `
                <div class="alert alert-warning">
                    <div class="empty-header">
                        <span class="fas fa-database"></span>
                        <strong>Sistema listo - Esperando datos</strong>
                    </div>
                    <p>No hay encuestas en la base de datos. <strong>Importa un archivo CSV</strong> para comenzar a visualizar las estadísticas.</p>
                </div>
                
                <div class="text-center empty-state-content">
                    <div class="empty-icon">
                        <span class="fas fa-chart-bar fa-4x text-muted"></span>
                    </div>
                    <h3>¡Comienza importando tus datos!</h3>
                    <p class="text-muted">Selecciona un archivo CSV con las encuestas de calidad de servicio para generar reportes visuales.</p>
                    <div class="empty-actions">
                        <button class="btn btn-primary btn-lg" data-action="import-empty">
                            <span class="fas fa-upload"></span>
                            Comenzar Importación
                        </button>
                    </div>
                </div>
            `;
        },

        setupDataEventListeners: function() {
            // Botón de actualización forzada
            this.$el.find('#force-refresh').off('click').on('click', () => {
                this.loadStatistics();
            });

            // Botones de actualización de gráficos
            this.$el.find('[data-chart][data-action="refresh"]').off('click').on('click', (e) => {
                const chartType = $(e.currentTarget).data('chart');
                this.refreshChart(chartType);
            });
        },

        setupEmptyEventListeners: function() {
            // Botón de importar en empty state
            this.$el.find('[data-action="import-empty"]').off('click').on('click', () => {
                this.actionImport();
            });
        },

        showLoadingState: function() {
            const container = this.$el.find('#dynamic-content-container')[0];
            if (container) {
                container.innerHTML = this.getLoadingHTML();
            }
        },

        safeRenderCharts: function() {
            console.log('🛡️ Renderizado seguro de gráficos...');
            
            if (!this.chartJsLoaded || typeof Chart === 'undefined') {
                console.warn('Chart.js no está disponible, reintentando en 1 segundo...');
                setTimeout(() => this.safeRenderCharts(), 1000);
                return;
            }
            
            // Esperar a que el DOM esté completamente renderizado
            setTimeout(() => {
                this.renderCharts();
            }, 300);
        },

        renderCharts: function() {
            console.log('📈 Iniciando renderizado de gráficos...');
            
            // Destruir gráficos existentes
            this.destroyCharts();
            
            try {
                // Renderizar gráfico de operaciones
                this.renderOperacionesChart();
                
                // Renderizar gráfico de asesores
                this.renderAsesoresChart();
                
                console.log('✅ Gráficos renderizados exitosamente');
            } catch (error) {
                console.error('💥 Error crítico renderizando gráficos:', error);
            }
        },

        renderOperacionesChart: function() {
            try {
                const distribucion = this.stats.distribucionOperaciones || {};
                const ctx = document.getElementById('operaciones-chart');
                
                console.log('📊 Datos para gráfico de operaciones:', distribucion);
                
                if (!ctx) {
                    console.error('❌ No se encontró el canvas para operaciones');
                    return;
                }
                
                if (Object.keys(distribucion).length === 0) {
                    console.warn('⚠️ No hay datos para el gráfico de operaciones');
                    this.showChartPlaceholder('operaciones-chart-container', 'No hay datos de operaciones');
                    return;
                }
                
                const labels = Object.keys(distribucion);
                const data = Object.values(distribucion);
                const backgroundColors = this.generateColors(labels.length);
                
                this.charts.operaciones = new Chart(ctx, {
                    type: 'pie',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: data,
                            backgroundColor: backgroundColors,
                            borderColor: '#fff',
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'right',
                                labels: {
                                    padding: 20,
                                    usePointStyle: true
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const label = context.label || '';
                                        const value = context.raw || 0;
                                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                        const percentage = Math.round((value / total) * 100);
                                        return `${label}: ${value} (${percentage}%)`;
                                    }
                                }
                            }
                        }
                    }
                });
                
            } catch (error) {
                console.error('💥 Error creando gráfico de operaciones:', error);
            }
        },

        renderAsesoresChart: function() {
            try {
                const asesores = this.stats.asesoresDestacados || [];
                const ctx = document.getElementById('asesores-chart');
                
                if (!ctx) {
                    console.error('❌ No se encontró el canvas para asesores');
                    return;
                }
                
                if (asesores.length === 0) {
                    console.warn('⚠️ No hay datos para el gráfico de asesores');
                    this.showChartPlaceholder('asesores-chart-container', 'No hay datos de asesores');
                    return;
                }
                
                // Tomar top 5 asesores
                const topAsesores = asesores.slice(0, 5);
                const labels = topAsesores.map(a => a.nombre || 'N/A');
                const data = topAsesores.map(a => a.calificacionPromedio || 0);
                const backgroundColors = this.generateRatingColors(data);
                
                this.charts.asesores = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Calificación Promedio',
                            data: data,
                            backgroundColor: backgroundColors,
                            borderColor: backgroundColors.map(color => this.adjustColor(color, -20)),
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                max: 5,
                                ticks: {
                                    stepSize: 1
                                },
                                title: {
                                    display: true,
                                    text: 'Calificación (1-5)'
                                }
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: 'Asesores'
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return `Calificación: ${context.raw}/5`;
                                    }
                                }
                            }
                        }
                    }
                });
                
            } catch (error) {
                console.error('💥 Error creando gráfico de asesores:', error);
            }
        },

        showChartPlaceholder: function(containerId, message) {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="chart-placeholder text-center">
                        <div class="placeholder-icon">📊</div>
                        <p class="text-muted">${message}</p>
                    </div>
                `;
            }
        },

        destroyCharts: function() {
            Object.values(this.charts).forEach(chart => {
                if (chart && typeof chart.destroy === 'function') {
                    chart.destroy();
                }
            });
            this.charts = {};
        },

        refreshChart: function(chartType) {
            console.log(`🔄 Actualizando gráfico: ${chartType}`);
            
            if (this.charts[chartType]) {
                this.charts[chartType].destroy();
                delete this.charts[chartType];
            }
            
            if (chartType === 'operaciones') {
                this.renderOperacionesChart();
            } else if (chartType === 'asesores') {
                this.renderAsesoresChart();
            }
        },

        // Helper functions (mantener las mismas)
        generateColors: function(count) {
            const colors = [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
                '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#36A2EB'
            ];
            return colors.slice(0, count);
        },

        generateRatingColors: function(ratings) {
            return ratings.map(rating => this.getRatingColor(rating));
        },

        getRatingColor: function(rating) {
            if (rating >= 4.5) return '#27ae60';
            if (rating >= 4.0) return '#2ecc71';
            if (rating >= 3.5) return '#f39c12';
            if (rating >= 3.0) return '#e67e22';
            return '#e74c3c';
        },

        getRecomendacionText: function(porcentaje) {
            if (porcentaje >= 90) return 'Excelente';
            if (porcentaje >= 80) return 'Muy Bueno';
            if (porcentaje >= 70) return 'Bueno';
            if (porcentaje >= 60) return 'Regular';
            return 'Necesita Mejora';
        },

        getRecomendacionClass: function(porcentaje) {
            if (porcentaje >= 80) return 'badge-success';
            if (porcentaje >= 60) return 'badge-warning';
            return 'badge-danger';
        },

        getNivelClass: function(nivel) {
            const niveles = {
                'Excelente': 'label-success',
                'Muy Bueno': 'label-info', 
                'Bueno': 'label-primary',
                'Regular': 'label-warning',
                'Necesita Mejora': 'label-danger'
            };
            return niveles[nivel] || 'label-default';
        },

        adjustColor: function(color, amount) {
            return '#' + color.replace(/^#/, '').replace(/../g, color => 
                ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2)
            );
        },

        actionImport: function() {
            var fileInput = this.$el.find('#csv-file-input')[0];
            
            if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
                Espo.Ui.warning('Por favor selecciona un archivo CSV primero.');
                return;
            }
            
            var file = fileInput.files[0];
            
            if (!file.name.endsWith('.csv')) {
                Espo.Ui.error('El archivo debe ser un CSV.');
                return;
            }
            
            console.log('📤 Importando archivo:', file.name);
            Espo.Ui.notify('Procesando CSV...', 'info');
            this.wait(true);
            
            var reader = new FileReader();
            
            reader.onload = function(e) {
                var contenidoCSV = e.target.result;
                this.iniciarProcesoDeCarga(contenidoCSV);
            }.bind(this);
            
            reader.onerror = function() {
                Espo.Ui.error('Error al leer el archivo.');
                this.wait(false);
            }.bind(this);
            
            reader.readAsText(file, 'UTF-8');
        },

        iniciarProcesoDeCarga: async function(contenidoCSV) {
            try {
                console.log('🔍 Procesando CSV...');
                
                const result = await Espo.Ajax.postRequest('CCustomerSurvey/action/importarEncuestas', {
                    csvData: contenidoCSV
                });
                
                console.log('📨 Respuesta de importación:', result);
                
                if (result.success) {
                    let mensaje = `✅ ${result.message || 'Importación completada'}<br>`;
                    mensaje += `• Procesadas: ${result.procesadas || 0}<br>`;
                    mensaje += `• Duplicadas: ${result.duplicadas || 0}<br>`;
                    mensaje += `• Errores: ${result.errores ? result.errores.length : 0}`;
                    
                    Espo.Ui.success(mensaje);
                    
                    // Recargar estadísticas después de 1 segundo
                    setTimeout(() => {
                        this.loadStatistics();
                    }, 1000);
                } else {
                    throw new Error(result.error || 'Error en el servidor');
                }
                
                this.wait(false);
                
            } catch (error) {
                console.error('💥 Error en importación:', error);
                Espo.Ui.error('Error al importar: ' + error.message);
                this.wait(false);
            }
        },

        onRemove: function() {
            console.log('🧹 Limpiando vista...');
            this.destroyCharts();
        }
    });
});