define("reportes-calidad-servicio:views/principal", [
    "view",
    "reportes-calidad-servicio:views/modules/permisos",
    "reportes-calidad-servicio:views/modules/estadisticas",
    "reportes-calidad-servicio:views/modules/filtros-cla",
    "reportes-calidad-servicio:views/modules/filtros-oficinas",
    "reportes-calidad-servicio:views/modules/filtros-asesores", // ✅ NUEVO
    "reportes-calidad-servicio:views/modules/importador-csv",
    "reportes-calidad-servicio:views/modules/graficos",
], function (
    Dep,
    PermisosManager,
    EstadisticasManager,
    FiltrosCLAManager,
    FiltrosOficinasManager,
    FiltrosAsesoresManager,
    ImportadorCSV,
    GraficosManager
) {
    return Dep.extend({
        checkAccess: function () {
            console.log("🔐 checkAccess llamado");
            return true;
        },

        template: "reportes-calidad-servicio:principal",

        setup: function () {
            console.log("🔍 DEBUG: Iniciando setup de principal");

            // Verificar rutas registradas
            console.log("🔍 DEBUG: Verificando rutas...");
            if (window.router && window.router.routes) {
                console.log("🔍 DEBUG: Rutas registradas:");
                Object.keys(window.router.routes).forEach(function (route) {
                    console.log("  -", route);
                });
            } else {
                console.log("⚠️ WARNING: No se encontró objeto router.routes");
            }

            var user = this.getUser();
            this.esAdmin = user.isAdmin();
            this.restaurarFiltrosDesdeURL();

            // 1. PermisosManager
            if (typeof PermisosManager === "function") {
                this.permisosManager = new PermisosManager(this);
            } else {
                this.permisosManager = {
                    cargarPermisosUsuario: function () {
                        return Promise.reject("Módulo no cargado");
                    },
                    getPermisos: function () {
                        return { puedeImportar: false, permisosListo: false };
                    },
                    aplicarRestriccionesUI: function () {},
                };
            }

            // 2. EstadisticasManager
            if (typeof EstadisticasManager === "function") {
                this.estadisticasManager = new EstadisticasManager(this);
            } else {
                this.estadisticasManager = {
                    loadStatistics: function () {},
                    showLoadingState: function () {
                        var container = this.view.$el.find(
                            "#dynamic-content-container"
                        )[0];
                        if (container) {
                            container.innerHTML =
                                '<div style="padding: 40px; text-align: center; color: red;">❌ Módulo de estadísticas no cargado</div>';
                        }
                    },
                    updateUI: function () {},
                };
            }

            // 3. FiltrosCLAManager
            if (typeof FiltrosCLAManager === "function") {
                this.filtrosCLAManager = new FiltrosCLAManager(this);
            } else {
                this.filtrosCLAManager = {
                    cargarFiltros: function () {},
                    setupEventListeners: function () {},
                    getFiltros: function () {
                        return {
                            cla: null,
                            oficina: null,
                            asesor: null,
                            mostrarTodas: true,
                        };
                    },
                };
            }

            // 4. FiltrosOficinasManager
            if (typeof FiltrosOficinasManager === "function") {
                this.filtrosOficinasManager = new FiltrosOficinasManager(this);
            } else {
                this.filtrosOficinasManager = {
                    loadOficinas: function () {},
                    setupEventListeners: function () {},
                };
            }

            // ✅ 5. NUEVO: FiltrosAsesoresManager
            if (typeof FiltrosAsesoresManager === "function") {
                this.filtrosAsesoresManager = new FiltrosAsesoresManager(this);
            } else {
                this.filtrosAsesoresManager = {
                    loadAsesores: function () {},
                    setupEventListeners: function () {},
                    limpiarFiltros: function () {},
                };
            }

            // 6. ImportadorCSV
            if (typeof ImportadorCSV === "function") {
                this.importadorCSV = new ImportadorCSV(this);
            } else {
                this.importadorCSV = {
                    initMappings: function () {
                        this.camposOrdenBD = [];
                        this.csvToFieldMapping = {};
                    },
                    actionImport: function () {
                        Espo.Ui.error("❌ Módulo de importación no disponible");
                    },
                };
            }

            // 7. GraficosManager
            if (typeof GraficosManager === "function") {
                this.graficosManager = new GraficosManager(this);
            } else {
                this.graficosManager = {
                    registrarPluginsChart: function () {},
                    renderCharts: function () {},
                    destroyCharts: function () {},
                };
            }

            // Estado inicial
            this.hasData = false;
            this.isLoading = true;
            this.filtros = {
                cla: null,
                oficina: null,
                asesor: null, // ✅ NUEVO
                mostrarTodas: true,
            };

            try {
                this.importadorCSV.initMappings();
            } catch (error) {}

            this.cargarChartJS();
        },

        data: function () {
            return {
                esAdmin: this.esAdmin,
            };
        },

        cargarChartJS: function () {
            if (typeof Chart === "undefined") {
                var script = document.createElement("script");
                script.src =
                    "client/custom/modules/reportes-calidad-servicio/lib/chart.min.js";
                script.onload = function () {
                    this.graficosManager.registrarPluginsChart();
                    this.cargarPermisosYFiltros();
                }.bind(this);
                script.onerror = function () {
                    Espo.Ui.error("Error al cargar la librería de gráficos");
                    this.cargarPermisosYFiltros();
                }.bind(this);
                document.head.appendChild(script);
            } else {
                this.graficosManager.registrarPluginsChart();
                this.cargarPermisosYFiltros();
            }
        },

        cargarPermisosYFiltros: function () {
            this.permisosManager
                .cargarPermisosUsuario()
                .then(
                    function (permisos) {
                        this.filtrosCLAManager.cargarFiltros();
                    }.bind(this)
                )
                .catch(
                    function (error) {
                        this.estadisticasManager.loadStatistics();
                    }.bind(this)
                );
        },

        afterRender: function () {
            this.showLoadingState();
            this.setupEventListeners();

            $(window).on("hashchange", function () {
                console.log("🔍 DEBUG: Hash changed to:", window.location.hash);
            });

            // Verificar el hash actual
            console.log("🔍 DEBUG: Hash actual:", window.location.hash);

            // Intentar restaurar filtros guardados
            setTimeout(
                function () {
                    if (this.restaurarEstadoFiltros()) {
                        // Si se restauraron filtros, disparar cambios
                        this.$el.find("#cla-select").trigger("change");
                    }
                }.bind(this),
                100
            );
        },

        setupEventListeners: function () {
            const fileInput = this.$el.find("#csv-file-input")[0];
            const fileName = this.$el.find("#file-name")[0];

            if (fileInput && fileName) {
                fileInput.addEventListener("change", function () {
                    if (this.files && this.files[0]) {
                        fileName.textContent = this.files[0].name;
                        fileName.classList.add("has-file");
                    } else {
                        fileName.textContent =
                            "No se ha seleccionado ningún archivo";
                        fileName.classList.remove("has-file");
                    }
                });
            }

            this.$el
                .find('[data-action="import"]')
                .off("click")
                .on("click", () => {
                    this.importadorCSV.actionImport();
                });

            this.$el
                .find('[data-action="refresh"]')
                .off("click")
                .on("click", () => {
                    this.estadisticasManager.loadStatistics();
                });

            // ✅ NUEVO: Event listeners para botones de comparación
            this.$el
                .find("#btn-comparar-asesores")
                .off("click")
                .on("click", () => {
                    this.mostrarComparacionAsesores();
                });

            this.$el
                .find("#btn-comparar-oficinas")
                .off("click")
                .on("click", () => {
                    this.mostrarComparacionOficinas();
                });

            this.filtrosCLAManager.setupEventListeners();
            this.filtrosOficinasManager.setupEventListeners();
            this.filtrosAsesoresManager.setupEventListeners();
        },

        // ✅ FUNCIÓN AUXILIAR para crear gráfico directamente
        crearGraficoDirectamente: function (config, windowId) {
            // Esta función es un fallback si el graficosManager no está disponible
            var ctx = document.getElementById(
                "chart-comparacion-" + config.tipo
            );
            if (!ctx || typeof Chart === "undefined") return;

            // Ordenar datos
            var datosOrdenados = config.data.sort(function (a, b) {
                return b.porcentaje - a.porcentaje;
            });

            var labels = datosOrdenados.map(function (item) {
                return item.nombre || item.id || "Sin nombre";
            });

            var data = datosOrdenados.map(function (item) {
                return item.porcentaje || 0;
            });

            // Colores basados en porcentaje
            var backgroundColors = data.map(function (porcentaje) {
                if (porcentaje >= 80) return "#9D8B64";
                if (porcentaje >= 70) return "#A89968";
                if (porcentaje >= 60) return "#B8A279";
                if (porcentaje >= 50) return "#999999";
                return "#666666";
            });

            try {
                new Chart(ctx, {
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
                        maintainAspectRatio: true,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: function (context) {
                                        var item =
                                            datosOrdenados[context.dataIndex];
                                        var encuestas =
                                            item.totalEncuestas || 0;
                                        var promedio =
                                            config.tipo === "asesores"
                                                ? (
                                                      item.promedioGeneral || 0
                                                  ).toFixed(2)
                                                : (
                                                      item.satisfaccionPromedio ||
                                                      0
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
                                grid: { color: "#E6E6E6" },
                                ticks: {
                                    callback: function (value) {
                                        return value + "%";
                                    },
                                    font: { size: 12 },
                                },
                            },
                            y: {
                                grid: { display: false },
                                ticks: {
                                    font: { size: 11 },
                                },
                            },
                        },
                    },
                });
            } catch (error) {
                console.error("Error creando gráfico directamente:", error);
            }
        },

        configurarEventosCerrar: function (windowId) {
            var self = this;

            // Función para cerrar la ventana
            var cerrarVentana = function () {
                var ventana = document.getElementById(windowId);
                if (ventana) {
                    ventana.remove();

                    // También limpiar cualquier gráfico de comparación que haya quedado
                    if (window.comparacionChart) {
                        try {
                            window.comparacionChart.destroy();
                            window.comparacionChart = null;
                        } catch (e) {}
                    }
                }
            };

            // Configurar eventos para ambos botones
            setTimeout(function () {
                var btn1 = document.getElementById("cerrar-ventana-btn");
                var btn2 = document.getElementById("cerrar-ventana-btn2");

                if (btn1) {
                    btn1.onclick = cerrarVentana;
                }

                if (btn2) {
                    btn2.onclick = cerrarVentana;
                }

                // También permitir cerrar con la tecla ESC
                document.addEventListener("keydown", function (event) {
                    if (event.key === "Escape") {
                        cerrarVentana();
                    }
                });
            }, 100);
        },

        mostrarComparacionAsesores: function () {
            var oficinaId = this.filtrosCLAManager.filtros.oficina;
            var oficinaNombre = this.$el
                .find("#oficina-select option:selected")
                .text();
            var claId = this.filtrosCLAManager.filtros.cla;

            if (!oficinaId) {
                Espo.Ui.error("Por favor seleccione una oficina primero");
                return;
            }

            // Navegar a nueva URL
            this.getRouter().navigate(
                "#CCustomerSurvey/comparacion-asesores?oficina=" +
                    oficinaId +
                    "&cla=" +
                    claId +
                    "&nombre=" +
                    encodeURIComponent(oficinaNombre),
                { trigger: true }
            );
        },

        /* mostrarComparacionOficinas: function () {
            console.log("🔍 DEBUG: Iniciando mostrarComparacionOficinas");

            var claId = this.filtrosCLAManager.filtros.cla;
            var claNombre = this.$el.find("#cla-select option:selected").text();

            if (!claId) {
                Espo.Ui.error("Por favor seleccione un CLA primero");
                return;
            }

            // Guardar estado
            this.guardarEstadoFiltros();

            // ✅ SIMPLIFICADO: Solo navegar
            let url = `#reportes-calidad-servicio/comparacion-oficinas?cla=${claId}&nombre=${encodeURIComponent(
                claNombre
            )}`;

            this.getRouter().navigate(url, { trigger: true });
        }, */

        mostrarComparacionOficinas: function () {
            console.log("🔍 DEBUG: Iniciando mostrarComparacionOficinas");

            var claId = this.filtrosCLAManager.filtros.cla;
            var claNombre = this.$el.find("#cla-select option:selected").text();

            if (!claId) {
                Espo.Ui.error("Por favor seleccione un CLA primero");
                return;
            }

            // USAR EXACTAMENTE EL MISMO PATRÓN QUE COMPETENCIAS
            const params = `cla=${claId}&nombre=${encodeURIComponent(
                claNombre
            )}`;

            console.log(
                "🔗 Navegando como Competencias:",
                `#reportes-calidad-servicio/comparacionOficinas?${params}`
            );

            // Método 1: Igual que Competencias
            this.getRouter().navigate(
                `#reportes-calidad-servicio/comparacionOficinas?${params}`,
                { trigger: true }
            );

            // Método 2 alternativo: Probar con CCustomerSurvey como tienes en otras rutas
            // this.getRouter().navigate(`#CCustomerSurvey/comparacion-oficinas?${params}`, {trigger: true});
        },

        // ✅ NUEVO: Guardar estado de filtros para restaurar al volver
        guardarEstadoFiltros: function () {
            var filtros = this.filtrosCLAManager.getFiltros();

            try {
                // Guardar en localStorage para persistir entre sesiones
                localStorage.setItem(
                    "calidadServicio_filtros",
                    JSON.stringify({
                        cla: filtros.cla,
                        oficina: filtros.oficina,
                        asesor: filtros.asesor,
                    })
                );
            } catch (e) {
                console.warn("No se pudo guardar el estado de los filtros:", e);
            }
        },

        // ✅ NUEVO: Restaurar estado de filtros al cargar la página
        restaurarEstadoFiltros: function () {
            try {
                var filtrosGuardados = localStorage.getItem(
                    "calidadServicio_filtros"
                );

                if (filtrosGuardados) {
                    var filtros = JSON.parse(filtrosGuardados);

                    // Restaurar en los selects si existen
                    if (filtros.cla && this.$el.find("#cla-select").length) {
                        this.$el.find("#cla-select").val(filtros.cla);
                    }

                    // Los cambios en los selects dispararán las actualizaciones automáticamente
                    return true;
                }
            } catch (e) {
                console.warn(
                    "No se pudo restaurar el estado de los filtros:",
                    e
                );
            }

            return false;
        },

        restaurarFiltrosDesdeURL: function () {
            var urlParams = new URLSearchParams(
                window.location.hash.split("?")[1] || ""
            );
            var claId = urlParams.get("cla");
            var oficinaId = urlParams.get("oficina");

            if (claId || oficinaId) {
                setTimeout(
                    function () {
                        if (claId) {
                            this.$el
                                .find("#cla-select")
                                .val(claId)
                                .trigger("change");

                            // Si hay oficina, esperar a que cargue las oficinas
                            if (oficinaId) {
                                setTimeout(
                                    function () {
                                        this.$el
                                            .find("#oficina-select")
                                            .val(oficinaId)
                                            .trigger("change");
                                    }.bind(this),
                                    800
                                );
                            }
                        }
                    }.bind(this),
                    500
                );
            } else {
                // Si no hay parámetros en la URL, intentar restaurar de localStorage
                this.restaurarEstadoFiltros();
            }
        },

        initMappings: function () {
            this.importadorCSV.initMappings();
        },

        showLoadingState: function () {
            this.estadisticasManager.showLoadingState();
        },

        updateUI: function () {
            this.estadisticasManager.updateUI();
        },

        aplicarRestriccionesUI: function () {
            this.permisosManager.aplicarRestriccionesUI();
        },
    });
});
