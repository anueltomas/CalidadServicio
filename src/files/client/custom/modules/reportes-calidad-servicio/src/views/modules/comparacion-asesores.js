define("reportes-calidad-servicio:views/comparacion-asesores", [
    "view",
], function (Dep) {
    return Dep.extend({
        template: "reportes-calidad-servicio:comparacion-asesores",

        events: {
            'click [data-action="volver"]': function () {
                this.actionVolver();
            },
        },

        data: function () {
            return {
                oficinaNombre: this.oficinaNombre,
                asesores: this.asesores || [],
                cargando: this.cargando,
            };
        },

        setup: function () {
            // ✅ Recibir parámetros del controlador (como reporteBase.js)
            this.oficinaId = this.options.oficinaId;
            this.claId = this.options.claId;
            this.oficinaNombre = this.options.oficinaNombre || "Oficina";

            this.asesores = [];
            this.cargando = true;

            this.cargarDatos();
        },

        cargarDatos: function () {
            Espo.Ui.notify("Cargando comparación...", "info", 1000, true);

            Espo.Ajax.getRequest(
                "CCustomerSurvey/action/getComparacionAsesores",
                {
                    oficinaId: this.oficinaId,
                }
            )
                .then(
                    function (response) {
                        if (response && response.success) {
                            this.asesores = response.data || [];
                            this.cargando = false;
                            this.reRender();
                        } else {
                            Espo.Ui.error("No se pudieron cargar los datos");
                            this.actionVolver();
                        }
                    }.bind(this)
                )
                .catch(
                    function (error) {
                        console.error("Error:", error);
                        Espo.Ui.error("Error al cargar la comparación");
                        this.actionVolver();
                    }.bind(this)
                );
        },

        afterRender: function () {
            if (!this.cargando && this.asesores.length > 0) {
                this.renderizarGrafico();
            }
        },

        renderizarGrafico: function () {
            var ctx = document.getElementById("chart-comparacion-asesores");
            if (!ctx || typeof Chart === "undefined") {
                console.error("Chart.js no disponible");
                return;
            }

            // Destruir gráfico anterior si existe
            if (this.chart) {
                this.chart.destroy();
            }

            var labels = this.asesores.map(function (a) {
                return a.nombre || "Sin nombre";
            });

            var data = this.asesores.map(function (a) {
                return a.porcentaje || 0;
            });

            var backgroundColors = data.map(function (porcentaje) {
                if (porcentaje >= 80) return "#9D8B64";
                if (porcentaje >= 70) return "#A89968";
                if (porcentaje >= 60) return "#B8A279";
                if (porcentaje >= 50) return "#999999";
                return "#666666";
            });

            this.chart = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: "Desempeño (%)",
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
                                    var asesor =
                                        this.asesores[context.dataIndex];
                                    return [
                                        "Desempeño: " +
                                            context.parsed.x.toFixed(1) +
                                            "%",
                                        "Encuestas: " +
                                            (asesor.totalEncuestas || 0),
                                        "Promedio: " +
                                            (
                                                asesor.promedioGeneral || 0
                                            ).toFixed(2),
                                    ];
                                }.bind(this),
                            },
                        },
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            max: 100,
                            grid: { color: "#E6E6E6" },
                            ticks: {
                                callback: function (value) {
                                    return value + "%";
                                },
                            },
                        },
                        y: {
                            grid: { display: false },
                        },
                    },
                },
            });
        },

        actionVolver: function () {
            // ✅ CORRECTO: Volver con los parámetros
            this.getRouter().navigate(
                "#CCustomerSurvey?cla=" +
                    this.claId +
                    "&oficina=" +
                    this.oficinaId,
                { trigger: true }
            );
        },
    });
});
