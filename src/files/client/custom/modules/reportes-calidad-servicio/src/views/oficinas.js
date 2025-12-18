define("reportes-calidad-servicio:views/oficinas", ["view"], function (Dep) {
    return Dep.extend({
        template: "reportes-calidad-servicio:oficinas",

        setup: function () {
            console.log("🏢 Vista de comparación de oficinas inicializada");
            console.log("📦 Options recibidas:", this.options);

            this.claId = (this.options && this.options.claId) || null;
            console.log("🔑 CLA ID inicial:", this.claId);

            this.isLoading = true;
            this.datosOficinas = [];
            this.clasList = [];

            this.chartRenderInProgress = false;
            this.chartLoading = false;

            this.colors = {
                relentlessGold: "#B8A279",
                darkGold: "#363438",
                obsessedGrey: "#1A1A1A",
                mediumGrey: "#666666",
                lightGrey: "#E6E6E6",
                primary: "#B8A279",
                secondary: "#363438",
                textDark: "#1A1A1A",
                textMedium: "#666666",
                textLight: "#999999",
                background: "#F5F5F5",
                white: "#FFFFFF",
                success: "#27ae60",
                warning: "#f39c12",
                danger: "#e74c3c",
            };

            this.chartBarrasHorizontales = null;
            this.checkChartJSAvailability();
        },

        data: function () {
            return {
                claId: this.claId,
                isLoading: this.isLoading,
                datosOficinas: this.datosOficinas,
                clasList: this.clasList,
                colors: this.colors,
            };
        },

        afterRender: function () {
            console.log("🔄 afterRender ejecutado");
            this.setupEventListeners();
            this.cargarCLAs();
        },

        setupEventListeners: function () {
            const self = this;

            console.log("🔧 Configurando event listeners");

            this.$el.find('[data-action="volver"]').on("click", function (e) {
                e.preventDefault();
                console.log("🔄 Volviendo al panel principal");
                self.volverAPrincipal();
            });

            this.$el.on("change", "#select-cla", function () {
                const claId = $(this).val();
                console.log("📋 CLA seleccionado:", claId);
                if (claId) {
                    self.claId = claId;
                    self.cargarDatosOficinas();
                } else {
                    self.datosOficinas = [];
                    self.isLoading = false;
                    self.updateUI();
                }
            });

            this.$el
                .find('[data-action="refrescar"]')
                .on("click", function (e) {
                    e.preventDefault();
                    console.log("🔄 Refrescando datos");
                    self.refrescarDatos();
                });

            this.$el.find('[data-action="exportar"]').on("click", function (e) {
                e.preventDefault();
                console.log("💾 Exportando reporte");
                self.exportarReporte();
            });

            // ✅ AGREGAR: Event listener para barras alternativas
            this.$el.on("click", ".alternative-bar", function (e) {
                e.preventDefault();
                e.stopPropagation();
                const oficinaId =
                    $(this).data("oficina-id") ||
                    $(this).attr("data-oficina-id");
                console.log("🖱️ Click en barra alternativa - ID:", oficinaId);
                if (oficinaId) {
                    self.navegarAAsesoresDeOficina(oficinaId);
                }
            });
        },

        checkChartJSAvailability: function () {
            console.log("🔍 Verificando disponibilidad de Chart.js...");

            // Verificar si Chart.js ya está disponible
            if (typeof Chart !== "undefined") {
                console.log("✅ Chart.js está disponible globalmente");
                this.chartAvailable = true;
                return;
            }

            console.warn("⚠️ Chart.js NO está disponible globalmente");
            this.chartAvailable = false;

            // ✅ IMPORTANTE: Si no está disponible, cargarlo ahora
            console.log(
                "📦 Chart.js no disponible, cargándolo desde módulo personalizado..."
            );
            this.loadChartJS();
        },

        loadChartJS: function () {
            const self = this;

            // Evitar múltiples cargas
            if (this.chartLoading) {
                console.log("⏳ Chart.js ya se está cargando...");
                return;
            }

            this.chartLoading = true;

            // Cargar Chart.js desde la misma ruta que principal.js
            const script = document.createElement("script");
            script.src =
                "client/custom/modules/reportes-calidad-servicio/lib/chart.min.js";

            script.onload = function () {
                self.chartLoading = false;
                console.log(
                    "✅ Chart.js cargado exitosamente desde módulo personalizado"
                );

                // Verificar que ahora esté disponible
                if (typeof Chart !== "undefined") {
                    self.chartAvailable = true;
                    console.log("✅ Chart.js ahora está disponible");

                    // Si ya tenemos datos, renderizar gráfico
                    if (self.datosOficinas.length > 0) {
                        setTimeout(() => {
                            self.renderGraficoBarrasHorizontales();
                        }, 300);
                    }
                } else {
                    console.error(
                        "❌ Chart.js aún no está disponible después de cargar"
                    );
                    self.showChartAlternative();
                }
            };

            script.onerror = function () {
                self.chartLoading = false;
                console.error(
                    "❌ Error al cargar Chart.js desde módulo personalizado"
                );
                self.showChartAlternative();
            };

            document.head.appendChild(script);
        },

        cargarCLAs: function () {
            const self = this;

            console.log("📋 Cargando lista de CLAs...");

            Espo.Ajax.getRequest("CCustomerSurvey/action/getCLAs")
                .then(function (response) {
                    console.log("✅ Respuesta de getCLAs:", response);

                    if (
                        response.success &&
                        response.data &&
                        response.data.length > 0
                    ) {
                        self.clasList = response.data;
                        console.log(`📋 ${self.clasList.length} CLAs cargados`);

                        // Actualizar select de CLAs
                        const selectCLA = self.$el.find("#select-cla");
                        if (selectCLA.length === 0) {
                            console.error(
                                "❌ Select CLA no encontrado en el DOM"
                            );
                            return;
                        }

                        selectCLA.empty();
                        selectCLA.append(
                            '<option value="">Seleccione un CLA</option>'
                        );

                        self.clasList.forEach(function (cla) {
                            selectCLA.append(
                                `<option value="${cla.id}">${cla.name}</option>`
                            );
                        });

                        // Habilitar el select
                        selectCLA.prop("disabled", false);

                        // Si hay un claId, seleccionarlo
                        if (self.claId) {
                            console.log(
                                `🎯 Seleccionando CLA desde controlador: ${self.claId}`
                            );
                            selectCLA.val(self.claId);

                            // Cargar datos automáticamente después de un delay
                            setTimeout(() => {
                                self.cargarDatosOficinas();
                            }, 200);
                        } else {
                            console.log(
                                "ℹ️ No hay CLA inicial para seleccionar"
                            );
                            self.isLoading = false;
                            self.updateUI();
                        }
                    } else {
                        console.warn(
                            "⚠️ Respuesta de getCLAs sin datos:",
                            response
                        );
                        Espo.Ui.error("No se encontraron CLAs disponibles");
                        self.isLoading = false;
                        self.updateUI();
                    }
                })
                .catch(function (error) {
                    console.error("❌ Error al cargar los CLAs:", error);
                    Espo.Ui.error("Error al cargar la lista de CLAs");

                    // Mostrar opción por defecto en caso de error
                    const selectCLA = self.$el.find("#select-cla");
                    if (selectCLA.length) {
                        selectCLA.empty();
                        selectCLA.append(
                            '<option value="">Error al cargar CLAs</option>'
                        );
                    }

                    self.isLoading = false;
                    self.updateUI();
                });
        },

        cargarDatosOficinas: function () {
            console.log("📊 Cargando datos de oficinas para CLA:", this.claId);

            if (!this.claId) {
                console.warn("⚠️ No hay CLA seleccionado");
                Espo.Ui.warning("Por favor, seleccione un CLA");
                this.isLoading = false;
                this.updateUI();
                return;
            }

            this.isLoading = true;
            this.updateUI();

            Espo.Ajax.getRequest(
                "CCustomerSurvey/action/getComparacionOficinas",
                { claId: this.claId }
            ).then(
                function (response) {
                    console.log(
                        "✅ Respuesta de getComparacionOficinas:",
                        response
                    );

                    if (
                        response.success &&
                        response.data &&
                        response.data.length > 0
                    ) {
                        this.datosOficinas = response.data.map((item) => {
                            const porcentajeRecomendacion =
                                item.porcentajeRecomendacion ||
                                item.recomendacionPorcentaje ||
                                0;

                            return {
                                id: item.id || "",
                                nombre: item.nombre || "Sin nombre",
                                encuestasTotales: item.totalEncuestas || 0,
                                satisfaccionPromedio:
                                    parseFloat(item.satisfaccionPromedio) || 0,
                                porcentajeRecomendacion: parseFloat(
                                    porcentajeRecomendacion
                                ),
                                porcentaje: parseFloat(item.porcentaje) || 0,
                            };
                        });

                        console.log(
                            `📊 ${this.datosOficinas.length} oficinas cargadas`
                        );

                        // Ordenar por satisfacción descendente
                        this.datosOficinas.sort(
                            (a, b) =>
                                b.satisfaccionPromedio - a.satisfaccionPromedio
                        );
                    } else {
                        console.warn(
                            "⚠️ No hay datos de oficinas para este CLA"
                        );
                        this.datosOficinas = [];
                        Espo.Ui.info(
                            "No hay datos de oficinas disponibles para este CLA"
                        );
                    }

                    this.isLoading = false;
                    this.updateUI();

                    // ✅ Intentar renderizar gráfico después de un delay
                    setTimeout(() => {
                        this.renderGraficoBarrasHorizontales();
                    }, 300);
                }.bind(this),
                function (error) {
                    console.error(
                        "❌ Error en petición getComparacionOficinas:",
                        error
                    );

                    Espo.Ui.error("Error al cargar datos de oficinas");
                    this.datosOficinas = [];
                    this.isLoading = false;
                    this.updateUI();
                }.bind(this)
            );
        },

        volverAPrincipal: function () {
            console.log("🔙 Volviendo a vista principal");
            this.getRouter().navigate("#Principal", { trigger: true });
        },

        refrescarDatos: function () {
            console.log("🔄 Refrescando datos para CLA:", this.claId);

            if (this.claId) {
                // Deshabilitar botón mientras carga
                const refreshBtn = this.$el.find('[data-action="refrescar"]');
                const originalHtml = refreshBtn.html();
                refreshBtn
                    .prop("disabled", true)
                    .html(
                        '<i class="fas fa-spinner fa-spin me-2"></i> Actualizando...'
                    );

                this.cargarDatosOficinas();

                // Restaurar botón después de 2 segundos
                setTimeout(() => {
                    refreshBtn.prop("disabled", false).html(originalHtml);
                }, 2000);
            } else {
                Espo.Ui.warning("Seleccione un CLA primero");
            }
        },

        exportarReporte: function () {
            console.log("💾 Iniciando exportación de reporte");

            if (this.datosOficinas.length === 0) {
                Espo.Ui.warning("No hay datos para exportar");
                return;
            }

            const claNombre =
                this.$el.find("#select-cla option:selected").text() ||
                this.claId ||
                "Reporte";
            console.log("📄 Exportando reporte para:", claNombre);

            let csv =
                "Oficina,Encuestas Totales,Satisfacción Promedio,% Satisfacción,% Recomendación\n";

            this.datosOficinas.forEach((oficina) => {
                csv += `"${oficina.nombre}",${
                    oficina.encuestasTotales
                },${oficina.satisfaccionPromedio.toFixed(
                    1
                )},${oficina.porcentaje.toFixed(
                    1
                )}%,${oficina.porcentajeRecomendacion.toFixed(1)}%\n`;
            });

            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");

            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute(
                    "download",
                    `comparacion-oficinas-${claNombre
                        .replace(/[^a-z0-9]/gi, "-")
                        .toLowerCase()}-${
                        new Date().toISOString().split("T")[0]
                    }.csv`
                );
                link.style.visibility = "hidden";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                console.log("✅ Reporte exportado exitosamente");
                Espo.Ui.success("Reporte exportado exitosamente");
            } else {
                Espo.Ui.error(
                    "Su navegador no soporta la descarga de archivos"
                );
            }
        },

        updateUI: function () {
            const container = this.$el.find("#oficinas-container");
            if (!container.length) {
                console.error(
                    "❌ Contenedor #oficinas-container no encontrado"
                );
                return;
            }

            // ✅ LIMPIAR el gráfico anterior antes de actualizar
            if (this.chartBarrasHorizontales) {
                this.chartBarrasHorizontales.destroy();
                this.chartBarrasHorizontales = null;
            }

            // ✅ Limpiar cualquier contenido alternativo previo
            this.$el.find(".chart-alternative").remove();

            if (this.isLoading) {
                console.log("⏳ Mostrando estado de carga...");
                container.html(`
                    <div class="text-center" style="padding: 80px 20px;">
                        <div class="spinner-large"></div>
                        <h4 class="mt-4" style="color: ${this.colors.textDark}; font-weight: 600; margin-bottom: 10px;">
                            Cargando comparación de oficinas...
                        </h4>
                        <p style="color: ${this.colors.textMedium}; max-width: 500px; margin: 0 auto;">
                            Obteniendo datos de satisfacción y recomendación de todas las oficinas
                        </p>
                    </div>
                `);
                return;
            }

            if (this.datosOficinas.length === 0) {
                console.log(
                    "📭 No hay datos de oficinas, mostrando estado vacío"
                );
                container.html(`
                    <div class="no-data-card">
                        <div class="no-data-icon">
                            <i class="fas fa-building"></i>
                        </div>
                        <h3 class="no-data-title">No hay datos de oficinas disponibles</h3>
                        <p class="no-data-text">Seleccione un CLA para ver la comparación de oficinas</p>
                        <p class="no-data-hint">Asegúrese de que el CLA seleccionado tenga oficinas con encuestas completadas</p>
                    </div>
                `);
                return;
            }

            console.log("🎨 Actualizando UI con datos de oficinas");
            // Mostrar datos y gráfico
            container.html(this.getOficinasHTML());
        },

        getOficinasHTML: function () {
            const claDisplay =
                this.$el.find("#select-cla option:selected").text() ||
                this.claId ||
                "General";
            console.log("📋 Generando HTML para CLA:", claDisplay);

            return `
                <!-- Resumen del CLA -->
                <div class="row" style="margin-bottom: 30px;">
                    <div class="col-md-12">
                        <div class="resumen-cla-card">
                            <div class="resumen-cla-header">
                                <h3 class="resumen-cla-title">
                                    <i class="fas fa-chart-line me-2"></i>
                                    Resumen del CLA
                                </h3>
                                <div class="resumen-cla-subtitle">${claDisplay}</div>
                            </div>
                            <div class="resumen-cla-body">
                                <div class="row">
                                    <div class="col-md-3 col-sm-6">
                                        <div class="resumen-stat">
                                            <div class="resumen-stat-icon" style="background-color: ${
                                                this.colors.primary
                                            }15;">
                                                <i class="fas fa-star" style="color: ${
                                                    this.colors.primary
                                                };"></i>
                                            </div>
                                            <div class="resumen-stat-content">
                                                <div class="resumen-stat-value">${this.calcularPromedioGlobal().toFixed(
                                                    1
                                                )}/5.0</div>
                                                <div class="resumen-stat-label">Satisfacción Promedio</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-3 col-sm-6">
                                        <div class="resumen-stat">
                                            <div class="resumen-stat-icon" style="background-color: ${
                                                this.colors.success
                                            }15;">
                                                <i class="fas fa-thumbs-up" style="color: ${
                                                    this.colors.success
                                                };"></i>
                                            </div>
                                            <div class="resumen-stat-content">
                                                <div class="resumen-stat-value" style="color: ${
                                                    this.colors.success
                                                };">${this.calcularPromedioRecomendacion().toFixed(
                1
            )}%</div>
                                                <div class="resumen-stat-label">% Recomendación</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-3 col-sm-6">
                                        <div class="resumen-stat">
                                            <div class="resumen-stat-icon" style="background-color: ${
                                                this.colors.warning
                                            }15;">
                                                <i class="fas fa-file-alt" style="color: ${
                                                    this.colors.warning
                                                };"></i>
                                            </div>
                                            <div class="resumen-stat-content">
                                                <div class="resumen-stat-value" style="color: ${
                                                    this.colors.warning
                                                };">${this.calcularTotalEncuestas()}</div>
                                                <div class="resumen-stat-label">Total de Encuestas</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-3 col-sm-6">
                                        <div class="resumen-stat">
                                            <div class="resumen-stat-icon" style="background-color: ${
                                                this.colors.danger
                                            }15;">
                                                <i class="fas fa-building" style="color: ${
                                                    this.colors.danger
                                                };"></i>
                                            </div>
                                            <div class="resumen-stat-content">
                                                <div class="resumen-stat-value" style="color: ${
                                                    this.colors.danger
                                                };">${
                this.datosOficinas.length
            }</div>
                                                <div class="resumen-stat-label">Oficinas Evaluadas</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Gráfico principal -->
                <div class="row">
                    <div class="col-md-12">
                        <div class="grafico-principal-card">
                            <div class="grafico-header">
                                <div>
                                    <h3 class="grafico-title">
                                        <i class="fas fa-chart-bar me-2"></i>
                                        Satisfacción por Oficina
                                    </h3>
                                    <p class="grafico-subtitle">
                                        Comparación del porcentaje de satisfacción entre oficinas del CLA ${claDisplay}
                                    </p>
                                </div>
                                <div class="grafico-legend">
                                    <div class="legend-item">
                                        <span class="legend-color" style="background-color: ${this.getBarColor(
                                            90
                                        )};"></span>
                                        <span class="legend-text">Excelente (≥90%)</span>
                                    </div>
                                    <div class="legend-item">
                                        <span class="legend-color" style="background-color: ${this.getBarColor(
                                            80
                                        )};"></span>
                                        <span class="legend-text">Bueno (80-89%)</span>
                                    </div>
                                    <div class="legend-item">
                                        <span class="legend-color" style="background-color: ${this.getBarColor(
                                            70
                                        )};"></span>
                                        <span class="legend-text">Regular (70-79%)</span>
                                    </div>
                                    <div class="legend-item">
                                        <span class="legend-color" style="background-color: ${this.getBarColor(
                                            60
                                        )};"></span>
                                        <span class="legend-text">Necesita mejorar (<70%)</span>
                                    </div>
                                </div>
                            </div>
                            <div class="grafico-body">
                                <div class="grafico-wrapper">
                                    <!-- ✅ Contenedor específico para el canvas -->
                                    <div class="grafico-canvas-container">
                                        <canvas id="grafico-barras-horizontales"></canvas>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

        calcularPromedioGlobal: function () {
            if (this.datosOficinas.length === 0) return 0;
            const total = this.datosOficinas.reduce(
                (sum, oficina) => sum + oficina.satisfaccionPromedio,
                0
            );
            return total / this.datosOficinas.length;
        },

        calcularPromedioRecomendacion: function () {
            if (this.datosOficinas.length === 0) return 0;
            const total = this.datosOficinas.reduce(
                (sum, oficina) => sum + oficina.porcentajeRecomendacion,
                0
            );
            return total / this.datosOficinas.length;
        },

        calcularTotalEncuestas: function () {
            return this.datosOficinas.reduce(
                (sum, oficina) => sum + oficina.encuestasTotales,
                0
            );
        },

        getBarColor: function (percentage) {
            if (percentage >= 90) return this.colors.primary;
            if (percentage >= 80) return this.colors.secondary;
            if (percentage >= 70) return this.colors.mediumGrey;
            return this.colors.obsessedGrey;
        },

        renderGraficoBarrasHorizontales: function () {
            if (this.chartRenderInProgress) {
                console.log(
                    "⏳ Ya hay un gráfico renderizándose, esperando..."
                );
                return;
            }

            this.chartRenderInProgress = true;

            if (typeof Chart === "undefined") {
                console.warn(
                    "Chart.js no está disponible, mostrando alternativa"
                );
                this.chartRenderInProgress = false;
                this.showChartAlternative();
                return;
            }

            if (this.datosOficinas.length === 0) {
                console.warn("No hay datos para renderizar gráfico");
                this.chartRenderInProgress = false;
                return;
            }

            const ctx = this.$el.find("#grafico-barras-horizontales")[0];
            if (!ctx) {
                console.warn("Canvas no encontrado");
                this.chartRenderInProgress = false;
                this.showChartAlternative();
                return;
            }

            const context = ctx.getContext("2d");
            context.clearRect(0, 0, ctx.width, ctx.height);

            if (this.chartBarrasHorizontales) {
                this.chartBarrasHorizontales.destroy();
                this.chartBarrasHorizontales = null;
            }

            const container = ctx.parentElement;
            if (container) {
                ctx.width = container.clientWidth;
                ctx.height = container.clientHeight;
            }

            const datosOrdenados = [...this.datosOficinas].sort((a, b) => {
                return b.satisfaccionPromedio - a.satisfaccionPromedio;
            });

            const nombres = datosOrdenados.map((o) => o.nombre);
            const porcentajes = datosOrdenados.map(
                (o) => (o.satisfaccionPromedio / 5) * 100
            );
            const encuestas = datosOrdenados.map((o) => o.encuestasTotales);
            const recomendaciones = datosOrdenados.map(
                (o) => o.porcentajeRecomendacion
            );

            const coloresBarras = porcentajes.map((p) => this.getBarColor(p));

            // ✅ MODIFICAR: Crear array con IDs de oficinas
            const oficinasIds = datosOrdenados.map((o) => o.id);

            // ✅ GUARDAR REFERENCIA A "this" para usar dentro de las funciones callback
            const self = this;

            try {
                this.chartBarrasHorizontales = new Chart(ctx, {
                    type: "bar",
                    data: {
                        labels: nombres,
                        datasets: [
                            {
                                label: "Satisfacción (%)",
                                data: porcentajes,
                                backgroundColor: coloresBarras,
                                borderColor: coloresBarras.map((c) =>
                                    self.darkenColor(c, 10)
                                ),
                                borderWidth: 1,
                                borderRadius: 3,
                                barPercentage: 0.8,
                                categoryPercentage: 0.9,
                            },
                        ],
                    },
                    options: {
                        indexAxis: "y",
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false,
                            },
                            tooltip: {
                                enabled: true,
                                mode: "nearest",
                                intersect: false,
                                callbacks: {
                                    title: function (tooltipItems) {
                                        return tooltipItems[0].label;
                                    },
                                    label: function (context) {
                                        const porcentaje = context.parsed.x;
                                        const index = context.dataIndex;
                                        const satisfaccionVal =
                                            datosOrdenados[index]
                                                .satisfaccionPromedio;
                                        const encuestasVal = encuestas[index];
                                        const recomendacion =
                                            recomendaciones[index];

                                        return [
                                            `Satisfacción: ${porcentaje.toFixed(
                                                1
                                            )}% (${satisfaccionVal.toFixed(
                                                1
                                            )}/5.0)`,
                                            `Encuestas completadas: ${encuestasVal}`,
                                            `Tasa de recomendación: ${recomendacion.toFixed(
                                                1
                                            )}%`,
                                            `\n🔍 Click para ver asesores de esta oficina`,
                                        ];
                                    },
                                },
                                backgroundColor: "rgba(255, 255, 255, 0.98)",
                                titleColor: self.colors.textDark,
                                bodyColor: self.colors.textDark,
                                borderColor: self.colors.lightGrey,
                                borderWidth: 1,
                                cornerRadius: 6,
                                padding: 12,
                                titleFont: {
                                    size: 13,
                                    weight: "600",
                                },
                                bodyFont: {
                                    size: 12,
                                },
                                displayColors: false,
                            },
                        },
                        // ✅ CORREGIR: Evento onClick usando "self" en lugar de "this"
                        onClick: function (evt, elements) {
                            if (elements && elements.length > 0) {
                                const elementIndex = elements[0].index;
                                console.log(
                                    "🎯 Click en elemento:",
                                    elementIndex
                                );

                                // ✅ OBTENER OFICINA ID DEL ARRAY DE IDs
                                if (oficinasIds[elementIndex]) {
                                    const oficinaId = oficinasIds[elementIndex];
                                    console.log("📍 Oficina ID:", oficinaId);
                                    self.navegarAAsesoresDeOficina(oficinaId);
                                } else {
                                    console.warn(
                                        "No se encontró ID para el índice:",
                                        elementIndex
                                    );
                                }
                            }
                        },
                        // ✅ CORREGIR: Evento onHover usando "self"
                        onHover: function (evt, elements, chart) {
                            if (elements && elements.length > 0) {
                                if (chart && chart.canvas) {
                                    chart.canvas.style.cursor = "pointer";
                                }
                            } else if (chart && chart.canvas) {
                                chart.canvas.style.cursor = "default";
                            }
                        },
                        scales: {
                            x: {
                                beginAtZero: true,
                                max: 100,
                                grid: {
                                    color: self.colors.lightGrey,
                                    drawBorder: false,
                                },
                                ticks: {
                                    color: self.colors.textMedium,
                                    font: {
                                        size: 11,
                                    },
                                    callback: function (value) {
                                        return value + "%";
                                    },
                                    padding: 8,
                                },
                                title: {
                                    display: true,
                                    text: "Porcentaje de Satisfacción",
                                    color: self.colors.textDark,
                                    font: {
                                        size: 12,
                                        weight: "600",
                                    },
                                    padding: { top: 10, bottom: 5 },
                                },
                            },
                            y: {
                                grid: {
                                    display: false,
                                },
                                ticks: {
                                    color: self.colors.textDark,
                                    font: {
                                        size: 12,
                                        weight: "500",
                                    },
                                    padding: 10,
                                    autoSkip: false,
                                    maxRotation: 0,
                                },
                            },
                        },
                        layout: {
                            padding: {
                                left: 5,
                                right: 20,
                                top: 10,
                                bottom: 10,
                            },
                        },
                        interaction: {
                            mode: "nearest",
                            intersect: false,
                            axis: "y",
                        },
                        hover: {
                            mode: "nearest",
                            intersect: false,
                            animationDuration: 100,
                        },
                    },
                });

                console.log("✅ Gráfico renderizado correctamente");
                this.chartRenderInProgress = false;

                setTimeout(() => {
                    if (this.chartBarrasHorizontales) {
                        this.chartBarrasHorizontales.update();
                    }
                }, 100);
            } catch (error) {
                console.error("❌ Error al renderizar gráfico:", error);
                this.chartRenderInProgress = false;
                this.showChartAlternative();
            }
        },

        navegarAAsesoresDeOficina: function (oficinaId) {
            console.log("🔗 Navegando a asesores de oficina:", oficinaId);

            // Verificar que tenemos datos
            if (!this.datosOficinas || this.datosOficinas.length === 0) {
                console.error("❌ No hay datos de oficinas disponibles");
                Espo.Ui.warning("No hay datos disponibles");
                return;
            }

            if (!oficinaId) {
                console.error("❌ ID de oficina no proporcionado");
                Espo.Ui.warning("No se pudo identificar la oficina");
                return;
            }

            // Buscar la oficina
            const oficina = this.datosOficinas.find((o) => {
                console.log(
                    `Comparando: ${o.id} === ${oficinaId} -> ${
                        o.id === oficinaId
                    }`
                );
                return o.id === oficinaId;
            });

            if (!oficina) {
                console.error(
                    "❌ Oficina no encontrada en datos:",
                    this.datosOficinas
                );
                console.error("Buscando ID:", oficinaId);
                Espo.Ui.warning("No se encontró la oficina seleccionada");
                return;
            }

            const nombreOficina = oficina.nombre || "esta oficina";
            console.log("✅ Oficina encontrada:", oficina);

            // ✅ USAR confirm nativo primero para testing
            try {
                const confirmacion = window.confirm(
                    `¿Deseas ver la comparación de asesores de "${nombreOficina}"?`
                );

                if (confirmacion) {
                    console.log("✅ Usuario confirmó, navegando...");
                    this.irAVistaAsesores(oficinaId);
                } else {
                    console.log("❌ Usuario canceló");
                }
            } catch (error) {
                console.error("❌ Error en confirm:", error);
                // Fallback: navegar directamente
                this.irAVistaAsesores(oficinaId);
            }
        },

        irAVistaAsesores: function (oficinaId) {
            console.log(
                "🚀 Iniciando navegación a vista de asesores para oficina:",
                oficinaId
            );

            if (!oficinaId) {
                console.error("❌ ID de oficina no válido para navegación");
                Espo.Ui.warning(
                    "No se pudo identificar la oficina seleccionada"
                );
                return;
            }

            // ✅ AGREGAR un pequeño delay para asegurar que la navegación no interfiera
            setTimeout(() => {
                try {
                    const router = this.getRouter();
                    if (!router) {
                        throw new Error("Router no disponible");
                    }

                    // ✅ Construir la ruta correctamente
                    const route =
                        "#Principal/asesores/" + encodeURIComponent(oficinaId);
                    console.log("📍 Navegando a ruta:", route);

                    // ✅ Navegar SIN trigger si es necesario, pero mejor mantenerlo
                    router.navigate(route, {
                        trigger: true,
                        replace: false, // Importante: no reemplazar la historia
                    });

                    console.log("✅ Navegación iniciada exitosamente");
                } catch (error) {
                    console.error("❌ Error en navegación:", error);

                    // Intentar navegación directa como fallback
                    try {
                        window.location.hash =
                            "#Principal/asesores/" +
                            encodeURIComponent(oficinaId);
                        console.log("🔄 Usando navegación por hash directa");

                        // Forzar recarga si es necesario
                        setTimeout(() => {
                            location.reload();
                        }, 100);
                    } catch (fallbackError) {
                        console.error("❌ Error en fallback:", fallbackError);
                        Espo.Ui.error("Error de navegación: " + error.message);
                    }
                }
            }, 100); // Pequeño delay para evitar conflictos
        },

        // Métodos auxiliares para colores (mantener)
        darkenColor: function (color, amount) {
            try {
                let usePound = false;
                if (color[0] === "#") {
                    color = color.slice(1);
                    usePound = true;
                }
                const num = parseInt(color, 16);
                let r = Math.max(0, (num >> 16) - amount);
                let g = Math.max(0, ((num >> 8) & 0x00ff) - amount);
                let b = Math.max(0, (num & 0x0000ff) - amount);
                return (
                    (usePound ? "#" : "") +
                    (b | (g << 8) | (r << 16)).toString(16).padStart(6, "0")
                );
            } catch (e) {
                return color;
            }
        },

        lightenColor: function (color, amount) {
            try {
                let usePound = false;
                if (color[0] === "#") {
                    color = color.slice(1);
                    usePound = true;
                }
                const num = parseInt(color, 16);
                let r = Math.min(255, (num >> 16) + amount);
                let g = Math.min(255, ((num >> 8) & 0x00ff) + amount);
                let b = Math.min(255, (num & 0x0000ff) + amount);
                return (
                    (usePound ? "#" : "") +
                    (b | (g << 8) | (r << 16)).toString(16).padStart(6, "0")
                );
            } catch (e) {
                return color;
            }
        },

        // Mantener el método showChartAlternative para casos donde Chart.js no esté disponible
        showChartAlternative: function () {
            console.log("📊 Mostrando alternativa HTML para gráfico");

            const canvasContainer = this.$el.find(".grafico-canvas-container");
            if (!canvasContainer.length) {
                console.warn(
                    "Contenedor del gráfico no encontrado para alternativa"
                );
                return;
            }

            // ✅ Destruir gráfico Chart.js si existe
            if (this.chartBarrasHorizontales) {
                this.chartBarrasHorizontales.destroy();
                this.chartBarrasHorizontales = null;
            }

            // ✅ Limpiar contenedor y mostrar alternativa HTML
            canvasContainer.html(this.getAlternativeChartHTML());

            // Agregar interactividad para tooltips
            this.setupAlternativeTooltips();
        },

        getAlternativeChartHTML: function () {
            const self = this;

            return `
        <div class="chart-alternative">
            <div class="alternative-header">
                <h4>Satisfacción por Oficina</h4>
                <p class="text-muted" style="font-size: 12px; margin-top: 5px;">
                    <i class="fas fa-info-circle"></i> Click en las barras para ver asesores de cada oficina
                </p>
            </div>
            <div class="alternative-body">
                ${this.datosOficinas
                    .map((oficina) => {
                        const porcentaje =
                            (oficina.satisfaccionPromedio / 5) * 100;
                        const barColor = this.getBarColor(porcentaje);
                        return `
                        <div class="alternative-bar" 
                             data-oficina-id="${oficina.id}" 
                             style="margin-bottom: 15px; cursor: pointer; padding: 10px; border-radius: 6px; border: 1px solid #eee; background: #f9f9f9;">
                            <div class="bar-label" style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span style="font-weight: 500; color: ${
                                    this.colors.textDark
                                }">
                                    ${oficina.nombre}
                                </span>
                                <span style="font-size: 12px; color: ${
                                    this.colors.textMedium
                                }">
                                    ${porcentaje.toFixed(1)}%
                                </span>
                            </div>
                            <div class="bar-container" 
                                 style="height: 30px; background: ${
                                     this.colors.lightGrey
                                 }; border-radius: 4px; overflow: hidden; position: relative;">
                                <div class="bar-fill" 
                                     style="height: 100%; width: ${porcentaje}%; background: ${barColor}; border-radius: 4px; transition: width 0.5s ease;">
                                </div>
                            </div>
                            <div class="bar-value" style="margin-top: 5px; font-size: 11px; color: ${
                                this.colors.textLight
                            }; display: flex; justify-content: space-between;">
                                <span>${
                                    oficina.encuestasTotales
                                } encuestas</span>
                                <span>${oficina.porcentajeRecomendacion.toFixed(
                                    1
                                )}% recomendación</span>
                            </div>
                        </div>
                    `;
                    })
                    .join("")}
            </div>
        </div>
    `;
        },

        setupAlternativeTooltips: function () {
            const self = this;

            // ✅ REMOVER el listener previo para evitar duplicados
            this.$el.off("click", ".alternative-bar");

            // ✅ AGREGAR nuevo listener
            this.$el.on("click", ".alternative-bar", function (e) {
                e.preventDefault();
                e.stopPropagation();

                // Obtener el ID de la oficina
                const oficinaId =
                    $(this).data("oficina-id") ||
                    $(this).attr("data-oficina-id") ||
                    $(this).find("[data-oficina-id]").data("oficina-id");

                console.log("🖱️ Click en barra alternativa - ID:", oficinaId);
                console.log("Elemento clickeado:", this);

                if (oficinaId) {
                    self.navegarAAsesoresDeOficina(oficinaId);
                } else {
                    console.error("❌ No se pudo obtener el ID de la oficina");
                    Espo.Ui.warning(
                        "No se pudo identificar la oficina seleccionada"
                    );
                }
            });
        },

        onRemove: function () {
            console.log("🧹 Limpiando recursos de la vista de oficinas");

            // Destruir gráfico si existe
            if (this.chartBarrasHorizontales) {
                this.chartBarrasHorizontales.destroy();
                this.chartBarrasHorizontales = null;
            }

            // Cancelar cualquier petición pendiente
            if (this.currentRequest && this.currentRequest.abort) {
                this.currentRequest.abort();
            }

            // Remover event listeners
            this.$el.off("change", "#select-cla");
            this.$el.off("click", "[data-action]");
            this.$el.off("click", ".alternative-bar");

            console.log("✅ Recursos limpiados");
        },
    });
});
