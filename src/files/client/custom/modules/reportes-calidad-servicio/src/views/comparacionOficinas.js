define("reportes-calidad-servicio:views/comparacionOficinas", [
    "view",
], function (Dep) {
    return Dep.extend({
        template: "reportes-calidad-servicio:comparacionOficinas",

        events: {
            'click [data-action="volver"]': function () {
                this.actionVolver();
            },
        },

        data: function () {
            return {
                claNombre: this.claNombre,
                oficinas: this.oficinas || [],
                cargando: this.cargando,
            };
        },

        setup: function () {
            // ✅ Recibir parámetros del controlador (como reporteBase.js)
            this.claId = this.options.claId;
            this.claNombre = this.options.claNombre || "CLA";

            this.oficinas = [];
            this.cargando = true;

            this.cargarDatos();
        },

        cargarDatos: function () {
            Espo.Ui.notify(
                "Cargando comparación de oficinas...",
                "info",
                1000,
                true
            );

            Espo.Ajax.getRequest(
                "CCustomerSurvey/action/getComparacionOficinas",
                {
                    claId: this.claId,
                }
            )
                .then(
                    function (response) {
                        if (response && response.success) {
                            this.oficinas = response.data || [];
                            this.cargando = false;
                            this.reRender();
                        } else {
                            Espo.Ui.error(
                                "No se pudieron cargar los datos de las oficinas"
                            );
                            this.actionVolver();
                        }
                    }.bind(this)
                )
                .catch(
                    function (error) {
                        console.error("Error cargando oficinas:", error);
                        Espo.Ui.error("Error al cargar la comparación");
                        this.actionVolver();
                    }.bind(this)
                );
        },

        afterRender: function () {
            if (!this.cargando && this.oficinas.length > 0) {
                setTimeout(
                    function () {
                        this.renderizarGrafico();
                    }.bind(this),
                    100
                );
            }
        },

        renderizarGrafico: function () {
            var ctx = document.getElementById("chart-comparacion-oficinas");
            if (!ctx || typeof Chart === "undefined") {
                console.error("Chart.js no disponible");
                return;
            }

            // Destruir gráfico anterior si existe
            if (this.chart) {
                this.chart.destroy();
            }

            var labels = this.oficinas.map(function (o) {
                return o.nombre || "Sin nombre";
            });

            var data = this.oficinas.map(function (o) {
                return o.porcentaje || 0;
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
                            label: "Evaluación (%)",
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
                                    var oficina =
                                        this.oficinas[context.dataIndex];
                                    return [
                                        "Evaluación: " +
                                            context.parsed.x.toFixed(1) +
                                            "%",
                                        "Encuestas: " +
                                            (oficina.totalEncuestas || 0),
                                        "Promedio: " +
                                            (
                                                oficina.satisfaccionPromedio ||
                                                0
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
            // ✅ Volver manteniendo el filtro de CLA seleccionado
            console.log("volver");
            this.getRouter().navigate("#CCustomerSurvey?cla=" + this.claId, {
                trigger: true,
            });
        },

        remove: function () {
            if (this.chart) {
                try {
                    this.chart.destroy();
                } catch (e) {}
            }
            Dep.prototype.remove.call(this);
        },
    });
});
