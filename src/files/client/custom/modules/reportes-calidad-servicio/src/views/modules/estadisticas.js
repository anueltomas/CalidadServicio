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

            if (filtros.asesor) {
                params.asesorId = filtros.asesor;
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
                        // ✅ AGREGAR: Cargar comentarios si es vista de asesor
                        var filtros = this.view.filtrosCLAManager.getFiltros();
                        if (filtros.asesor) {
                            this.cargarComentariosAsesor();
                        }
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
        } else if (filtros.asesor) {
            var asesorSelect = this.view.$el.find("#asesor-select");
            var asesorNombre = asesorSelect.find("option:selected").text();
            tituloFiltro =
                '<span class="badge badge-warning" style="font-size: clamp(0.75rem, 2vw, 0.9rem); padding: 6px 12px;">👤 ' +
                asesorNombre +
                "</span>";
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

        // ✅ NUEVO: Renderizado condicional según el filtro activo
        if (filtros.asesor) {
            // Vista específica para asesor individual
            return this.getAsesorDetailHTML(
                stats,
                filtros,
                tituloFiltro,
                venta,
                compra,
                alquiler,
                total,
                ventaPct,
                compraPct,
                alquilerPct
            );
        } else {
            // Vista general (territorio, CLA, oficina)
            return this.getGeneralViewHTML(
                stats,
                filtros,
                tituloFiltro,
                venta,
                compra,
                alquiler,
                total,
                ventaPct,
                compraPct,
                alquilerPct
            );
        }
    };

    EstadisticasManager.prototype.getAsesorDetailHTML = function (
        stats,
        filtros,
        tituloFiltro,
        venta,
        compra,
        alquiler,
        total,
        ventaPct,
        compraPct,
        alquilerPct
    ) {
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

            <!-- Sección de Operaciones -->
            <div class="seccion-operaciones">
                <h2 class="titulo-seccion">¿Qué tipo de operación realizó?</h2>
                
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

                <div class="graficos-container" style="grid-template-columns: 1fr; max-width: 600px; margin: 40px auto;">
                    <div class="grafico-card">
                        <h3 class="grafico-titulo">¿Qué tipo de operación realizó?</h3>
                        <div class="grafico-wrapper">
                            <canvas id="chart-donut"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Evaluación del servicio prestado -->
                <div class="graficos-secundarios" style="margin-top: 40px;">
                    <div class="grafico-card grande">
                        <h3 class="grafico-titulo">Evaluación del servicio prestado por el Asesor Inmobiliario</h3>
                        <div class="grafico-wrapper" style="min-height: 400px;">
                            <canvas id="chart-competencias"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Evaluación de Satisfacción -->
                <div class="graficos-secundarios" style="margin-top: 40px;">
                    <div class="grafico-card grande">
                        <h3 class="grafico-titulo">Evaluación de la satisfacción del servicio</h3>
                        <div class="grafico-wrapper" style="min-height: 350px;">
                            <canvas id="chart-satisfaccion"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Cómo percibió el servicio -->
                <div class="graficos-secundarios" style="margin-top: 40px;">
                    <div class="grafico-card">
                        <h3 class="grafico-titulo">¿Cómo percibió el servicio prestado por el Asesor?</h3>
                        <div class="grafico-wrapper">
                            <canvas id="chart-calificacion-general"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Medio de contacto -->
                <div class="graficos-secundarios" style="margin-top: 40px;">
                    <div class="grafico-card">
                        <h3 class="grafico-titulo">¿Por cuál medio se puso en contacto?</h3>
                        <div class="grafico-wrapper" style="min-height: 350px;">
                            <canvas id="chart-medios-contacto"></canvas>
                        </div>
                    </div>
                </div>

                <!-- ✅ NUEVO: Comentarios del asesor -->
                <div class="graficos-secundarios" style="margin-top: 40px;">
                    <div class="grafico-card grande">
                        <h3 class="grafico-titulo">💬 Comentarios y Sugerencias de los Clientes</h3>
                        <div id="comentarios-container" class="comentarios-wrapper">
                            <div style="text-align: center; padding: 20px; color: #7f8c8d;">
                                <i class="fas fa-spinner fa-spin" style="font-size: 24px;"></i>
                                <p style="margin-top: 10px;">Cargando comentarios...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    };

    EstadisticasManager.prototype.getGeneralViewHTML = function (
        stats,
        filtros,
        tituloFiltro,
        venta,
        compra,
        alquiler,
        total,
        ventaPct,
        compraPct,
        alquilerPct
    ) {
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

                <div class="graficos-container" style="grid-template-columns: 1fr; max-width: 600px; margin: 40px auto;">
                    <div class="grafico-card">
                        <h3 class="grafico-titulo">¿Qué tipo de operación realizó?</h3>
                        <div class="grafico-wrapper">
                            <canvas id="chart-donut"></canvas>
                        </div>
                    </div>
                </div>

                <div class="graficos-secundarios" style="margin-top: 40px;">
                    <div class="grafico-card grande">
                        <h3 class="grafico-titulo">Por favor, evalúe el servicio prestado por el Asesor Inmobiliario de CENTURY 21 en cada uno de los siguientes aspectos:</h3>
                        <div class="grafico-wrapper" style="min-height: 400px;">
                            <canvas id="chart-competencias"></canvas>
                        </div>
                    </div>
                </div>

                <div class="graficos-secundarios" style="margin-top: 40px;">
                    <div class="grafico-card grande">
                        <h3 class="grafico-titulo">Evaluación de la satisfacción del servicio prestado por el Asesor Inmobiliario de Century 21</h3>
                        <div class="grafico-wrapper" style="min-height: 350px;">
                            <canvas id="chart-satisfaccion"></canvas>
                        </div>
                    </div>
                </div>

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

    EstadisticasManager.prototype.cargarComentariosAsesor = function () {
        var filtros = this.view.filtrosCLAManager.getFiltros();

        if (!filtros.asesor) {
            return;
        }

        Espo.Ajax.getRequest("CCustomerSurvey/action/getComentariosAsesor", {
            asesorId: filtros.asesor,
        })
            .then(
                function (response) {
                    if (response && response.success) {
                        this.renderComentarios(response.comentarios || []);
                    } else {
                        this.renderComentarios([]);
                    }
                }.bind(this)
            )
            .catch(
                function (error) {
                    console.error("Error cargando comentarios:", error);
                    this.renderComentarios([]);
                }.bind(this)
            );
    };

    // ✅ NUEVO: Renderizar lista de comentarios
    // En el método renderComentarios:
    EstadisticasManager.prototype.renderComentarios = function (comentarios) {
        var container = document.getElementById("comentarios-container");

        if (!container) {
            return;
        }

        if (comentarios.length === 0) {
            container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #95a5a6;">
            <i class="fas fa-comment-slash" style="font-size: 48px; margin-bottom: 15px;"></i>
            <p style="font-size: 16px; margin: 0;">No hay comentarios disponibles para este asesor</p>
        </div>
    `;
            return;
        }

        // Configuración de paginación
        var itemsPorPagina = 5;
        var paginaActual = 1;
        var totalPaginas = Math.ceil(comentarios.length / itemsPorPagina);

        // Función para renderizar una página específica
        var renderizarPagina = function (pagina) {
            var inicio = (pagina - 1) * itemsPorPagina;
            var fin = inicio + itemsPorPagina;
            var comentariosPagina = comentarios.slice(inicio, fin);

            var html = `
        <div class="comentarios-list">
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 8px;
            ">
                <div>
                    <span style="font-weight: 600; color: #2c3e50;">
                        <i class="fas fa-comments"></i> 
                        ${comentarios.length} comentarios encontrados
                    </span>
                </div>
                <div style="display: flex; align-items: center; gap: 15px;">
                    <span style="color: #7f8c8d; font-size: 14px;">
                        Mostrando ${inicio + 1}-${Math.min(
                fin,
                comentarios.length
            )} de ${comentarios.length}
                    </span>
                    <div style="display: flex; gap: 5px;">
                        <button onclick="cambiarPagina(${pagina - 1})" 
                                ${pagina === 1 ? "disabled" : ""}
                                style="
                                    background: ${
                                        pagina === 1 ? "#e9ecef" : "#B8A279"
                                    };
                                    color: ${
                                        pagina === 1 ? "#95a5a6" : "white"
                                    };
                                    border: none;
                                    width: 35px;
                                    height: 35px;
                                    border-radius: 50%;
                                    cursor: ${
                                        pagina === 1 ? "not-allowed" : "pointer"
                                    };
                                    font-weight: 600;
                                    transition: all 0.3s ease;
                                " onmouseover="this.style.transform='translateY(-2px)';" 
                                onmouseout="this.style.transform='translateY(0)';">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        
                        <div style="
                            display: flex;
                            align-items: center;
                            background: white;
                            padding: 0 15px;
                            border-radius: 20px;
                            font-weight: 600;
                            color: #2c3e50;
                            height: 35px;
                        ">
                            Página ${pagina} de ${totalPaginas}
                        </div>
                        
                        <button onclick="cambiarPagina(${pagina + 1})" 
                                ${pagina === totalPaginas ? "disabled" : ""}
                                style="
                                    background: ${
                                        pagina === totalPaginas
                                            ? "#e9ecef"
                                            : "#B8A279"
                                    };
                                    color: ${
                                        pagina === totalPaginas
                                            ? "#95a5a6"
                                            : "white"
                                    };
                                    border: none;
                                    width: 35px;
                                    height: 35px;
                                    border-radius: 50%;
                                    cursor: ${
                                        pagina === totalPaginas
                                            ? "not-allowed"
                                            : "pointer"
                                    };
                                    font-weight: 600;
                                    transition: all 0.3s ease;
                                " onmouseover="this.style.transform='translateY(-2px)';" 
                                onmouseout="this.style.transform='translateY(0)';">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

            comentariosPagina.forEach(function (comentario, index) {
                var indiceGlobal = inicio + index + 1;

                // Determinar color de borde según calificación
                var colorBorde = "#B8A279"; // Default
                if (comentario.calificacionGeneral) {
                    if (comentario.calificacionGeneral >= 4) {
                        colorBorde = "#27ae60"; // Verde para calificaciones altas
                    } else if (comentario.calificacionGeneral <= 2) {
                        colorBorde = "#e74c3c"; // Rojo para calificaciones bajas
                    }
                }

                html += `
            <div class="comentario-item" style="
                background: white;
                border-left: 4px solid ${colorBorde};
                padding: 20px;
                margin-bottom: 15px;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                transition: transform 0.2s, box-shadow 0.2s;
            " onmouseover="this.style.transform='translateX(5px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)';" 
            onmouseout="this.style.transform='translateX(0)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.05)';">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                    <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
                        <span style="
                            background: #B8A279;
                            color: white;
                            width: 35px;
                            height: 35px;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-weight: bold;
                            font-size: 16px;
                        ">${indiceGlobal}</span>
                        <div>
                            <strong style="color: #2c3e50; font-size: 16px; display: block;">
                                ${comentario.clientName || "Cliente Anónimo"}
                            </strong>
                            ${
                                comentario.operationType
                                    ? `
                            <span style="
                                background: #e8e8e8;
                                color: #666;
                                padding: 3px 10px;
                                border-radius: 12px;
                                font-size: 12px;
                                font-weight: 600;
                                margin-top: 5px;
                                display: inline-block;
                            ">
                                <i class="fas fa-tag"></i> ${comentario.operationType}
                            </span>
                            `
                                    : ""
                            }
                        </div>
                    </div>
                    
                    <div style="text-align: right;">
                        <span style="color: #7f8c8d; font-size: 13px; display: block; margin-bottom: 5px;">
                            <i class="far fa-calendar-alt"></i> ${
                                comentario.fecha || "Sin fecha"
                            }
                        </span>
                        ${
                            comentario.calificacionGeneral &&
                            comentario.calificacionGeneral !== "No calificada"
                                ? `
                        <span style="
                            background: ${
                                comentario.calificacionGeneral >= 4
                                    ? "rgba(39, 174, 96, 0.1)"
                                    : comentario.calificacionGeneral <= 2
                                    ? "rgba(231, 76, 60, 0.1)"
                                    : "rgba(52, 152, 219, 0.1)"
                            };
                            color: ${
                                comentario.calificacionGeneral >= 4
                                    ? "#27ae60"
                                    : comentario.calificacionGeneral <= 2
                                    ? "#e74c3c"
                                    : "#3498db"
                            };
                            padding: 3px 10px;
                            border-radius: 12px;
                            font-size: 12px;
                            font-weight: 700;
                            display: inline-block;
                        ">
                            <i class="fas fa-star"></i> ${
                                comentario.calificacionGeneral
                            }/5
                        </span>
                        `
                                : ""
                        }
                    </div>
                </div>
                
                <div style="
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 6px;
                    margin-top: 10px;
                    border-left: 3px solid #B8A279;
                ">
                    <p style="
                        color: #34495e;
                        line-height: 1.6;
                        margin: 0;
                        font-size: 14px;
                        font-style: italic;
                        quotes: '\\201C' '\\201D';
                    ">
                        &ldquo;${comentario.comentario}&rdquo;
                    </p>
                </div>
            </div>
        `;
            });

            // Botones de navegación en la parte inferior
            html += `
            ${
                totalPaginas > 1
                    ? `
            <div style="
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 10px;
                margin-top: 30px;
                padding: 20px;
                background: #f8f9fa;
                border-radius: 8px;
            ">
                <button onclick="cambiarPagina(1)" 
                        ${pagina === 1 ? "disabled" : ""}
                        style="
                            background: ${pagina === 1 ? "#e9ecef" : "#666666"};
                            color: ${pagina === 1 ? "#95a5a6" : "white"};
                            border: none;
                            padding: 8px 15px;
                            border-radius: 6px;
                            cursor: ${pagina === 1 ? "not-allowed" : "pointer"};
                            font-weight: 600;
                            font-size: 14px;
                            transition: all 0.3s ease;
                        " onmouseover="this.style.transform='translateY(-2px)';" 
                        onmouseout="this.style.transform='translateY(0)';">
                    <i class="fas fa-angle-double-left"></i> Primera
                </button>
                
                <button onclick="cambiarPagina(${pagina - 1})" 
                        ${pagina === 1 ? "disabled" : ""}
                        style="
                            background: ${pagina === 1 ? "#e9ecef" : "#B8A279"};
                            color: ${pagina === 1 ? "#95a5a6" : "white"};
                            border: none;
                            padding: 8px 15px;
                            border-radius: 6px;
                            cursor: ${pagina === 1 ? "not-allowed" : "pointer"};
                            font-weight: 600;
                            font-size: 14px;
                            transition: all 0.3s ease;
                        " onmouseover="this.style.transform='translateY(-2px)';" 
                        onmouseout="this.style.transform='translateY(0)';">
                    <i class="fas fa-chevron-left"></i> Anterior
                </button>
                
                <div style="
                    display: flex;
                    gap: 5px;
                    align-items: center;
                    margin: 0 10px;
                ">
                    ${Array.from(
                        { length: Math.min(5, totalPaginas) },
                        (_, i) => {
                            var paginaNum = i + 1;
                            if (totalPaginas > 5) {
                                if (pagina <= 3) {
                                    paginaNum = i + 1;
                                } else if (pagina >= totalPaginas - 2) {
                                    paginaNum = totalPaginas - 4 + i;
                                } else {
                                    paginaNum = pagina - 2 + i;
                                }
                            }
                            return `
                        <button onclick="cambiarPagina(${paginaNum})"
                                style="
                                    background: ${
                                        pagina === paginaNum
                                            ? "#B8A279"
                                            : "white"
                                    };
                                    color: ${
                                        pagina === paginaNum
                                            ? "white"
                                            : "#666666"
                                    };
                                    border: 2px solid ${
                                        pagina === paginaNum
                                            ? "#B8A279"
                                            : "#e9ecef"
                                    };
                                    width: 35px;
                                    height: 35px;
                                    border-radius: 50%;
                                    cursor: pointer;
                                    font-weight: 600;
                                    transition: all 0.3s ease;
                                " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)';" 
                                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                            ${paginaNum}
                        </button>
                        `;
                        }
                    ).join("")}
                </div>
                
                <button onclick="cambiarPagina(${pagina + 1})" 
                        ${pagina === totalPaginas ? "disabled" : ""}
                        style="
                            background: ${
                                pagina === totalPaginas ? "#e9ecef" : "#B8A279"
                            };
                            color: ${
                                pagina === totalPaginas ? "#95a5a6" : "white"
                            };
                            border: none;
                            padding: 8px 15px;
                            border-radius: 6px;
                            cursor: ${
                                pagina === totalPaginas
                                    ? "not-allowed"
                                    : "pointer"
                            };
                            font-weight: 600;
                            font-size: 14px;
                            transition: all 0.3s ease;
                        " onmouseover="this.style.transform='translateY(-2px)';" 
                        onmouseout="this.style.transform='translateY(0)';">
                    Siguiente <i class="fas fa-chevron-right"></i>
                </button>
                
                <button onclick="cambiarPagina(${totalPaginas})" 
                        ${pagina === totalPaginas ? "disabled" : ""}
                        style="
                            background: ${
                                pagina === totalPaginas ? "#e9ecef" : "#666666"
                            };
                            color: ${
                                pagina === totalPaginas ? "#95a5a6" : "white"
                            };
                            border: none;
                            padding: 8px 15px;
                            border-radius: 6px;
                            cursor: ${
                                pagina === totalPagmas
                                    ? "not-allowed"
                                    : "pointer"
                            };
                            font-weight: 600;
                            font-size: 14px;
                            transition: all 0.3s ease;
                        " onmouseover="this.style.transform='translateY(-2px)';" 
                        onmouseout="this.style.transform='translateY(0)';">
                    Última <i class="fas fa-angle-double-right"></i>
                </button>
            </div>
            `
                    : ""
            }
        </div>
        `;

            container.innerHTML = html;
        };

        // Función global para cambiar de página
        window.cambiarPagina = function (nuevaPagina) {
            if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
            paginaActual = nuevaPagina;
            renderizarPagina(paginaActual);
        };

        // Renderizar primera página
        renderizarPagina(1);
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
