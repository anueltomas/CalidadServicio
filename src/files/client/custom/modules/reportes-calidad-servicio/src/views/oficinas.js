define("reportes-calidad-servicio:views/oficinas", [
    "view",
    "reportes-calidad-servicio:views/modules/estadisticas",
    "reportes-calidad-servicio:views/modules/graficos",
], function (Dep, EstadisticasManager, GraficosManager) {
    return Dep.extend({
        template: "reportes-calidad-servicio:oficinas",

        setup: function () {
            console.log("🏢 Vista de comparación de oficinas inicializada");
            console.log("📦 Options recibidas:", this.options);

            // ✅ CORRECCIÓN: Obtener claId directamente de options
            this.claId = this.options.claId || null;

            console.log("🔑 CLA ID extraído:", this.claId);

            // Mantener compatibilidad con código existente
            this.categoriaId = this.options.categoriaId || "";
            this.filtrosString = this.options.filtros || "";

            // ✅ NUEVO: Construir filtrosCompletos desde claId
            this.filtrosCompletos =
                this.options.filtrosCompletos ||
                (this.claId ? `null-null-${this.claId}-null-null` : "");

            // Parsear filtros
            this.filtros = this.parsearFiltros(this.filtrosCompletos);

            // ✅ IMPORTANTE: Asegurar que cla esté disponible
            if (this.claId && !this.filtros.cla) {
                this.filtros.cla = this.claId;
            }

            console.log("📊 Filtros parseados:", this.filtros);

            // Inicializar módulos
            if (typeof EstadisticasManager === "function") {
                this.estadisticasManager = new EstadisticasManager(this);
            }

            if (typeof GraficosManager === "function") {
                this.graficosManager = new GraficosManager(this);
            }

            // Estado inicial
            this.datosOficinas = [];
            this.isLoading = true;
        },
        parsearFiltros: function (filtrosCompletos) {
            if (!filtrosCompletos) {
                return {
                    anio: null,
                    cla: null,
                    oficina: null,
                    usuario: null,
                };
            }

            var partes = filtrosCompletos.split("-");
            return {
                categoria: partes[0] !== "null" ? partes[0] : null,
                anio: partes[1] !== "null" ? partes[1] : null,
                cla: partes[2] !== "null" ? partes[2] : null,
                oficina: partes[3] !== "null" ? partes[3] : null,
                usuario: partes[4] !== "null" ? partes[4] : null,
            };
        },

        data: function () {
            return {
                claId: this.claId, // ✅ AGREGAR
                categoriaId: this.categoriaId,
                filtros: this.filtros,
                isLoading: this.isLoading,
                datosOficinas: this.datosOficinas,
            };
        },

        afterRender: function () {
            this.showLoadingState();
            this.setupEventListeners();
            this.cargarDatosOficinas();
        },

        cargarDatosOficinas: function () {
            console.log("📊 Cargando datos de oficinas desde API...");
            console.log("🔑 CLA ID:", this.claId);
            console.log("📋 Filtros:", this.filtros);

            // ✅ CORRECCIÓN: Usar claId directamente
            const claIdFinal = this.claId || this.filtros.cla;

            if (!claIdFinal) {
                Espo.Ui.error("No se proporcionó un ID de CLA");
                this.isLoading = false;
                this.updateUI();
                return;
            }

            console.log("🌐 Realizando petición con CLA:", claIdFinal);

            // Realizar petición al endpoint del controlador
            Espo.Ajax.getRequest(
                "CCustomerSurvey/action/getComparacionOficinas",
                {
                    claId: claIdFinal,
                }
            ).then(
                function (response) {
                    console.log("✅ Datos recibidos de API:", response);

                    if (response.success && response.data) {
                        this.datosOficinas = response.data.map((item) => {
                            return {
                                id: item.id || "N/A",
                                nombre: item.nombre || "Sin nombre",
                                encuestasTotales: item.totalEncuestas || 0,
                                satisfaccionPromedio:
                                    parseFloat(item.satisfaccionPromedio) || 0,
                                porcentajeRecomendacion:
                                    parseFloat(item.porcentaje) || 0,
                                asesoresActivos: item.asesoresActivos || 0,
                            };
                        });
                    } else {
                        Espo.Ui.warning(
                            response.error || "No se pudieron cargar los datos"
                        );
                        this.datosOficinas = [];
                    }

                    this.isLoading = false;
                    this.updateUI();

                    // Renderizar gráficos después de cargar datos
                    setTimeout(() => {
                        this.renderGraficosComparativos();
                    }, 100);
                }.bind(this),
                function (error) {
                    console.error("❌ Error al cargar datos:", error);
                    Espo.Ui.error(
                        "Error al conectar con el servidor: " +
                            (error.message || "")
                    );

                    this.datosOficinas = [];
                    this.isLoading = false;
                    this.updateUI();
                }.bind(this)
            );
        },

        setupEventListeners: function () {
            // Botón para volver
            this.$el.find('[data-action="volver"]').on("click", () => {
                this.volverAPrincipal();
            });

            // Botón para exportar
            this.$el.find('[data-action="exportar"]').on("click", () => {
                this.exportarReporte();
            });

            // Botón para filtrar
            this.$el.find('[data-action="filtrar"]').on("click", () => {
                this.aplicarFiltrosAvanzados();
            });

            // Botones de detalle (delegación de eventos)
            this.$el.on("click", '[data-action="detalle"]', (e) => {
                const oficinaId = $(e.currentTarget).data("id");
                this.verDetalleOficina(oficinaId);
            });
        },

        volverAPrincipal: function () {
            this.getRouter().navigate("#reportes-calidad-servicio", {
                trigger: true,
            });
        },

        exportarReporte: function () {
            console.log("📤 Exportando reporte de comparación de oficinas");

            const datosExportar = this.datosOficinas.map((oficina) => ({
                Oficina: oficina.nombre,
                "Encuestas Totales": oficina.encuestasTotales,
                "Satisfacción Promedio": oficina.satisfaccionPromedio,
                "% Recomendación": oficina.porcentajeRecomendacion,
                "Asesores Activos": oficina.asesoresActivos,
            }));

            // Usar una biblioteca como SheetJS o crear CSV manualmente
            this.exportarAExcel(datosExportar);
        },

        exportarAExcel: function (datos) {
            let csv =
                "Oficina,Encuestas Totales,Satisfacción Promedio,% Recomendación,Asesores Activos\n";

            datos.forEach((oficina) => {
                csv += `"${oficina.Oficina}",${oficina["Encuestas Totales"]},${oficina["Satisfacción Promedio"]},${oficina["% Recomendación"]},${oficina["Asesores Activos"]}\n`;
            });

            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");

            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute(
                    "download",
                    `comparacion-oficinas-${this.filtros.cla}-${
                        new Date().toISOString().split("T")[0]
                    }.csv`
                );
                link.style.visibility = "hidden";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

            Espo.Ui.success("Reporte exportado exitosamente");
        },

        verDetalleOficina: function (oficinaId) {
            console.log("🔍 Ver detalle de oficina:", oficinaId);

            // Buscar la oficina seleccionada
            const oficina = this.datosOficinas.find((o) => o.id === oficinaId);

            if (oficina) {
                const mensaje = `
                    <strong>${oficina.nombre}</strong><br>
                    <hr>
                    <strong>Encuestas Totales:</strong> ${
                        oficina.encuestasTotales
                    }<br>
                    <strong>Satisfacción Promedio:</strong> ${oficina.satisfaccionPromedio.toFixed(
                        1
                    )}/5.0<br>
                    <strong>% de Recomendación:</strong> ${
                        oficina.porcentajeRecomendacion
                    }%<br>
                    <strong>Asesores Activos:</strong> ${
                        oficina.asesoresActivos
                    }
                `;

                Espo.Ui.dialog(mensaje, {
                    title: `Detalle: ${oficina.nombre}`,
                    buttons: [
                        {
                            text: "Cerrar",
                            onClick: function () {
                                this.close();
                            },
                        },
                    ],
                });
            }
        },

        aplicarFiltrosAvanzados: function () {
            const filtroAnio = this.$el.find("#filtro-anio").val();
            const filtroMes = this.$el.find("#filtro-mes").val();

            console.log("🔍 Aplicando filtros avanzados:", {
                anio: filtroAnio,
                mes: filtroMes,
            });

            // TODO: Implementar filtros avanzados en el backend
            // Por ahora solo recargamos los datos básicos
            this.isLoading = true;
            this.updateUI();
            this.cargarDatosOficinas();

            Espo.Ui.info("Filtros aplicados (funcionalidad en desarrollo)");
        },

        showLoadingState: function () {
            const container = this.$el.find("#oficinas-container");
            if (container.length) {
                const claDisplay =
                    this.claId || this.filtros.cla || "No especificado";
                container.html(`
            <div class="text-center" style="padding: 60px;">
                <div class="spinner-large"></div>
                <h4 class="mt-3">Cargando datos de oficinas...</h4>
                <p>Consultando métricas del CLA: <strong>${claDisplay}</strong></p>
            </div>
        `);
            }
        },

        updateUI: function () {
            if (this.isLoading) {
                this.showLoadingState();
                return;
            }

            const container = this.$el.find("#oficinas-container");
            if (container.length) {
                container.html(this.getOficinasHTML());
            }

            // Renderizar gráficos comparativos
            this.renderGraficosComparativos();
        },

        getOficinasHTML: function () {
            if (this.datosOficinas.length === 0) {
                return `
            <div class="row">
                <div class="col-md-12">
                    <div class="alert alert-warning text-center" style="padding: 40px;">
                        <i class="fas fa-building fa-4x mb-3"></i>
                        <h4>No hay datos de oficinas disponibles</h4>
                        <p>No se encontraron datos para el CLA: <strong>${
                            this.claId || this.filtros.cla || "No especificado"
                        }</strong></p>
                        <button class="btn btn-primary mt-2" data-action="volver">
                            <i class="fas fa-arrow-left me-1"></i> Volver
                        </button>
                    </div>
                </div>
            </div>
        `;
            }

            const claDisplay = this.claId || this.filtros.cla || "General";

            let html = `
        <div class="row mb-4">
            <div class="col-md-12">
                <div class="panel panel-default">
                    <div class="panel-heading" style="background: #B8A279; color: white; padding: 15px;">
                        <h4 class="mb-0">
                            <i class="fas fa-building me-2"></i>
                            Comparación de Oficinas - CLA: ${claDisplay}
                            <span class="badge" style="background: white; color: #B8A279; margin-left: 10px;">
                                ${this.datosOficinas.length} oficinas
                            </span>
                        </h4>
                    </div>
                    <div class="panel-body">
                        <div class="table-responsive">
                            <table class="table table-hover table-striped">
                                <thead style="background: #f8f9fa;">
                                    <tr>
                                        <th>Oficina</th>
                                        <th>Encuestas Totales</th>
                                        <th>Satisfacción Promedio</th>
                                        <th>% Recomendación</th>
                                        <th>Asesores Activos</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
    `;

            this.datosOficinas.forEach((oficina) => {
                const porcentajeSatisfaccion =
                    (oficina.satisfaccionPromedio / 5) * 100;

                html += `
            <tr>
                <td><strong>${oficina.nombre}</strong></td>
                <td>
                    <span class="badge" style="background: #3498db; color: white;">
                        ${oficina.encuestasTotales}
                    </span>
                </td>
                <td>
                    <div style="display: flex; align-items: center;">
                        <div style="flex-grow: 1; margin-right: 10px;">
                            <div class="progress" style="height: 20px; margin: 0;">
                                <div class="progress-bar" style="background: #27ae60; width: ${porcentajeSatisfaccion}%">
                                    ${oficina.satisfaccionPromedio.toFixed(
                                        1
                                    )}/5.0
                                </div>
                            </div>
                        </div>
                        <small style="color: #7f8c8d;">${porcentajeSatisfaccion.toFixed(
                            0
                        )}%</small>
                    </div>
                </td>
                <td>
                    <span class="badge" style="background: ${
                        oficina.porcentajeRecomendacion >= 90
                            ? "#27ae60"
                            : oficina.porcentajeRecomendacion >= 80
                            ? "#f39c12"
                            : "#e74c3c"
                    }; color: white;">
                        ${oficina.porcentajeRecomendacion}%
                    </span>
                </td>
                <td>${oficina.asesoresActivos}</td>
                <td>
                    <button class="btn btn-sm btn-default" data-id="${
                        oficina.id
                    }" data-action="detalle">
                        <i class="fas fa-chart-line"></i> Detalle
                    </button>
                </td>
            </tr>
        `;
            });

            html += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-12">
                <div class="panel panel-default">
                    <div class="panel-heading">
                        <h5 class="mb-0">Comparativa de Satisfacción</h5>
                    </div>
                    <div class="panel-body">
                        <canvas id="grafico-comparacion-oficinas" height="250"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;

            return html;
        },

        renderGraficosComparativos: function () {
            if (typeof Chart === "undefined") return;

            setTimeout(() => {
                const ctx = document.getElementById(
                    "grafico-comparacion-oficinas"
                );
                if (!ctx || this.datosOficinas.length === 0) return;

                const nombres = this.datosOficinas.map((o) => o.nombre);
                const satisfaccion = this.datosOficinas.map(
                    (o) => o.satisfaccionPromedio
                );
                const recomendacion = this.datosOficinas.map(
                    (o) => o.porcentajeRecomendacion
                );
                const encuestas = this.datosOficinas.map(
                    (o) => o.encuestasTotales
                );

                // Destruir gráfico anterior si existe
                if (this.chartInstance) {
                    this.chartInstance.destroy();
                }

                this.chartInstance = new Chart(ctx, {
                    type: "bar",
                    data: {
                        labels: nombres,
                        datasets: [
                            {
                                label: "Satisfacción (1-5)",
                                data: satisfaccion,
                                backgroundColor: "rgba(54, 162, 235, 0.7)",
                                borderColor: "rgba(54, 162, 235, 1)",
                                borderWidth: 1,
                                yAxisID: "y",
                            },
                            {
                                label: "% Recomendación",
                                data: recomendacion,
                                backgroundColor: "rgba(75, 192, 192, 0.7)",
                                borderColor: "rgba(75, 192, 192, 1)",
                                borderWidth: 1,
                                yAxisID: "y1",
                            },
                        ],
                    },
                    options: {
                        responsive: true,
                        interaction: {
                            mode: "index",
                            intersect: false,
                        },
                        scales: {
                            x: {
                                ticks: {
                                    maxRotation: 45,
                                },
                            },
                            y: {
                                type: "linear",
                                display: true,
                                position: "left",
                                title: {
                                    display: true,
                                    text: "Satisfacción (1-5)",
                                },
                                max: 5,
                                min: 0,
                            },
                            y1: {
                                type: "linear",
                                display: true,
                                position: "right",
                                title: {
                                    display: true,
                                    text: "% Recomendación",
                                },
                                max: 100,
                                min: 0,
                                grid: {
                                    drawOnChartArea: false,
                                },
                            },
                        },
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    label: function (context) {
                                        let label = context.dataset.label || "";
                                        if (label) {
                                            label += ": ";
                                        }
                                        if (context.datasetIndex === 0) {
                                            label +=
                                                context.parsed.y.toFixed(1) +
                                                "/5.0";
                                        } else {
                                            label +=
                                                context.parsed.y.toFixed(1) +
                                                "%";
                                        }
                                        return label;
                                    },
                                },
                            },
                        },
                    },
                });
            }, 100);
        },
    });
});
