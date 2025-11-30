define("reportes-calidad-servicio:views/modules/estadisticas", [], function () {
    var EstadisticasManager = function (view) {
        this.view = view;
        this.stats = this.getStatsIniciales();
    };

    EstadisticasManager.prototype.getStatsIniciales = function () {
        return {
            totalEncuestas: 0,
            satisfaccionPromedio: 0,
            porcentajeRecomendacion: 0,
            tiposOperacion: 0,
            distribucionOperaciones: {},
            asesoresDestacados: [],
            promediosCategorias: {},
            distribucionCalificaciones: {},
            recomendacion: { si: 0, no: 0 }, // ✅ AGREGADO
            mediosContacto: {}, // ✅ AGREGADO
            estadisticasOficinas: [], // ✅ AGREGADO
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
            calificacionOficina: 0,
        };
    };

    EstadisticasManager.prototype.loadStatistics = function () {
        this.view.isLoading = true;
        this.view.hasData = false;
        this.showLoadingState();

        var filtros = this.view.filtrosCLAManager.getFiltros();
        var params = {};

        if (filtros.mostrarTodas) {
        } else {
            if (filtros.cla) {
                params.claId = filtros.cla;
            }

            if (filtros.oficina) {
                params.oficinaId = filtros.oficina;
            }
        }

        Espo.Ajax.getRequest("CCustomerSurvey/action/getStats", params)
            .then(
                function (response) {
                    if (response && response.success && response.data) {
                        this.stats = this.procesarEstadisticasReales(
                            response.data
                        );
                        this.view.hasData = this.stats.totalEncuestas > 0;
                        this.view.isLoading = false;

                        this.updateUI();
                    } else {
                        this.handleNoData();
                    }
                }.bind(this)
            )
            .catch(
                function (error) {
                    this.handleNoData();
                }.bind(this)
            );
    };

    EstadisticasManager.prototype.procesarEstadisticasReales = function (
        datosBackend
    ) {
        var promediosBackend = datosBackend.promediosCategorias || {};

        return {
            totalEncuestas: datosBackend.totalEncuestas || 0,
            satisfaccionPromedio: datosBackend.satisfaccionPromedio || 0,
            porcentajeRecomendacion: datosBackend.porcentajeRecomendacion || 0,
            tiposOperacion: datosBackend.tiposOperacion || 0,
            distribucionOperaciones: datosBackend.distribucionOperaciones || {},
            asesoresDestacados: datosBackend.asesoresDestacados || [],
            promediosCategorias: promediosBackend,
            distribucionCalificaciones:
                datosBackend.distribucionCalificaciones || {},
            efectividadComunicacion:
                promediosBackend.communicationEffectiveness || 0,
            asesoriaLegal: promediosBackend.legalAdvice || 0,
            presentacionPersonal: promediosBackend.personalPresentation || 0,
            manejoDetalles: promediosBackend.detailManagement || 0,
            puntualidad: promediosBackend.punctuality || 0,
            compromiso: promediosBackend.commitmentLevel || 0,
            solucionProblemas: promediosBackend.problemSolving || 0,
            acompanamiento: promediosBackend.fullSupport || 0,
            situacionesImprevistas: promediosBackend.unexpectedSituations || 0,
            tiemposNegociacion: promediosBackend.negotiationTiming || 0,
            calificacionOficina: promediosBackend.officeRating || 0,
        };
    };

    EstadisticasManager.prototype.showLoadingState = function () {
        var container = this.view.$el.find("#dynamic-content-container")[0];
        if (container) {
            container.innerHTML = this.getLoadingHTML();
        }
    };

    EstadisticasManager.prototype.handleNoData = function () {
        this.view.hasData = false;
        this.view.isLoading = false;
        this.updateUI();
    };

    EstadisticasManager.prototype.updateUI = function () {
        var container = this.view.$el.find("#dynamic-content-container")[0];
        if (!container) {
            return;
        }

        if (this.view.isLoading) {
            container.innerHTML = this.getLoadingHTML();
        } else if (this.view.hasData) {
            container.innerHTML = this.getDataHTML();

            setTimeout(
                function () {
                    if (!this.view.graficosManager) {
                        return;
                    }

                    if (
                        typeof this.view.graficosManager.renderCharts !==
                        "function"
                    ) {
                        return;
                    }

                    if (!this.stats || this.stats.totalEncuestas === 0) {
                        return;
                    }

                    try {
                        this.view.graficosManager.renderCharts();
                    } catch (error) {}
                }.bind(this),
                200
            );
        } else {
            container.innerHTML = this.getEmptyHTML();
        }
    };

    EstadisticasManager.prototype.getLoadingHTML = function () {
        return `
            <div class="loading-alert">
                <div class="spinner-large"></div>
                <h4>Cargando estadísticas...</h4>
                <p class="text-muted">Conectando con el servidor...</p>
            </div>
        `;
    };

    EstadisticasManager.prototype.getDataHTML = function () {
        var stats = this.stats;
        var distribucion = stats.distribucionOperaciones || {};

        var venta = distribucion["Venta"] || 0;
        var compra = distribucion["Compra"] || 0;
        var alquiler = distribucion["Alquiler"] || 0;
        var total = venta + compra + alquiler;

        var ventaPct = total > 0 ? Math.round((venta / total) * 100) : 0;
        var compraPct = total > 0 ? Math.round((compra / total) * 100) : 0;
        var alquilerPct = total > 0 ? Math.round((alquiler / total) * 100) : 0;

        var filtros = this.view.filtrosCLAManager.getFiltros();
        var tituloFiltro = "";

        if (filtros.mostrarTodas) {
            tituloFiltro =
                '<span class="badge badge-primary" style="font-size: clamp(0.75rem, 2vw, 0.9rem); padding: 6px 12px;">🌎 Territorio Nacional</span>';
        } else if (filtros.oficina) {
            tituloFiltro =
                '<span class="badge badge-success" style="font-size: clamp(0.75rem, 2vw, 0.9rem); padding: 6px 12px;">🏪 ' +
                filtros.oficina +
                "</span>";
        } else if (filtros.cla) {
            tituloFiltro =
                '<span class="badge badge-info" style="font-size: clamp(0.75rem, 2vw, 0.9rem); padding: 6px 12px;">🏢 ' +
                filtros.cla +
                "</span>";
        }

        return `
        <div class="reporte-container">
            <!-- Información de Encuesta -->
            <div class="info-encuesta-card">
                <h3 class="info-title">Información de Encuesta ${tituloFiltro}</h3>
                <table class="info-table">
                    <tr>
                        <td class="info-label">Total encuestados:</td>
                        <td class="info-value">${stats.totalEncuestas}</td>
                    </tr>
                    <tr>
                        <td class="info-label">Fecha de Actualización:</td>
                        <td class="info-value">${new Date().toLocaleDateString(
                            "es-ES",
                            {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            }
                        )}</td>
                    </tr>
                </table>
            </div>

            <!-- Sección de Tipo de Operación -->
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
                                <td><strong>Total de Operaciones:</strong></td>
                                <td><strong>${total}</strong></td>
                                <td><strong>100%</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Gráfico de Operaciones -->
                <div class="graficos-container" style="grid-template-columns: 1fr; max-width: 600px; margin: 40px auto;">
                    <div class="grafico-card">
                        <h3 class="grafico-titulo">¿Qué tipo de operación realizó?</h3>
                        <div class="grafico-wrapper">
                            <canvas id="chart-donut"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Gráfico de Competencias -->
                <div class="graficos-secundarios" style="margin-top: 40px;">
                    <div class="grafico-card grande">
                        <h3 class="grafico-titulo">Por favor, evalúe el servicio prestado por el Asesor Inmobiliario de CENTURY 21 en cada uno de los siguientes aspectos:</h3>
                        <div class="grafico-wrapper" style="min-height: 400px;">
                            <canvas id="chart-competencias"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Gráfico de Satisfacción -->
                <div class="graficos-secundarios" style="margin-top: 40px;">
                    <div class="grafico-card grande">
                        <h3 class="grafico-titulo">Evaluación de la satisfacción del servicio prestado por el Asesor Inmobiliario de Century 21</h3>
                        <div class="grafico-wrapper" style="min-height: 350px;">
                            <canvas id="chart-satisfaccion"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Gráficos de Calificación General y Oficina -->
                <div class="graficos-secundarios" style="margin-top: 40px;">
                    <div class="grafico-card">
                        <h3 class="grafico-titulo">En general, ¿Cómo percibió el servicio prestado por el Asesor Inmobiliario de CENTURY 21?</h3>
                        <div class="grafico-wrapper">
                            <canvas id="chart-calificacion-general"></canvas>
                        </div>
                    </div>

                    <div class="grafico-card">
                        <h3 class="grafico-titulo">¿Cómo califica el servicio prestado por la oficina Century 21?</h3>
                        <div class="grafico-wrapper">
                            <canvas id="chart-calificacion-oficina"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Gráficos de Recomendación y Medios de Contacto -->
                <div class="graficos-secundarios" style="margin-top: 40px;">
                    <div class="grafico-card">
                        <h3 class="grafico-titulo">¿Recomendaría el servicio de Century 21 a un amigo/familiar?</h3>
                        <div class="grafico-wrapper">
                            <canvas id="chart-recomendacion"></canvas>
                        </div>
                    </div>

                    <div class="grafico-card">
                        <h3 class="grafico-titulo">¿Por cuál medio se puso en contacto con la oficina/asesor Century 21?</h3>
                        <div class="grafico-wrapper" style="min-height: 350px;">
                            <canvas id="chart-medios-contacto"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    };

    EstadisticasManager.prototype.getEmptyHTML = function () {
        var filtros = this.view.filtrosCLAManager.getFiltros();
        var mensaje = "No hay datos disponibles";

        if (filtros.oficina) {
            mensaje = "No hay datos para esta oficina";
        } else if (filtros.cla) {
            mensaje = "No hay datos para este CLA";
        }

        return `
            <div class="empty-alert">
                <div class="empty-icon">📊</div>
                <h3>${mensaje}</h3>
                <p class="text-muted">No se encontraron encuestas con los filtros seleccionados.</p>
            </div>
        `;
    };

    EstadisticasManager.prototype.procesarEstadisticasReales = function (
        datosBackend
    ) {
        var promediosBackend = datosBackend.promediosCategorias || {};

        return {
            totalEncuestas: datosBackend.totalEncuestas || 0,
            satisfaccionPromedio: datosBackend.satisfaccionPromedio || 0,
            porcentajeRecomendacion: datosBackend.porcentajeRecomendacion || 0,
            tiposOperacion: datosBackend.tiposOperacion || 0,
            distribucionOperaciones: datosBackend.distribucionOperaciones || {},
            asesoresDestacados: datosBackend.asesoresDestacados || [],
            promediosCategorias: promediosBackend,
            distribucionCalificaciones:
                datosBackend.distribucionCalificaciones || {},
            recomendacion: datosBackend.recomendacion || { si: 0, no: 0 },
            mediosContacto: datosBackend.mediosContacto || {},
            estadisticasOficinas: datosBackend.estadisticasOficinas || [],
            efectividadComunicacion:
                promediosBackend.communicationEffectiveness || 0,
            asesoriaLegal: promediosBackend.legalAdvice || 0,
            presentacionPersonal: promediosBackend.personalPresentation || 0,
            manejoDetalles: promediosBackend.detailManagement || 0,
            puntualidad: promediosBackend.punctuality || 0,
            compromiso: promediosBackend.commitmentLevel || 0,
            solucionProblemas: promediosBackend.problemSolving || 0,
            acompanamiento: promediosBackend.fullSupport || 0,
            situacionesImprevistas: promediosBackend.unexpectedSituations || 0,
            tiemposNegociacion: promediosBackend.negotiationTiming || 0,
            calificacionOficina: promediosBackend.officeRating || 0,
        };
    };

    return EstadisticasManager;
});
