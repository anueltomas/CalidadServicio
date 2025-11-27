define('reportes-calidad-servicio:views/modules/estadisticas', [], function () {
    
    // ✅ DEFINIR EL CONSTRUCTOR PRIMERO
    var EstadisticasManager = function(view) {
        this.view = view;
        this.stats = this.getStatsIniciales();
        console.log('✅ EstadisticasManager instanciado');
    };

    // ✅ VERIFICAR QUE ESTÉ BIEN DEFINIDO
    EstadisticasManager.prototype.getStats = function() {
        console.log('📊 Obteniendo estadísticas actuales...');
        console.log('Stats disponibles:', this.stats);
        return this.stats;
    };

    // ✅ LUEGO AGREGAR MÉTODOS AL PROTOTIPO
    EstadisticasManager.prototype.getStatsIniciales = function() {
        console.log('📊 Obteniendo stats iniciales...');
        return {
            totalEncuestas: 0,
            satisfaccionPromedio: 0,
            porcentajeRecomendacion: 0,
            tiposOperacion: 0,
            distribucionOperaciones: {},
            asesoresDestacados: [],
            promediosCategorias: {},
            distribucionCalificaciones: {},
            efectividadComunicacion: 0,
            asesoriaLegal: 0,
            presentacionPersonal: 0,
            manejoDetalles: 0,
            puntualidad: 0,
            compromiso: 0,
            solucionProblemas: 0,
            acompanamiento: 0,
            situacionesImprevistas: 0,
            tiemposNegociacion: 0,
            calificacionOficina: 0
        };
    };

    EstadisticasManager.prototype.loadStatistics = function() {
    console.log('📊 Cargando estadísticas desde módulo...');
    this.view.isLoading = true;
    this.view.hasData = false;
    this.showLoadingState();

    var filtros = this.view.filtrosCLAManager.getFiltros();
    var params = {};

    // Enviar parámetros de filtro al backend
    if (filtros.cla) {
        params.claId = filtros.cla;
    }
    if (filtros.oficina) {
        params.oficinaId = filtros.oficina;
    }
    
    console.log('🌐 Haciendo request a CCustomerSurvey/action/getStats...');
    
    Espo.Ajax.getRequest('CCustomerSurvey/action/getStats', params)
        .then(function(response) {
            console.log('✅ Respuesta del servidor recibida:', response);
            
            if (response && response.success && response.data) {
                console.log('📈 Datos recibidos del servidor:', response.data);
                this.stats = this.procesarEstadisticasReales(response.data);
                this.view.hasData = this.stats.totalEncuestas > 0;
                this.view.isLoading = false;
                
                console.log('🔄 Estado después de procesar:', {
                    hasData: this.view.hasData,
                    totalEncuestas: this.stats.totalEncuestas,
                    isLoading: this.view.isLoading
                });
                
                this.updateUI();
            } else {
                console.log('⚠️ No hay datos en la respuesta o success es false');
                console.log('Response:', response);
                this.handleNoData();
            }
        }.bind(this))
        .catch(function(error) {
            console.error('❌ Error cargando estadísticas:', error);
            console.error('Error details:', error.message, error.status);
            this.handleNoData();
        }.bind(this));
};

    EstadisticasManager.prototype.procesarEstadisticasReales = function(datosBackend) {
        var promediosBackend = datosBackend.promediosCategorias || {};
        
        return {
            totalEncuestas: datosBackend.totalEncuestas || 0,
            satisfaccionPromedio: datosBackend.satisfaccionPromedio || 0,
            porcentajeRecomendacion: datosBackend.porcentajeRecomendacion || 0,
            tiposOperacion: datosBackend.tiposOperacion || 0,
            distribucionOperaciones: datosBackend.distribucionOperaciones || {},
            asesoresDestacados: datosBackend.asesoresDestacados || [],
            promediosCategorias: promediosBackend,
            distribucionCalificaciones: datosBackend.distribucionCalificaciones || {},
            efectividadComunicacion: promediosBackend.communicationEffectiveness || 0,
            asesoriaLegal: promediosBackend.legalAdvice || 0,
            presentacionPersonal: promediosBackend.personalPresentation || 0,
            manejoDetalles: promediosBackend.detailManagement || 0,
            puntualidad: promediosBackend.punctuality || 0,
            compromiso: promediosBackend.commitmentLevel || 0,
            solucionProblemas: promediosBackend.problemSolving || 0,
            acompanamiento: promediosBackend.fullSupport || 0,
            situacionesImprevistas: promediosBackend.unexpectedSituations || 0,
            tiemposNegociacion: promediosBackend.negotiationTiming || 0,
            calificacionOficina: promediosBackend.officeRating || 0
        };
    };

    EstadisticasManager.prototype.showLoadingState = function() {
        var container = this.view.$el.find('#dynamic-content-container')[0];
        if (container) {
            container.innerHTML = this.getLoadingHTML();
        }
    };

    EstadisticasManager.prototype.handleNoData = function() {
        this.view.hasData = false;
        this.view.isLoading = false;
        this.updateUI();
    };

    EstadisticasManager.prototype.updateUI = function() {
        console.log('🔄 Actualizando UI...', {
            isLoading: this.view.isLoading,
            hasData: this.view.hasData,
            totalEncuestas: this.stats.totalEncuestas
        });
        
        var container = this.view.$el.find('#dynamic-content-container')[0];
        if (!container) {
            console.error('❌ No se encontró #dynamic-content-container');
            return;
        }

        if (this.view.isLoading) {
            console.log('⏳ Mostrando estado de carga...');
            container.innerHTML = this.getLoadingHTML();
        } else if (this.view.hasData) {
            console.log('📈 Mostrando datos con', this.stats.totalEncuestas, 'encuestas...');
            container.innerHTML = this.getDataHTML();
            
            // ✅ LLAMAR A RENDERCHARTS CON VERIFICACIÓN COMPLETA
            setTimeout(function() {
                console.log('🔄 Intentando renderizar gráficos...');
                
                // Verificación completa de graficosManager
                if (!this.view.graficosManager) {
                    console.error('❌ graficosManager no está definido en la vista');
                    return;
                }
                
                if (typeof this.view.graficosManager.renderCharts !== 'function') {
                    console.error('❌ renderCharts no es una función en graficosManager');
                    console.log('Métodos disponibles en graficosManager:', Object.keys(this.view.graficosManager));
                    return;
                }
                
                // Verificar que las stats estén disponibles
                if (!this.stats || this.stats.totalEncuestas === 0) {
                    console.error('❌ No hay estadísticas disponibles para gráficos');
                    return;
                }
                
                console.log('✅ Llamando a graficosManager.renderCharts()');
                
                try {
                    this.view.graficosManager.renderCharts();
                    console.log('✅ renderCharts ejecutado exitosamente');
                } catch (error) {
                    console.error('❌ Error al ejecutar renderCharts:', error);
                }
                
            }.bind(this), 200); // Aumenté el delay a 200ms para asegurar que el DOM esté listo
        } else {
            console.log('📭 Mostrando estado vacío...');
            container.innerHTML = this.getEmptyHTML();
            this.setupEmptyEventListeners();
        }
    };

    EstadisticasManager.prototype.getLoadingHTML = function() {
        return `
            <div class="loading-alert">
                <div class="spinner-large"></div>
                <h4>Cargando estadísticas...</h4>
                <p class="text-muted">Conectando con el servidor...</p>
            </div>
        `;
    };

    EstadisticasManager.prototype.getDataHTML = function() {
        var stats = this.stats;
        var distribucion = stats.distribucionOperaciones || {};
        
        var venta = distribucion['Venta'] || 0;
        var compra = distribucion['Compra'] || 0;
        var alquiler = distribucion['Alquiler'] || 0;
        var total = venta + compra + alquiler;
        
        var ventaPct = total > 0 ? Math.round((venta / total) * 100) : 0;
        var compraPct = total > 0 ? Math.round((compra / total) * 100) : 0;
        var alquilerPct = total > 0 ? Math.round((alquiler / total) * 100) : 0;
        
        return `
            <div class="reporte-container">
                <!-- Información de Encuesta -->
                <div class="info-encuesta-card">
                    <h3 class="info-title">Información de Encuesta</h3>
                    <table class="info-table">
                        <tr>
                            <td class="info-label">Total encuestados:</td>
                            <td class="info-value">${stats.totalEncuestas}</td>
                        </tr>
                        <tr>
                            <td class="info-label">Satisfacción promedio:</td>
                            <td class="info-value">${stats.satisfaccionPromedio}/5</td>
                        </tr>
                        <tr>
                            <td class="info-label">Porcentaje recomendación:</td>
                            <td class="info-value">${stats.porcentajeRecomendacion}%</td>
                        </tr>
                        <tr>
                            <td class="info-label">Fecha de Actualización:</td>
                            <td class="info-value">${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                        </tr>
                    </table>
                </div>

                <!-- Sección Principal -->
                <div class="seccion-operaciones">
                    <h2 class="titulo-seccion">¿Qué tipo de operación realizó?</h2>
                    
                    <!-- Tabla de Operaciones -->
                    <div class="tabla-operaciones-card">
                        <table class="tabla-operaciones">
                            <thead>
                                <tr>
                                    <th>Opción</th>
                                    <th>Cantidad</th>
                                    <th>Porcentaje</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Venta</td>
                                    <td>${venta}</td>
                                    <td>${ventaPct}%</td>
                                </tr>
                                <tr>
                                    <td>Compra</td>
                                    <td>${compra}</td>
                                    <td>${compraPct}%</td>
                                </tr>
                                <tr>
                                    <td>Alquiler</td>
                                    <td>${alquiler}</td>
                                    <td>${alquilerPct}%</td>
                                </tr>
                                <tr class="total-row">
                                    <td><strong>Total de Operaciones Individualmente:</strong></td>
                                    <td><strong>${total}</strong></td>
                                    <td><strong>100%</strong></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Gráficos Principales -->
                    <div class="graficos-container">
                        <div class="grafico-card">
                            <h3 class="grafico-titulo">Distribución de Operaciones</h3>
                            <div class="grafico-wrapper">
                                <canvas id="chart-donut"></canvas>
                            </div>
                            <div class="leyenda-donut">
                                <div class="leyenda-item">
                                    <span class="leyenda-color" style="background: #2196F3;"></span>
                                    <span class="leyenda-texto">Venta (${ventaPct}%)</span>
                                </div>
                                <div class="leyenda-item">
                                    <span class="leyenda-color" style="background: #4CAF50;"></span>
                                    <span class="leyenda-texto">Compra (${compraPct}%)</span>
                                </div>
                                <div class="leyenda-item">
                                    <span class="leyenda-color" style="background: #F44336;"></span>
                                    <span class="leyenda-texto">Alquiler (${alquilerPct}%)</span>
                                </div>
                            </div>
                        </div>

                        <div class="grafico-card">
                            <h3 class="grafico-titulo">Comparación de Operaciones</h3>
                            <div class="grafico-wrapper">
                                <canvas id="chart-barras"></canvas>
                            </div>
                        </div>
                    </div>

                    <!-- Gráficos de Calidad de Servicio -->
                    <div class="graficos-secundarios">
                        <div class="grafico-card grande">
                            <h3 class="grafico-titulo">Evaluación por Competencias</h3>
                            <div class="grafico-wrapper">
                                <canvas id="chart-radar"></canvas>
                            </div>
                        </div>

                        <div class="grafico-card grande">
                            <h3 class="grafico-titulo">Calificaciones Promedio por Categoría</h3>
                            <div class="grafico-wrapper">
                                <canvas id="chart-horizontal"></canvas>
                            </div>
                        </div>

                        <div class="grafico-card">
                            <h3 class="grafico-titulo">Distribución General de Calificaciones</h3>
                            <div class="grafico-wrapper">
                                <canvas id="chart-distribution"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    EstadisticasManager.prototype.getEmptyHTML = function() {
        return `
            <div class="empty-alert">
                <div class="empty-icon">📊</div>
                <h3>No hay datos disponibles</h3>
                <p class="text-muted">El servidor no retornó datos.</p>
            </div>
        `;
    };

    EstadisticasManager.prototype.setupEmptyEventListeners = function() {
        // Event listeners para estado vacío
    };

    // ✅ RETORNAR EL CONSTRUCTOR
    return EstadisticasManager;
});