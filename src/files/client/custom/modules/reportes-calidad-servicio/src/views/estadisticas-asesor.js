define("reportes-calidad-servicio:views/estadisticas-asesor", [
    "view",
    "reportes-calidad-servicio:views/modules/estadisticas",
    "reportes-calidad-servicio:views/modules/graficos",
], function (Dep, EstadisticasManager, GraficosManager) {
    return Dep.extend({
        template: "reportes-calidad-servicio:estadisticas-asesor",

        setup: function () {
            this._afterRenderExecuted = false;
            this._chartJSLoadInitiated = false;
            this._chartJSLoading = false;
            this._datosYaCargados = false;
            this._cargandoDatos = false;
            this._graficosRenderizados = false;
            this._renderizandoCharts = false;
            this._graficosActualizados = false;

            this.asesorId = this.options.asesorId || null;

            if (!this.asesorId) {
                Espo.Ui.error("No se pudo identificar el asesor");
                this.getRouter().navigate("#Principal", { trigger: true });
                return;
            }

            this.asesorNombre = this.options.asesorNombre || "Cargando...";
            this.oficinaNombre = this.options.oficinaNombre || "Cargando...";
            this.claNombre = this.options.claNombre || "Cargando...";

            if (!this.options.asesorNombre && !this.options.datosAsesor) {
                this.recuperarDatosSessionStorage();
            }

            this.previousRoute = this.options.previousRoute || null;

            this.colores = {
                primario: "#B8A279",
                secundario: "#363438",
                grisOscuro: "#1A1A1A",
                grisMedio: "#666666",
                grisClaro: "#999999",
                grisFondo: "#E6E6E6",
                blanco: "#FFFFFF",
            };

            if (typeof EstadisticasManager === "function") {
                this.estadisticasManager = new EstadisticasManager(this);
            }

            if (typeof GraficosManager === "function") {
                this.graficosManager = new GraficosManager(this);
            }

            this.isLoading = true;
            this.stats = this.getStatsIniciales();
            this.infoAsesor = {
                nombre: this.asesorNombre,
                oficina: this.oficinaNombre,
                cla: this.claNombre,
            };

            this.chartLoaded = false;
            this.dataLoaded = false;
        },

        data: function () {
            return {
                infoAsesor: this.infoAsesor,
                stats: this.stats,
                isLoading: this.isLoading,
                colors: this.colores,
                asesorId: this.asesorId,
            };
        },

        recuperarDatosSessionStorage: function () {
            try {
                if (typeof sessionStorage === "undefined") {
                    return;
                }

                const contextoDetalle = sessionStorage.getItem(
                    "contextoDetalleAsesor"
                );
                if (!contextoDetalle) {
                    return;
                }

                const contexto = JSON.parse(contextoDetalle);
                if (
                    contexto &&
                    contexto.datosAsesor &&
                    contexto.datosAsesor.id === this.asesorId
                ) {
                    this.asesorNombre =
                        contexto.datosAsesor.nombre || this.asesorNombre;
                    this.oficinaNombre =
                        contexto.datosAsesor.oficinaNombre ||
                        this.oficinaNombre;
                    this.claNombre =
                        contexto.datosAsesor.claNombre || this.claNombre;
                }
            } catch (error) {}
        },

        afterRender: function () {
            if (this._afterRenderExecuted) {
                return;
            }
            this._afterRenderExecuted = true;

            this.setupEventListeners();
            this.agregarEstilosGraficos();

            if (!this._chartJSLoadInitiated) {
                this._chartJSLoadInitiated = true;
                this.cargarChartJS();
            }
        },

        agregarEstilosGraficos: function () {
            if (this._estilosAgregados) {
                return;
            }
            this._estilosAgregados = true;

            const style = document.createElement("style");
            style.textContent = `
                .grafico-wrapper {
                    position: relative;
                    width: 100%;
                }
                
                .grafico-donut {
                    height: 300px !important;
                }
                
                .grafico-competencias {
                    height: 450px !important;
                }
                
                .grafico-barras {
                    height: 400px !important;
                }
                
                .grafico-medios-contacto {
                    height: 450px !important;
                }
                
                canvas {
                    display: block !important;
                    max-width: 100% !important;
                    height: 100% !important;
                }
                
                @media (max-width: 768px) {
                    .grafico-donut {
                        height: 250px !important;
                    }
                    
                    .grafico-competencias {
                        height: 350px !important;
                    }
                    
                    .grafico-barras {
                        height: 300px !important;
                    }
                    
                    .grafico-medios-contacto {
                        height: 350px !important;
                    }
                }

                #graficos-container {
                    padding: 20px;
                }
                
                .seccion-operaciones {
                    background: white;
                    border-radius: 12px;
                    padding: 25px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                    margin-bottom: 25px;
                }
                
                .grafico-card {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
                    border: 1px solid #E6E6E6;
                    height: 100%;
                    margin-bottom: 25px;
                }
                
                .graficos-secundarios {
                    margin-top: 30px;
                }
                
                .comentarios-wrapper {
                    min-height: 200px;
                    padding: 20px;
                    background: #F9F9F9;
                    border-radius: 8px;
                    border: 1px solid #E6E6E6;
                }
            `;
            document.head.appendChild(style);
        },

        cargarChartJS: function () {
            if (this.chartLoaded) {
                if (!this._datosYaCargados) {
                    this._datosYaCargados = true;
                    this.cargarDatosAsesor();
                }
                return;
            }

            if (this._chartJSLoading) {
                return;
            }

            if (typeof Chart !== "undefined") {
                this.chartLoaded = true;
                if (!this._datosYaCargados) {
                    this._datosYaCargados = true;
                    this.cargarDatosAsesor();
                }
                return;
            }

            this._chartJSLoading = true;

            const script = document.createElement("script");
            script.src =
                "client/custom/modules/reportes-calidad-servicio/lib/chart.min.js";

            script.onload = () => {
                this._chartJSLoading = false;
                this.chartLoaded = true;

                if (!this._datosYaCargados) {
                    this._datosYaCargados = true;
                    this.cargarDatosAsesor();
                }
            };

            script.onerror = () => {
                this._chartJSLoading = false;
                this.chartLoaded = false;
                Espo.Ui.warning(
                    "No se pudieron cargar los gráficos. Mostrando solo datos."
                );

                if (!this._datosYaCargados) {
                    this._datosYaCargados = true;
                    this.cargarDatosAsesor();
                }
            };

            document.head.appendChild(script);
        },

        cargarDatosAsesor: function () {
            if (this._cargandoDatos) {
                return;
            }

            this._cargandoDatos = true;
            this.isLoading = true;

            if (this.$el && this.$el.length) {
                this.reRender();
            }

            Promise.all([
                this.cargarInfoAsesor(),
                this.cargarEstadisticasAsesor(),
            ])
                .then(() => {
                    this.dataLoaded = true;
                    this.isLoading = false;
                    this._cargandoDatos = false;

                    if (this.$el && this.$el.length) {
                        this.reRender();
                    }

                    setTimeout(() => {
                        if (!this._graficosRenderizados) {
                            this._graficosRenderizados = true;
                            this.renderCharts();
                            this.cargarComentariosAsesor();
                        }
                    }, 200);
                })
                .catch((error) => {
                    Espo.Ui.error("Error al cargar datos del asesor");
                    this.isLoading = false;
                    this._cargandoDatos = false;

                    if (this.$el && this.$el.length) {
                        this.reRender();
                    }
                });
        },

        cargarInfoAsesor: function () {
            return new Promise((resolve, reject) => {
                Espo.Ajax.getRequest("CCustomerSurvey/action/getInfoAsesor", {
                    asesorId: this.asesorId,
                })
                    .then((response) => {
                        if (response && response.success && response.data) {
                            this.infoAsesor = {
                                nombre:
                                    response.data.name ||
                                    response.data.userName ||
                                    this.infoAsesor.nombre,
                                oficina:
                                    response.data.oficina ||
                                    this.infoAsesor.oficina,
                                cla: response.data.cla || this.infoAsesor.cla,
                                email: response.data.email,
                                telefono: response.data.telefono,
                            };
                        }
                        resolve();
                    })
                    .catch((error) => {
                        resolve();
                    });
            });
        },

        cargarEstadisticasAsesor: function () {
            return new Promise((resolve, reject) => {
                Espo.Ajax.getRequest("CCustomerSurvey/action/getStats", {
                    asesorId: this.asesorId,
                })
                    .then((response) => {
                        if (response.success && response.data) {
                            this.stats = this.procesarEstadisticasReales(
                                response.data
                            );
                        } else {
                            this.stats = this.getStatsIniciales();
                        }
                        resolve();
                    })
                    .catch((error) => {
                        this.stats = this.getStatsIniciales();
                        resolve();
                    });
            });
        },

        renderCharts: function () {
            if (this._renderizandoCharts) {
                return;
            }

            if (typeof Chart === "undefined") {
                this.showNoChartsMessage();
                return;
            }

            if (!this.stats || this.stats.totalEncuestas === 0) {
                this.showNoDataMessage();
                return;
            }

            const container = this.$el.find("#graficos-container");
            if (!container.length) {
                return;
            }

            this._renderizandoCharts = true;

            container.html(`
        <div class="seccion-operaciones mb-4">
            <h3 style="color: #363438; margin-bottom: 25px;">
                <i class="fas fa-chart-pie me-2" style="color: #B8A279;"></i>
                Métricas Generales
            </h3>
            
            <div class="row mb-4">
                <div class="col-md-4">
                    <div class="stat-card" style="background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <div style="color: #B8A279; font-size: 36px; font-weight: bold;">
                            ${this.stats.totalEncuestas}
                        </div>
                        <div style="color: #666666; font-size: 14px; margin-top: 5px;">
                            Total Encuestas
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="stat-card" style="background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <div style="color: #B8A279; font-size: 36px; font-weight: bold;">
                            ${this.stats.satisfaccionPromedio.toFixed(1)}/5.0
                        </div>
                        <div style="color: #666666; font-size: 14px; margin-top: 5px;">
                            Satisfacción Promedio
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="stat-card" style="background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <div style="color: #B8A279; font-size: 36px; font-weight: bold;">
                            ${this.stats.porcentajeRecomendacion}%
                        </div>
                        <div style="color: #666666; font-size: 14px; margin-top: 5px;">
                            Recomendación
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row mb-4">
            <div class="col-md-6">
                <div class="grafico-card">
                    <h4 style="color: #363438; margin-bottom: 20px;">
                        <i class="fas fa-chart-pie me-2" style="color: #B8A279;"></i>
                        Distribución de Operaciones
                    </h4>
                    <div class="grafico-wrapper grafico-donut">
                        <canvas id="chart-donut"></canvas>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="grafico-card">
                    <h4 style="color: #363438; margin-bottom: 20px;">
                        <i class="fas fa-star me-2" style="color: #B8A279;"></i>
                        Promedio por Competencia
                    </h4>
                    <div class="grafico-wrapper grafico-competencias">
                        <canvas id="chart-competencias"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <div class="row mb-4">
            <div class="col-md-6">
                <div class="grafico-card">
                    <h4 style="color: #363438; margin-bottom: 20px;">
                        <i class="fas fa-chart-bar me-2" style="color: #B8A279;"></i>
                        Distribución de Calificaciones
                    </h4>
                    <div class="grafico-wrapper grafico-barras">
                        <canvas id="chart-satisfaccion"></canvas>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="grafico-card">
                    <h4 style="color: #363438; margin-bottom: 20px;">
                        <i class="fas fa-thumbs-up me-2" style="color: #B8A279;"></i>
                        Recomendación
                    </h4>
                    <div class="grafico-wrapper grafico-donut">
                        <canvas id="chart-recomendacion"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <div class="row mb-4">
            <div class="col-md-12">
                <div class="grafico-card">
                    <h4 style="color: #363438; margin-bottom: 20px;">
                        <i class="fas fa-phone me-2" style="color: #B8A279;"></i>
                        Medios de Contacto
                    </h4>
                    <div class="grafico-wrapper grafico-medios-contacto">
                        <canvas id="chart-medios-contacto"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `);

            setTimeout(() => {
                try {
                    const canvasIds = [
                        "chart-donut",
                        "chart-competencias",
                        "chart-satisfaccion",
                        "chart-recomendacion",
                        "chart-medios-contacto",
                    ];
                    const canvasExisten = canvasIds.map((id) => {
                        return !!document.getElementById(id);
                    });

                    if (!canvasExisten.every((e) => e)) {
                        this._renderizandoCharts = false;
                        return;
                    }

                    this.graficosManager.view = this;

                    this.graficosManager.renderCharts();

                    setTimeout(() => {
                        if (this.graficosManager.charts) {
                            const chartsCreados = Object.keys(
                                this.graficosManager.charts
                            );

                            if (chartsCreados.length > 0) {
                                this.actualizarGraficosUnaVez();
                            }
                        }
                        this._renderizandoCharts = false;
                    }, 200);
                } catch (error) {
                    this._renderizandoCharts = false;
                }
            }, 200);
        },

        actualizarGraficosUnaVez: function () {
            if (this._graficosActualizados) {
                return;
            }

            try {
                if (this.graficosManager && this.graficosManager.charts) {
                    Object.values(this.graficosManager.charts).forEach(
                        (chart) => {
                            if (chart && typeof chart.resize === "function") {
                                chart.resize();
                                chart.update();
                            }
                        }
                    );
                    this._graficosActualizados = true;
                }
            } catch (error) {}
        },

        cargarComentariosAsesor: function () {
            Espo.Ajax.getRequest(
                "CCustomerSurvey/action/getComentariosAsesor",
                {
                    asesorId: this.asesorId,
                }
            )
                .then((response) => {
                    if (response && response.success) {
                        this.renderComentarios(response.comentarios || []);
                    } else {
                        this.renderComentarios([]);
                    }
                })
                .catch(() => {
                    this.renderComentarios([]);
                });
        },

        renderComentarios: function (comentarios) {
            const container = this.$el.find("#comentarios-container");
            if (!container.length) return;

            if (!comentarios || comentarios.length === 0) {
                container.html(`
                    <div style="text-align: center; padding: 30px; color: #999999;">
                        <i class="fas fa-comment-slash" style="font-size: 36px; margin-bottom: 12px;"></i>
                        <p style="font-size: 14px; margin: 0;">No hay comentarios disponibles</p>
                    </div>
                `);
                return;
            }

            const comentariosLimitados = comentarios.slice(0, 10);
            comentariosLimitados.sort((a, b) => {
                const dateA = new Date(a.fecha || a.createdAt || 0);
                const dateB = new Date(b.fecha || b.createdAt || 0);
                return dateB - dateA;
            });

            const totalComentarios = comentarios.length;

            const html = `
                <div class="comentarios-content">
                    <div class="comentarios-counter" style="
                        text-align: center;
                        padding: 10px;
                        color: #666666;
                        font-size: 0.9em;
                        border-bottom: 1px solid #E6E6E6;
                        margin-bottom: 15px;
                    ">
                        <span style="font-weight: 600; color: #363438;">
                            <i class="fas fa-comments me-2"></i>${totalComentarios}
                        </span> comentarios totales
                        ${
                            totalComentarios > 10
                                ? ` · Mostrando los 10 más recientes`
                                : ""
                        }
                    </div>

                    <div class="comentarios-list" style="max-height: 600px; overflow-y: auto;">
                        ${comentariosLimitados
                            .map((comentario) => {
                                const fecha = new Date(
                                    comentario.fecha ||
                                        comentario.createdAt ||
                                        Date.now()
                                );
                                const fechaFormateada =
                                    fecha.toLocaleDateString("es-ES", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                    });

                                const comentarioTexto = this.escapeHtml(
                                    comentario.comentario ||
                                        comentario.texto ||
                                        "Sin comentario"
                                );

                                return `
                                <div class="comentario-item-compacto" style="
                                    background: #F5F5F5;
                                    border-left: 3px solid #B8A279;
                                    border-radius: 6px;
                                    padding: 12px 15px;
                                    margin-bottom: 10px;
                                    transition: all 0.2s ease;
                                ">
                                    <div class="comentario-texto" style="
                                        color: #1A1A1A;
                                        line-height: 1.4;
                                        font-size: 0.9em;
                                        margin-bottom: 8px;
                                        text-align: left;
                                    ">
                                        ${comentarioTexto}
                                    </div>
                                    
                                    <div class="comentario-footer" style="
                                        display: flex;
                                        justify-content: space-between;
                                        align-items: center;
                                        font-size: 0.75em;
                                        color: #999999;
                                    ">
                                        <span>
                                            <i class="fas fa-user me-1"></i>
                                            ${
                                                comentario.clientName ||
                                                "Cliente Anónimo"
                                            }
                                        </span>
                                        <span>
                                            <i class="fas fa-calendar me-1"></i>
                                            ${fechaFormateada}
                                        </span>
                                    </div>
                                </div>
                            `;
                            })
                            .join("")}
                    </div>

                    ${
                        totalComentarios > 10
                            ? `
                        <div class="comentarios-notice" style="
                            text-align: center;
                            padding: 10px;
                            color: #999999;
                            font-size: 0.8em;
                            font-style: italic;
                            border-top: 1px solid #E6E6E6;
                            margin-top: 10px;
                        ">
                            <i class="fas fa-info-circle me-1"></i>
                            Mostrando los 10 comentarios más recientes de ${totalComentarios} totales
                        </div>
                    `
                            : ""
                    }
                </div>
            `;

            container.html(html);
        },

        escapeHtml: function (text) {
            if (!text) return "";
            const div = document.createElement("div");
            div.textContent = text;
            return div.innerHTML;
        },

        volverAComparacion: function () {
            const contextoDetalle = this.obtenerContextoDetalle();
            if (contextoDetalle) {
                if (
                    contextoDetalle.desde === "comparacion-asesores" &&
                    contextoDetalle.oficinaId
                ) {
                    sessionStorage.removeItem("contextoDetalleAsesor");
                    this.getRouter().navigate(
                        `#Principal/asesores/${contextoDetalle.oficinaId}`,
                        { trigger: true }
                    );
                    return;
                }
            }

            if (this.options.previousRoute) {
                this.getRouter().navigate(this.options.previousRoute, {
                    trigger: true,
                });
                return;
            }

            if (this.options.oficinaId) {
                this.getRouter().navigate(
                    `#Principal/asesores/${this.options.oficinaId}`,
                    { trigger: true }
                );
                return;
            }

            if (this.options.claId) {
                this.getRouter().navigate(
                    `#Principal/oficinas/${this.options.claId}`,
                    { trigger: true }
                );
                return;
            }

            this.getRouter().navigate("#Principal", { trigger: true });
        },

        obtenerContextoDetalle: function () {
            try {
                const contexto = sessionStorage.getItem(
                    "contextoDetalleAsesor"
                );
                if (contexto) {
                    return JSON.parse(contexto);
                }
            } catch (error) {}
            return null;
        },

        exportarReporte: function () {
            const nombreAsesor = this.infoAsesor.nombre
                .replace(/[^a-z0-9]/gi, "-")
                .toLowerCase();
            const fecha = new Date().toISOString().split("T")[0];

            let csv = `Estadísticas de ${this.infoAsesor.nombre}\n`;
            csv += `Fecha: ${fecha}\n`;
            csv += `CLA: ${this.infoAsesor.cla}\n`;
            csv += `Oficina: ${this.infoAsesor.oficina}\n\n`;

            csv += "Métrica,Valor\n";
            csv += `Total Encuestas,${this.stats.totalEncuestas}\n`;
            csv += `Satisfacción Promedio,${this.stats.satisfaccionPromedio.toFixed(
                1
            )}/5.0\n`;
            csv += `Porcentaje Recomendación,${this.stats.porcentajeRecomendacion}%\n`;

            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute(
                "download",
                `estadisticas-${nombreAsesor}-${fecha}.csv`
            );
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            Espo.Ui.success("Reporte exportado exitosamente");
        },

        setupEventListeners: function () {
            this.$el.on("click", '[data-action="volver"]', () =>
                this.volverAComparacion()
            );
            this.$el.on("click", '[data-action="exportar"]', () =>
                this.exportarReporte()
            );
        },

        procesarEstadisticasReales: function (datosBackend) {
            var promediosBackend = datosBackend.promediosCategorias || {};

            return {
                totalEncuestas: datosBackend.totalEncuestas || 0,
                satisfaccionPromedio: datosBackend.satisfaccionPromedio || 0,
                porcentajeRecomendacion:
                    datosBackend.porcentajeRecomendacion || 0,
                distribucionOperaciones:
                    datosBackend.distribucionOperaciones || {},
                promediosCategorias: promediosBackend,
                distribucionCalificaciones:
                    datosBackend.distribucionCalificaciones || {},
                recomendacion: datosBackend.recomendacion || { si: 0, no: 0 },
                mediosContacto: datosBackend.mediosContacto || {},
                estadisticasOficinas: datosBackend.estadisticasOficinas || [],
            };
        },

        getStatsIniciales: function () {
            return {
                totalEncuestas: 0,
                satisfaccionPromedio: 0,
                porcentajeRecomendacion: 0,
                distribucionOperaciones: {},
                promediosCategorias: {},
                distribucionCalificaciones: {},
                recomendacion: { si: 0, no: 0 },
                mediosContacto: {},
                estadisticasOficinas: [],
            };
        },

        showNoDataMessage: function () {
            const container = this.$el.find("#graficos-container");
            if (container.length) {
                container.html(`
                    <div class="text-center" style="padding: 60px;">
                        <div style="color: ${this.colores.grisMedio}; font-size: 48px; margin-bottom: 20px;">
                            <i class="fas fa-chart-bar"></i>
                        </div>
                        <h4 style="color: ${this.colores.secundario};">No hay datos disponibles</h4>
                        <p style="color: ${this.colores.grisMedio};">Este asesor no tiene encuestas registradas</p>
                    </div>
                `);
            }
        },

        showNoChartsMessage: function () {
            const container = this.$el.find("#graficos-container");
            if (container.length) {
                container.html(`
                    <div class="text-center" style="padding: 40px; color: ${this.colores.grisClaro};">
                        <i class="fas fa-exclamation-circle" style="font-size: 36px; margin-bottom: 15px;"></i>
                        <p style="font-size: 14px; margin: 0;">No se pueden mostrar los gráficos</p>
                    </div>
                `);
            }
        },

        onRemove: function () {
            this._afterRenderExecuted = false;
            this._chartJSLoadInitiated = false;
            this._chartJSLoading = false;
            this._datosYaCargados = false;
            this._cargandoDatos = false;
            this._graficosRenderizados = false;
            this._renderizandoCharts = false;
            this._graficosActualizados = false;
            this._estilosAgregados = false;

            this.$el.off("click", '[data-action="volver"]');
            this.$el.off("click", '[data-action="exportar"]');

            if (
                this.graficosManager &&
                typeof this.graficosManager.destroyCharts === "function"
            ) {
                try {
                    this.graficosManager.destroyCharts();
                } catch (error) {}
            }
        },
    });
});
