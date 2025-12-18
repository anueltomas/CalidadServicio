define("reportes-calidad-servicio:views/estadisticas-asesor", [
    "view",
    "reportes-calidad-servicio:views/modules/estadisticas",
    "reportes-calidad-servicio:views/modules/graficos",
], function (Dep, EstadisticasManager, GraficosManager) {
    return Dep.extend({
        template: "reportes-calidad-servicio:estadisticas-asesor",

        setup: function () {
            this.asesorId = this.options.asesorId || null;

            if (!this.asesorId) {
                Espo.Ui.error("No se pudo identificar el asesor");
                this.getRouter().navigate("#Principal", { trigger: true });
                return;
            }

            // Paleta de colores unificada
            this.colores = {
                primario: "#B8A279",
                secundario: "#363438",
                grisOscuro: "#1A1A1A",
                grisMedio: "#666666",
                grisClaro: "#999999",
                grisFondo: "#E6E6E6",
                blanco: "#FFFFFF",
            };

            // Inicializar managers
            if (typeof EstadisticasManager === "function") {
                this.estadisticasManager = new EstadisticasManager(this);
            }

            if (typeof GraficosManager === "function") {
                this.graficosManager = new GraficosManager(this);
            }

            // Estado inicial
            this.isLoading = true;
            this.stats = this.getStatsIniciales();
            this.infoAsesor = {
                nombre: "Cargando...",
                oficina: "Cargando...",
                cla: "Cargando...",
            };

            this.chartLoaded = false;
            this.dataLoaded = false;
        },

        afterRender: function () {
            this.renderBasicStructure();
            this.setupEventListeners();
            this.agregarEstilosGraficos();
            this.cargarChartJS();
        },

        agregarEstilosGraficos: function () {
            const style = document.createElement("style");
            style.textContent = `
        /* Tamaños estándar para gráficos */
        .grafico-wrapper {
            position: relative;
            width: 100%;
        }
        
        /* Gráficos donut/pie - altura estándar */
        .grafico-donut {
            height: 300px !important;
        }
        
        /* Gráficos de barras horizontales (competencias) - altura estándar */
        .grafico-competencias {
            height: 450px !important;
        }
        
        /* Gráficos de barras verticales - altura estándar */
        .grafico-barras {
            height: 400px !important;
        }
        
        /* Gráficos de barras horizontales (medios contacto) - altura estándar */
        .grafico-medios-contacto {
            height: 450px !important;
        }
        
        canvas {
            display: block !important;
            max-width: 100% !important;
            height: 100% !important;
            opacity: 1 !important;
            visibility: visible !important;
        }
        
        /* Responsive */
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
    `;
            document.head.appendChild(style);
        },

        cargarChartJS: function () {
            if (typeof Chart !== "undefined") {
                this.chartLoaded = true;
                this.cargarDatosAsesor();
                return;
            }

            const script = document.createElement("script");
            script.src =
                "client/custom/modules/reportes-calidad-servicio/lib/chart.min.js";
            script.onload = () => {
                this.chartLoaded = true;
                this.cargarDatosAsesor();
            };
            script.onerror = () => {
                Espo.Ui.warning(
                    "No se pudieron cargar los gráficos. Mostrando solo datos."
                );
                this.chartLoaded = false;
                this.cargarDatosAsesor();
            };
            document.head.appendChild(script);
        },

        cargarDatosAsesor: function () {
            this.showLoadingState();

            Promise.all([
                this.cargarInfoAsesor(),
                this.cargarEstadisticasAsesor(),
            ])
                .then(() => {
                    this.dataLoaded = true;
                    this.isLoading = false;
                    this.updateUIWithData();
                    this.renderCharts();
                    this.cargarComentariosAsesor();
                })
                .catch((error) => {
                    console.error("Error cargando datos:", error);
                    Espo.Ui.error("Error al cargar datos del asesor");
                    this.isLoading = false;
                    this.updateUIWithData();
                });
        },

        renderBasicStructure: function () {
            const html = `
                <div class="container-fluid">
                    <div class="row mb-4">
                        <div class="col-md-12">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h1 class="h3 mb-0">
                                        <i class="fas fa-chart-bar me-2" style="color: ${this.colores.primario};"></i>
                                        Estadísticas Detalladas del Asesor
                                    </h1>
                                    <p class="mb-0" style="color: ${this.colores.grisMedio};">
                                        <i class="fas fa-user-tie me-1" style="color: ${this.colores.secundario};"></i> 
                                        Asesor: <strong id="nombre-asesor" style="color: ${this.colores.secundario};">Cargando...</strong>
                                    </p>
                                </div>
                                <div>
                                    <button class="btn btn-default btn-sm me-2" data-action="volver" style="border-color: ${this.colores.grisFondo}; color: ${this.colores.secundario};">
                                        <i class="fas fa-arrow-left me-1"></i> Volver
                                    </button>
                                    <button class="btn btn-success btn-sm" data-action="exportar" style="background-color: ${this.colores.primario}; border-color: ${this.colores.primario};">
                                        <i class="fas fa-file-excel me-1"></i> Exportar Reporte
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div id="estadisticas-container">
                        <div class="text-center" style="padding: 60px;">
                            <div class="spinner-large"></div>
                            <h4 class="mt-3" style="color: ${this.colores.secundario};">Cargando estadísticas del asesor...</h4>
                            <p style="color: ${this.colores.grisMedio};">Obteniendo información detallada</p>
                        </div>
                    </div>
                </div>
            `;

            this.$el.html(html);
        },

        showLoadingState: function () {
            const container = this.$el.find("#estadisticas-container");
            if (container.length) {
                container.html(`
                    <div class="text-center" style="padding: 60px;">
                        <div class="spinner-large"></div>
                        <h4 class="mt-3" style="color: ${this.colores.secundario};">Cargando estadísticas del asesor...</h4>
                        <p style="color: ${this.colores.grisMedio};">Obteniendo información detallada</p>
                    </div>
                `);
            }
        },

        updateUIWithData: function () {
            this.isLoading = false;
            const nombreElement = this.$el.find("#nombre-asesor");
            if (nombreElement.length) {
                nombreElement.text(this.infoAsesor.nombre);
            }

            const container = this.$el.find("#estadisticas-container");
            if (container.length) {
                container.html(this.getEstadisticasHTML());
            }
        },

        // En el método getEstadisticasHTML(), modifica las secciones de gráficos:
        getEstadisticasHTML: function () {
            const stats = this.stats;
            const info = this.infoAsesor;
            const colores = this.colores;

            return `
        <div class="reporte-container">
            <!-- Header del asesor y estadísticas principales (mantener igual) -->
            
            <!-- Gráficos principales - CON TAMAÑOS UNIFICADOS -->
            <div class="seccion-operaciones" style="background: white; border-radius: 12px; padding: 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); margin-bottom: 25px;">
                <h2 class="titulo-seccion" style="text-align: center; font-size: 1.6em; font-weight: 700; color: ${colores.secundario}; margin: 0 0 25px 0; padding-bottom: 12px; border-bottom: 3px solid ${colores.primario};">
                    <i class="fas fa-chart-pie me-2"></i>
                    Distribución de Operaciones
                </h2>
                
                <!-- Distribución de Operaciones -->
                <div class="row mb-4">
                    <div class="col-md-6">
                        <div class="grafico-card" style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid ${colores.grisFondo}; height: 100%;">
                            <h3 class="grafico-titulo" style="text-align: center; font-size: 1.1em; font-weight: 600; color: ${colores.secundario}; margin: 0 0 15px 0; padding-bottom: 12px; border-bottom: 2px solid ${colores.primario};">
                                ¿Qué tipo de operación realizó?
                            </h3>
                            <div class="grafico-wrapper" style="height: 300px; position: relative;">
                                <canvas id="chart-donut"></canvas>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="grafico-card" style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid ${colores.grisFondo}; height: 100%;">
                            <h3 class="grafico-titulo" style="text-align: center; font-size: 1.1em; font-weight: 600; color: ${colores.secundario}; margin: 0 0 15px 0; padding-bottom: 12px; border-bottom: 2px solid ${colores.primario};">
                                ¿Cómo percibió el servicio prestado por el Asesor?
                            </h3>
                            <div class="grafico-wrapper" style="height: 300px; position: relative;">
                                <canvas id="chart-calificacion-general"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Evaluación de competencias -->
                <div class="graficos-secundarios" style="margin-top: 30px;">
                    <div class="grafico-card">
                        <h3 class="grafico-titulo" style="text-align: center; font-size: 1.1em; font-weight: 600; color: ${colores.secundario}; margin: 0 0 15px 0; padding-bottom: 12px; border-bottom: 2px solid ${colores.primario};">
                            Evaluación del servicio prestado por el Asesor Inmobiliario
                        </h3>
                        <div class="grafico-wrapper" style="height: 450px; position: relative;">
                            <canvas id="chart-competencias"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Evaluación de Satisfacción -->
                <div class="graficos-secundarios" style="margin-top: 30px;">
                    <div class="grafico-card">
                        <h3 class="grafico-titulo" style="text-align: center; font-size: 1.1em; font-weight: 600; color: ${colores.secundario}; margin: 0 0 15px 0; padding-bottom: 12px; border-bottom: 2px solid ${colores.primario};">
                            Evaluación de la satisfacción del servicio
                        </h3>
                        <div class="grafico-wrapper" style="height: 400px; position: relative;">
                            <canvas id="chart-satisfaccion"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Medio de contacto -->
                <div class="graficos-secundarios" style="margin-top: 30px;">
                    <div class="grafico-card">
                        <h3 class="grafico-titulo" style="text-align: center; font-size: 1.1em; font-weight: 600; color: ${colores.secundario}; margin: 0 0 15px 0; padding-bottom: 12px; border-bottom: 2px solid ${colores.primario};">
                            ¿Por cuál medio se puso en contacto?
                        </h3>
                        <div class="grafico-wrapper" style="height: 450px; position: relative;">
                            <canvas id="chart-medios-contacto"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Comentarios del asesor -->
                <div class="graficos-secundarios" style="margin-top: 30px;">
                    <div class="grafico-card">
                        <h3 class="grafico-titulo" style="text-align: center; font-size: 1.1em; font-weight: 600; color: ${colores.secundario}; margin: 0 0 15px 0; padding-bottom: 12px; border-bottom: 2px solid ${colores.primario};">
                            <i class="fas fa-comments me-2"></i>Comentarios de Clientes
                        </h3>
                        <div id="comentarios-container" class="comentarios-wrapper" style="min-height: 200px;">
                            <div style="text-align: center; padding: 20px; color: ${colores.grisClaro};">
                                <i class="fas fa-spinner fa-spin" style="font-size: 20px;"></i>
                                <p style="margin-top: 10px; font-size: 0.9em;">Cargando comentarios...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
        },

        renderCharts: function () {
            if (typeof Chart === "undefined") {
                this.showNoChartsMessage();
                return;
            }

            if (!this.stats || this.stats.totalEncuestas === 0) {
                this.showNoDataMessage();
                return;
            }

            // Dar tiempo al DOM para renderizarse
            setTimeout(() => {
                if (
                    this.graficosManager &&
                    typeof this.graficosManager.renderCharts === "function"
                ) {
                    this.graficosManager.view = this;
                    this.graficosManager.renderCharts();

                    // Forzar redibujado después de un momento
                    setTimeout(() => {
                        if (this.graficosManager.charts) {
                            Object.values(this.graficosManager.charts).forEach(
                                (chart) => {
                                    if (
                                        chart &&
                                        typeof chart.resize === "function"
                                    ) {
                                        chart.resize();
                                        chart.update();
                                    }
                                }
                            );
                        }
                    }, 100);
                }
            }, 100);
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
            if (!container.length) {
                return;
            }

            if (!comentarios || comentarios.length === 0) {
                container.html(`
                    <div style="text-align: center; padding: 30px; color: ${this.colores.grisClaro};">
                        <i class="fas fa-comment-slash" style="font-size: 36px; margin-bottom: 12px;"></i>
                        <p style="font-size: 14px; margin: 0;">No hay comentarios disponibles</p>
                    </div>
                `);
                return;
            }

            // LIMITAR A 10 COMENTARIOS COMO MÁXIMO
            const comentariosLimitados = comentarios.slice(0, 10);

            // Ordenar comentarios por fecha (más recientes primero)
            comentariosLimitados.sort((a, b) => {
                const dateA = new Date(a.fecha || a.createdAt || 0);
                const dateB = new Date(b.fecha || b.createdAt || 0);
                return dateB - dateA;
            });

            // Contador simple
            const totalComentarios = comentarios.length;
            const comentariosMostrados = comentariosLimitados.length;

            const html = `
                <div class="comentarios-content">
                    <!-- Contador simple -->
                    <div class="comentarios-counter mb-3" style="
                        text-align: center;
                        padding: 8px;
                        color: ${this.colores.grisMedio};
                        font-size: 0.9em;
                        border-bottom: 1px solid ${this.colores.grisFondo};
                    ">
                        <span style="font-weight: 600; color: ${
                            this.colores.secundario
                        };">${totalComentarios}</span> comentarios totales
                        ${
                            totalComentarios > 10
                                ? ` · Mostrando los ${comentariosMostrados} más recientes`
                                : ""
                        }
                    </div>

                    <!-- Lista de comentarios (máximo 10) -->
                    <div class="comentarios-list">
                        ${comentariosLimitados
                            .map((comentario, index) => {
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
                                    <div class="comentario-item" style="
                                        background: ${this.colores.grisFondo};
                                        border-left: 3px solid ${this.colores.primario};
                                        border-radius: 6px;
                                        padding: 12px 15px;
                                        margin-bottom: 10px;
                                        transition: all 0.2s ease;
                                    ">
                                        <!-- Comentario -->
                                        <div class="comentario-body mb-2">
                                            <p style="
                                                color: ${this.colores.grisOscuro};
                                                line-height: 1.5;
                                                margin: 0;
                                                font-size: 0.95em;
                                                white-space: pre-wrap;
                                                word-wrap: break-word;
                                            ">
                                                ${comentarioTexto}
                                            </p>
                                        </div>
                                        
                                        <!-- Fecha -->
                                        <div class="comentario-footer" style="
                                            display: flex;
                                            justify-content: flex-end;
                                            font-size: 0.8em;
                                            color: ${this.colores.grisClaro};
                                        ">
                                            <i class="fas fa-calendar me-1"></i>
                                            <span class="comentario-fecha">${fechaFormateada}</span>
                                        </div>
                                    </div>
                                `;
                            })
                            .join("")}
                    </div>

                    <!-- Nota si hay más de 10 comentarios -->
                    ${
                        totalComentarios > 10
                            ? `
                        <div class="comentarios-notice mt-3" style="
                            text-align: center;
                            padding: 8px;
                            color: ${this.colores.grisClaro};
                            font-size: 0.85em;
                            font-style: italic;
                            border-top: 1px solid ${this.colores.grisFondo};
                        ">
                            <i class="fas fa-info-circle me-1"></i>
                            Mostrando los ${comentariosMostrados} comentarios más recientes de ${totalComentarios} totales
                        </div>
                        `
                            : ""
                    }
                </div>
            `;

            container.html(html);

            // Agregar efectos hover ligeros
            this.$el
                .find(".comentario-item")
                .hover(
                    function () {
                        $(this).css({
                            transform: "translateY(-1px)",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                            backgroundColor: "rgba(184, 162, 121, 0.05)",
                        });
                    },
                    function () {
                        $(this).css({
                            transform: "translateY(0)",
                            boxShadow: "none",
                            backgroundColor:
                                $(this).data("original-bg") || "#E6E6E6",
                        });
                    }
                )
                .each(function () {
                    $(this).data(
                        "original-bg",
                        $(this).css("background-color")
                    );
                });
        },

        escapeHtml: function (text) {
            if (!text) return "";
            const div = document.createElement("div");
            div.textContent = text;
            return div.innerHTML;
        },

        volverAComparacion: function () {
            this.getRouter().navigate("#Principal", { trigger: true });
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

        onRemove: function () {
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

        setupEventListeners: function () {
            this.$el.on("click", '[data-action="volver"]', () =>
                this.volverAComparacion()
            );
            this.$el.on("click", '[data-action="exportar"]', () =>
                this.exportarReporte()
            );
        },

        cargarInfoAsesor: function () {
            return new Promise((resolve, reject) => {
                // Primero obtener la información básica del usuario
                Espo.Ajax.getRequest(`User/${this.asesorId}`)
                    .then((user) => {
                        this.infoAsesor.nombre =
                            user.name || user.userName || "Usuario sin nombre";

                        // Luego obtener información adicional del asesor desde el endpoint específico
                        return Espo.Ajax.getRequest(
                            "CCustomerSurvey/action/getInfoAsesor",
                            {
                                asesorId: this.asesorId,
                            }
                        );
                    })
                    .then((response) => {
                        if (response && response.success && response.data) {
                            this.infoAsesor.oficina =
                                response.data.oficina || "No asignada";
                            this.infoAsesor.cla =
                                response.data.cla || "No asignado";
                        } else {
                            // Si no hay respuesta, intentar obtener de otros campos
                            this.infoAsesor.oficina = "No disponible";
                            this.infoAsesor.cla = "No disponible";
                        }
                        resolve();
                    })
                    .catch((error) => {
                        console.error("Error cargando info asesor:", error);
                        this.infoAsesor.nombre = "Asesor " + this.asesorId;
                        this.infoAsesor.oficina = "No disponible";
                        this.infoAsesor.cla = "No disponible";
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
                        console.error("Error cargando estadísticas:", error);
                        this.stats = this.getStatsIniciales();
                        resolve();
                    });
            });
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
            const container = this.$el.find("#estadisticas-container");
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
            const chartContainers = this.$el.find(".grafico-wrapper");
            chartContainers.each((index, container) => {
                if (!$(container).find(".no-chart-message").length) {
                    $(container).html(`
                        <div class="no-chart-message" style="text-align: center; padding: 40px; color: ${this.colores.grisClaro};">
                            <i class="fas fa-exclamation-circle" style="font-size: 36px; margin-bottom: 15px;"></i>
                            <p style="font-size: 14px; margin: 0;">No se pueden mostrar los gráficos</p>
                        </div>
                    `);
                }
            });
        },
    });
});
