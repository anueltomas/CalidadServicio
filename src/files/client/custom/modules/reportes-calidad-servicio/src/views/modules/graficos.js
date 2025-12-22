define("reportes-calidad-servicio:views/modules/graficos", [], function () {
    const COLORES = {
        DORADO_OSCURO: "#9D8B64",
        DORADO_RELENTLESS: "#A89968",
        DORADO_CLARO: "#B8A279",
        GRIS_OBSESIVO: "#1A1A1A",
        GRIS_MEDIO: "#666666",
        GRIS_CLARO: "#999999",
        GRIS_MUY_CLARO: "#CCCCCC",
        GRIS_FONDO: "#E6E6E6",
        GRIS_WHITE: "#FFFFFF",
        EXCELENTE: "#9D8B64",
        MUY_BUENO: "#A89968",
        BUENO: "#B8A279",
        REGULAR: "#666666",
        DEFICIENTE: "#999999",
    };

    const TAMANOS_GRAFICOS = {
        DONUT: {
            altura: 280,
            ancho: "100%",
            aspectRatio: 1.2,
        },
        BARRAS_HORIZONTALES: {
            altura: 350,
            ancho: "100%",
            aspectRatio: 1.8,
        },
        BARRAS_VERTICALES: {
            altura: 300,
            ancho: "100%",
            aspectRatio: 1.5,
        },
        PIE: {
            altura: 250,
            ancho: "100%",
            aspectRatio: 1.2,
        },
        COMPARACION: {
            altura: 400,
            ancho: "100%",
            aspectRatio: 1.6,
        },
    };

    const OPCIONES_GRAFICOS = {
        DONUT: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "50%",
            plugins: {
                legend: {
                    display: true,
                    position: "bottom",
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: "circle",
                        font: {
                            size: 12,
                            weight: "600",
                            family: "'Arial', sans-serif",
                        },
                    },
                },
            },
        },

        BARRAS_HORIZONTALES: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function (value) {
                            return value + "%";
                        },
                    },
                    grid: { color: COLORES.GRIS_FONDO },
                },
                y: {
                    grid: { display: false },
                    ticks: {
                        font: {
                            size: 11,
                            family: "'Arial', sans-serif",
                        },
                        autoSkip: false,
                        maxRotation: 0,
                    },
                },
            },
            plugins: {
                legend: { display: false },
                barLabels: false,
            },
        },

        BARRAS_VERTICALES: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: COLORES.GRIS_FONDO },
                    ticks: {
                        font: {
                            size: 12,
                            family: "'Arial', sans-serif",
                        },
                    },
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        font: {
                            size: 12,
                            family: "'Arial', sans-serif",
                        },
                    },
                },
            },
            plugins: {
                legend: { display: false },
            },
        },

        PIE: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "right",
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        font: {
                            size: 11,
                            family: "'Arial', sans-serif",
                        },
                    },
                },
            },
        },

        RADAR: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 5,
                    ticks: {
                        stepSize: 1,
                        callback: function (value) {
                            return value.toFixed(1);
                        },
                        font: {
                            size: 11,
                            family: "'Arial', sans-serif",
                        },
                    },
                    grid: { color: COLORES.GRIS_FONDO },
                    pointLabels: {
                        font: {
                            size: 11,
                            family: "'Arial', sans-serif",
                        },
                    },
                },
            },
            plugins: {
                legend: { display: false },
            },
        },
    };

    const ESCALA_COLORES = {
        80: COLORES.EXCELENTE,
        70: COLORES.MUY_BUENO,
        60: COLORES.BUENO,
        50: COLORES.REGULAR,
        default: COLORES.DEFICIENTE,
    };

    var GraficosManager = function (view) {
        this.view = view;
        this.charts = {};
        this.colores = COLORES;
        this.escalaColores = ESCALA_COLORES;
        this.tamanos = TAMANOS_GRAFICOS;
    };

    GraficosManager.prototype.configurarContenedorGrafico = function (
        elementId,
        tipoGrafico
    ) {
        var canvas = document.getElementById(elementId);
        if (!canvas) return;

        var wrapper = canvas.closest(".grafico-wrapper");
        if (!wrapper) {
            wrapper = document.createElement("div");
            wrapper.className = "grafico-wrapper";
            canvas.parentNode.insertBefore(wrapper, canvas);
            wrapper.appendChild(canvas);
        }

        wrapper.style.position = "relative";
        wrapper.style.width = TAMANOS_GRAFICOS[tipoGrafico].ancho;
        wrapper.style.height = TAMANOS_GRAFICOS[tipoGrafico].altura + "px";
        wrapper.style.minHeight = TAMANOS_GRAFICOS[tipoGrafico].altura + "px";
        wrapper.style.maxHeight = TAMANOS_GRAFICOS[tipoGrafico].altura + "px";

        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.display = "block";
    };

    GraficosManager.prototype.renderCharts = function () {
        if (!this.view) {
            this.mostrarMensajeSinDatos();
            return;
        }

        var stats;

        if (this.view.stats) {
            stats = this.view.stats;
        } else if (
            this.view.estadisticasManager &&
            this.view.estadisticasManager.stats
        ) {
            stats = this.view.estadisticasManager.stats;
        } else {
            this.mostrarMensajeSinDatos();
            return;
        }

        if (!stats || !stats.totalEncuestas || stats.totalEncuestas === 0) {
            this.mostrarMensajeSinDatos();
            return;
        }

        if (typeof Chart === "undefined") {
            this.mostrarErrorChartJS();
            return;
        }

        this.destroyCharts();

        var distribucion = stats.distribucionOperaciones || {};
        var promedios = stats.promediosCategorias || {};
        var distribucionCalificaciones = stats.distribucionCalificaciones || {};

        try {
            if (document.getElementById("chart-donut")) {
                this.configurarContenedorGrafico("chart-donut", "DONUT");
                this.renderDonutChart(distribucion);
            }

            if (document.getElementById("chart-competencias")) {
                this.configurarContenedorGrafico(
                    "chart-competencias",
                    "BARRAS_HORIZONTALES"
                );
                this.renderCompetenciasChart(promedios);
            }

            if (document.getElementById("chart-satisfaccion")) {
                this.configurarContenedorGrafico(
                    "chart-satisfaccion",
                    "BARRAS_VERTICALES"
                );
                this.renderSatisfaccionChart(distribucionCalificaciones);
            }

            if (document.getElementById("chart-calificacion-general")) {
                this.configurarContenedorGrafico(
                    "chart-calificacion-general",
                    "PIE"
                );
                this.renderCalificacionGeneralChart(distribucionCalificaciones);
            }

            if (document.getElementById("chart-medios-contacto")) {
                this.configurarContenedorGrafico(
                    "chart-medios-contacto",
                    "BARRAS_HORIZONTALES"
                );
                this.renderMediosContactoChart(stats.mediosContacto || {});
            }

            if (document.getElementById("chart-recomendacion")) {
                this.configurarContenedorGrafico("chart-recomendacion", "PIE");
                this.renderRecomendacionChart(
                    stats.recomendacion || { si: 0, no: 0 }
                );
            }

            if (document.getElementById("chart-calificacion-oficina")) {
                this.configurarContenedorGrafico(
                    "chart-calificacion-oficina",
                    "PIE"
                );
                this.renderCalificacionOficinaChart(promedios);
            }

            if (document.getElementById("chart-oficinas")) {
                this.configurarContenedorGrafico(
                    "chart-oficinas",
                    "BARRAS_VERTICALES"
                );
                this.renderOficinasChart(stats.estadisticasOficinas || []);
            }

            if (document.getElementById("chart-barras")) {
                this.configurarContenedorGrafico(
                    "chart-barras",
                    "BARRAS_VERTICALES"
                );
                this.renderBarChart(
                    distribucion["Venta"] || 0,
                    distribucion["Compra"] || 0,
                    distribucion["Alquiler"] || 0
                );
            }

            if (document.getElementById("chart-radar")) {
                this.configurarContenedorGrafico("chart-radar", "RADAR");
                this.renderRadarChart(promedios);
            }

            if (document.getElementById("chart-horizontal")) {
                this.configurarContenedorGrafico(
                    "chart-horizontal",
                    "BARRAS_HORIZONTALES"
                );
                this.renderHorizontalBarChart(promedios);
            }

            if (document.getElementById("chart-distribution")) {
                this.configurarContenedorGrafico("chart-distribution", "PIE");
                this.renderDistributionChart(distribucionCalificaciones);
            }

            if (document.querySelector("[id^='chart-comparacion-']")) {
                this.configurarContenedorGrafico(
                    document.querySelector("[id^='chart-comparacion-']").id,
                    "COMPARACION"
                );
            }
        } catch (error) {
            this.mostrarErrorChartJS();
        }

        setTimeout(() => {
            this.redimensionarTodosLosGraficos();
        }, 100);
    };

    GraficosManager.prototype.redimensionarTodosLosGraficos = function () {
        Object.values(this.charts).forEach(function (chart) {
            if (chart && typeof chart.resize === "function") {
                try {
                    chart.resize();
                    chart.update("none");
                } catch (error) {}
            }
        });
    };

    GraficosManager.prototype.renderGraficoComparacion = function (config) {
        if (typeof Chart === "undefined") {
            return;
        }

        var ctx = document.getElementById("chart-comparacion-" + config.tipo);
        if (!ctx) return;

        this.configurarContenedorGrafico(
            "chart-comparacion-" + config.tipo,
            "COMPARACION"
        );

        if (this.charts["comparacion_" + config.tipo]) {
            this.charts["comparacion_" + config.tipo].destroy();
        }

        var datosOrdenados = config.data.sort(function (a, b) {
            return b.porcentaje - a.porcentaje;
        });

        var labels = datosOrdenados.map(function (item) {
            var nombre = item.nombre || item.id || "Sin nombre";
            return nombre.length > 30
                ? nombre.substring(0, 30) + "..."
                : nombre;
        });

        var data = datosOrdenados.map(function (item) {
            return item.porcentaje || 0;
        });

        var backgroundColors = data.map(function (porcentaje) {
            if (porcentaje >= 80) return COLORES.EXCELENTE;
            if (porcentaje >= 70) return COLORES.MUY_BUENO;
            if (porcentaje >= 60) return COLORES.BUENO;
            if (porcentaje >= 50) return COLORES.REGULAR;
            return COLORES.DEFICIENTE;
        });

        try {
            this.charts["comparacion_" + config.tipo] = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label:
                                config.tipo === "asesores"
                                    ? "Desempeño del Asesor"
                                    : "Evaluación de la Oficina",
                            data: data,
                            backgroundColor: backgroundColors,
                            borderWidth: 0,
                            borderRadius: 6,
                        },
                    ],
                },
                options: {
                    indexAxis: "y",
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    var item =
                                        datosOrdenados[context.dataIndex];
                                    var encuestas = item.totalEncuestas || 0;
                                    var promedio =
                                        config.tipo === "asesores"
                                            ? (
                                                  item.promedioGeneral || 0
                                              ).toFixed(2)
                                            : (
                                                  item.satisfaccionPromedio || 0
                                              ).toFixed(2);

                                    return [
                                        "Desempeño: " +
                                            context.parsed.x.toFixed(1) +
                                            "%",
                                        "Encuestas: " + encuestas,
                                        "Promedio: " + promedio,
                                    ];
                                },
                            },
                        },
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            max: 100,
                            grid: { color: COLORES.GRIS_FONDO },
                            ticks: {
                                callback: function (value) {
                                    return value + "%";
                                },
                                font: {
                                    size: 12,
                                    family: "'Arial', sans-serif",
                                },
                            },
                            title: {
                                display: true,
                                text: "Porcentaje de Desempeño",
                                font: {
                                    size: 14,
                                    weight: "bold",
                                    family: "'Arial', sans-serif",
                                },
                            },
                        },
                        y: {
                            grid: { display: false },
                            ticks: {
                                font: {
                                    size: 11,
                                    family: "'Arial', sans-serif",
                                },
                                callback: function (value, index) {
                                    var item = datosOrdenados[index];
                                    return item.nombre || item.id || "";
                                },
                            },
                        },
                    },
                },
            });
        } catch (error) {}
    };

    GraficosManager.prototype.renderDonutChart = function (distribucion) {
        var ctxDonut = document.getElementById("chart-donut");
        if (!ctxDonut) return;

        var venta = distribucion["Venta"] || 0;
        var compra = distribucion["Compra"] || 0;
        var alquiler = distribucion["Alquiler"] || 0;
        var total = venta + compra + alquiler;

        if (total === 0) {
            this.mostrarMensajeSinDatos();
            return;
        }

        try {
            this.charts.donut = new Chart(ctxDonut, {
                type: "doughnut",
                data: {
                    labels: ["Venta", "Compra", "Alquiler"],
                    datasets: [
                        {
                            data: [venta, compra, alquiler],
                            backgroundColor: [
                                COLORES.EXCELENTE,
                                COLORES.MUY_BUENO,
                                COLORES.GRIS_MEDIO,
                            ],
                            borderWidth: 3,
                            borderColor: COLORES.GRIS_WHITE,
                        },
                    ],
                },
                options: {
                    ...OPCIONES_GRAFICOS.DONUT,
                    plugins: {
                        ...OPCIONES_GRAFICOS.DONUT.plugins,
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    var label = context.label || "";
                                    var value = context.parsed || 0;
                                    var percentage =
                                        total > 0
                                            ? ((value / total) * 100).toFixed(0)
                                            : 0;
                                    return (
                                        label +
                                        ": " +
                                        value +
                                        " (" +
                                        percentage +
                                        "%)"
                                    );
                                },
                            },
                        },
                    },
                },
            });
        } catch (error) {}
    };

    GraficosManager.prototype.renderCompetenciasChart = function (promedios) {
        var ctx = document.getElementById("chart-competencias");
        if (!ctx) return;

        try {
            var total = Object.keys(promedios).length > 0 ? 5 : 1;

            var labels = [
                "Manejo de los tiempos de la negociación",
                "Manejo de situaciones imprevistas",
                "Acompañamiento de inicio a fin",
                "Solución de problemas",
                "Nivel de compromiso en el servicio",
                "Puntualidad",
                "Manejo de los detalles",
                "Presentación Personal e imagen",
                "Nivel de conocimiento del negocio inmobiliario",
                "Asesoría legal, fiscal y financiera",
                "Efectividad y regularidad en la comunicación",
            ];

            var dataValues = [
                promedios.negotiationTiming || 0,
                promedios.unexpectedSituations || 0,
                promedios.fullSupport || 0,
                promedios.problemSolving || 0,
                promedios.commitmentLevel || 0,
                promedios.punctuality || 0,
                promedios.detailManagement || 0,
                promedios.personalPresentation || 0,
                promedios.businessKnowledge || 0,
                promedios.legalAdvice || 0,
                promedios.communicationEffectiveness || 0,
            ];

            var porcentajes = dataValues.map(function (val) {
                return total > 0 ? Math.round((val / total) * 100) : 0;
            });

            this.charts.competencias = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: "Porcentaje",
                            data: porcentajes,
                            backgroundColor: COLORES.MUY_BUENO,
                            borderWidth: 0,
                            borderRadius: 4,
                        },
                    ],
                },
                options: {
                    ...OPCIONES_GRAFICOS.BARRAS_HORIZONTALES,
                    plugins: {
                        ...OPCIONES_GRAFICOS.BARRAS_HORIZONTALES.plugins,
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return context.parsed.x + "%";
                                },
                            },
                        },
                    },
                },
            });
        } catch (error) {}
    };

    GraficosManager.prototype.renderSatisfaccionChart = function (
        distribucionCalificaciones
    ) {
        var ctx = document.getElementById("chart-satisfaccion");
        if (!ctx) return;

        try {
            var total = 0;
            ["1", "2", "3", "4", "5"].forEach(function (key) {
                total += distribucionCalificaciones[key] || 0;
            });

            var data = [
                distribucionCalificaciones["5"] || 0,
                distribucionCalificaciones["4"] || 0,
                distribucionCalificaciones["3"] || 0,
                distribucionCalificaciones["2"] || 0,
                distribucionCalificaciones["1"] || 0,
            ];

            var satisfaccion =
                total > 0 ? Math.round(((data[0] + data[1]) / total) * 100) : 0;

            this.charts.satisfaccion = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: [
                        "Excelente",
                        "Muy Bueno",
                        "Bueno",
                        "Regular",
                        "Deficiente",
                    ],
                    datasets: [
                        {
                            label: "Cantidad",
                            data: data,
                            backgroundColor: COLORES.MUY_BUENO,
                            borderWidth: 0,
                            borderRadius: 4,
                        },
                    ],
                },
                options: {
                    ...OPCIONES_GRAFICOS.BARRAS_VERTICALES,
                    scales: {
                        ...OPCIONES_GRAFICOS.BARRAS_VERTICALES.scales,
                        y: {
                            ...OPCIONES_GRAFICOS.BARRAS_VERTICALES.scales.y,
                            ticks: {
                                stepSize: Math.ceil(Math.max(...data) / 5) || 1,
                                font: {
                                    size: 11,
                                    family: "'Arial', sans-serif",
                                },
                            },
                        },
                        x: {
                            ...OPCIONES_GRAFICOS.BARRAS_VERTICALES.scales.x,
                            ticks: {
                                font: {
                                    size: 11,
                                    family: "'Arial', sans-serif",
                                },
                            },
                        },
                    },
                    plugins: {
                        ...OPCIONES_GRAFICOS.BARRAS_VERTICALES.plugins,
                        title: {
                            display: true,
                            text:
                                "Porcentaje de satisfacción " +
                                satisfaccion +
                                "%",
                            font: {
                                size: 14,
                                weight: "bold",
                                family: "'Arial', sans-serif",
                            },
                            color: COLORES.GRIS_OBSESIVO,
                            padding: { top: 10, bottom: 20 },
                        },
                    },
                },
            });
        } catch (error) {}
    };

    GraficosManager.prototype.renderCalificacionGeneralChart = function (
        distribucionCalificaciones
    ) {
        var ctx = document.getElementById("chart-calificacion-general");
        if (!ctx) return;

        try {
            var total = 0;
            ["1", "2", "3", "4", "5"].forEach(function (key) {
                total += distribucionCalificaciones[key] || 0;
            });

            var data = [
                distribucionCalificaciones["5"] || 0,
                distribucionCalificaciones["4"] || 0,
                distribucionCalificaciones["3"] || 0,
                distribucionCalificaciones["2"] || 0,
                distribucionCalificaciones["1"] || 0,
            ];

            var porcentajes = data.map(function (val) {
                return total > 0 ? Math.round((val / total) * 100) : 0;
            });

            this.charts.calificacionGeneral = new Chart(ctx, {
                type: "pie",
                data: {
                    labels: [
                        "Excelente",
                        "Muy Bueno",
                        "Bueno",
                        "Regular",
                        "Deficiente",
                    ],
                    datasets: [
                        {
                            data: data,
                            backgroundColor: [
                                COLORES.EXCELENTE,
                                COLORES.MUY_BUENO,
                                COLORES.GRIS_MEDIO,
                                COLORES.GRIS_CLARO,
                                COLORES.GRIS_MUY_CLARO,
                            ],
                            borderWidth: 2,
                            borderColor: COLORES.GRIS_WHITE,
                        },
                    ],
                },
                options: {
                    ...OPCIONES_GRAFICOS.PIE,
                    plugins: {
                        ...OPCIONES_GRAFICOS.PIE.plugins,
                        legend: {
                            ...OPCIONES_GRAFICOS.PIE.plugins.legend,
                            generateLabels: function (chart) {
                                var data = chart.data;
                                if (
                                    data.labels.length &&
                                    data.datasets.length
                                ) {
                                    return data.labels.map(function (label, i) {
                                        var value = data.datasets[0].data[i];
                                        var percentage = porcentajes[i];
                                        return {
                                            text:
                                                label + " " + percentage + "%",
                                            fillStyle:
                                                data.datasets[0]
                                                    .backgroundColor[i],
                                            hidden: false,
                                            index: i,
                                        };
                                    });
                                }
                                return [];
                            },
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    var label = context.label || "";
                                    var value = context.parsed || 0;
                                    var percentage =
                                        porcentajes[context.dataIndex];
                                    return (
                                        label +
                                        ": " +
                                        value +
                                        " (" +
                                        percentage +
                                        "%)"
                                    );
                                },
                            },
                        },
                    },
                },
            });
        } catch (error) {}
    };

    GraficosManager.prototype.renderMediosContactoChart = function (
        mediosContacto
    ) {
        var ctx = document.getElementById("chart-medios-contacto");
        if (!ctx) return;

        try {
            var labels = [];
            var data = [];
            var total = 0;

            Object.keys(mediosContacto).forEach(function (medio) {
                total += mediosContacto[medio];
            });

            Object.keys(mediosContacto).forEach(function (medio) {
                var valor = mediosContacto[medio];
                if (valor > 0) {
                    labels.push(medio);
                    var porcentaje =
                        total > 0 ? Math.round((valor / total) * 100) : 0;
                    data.push(porcentaje);
                }
            });

            var colores = [
                COLORES.EXCELENTE,
                COLORES.MUY_BUENO,
                COLORES.GRIS_MEDIO,
                COLORES.GRIS_CLARO,
                COLORES.BUENO,
                COLORES.GRIS_MUY_CLARO,
            ];

            this.charts.mediosContacto = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: "Porcentaje",
                            data: data,
                            backgroundColor: colores.slice(0, labels.length),
                            borderWidth: 0,
                            borderRadius: 4,
                        },
                    ],
                },
                options: {
                    ...OPCIONES_GRAFICOS.BARRAS_HORIZONTALES,
                },
            });
        } catch (error) {}
    };

    GraficosManager.prototype.renderRecomendacionChart = function (
        recomendacion
    ) {
        var ctx = document.getElementById("chart-recomendacion");
        if (!ctx) return;

        try {
            var si = recomendacion.si || 0;
            var no = recomendacion.no || 0;
            var total = si + no;
            var porcentajeSi = total > 0 ? Math.round((si / total) * 100) : 0;

            this.charts.recomendacion = new Chart(ctx, {
                type: "pie",
                data: {
                    labels: ["SI lo recomendaría", "NO lo recomendaría"],
                    datasets: [
                        {
                            data: [si, no],
                            backgroundColor: [
                                COLORES.EXCELENTE,
                                COLORES.GRIS_MEDIO,
                            ],
                            borderWidth: 2,
                            borderColor: COLORES.GRIS_WHITE,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: "bottom",
                            labels: {
                                padding: 15,
                                usePointStyle: true,
                                font: {
                                    size: 12,
                                    weight: "600",
                                    family: "'Arial', sans-serif",
                                },
                                generateLabels: function (chart) {
                                    var data = chart.data;
                                    if (
                                        data.labels.length &&
                                        data.datasets.length
                                    ) {
                                        return data.labels.map(function (
                                            label,
                                            i
                                        ) {
                                            var percentage =
                                                i === 0
                                                    ? porcentajeSi
                                                    : 100 - porcentajeSi;
                                            return {
                                                text:
                                                    label +
                                                    " " +
                                                    percentage +
                                                    "%",
                                                fillStyle:
                                                    data.datasets[0]
                                                        .backgroundColor[i],
                                                hidden: false,
                                                index: i,
                                            };
                                        });
                                    }
                                    return [];
                                },
                            },
                        },
                    },
                },
            });
        } catch (error) {}
    };

    GraficosManager.prototype.renderCalificacionOficinaChart = function (
        promedios
    ) {
        var ctx = document.getElementById("chart-calificacion-oficina");
        if (!ctx) return;

        try {
            var officeRating = promedios.officeRating || 0;

            var total = 100;
            var excelente = Math.round(officeRating * 20);
            var muyBueno = Math.round((5 - officeRating) * 10);
            var bueno = Math.max(0, 100 - excelente - muyBueno - 1 - 1);
            var regular = 1;
            var deficiente = 1;

            var data = [excelente, muyBueno, bueno, regular, deficiente];

            this.charts.calificacionOficina = new Chart(ctx, {
                type: "pie",
                data: {
                    labels: [
                        "Excelente",
                        "Muy Bueno",
                        "Bueno",
                        "Regular",
                        "Deficiente",
                    ],
                    datasets: [
                        {
                            data: data,
                            backgroundColor: [
                                COLORES.EXCELENTE,
                                COLORES.MUY_BUENO,
                                COLORES.GRIS_MEDIO,
                                COLORES.GRIS_CLARO,
                                COLORES.GRIS_MUY_CLARO,
                            ],
                            borderWidth: 2,
                            borderColor: COLORES.GRIS_WHITE,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: "right",
                            labels: {
                                padding: 15,
                                usePointStyle: true,
                                font: {
                                    size: 11,
                                    family: "'Arial', sans-serif",
                                },
                                generateLabels: function (chart) {
                                    var data = chart.data;
                                    if (
                                        data.labels.length &&
                                        data.datasets.length
                                    ) {
                                        return data.labels.map(function (
                                            label,
                                            i
                                        ) {
                                            var percentage =
                                                data.datasets[0].data[i];
                                            return {
                                                text:
                                                    label +
                                                    " " +
                                                    percentage +
                                                    "%",
                                                fillStyle:
                                                    data.datasets[0]
                                                        .backgroundColor[i],
                                                hidden: false,
                                                index: i,
                                            };
                                        });
                                    }
                                    return [];
                                },
                            },
                        },
                    },
                },
            });
        } catch (error) {}
    };

    GraficosManager.prototype.renderOficinasChart = function (
        estadisticasOficinas
    ) {
        var ctx = document.getElementById("chart-oficinas");
        if (!ctx) return;

        try {
            var labels = [];
            var dataEncuestas = [];
            var dataSatisfaccion = [];

            estadisticasOficinas.forEach(function (oficina) {
                labels.push(oficina.nombre);
                dataEncuestas.push(oficina.totalEncuestas);
                dataSatisfaccion.push(oficina.satisfaccionPromedio);
            });

            this.charts.oficinas = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: "Total Encuestas",
                            data: dataEncuestas,
                            backgroundColor: COLORES.DORADO_CLARO,
                            borderWidth: 0,
                            borderRadius: 6,
                            yAxisID: "y",
                        },
                        {
                            label: "Satisfacción Promedio",
                            data: dataSatisfaccion,
                            backgroundColor: COLORES.GRIS_OBSESIVO,
                            borderWidth: 0,
                            borderRadius: 6,
                            yAxisID: "y1",
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            type: "linear",
                            display: true,
                            position: "left",
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: "Total Encuestas",
                                font: {
                                    weight: "bold",
                                    family: "'Arial', sans-serif",
                                },
                            },
                            grid: { color: COLORES.GRIS_FONDO },
                            ticks: {
                                font: {
                                    size: 11,
                                    family: "'Arial', sans-serif",
                                },
                            },
                        },
                        y1: {
                            type: "linear",
                            display: true,
                            position: "right",
                            beginAtZero: true,
                            max: 5,
                            title: {
                                display: true,
                                text: "Satisfacción (1-5)",
                                font: {
                                    weight: "bold",
                                    family: "'Arial', sans-serif",
                                },
                            },
                            grid: { drawOnChartArea: false },
                            ticks: {
                                font: {
                                    size: 11,
                                    family: "'Arial', sans-serif",
                                },
                            },
                        },
                        x: {
                            grid: { display: false },
                            ticks: {
                                font: {
                                    size: 10,
                                    family: "'Arial', sans-serif",
                                },
                                maxRotation: 45,
                                minRotation: 45,
                            },
                        },
                    },
                    plugins: {
                        legend: {
                            position: "top",
                            labels: {
                                usePointStyle: true,
                                padding: 15,
                                font: {
                                    size: 12,
                                    weight: "600",
                                    family: "'Arial', sans-serif",
                                },
                            },
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    var label = context.dataset.label || "";
                                    var value = context.parsed.y;
                                    if (context.datasetIndex === 1) {
                                        return (
                                            label +
                                            ": " +
                                            value.toFixed(1) +
                                            "/5"
                                        );
                                    }
                                    return label + ": " + value;
                                },
                            },
                        },
                    },
                },
            });
        } catch (error) {}
    };

    GraficosManager.prototype.renderBarChart = function (
        venta,
        compra,
        alquiler
    ) {
        var ctxBarras = document.getElementById("chart-barras");
        if (!ctxBarras) return;

        try {
            this.charts.barras = new Chart(ctxBarras, {
                type: "bar",
                data: {
                    labels: ["Venta", "Compra", "Alquiler"],
                    datasets: [
                        {
                            label: "Cantidad",
                            data: [venta, compra, alquiler],
                            backgroundColor: [
                                COLORES.DORADO_CLARO,
                                COLORES.DORADO_OSCURO,
                                COLORES.GRIS_MEDIO,
                            ],
                            borderWidth: 0,
                            borderRadius: 4,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize:
                                    Math.ceil(
                                        Math.max(venta, compra, alquiler) / 5
                                    ) || 1,
                                font: {
                                    size: 11,
                                    family: "'Arial', sans-serif",
                                },
                            },
                            grid: { color: COLORES.GRIS_FONDO },
                        },
                        x: {
                            grid: { display: false },
                            ticks: {
                                font: {
                                    size: 12,
                                    family: "'Arial', sans-serif",
                                },
                            },
                        },
                    },
                    plugins: {
                        legend: { display: false },
                    },
                },
            });
        } catch (error) {}
    };

    GraficosManager.prototype.renderRadarChart = function (promedios) {
        var ctxRadar = document.getElementById("chart-radar");
        if (!ctxRadar) return;

        try {
            this.charts.radar = new Chart(ctxRadar, {
                type: "radar",
                data: {
                    labels: [
                        "Comunicación",
                        "Asesoría Legal",
                        "Presentación",
                        "Manejo Detalles",
                        "Puntualidad",
                        "Compromiso",
                        "Solución Problemas",
                        "Acompañamiento",
                        "Situaciones Imprevistas",
                        "Tiempos Negociación",
                        "Calificación Oficina",
                    ],
                    datasets: [
                        {
                            label: "Promedio de Calificación",
                            data: [
                                promedios.communicationEffectiveness || 0,
                                promedios.legalAdvice || 0,
                                promedios.personalPresentation || 0,
                                promedios.detailManagement || 0,
                                promedios.punctuality || 0,
                                promedios.commitmentLevel || 0,
                                promedios.problemSolving || 0,
                                promedios.fullSupport || 0,
                                promedios.unexpectedSituations || 0,
                                promedios.negotiationTiming || 0,
                                promedios.officeRating || 0,
                            ],
                            backgroundColor: "rgba(184, 162, 121, 0.2)",
                            borderColor: COLORES.DORADO_CLARO,
                            borderWidth: 2,
                            pointBackgroundColor: COLORES.DORADO_CLARO,
                            pointBorderColor: COLORES.GRIS_WHITE,
                            pointHoverBackgroundColor: COLORES.GRIS_WHITE,
                            pointHoverBorderColor: COLORES.DORADO_CLARO,
                        },
                    ],
                },
                options: OPCIONES_GRAFICOS.RADAR,
            });
        } catch (error) {}
    };

    GraficosManager.prototype.renderHorizontalBarChart = function (promedios) {
        var ctxHorizontal = document.getElementById("chart-horizontal");
        if (!ctxHorizontal) return;

        try {
            this.charts.horizontal = new Chart(ctxHorizontal, {
                type: "bar",
                data: {
                    labels: [
                        "Comunicación",
                        "Asesoría Legal",
                        "Presentación Personal",
                        "Manejo de Detalles",
                        "Puntualidad",
                        "Compromiso",
                        "Solución Problemas",
                        "Acompañamiento",
                        "Situaciones Imprevistas",
                        "Tiempos Negociación",
                        "Calificación Oficina",
                    ],
                    datasets: [
                        {
                            label: "Calificación Promedio",
                            data: [
                                promedios.communicationEffectiveness || 0,
                                promedios.legalAdvice || 0,
                                promedios.personalPresentation || 0,
                                promedios.detailManagement || 0,
                                promedios.punctuality || 0,
                                promedios.commitmentLevel || 0,
                                promedios.problemSolving || 0,
                                promedios.fullSupport || 0,
                                promedios.unexpectedSituations || 0,
                                promedios.negotiationTiming || 0,
                                promedios.officeRating || 0,
                            ],
                            backgroundColor: [
                                COLORES.DORADO_CLARO,
                                COLORES.DORADO_OSCURO,
                                COLORES.GRIS_OBSESIVO,
                                COLORES.GRIS_MEDIO,
                                COLORES.DORADO_CLARO,
                                COLORES.DORADO_OSCURO,
                                COLORES.GRIS_OBSESIVO,
                                COLORES.GRIS_MEDIO,
                                COLORES.DORADO_CLARO,
                                COLORES.DORADO_OSCURO,
                                COLORES.GRIS_OBSESIVO,
                            ],
                            borderWidth: 0,
                            borderRadius: 4,
                        },
                    ],
                },
                options: {
                    indexAxis: "y",
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            beginAtZero: true,
                            max: 5,
                            grid: { color: COLORES.GRIS_FONDO },
                            ticks: {
                                callback: function (value) {
                                    return value.toFixed(1);
                                },
                                font: {
                                    size: 11,
                                    family: "'Arial', sans-serif",
                                },
                            },
                        },
                        y: {
                            grid: { display: false },
                            ticks: {
                                font: {
                                    size: 11,
                                    family: "'Arial', sans-serif",
                                },
                            },
                        },
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    return (
                                        "Calificación: " +
                                        context.parsed.x.toFixed(1) +
                                        "/5"
                                    );
                                },
                            },
                        },
                    },
                },
            });
        } catch (error) {}
    };

    GraficosManager.prototype.renderDistributionChart = function (
        distribucionCalificaciones
    ) {
        var ctxDistribution = document.getElementById("chart-distribution");
        if (!ctxDistribution) return;

        try {
            var total = 0;
            ["1", "2", "3", "4", "5"].forEach(function (key) {
                total += distribucionCalificaciones[key] || 0;
            });

            var data = [
                distribucionCalificaciones["5"] || 0,
                distribucionCalificaciones["4"] || 0,
                distribucionCalificaciones["3"] || 0,
                distribucionCalificaciones["2"] || 0,
                distribucionCalificaciones["1"] || 0,
            ];

            this.charts.distribution = new Chart(ctxDistribution, {
                type: "pie",
                data: {
                    labels: [
                        "Excelente (5)",
                        "Muy Bueno (4)",
                        "Bueno (3)",
                        "Regular (2)",
                        "Deficiente (1)",
                    ],
                    datasets: [
                        {
                            data: data,
                            backgroundColor: [
                                COLORES.DORADO_CLARO,
                                COLORES.DORADO_OSCURO,
                                COLORES.GRIS_MEDIO,
                                COLORES.GRIS_OBSESIVO,
                                COLORES.GRIS_FONDO,
                            ],
                            borderWidth: 2,
                            borderColor: COLORES.GRIS_WHITE,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: "bottom",
                            labels: {
                                padding: 20,
                                usePointStyle: true,
                                font: {
                                    size: 11,
                                    family: "'Arial', sans-serif",
                                },
                            },
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    var label = context.label || "";
                                    var value = context.parsed || 0;
                                    var percentage =
                                        total > 0
                                            ? ((value / total) * 100).toFixed(1)
                                            : 0;
                                    return (
                                        label +
                                        ": " +
                                        value +
                                        " (" +
                                        percentage +
                                        "%)"
                                    );
                                },
                            },
                        },
                    },
                },
            });
        } catch (error) {}
    };

    GraficosManager.prototype.destroyCharts = function () {
        Object.values(this.charts).forEach(function (chart) {
            if (chart && typeof chart.destroy === "function") {
                try {
                    chart.destroy();
                } catch (error) {}
            }
        });
        this.charts = {};
    };

    GraficosManager.prototype.mostrarMensajeSinDatos = function () {
        const mensajeHTML = `
            <div class="no-data-message" style="text-align: center; padding: 40px; color: ${COLORES.GRIS_CLARO};">
                <i class="fas fa-chart-line" style="font-size: 48px; margin-bottom: 15px;"></i>
                <p style="font-size: 16px; margin: 0;">No hay datos suficientes para mostrar este gráfico</p>
            </div>
        `;

        const graficoWrappers = document.querySelectorAll(".grafico-wrapper");
        graficoWrappers.forEach((wrapper) => {
            if (!wrapper.querySelector(".no-data-message")) {
                wrapper.innerHTML = mensajeHTML;
            }
        });
    };

    GraficosManager.prototype.mostrarErrorChartJS = function () {
        const container = this.view.$el.find("#dynamic-content-container")[0];
        if (container) {
            const graficosContainer = container.querySelector(
                ".graficos-container"
            );
            if (graficosContainer) {
                graficosContainer.innerHTML = `
                    <div class="empty-alert">
                        <div class="empty-icon">📊</div>
                        <h3>Error al cargar gráficos</h3>
                        <p class="text-muted">Chart.js no está disponible. Los datos se cargaron pero no se pueden mostrar los gráficos.</p>
                    </div>
                `;
            }
        }
    };

    GraficosManager.prototype.registrarPluginsChart = function () {
        if (typeof Chart === "undefined") return;

        var barLabelsPlugin = {
            id: "barLabels",
            afterDatasetsDraw: function (chart) {
                var showLabels =
                    chart.options.plugins && chart.options.plugins.barLabels;
                if (chart.config.type === "bar" && showLabels !== false) {
                    var ctx = chart.ctx;
                    chart.data.datasets.forEach(function (
                        dataset,
                        datasetIndex
                    ) {
                        var meta = chart.getDatasetMeta(datasetIndex);
                        if (!meta.hidden) {
                            meta.data.forEach(function (element, index) {
                                var value = dataset.data[index];
                                if (value > 0) {
                                    if (chart.options.indexAxis === "y") {
                                        var textX =
                                            element.x + element.width + 8;
                                        var textY = element.y;
                                        ctx.fillStyle = COLORES.GRIS_OBSESIVO;
                                        ctx.font =
                                            "bold 13px 'Arial', sans-serif";
                                        ctx.textAlign = "left";
                                        ctx.textBaseline = "middle";
                                        ctx.fillText(
                                            value.toFixed(1),
                                            textX,
                                            textY
                                        );
                                    } else {
                                        var textX = element.x;
                                        var textY = element.y - 5;
                                        ctx.fillStyle = COLORES.GRIS_OBSESIVO;
                                        ctx.font =
                                            "bold 12px 'Arial', sans-serif";
                                        ctx.textAlign = "center";
                                        ctx.textBaseline = "bottom";
                                        ctx.fillText(value, textX, textY);
                                    }
                                }
                            });
                        }
                    });
                }
            },
        };

        Chart.register(barLabelsPlugin);
    };

    GraficosManager.prototype.getColorPorPorcentaje = function (porcentaje) {
        if (porcentaje >= 80) return this.escalaColores[80];
        if (porcentaje >= 70) return this.escalaColores[70];
        if (porcentaje >= 60) return this.escalaColores[60];
        if (porcentaje >= 50) return this.escalaColores[50];
        return this.escalaColores.default;
    };

    return GraficosManager;
});
