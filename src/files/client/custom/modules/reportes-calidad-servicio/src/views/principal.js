define("reportes-calidad-servicio:views/principal", [
    "view",
    "reportes-calidad-servicio:views/modules/permisos",
    "reportes-calidad-servicio:views/modules/estadisticas",
    "reportes-calidad-servicio:views/modules/filtros-cla",
    "reportes-calidad-servicio:views/modules/filtros-oficinas",
    "reportes-calidad-servicio:views/modules/filtros-asesores",
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
            return true;
        },

        template: "reportes-calidad-servicio:principal",

        setup: function () {
            var user = this.getUser();

            this.userType = user.get("type");
            this.esAdmin = this.userType === "admin";

            if (typeof PermisosManager === "function") {
                this.permisosManager = new PermisosManager(this);
            } else {
                this.permisosManager = {
                    cargarPermisosUsuario: function () {
                        if (this.view && this.view.esAdmin) {
                            return Promise.resolve({
                                esAdministrativo: true,
                                puedeImportar: true,
                            });
                        }
                        return Promise.resolve({
                            esAdministrativo: false,
                            puedeImportar: false,
                        });
                    }.bind(this),
                    getPermisos: function () {
                        return {
                            puedeImportar: this.view.esAdmin,
                            permisosListo: true,
                        };
                    },
                    aplicarRestriccionesUI: function () {},
                };
            }

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

            if (typeof FiltrosOficinasManager === "function") {
                this.filtrosOficinasManager = new FiltrosOficinasManager(this);
            } else {
                this.filtrosOficinasManager = {
                    loadOficinas: function () {},
                    setupEventListeners: function () {},
                };
            }

            if (typeof FiltrosAsesoresManager === "function") {
                this.filtrosAsesoresManager = new FiltrosAsesoresManager(this);
            } else {
                this.filtrosAsesoresManager = {
                    loadAsesores: function () {},
                    setupEventListeners: function () {},
                    limpiarFiltros: function () {},
                };
            }

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

            if (typeof GraficosManager === "function") {
                this.graficosManager = new GraficosManager(this);
            } else {
                this.graficosManager = {
                    registrarPluginsChart: function () {},
                    renderCharts: function () {},
                    destroyCharts: function () {},
                };
            }

            this.hasData = false;
            this.isLoading = true;
            this.filtros = {
                cla: null,
                oficina: null,
                asesor: null,
                mostrarTodas: true,
            };

            this.filtrosGuardados = null;

            try {
                this.importadorCSV.initMappings();
            } catch (error) {}

            this.cargarChartJS();
        },

        data: function () {
            return {
                esAdmin: this.esAdmin,
                puedeImportar: this.esAdmin,
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
            if (
                this.permisosManager &&
                typeof this.permisosManager.cargarPermisosUsuario === "function"
            ) {
                this.permisosManager
                    .cargarPermisosUsuario()
                    .then(
                        function (permisos) {
                            permisos.puedeImportar = this.esAdmin;

                            this.filtrosCLAManager.cargarFiltros();
                        }.bind(this)
                    )
                    .catch(
                        function (error) {
                            this.estadisticasManager.loadStatistics();
                        }.bind(this)
                    );
            } else {
                this.filtrosCLAManager.cargarFiltros();
            }
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

            this.filtrosCLAManager.setupEventListeners();
            this.filtrosOficinasManager.setupEventListeners();
            this.filtrosAsesoresManager.setupEventListeners();
            this.setupCompararOficinasListener();
        },

        afterRender: function () {
            this.showLoadingState();
            this.setupEventListeners();

            this.setupCompararOficinasListener();
            this.setupCompararAsesoresListener();

            if (this.filtrosGuardados) {
                setTimeout(() => {
                    this.restaurarFiltros();
                }, 500);
            }
        },

        restaurarFiltros: function () {
            if (!this.filtrosGuardados) return;

            const selectCLA = this.$el.find("#cla-select");
            const selectOficina = this.$el.find("#oficina-select");
            const selectAsesor = this.$el.find("#asesor-select");

            if (this.filtrosGuardados.cla) {
                selectCLA.val(this.filtrosGuardados.cla).trigger("change");

                setTimeout(() => {
                    if (this.filtrosGuardados.oficina) {
                        selectOficina
                            .val(this.filtrosGuardados.oficina)
                            .trigger("change");

                        setTimeout(() => {
                            if (this.filtrosGuardados.asesor) {
                                selectAsesor
                                    .val(this.filtrosGuardados.asesor)
                                    .trigger("change");
                            }
                        }, 400);
                    }
                }, 400);
            }
        },

        setupCompararOficinasListener: function () {
            const self = this;

            const btnComparar = this.$el.find("#btn-comparar-oficinas");
            const selectCLA = this.$el.find("#cla-select");

            if (btnComparar.length && selectCLA.length) {
                btnComparar.off("mouseenter mouseleave").on({
                    mouseenter: function () {
                        $(this).css({
                            transform: "translateY(-2px)",
                            boxShadow: "0 4px 12px rgba(102, 102, 102, 0.4)",
                        });
                    },
                    mouseleave: function () {
                        $(this).css({
                            transform: "translateY(0)",
                            boxShadow: "0 2px 8px rgba(102, 102, 102, 0.3)",
                        });
                    },
                });

                btnComparar.off("click").on("click", function () {
                    const claId = selectCLA.val();
                    if (!claId) {
                        Espo.Ui.warning("Por favor, selecciona un CLA primero");
                        return;
                    }
                    self.guardarFiltrosActuales();
                    self.getRouter().navigate("#Principal/oficinas/" + claId, {
                        trigger: true,
                    });
                });
            }
        },

        setupCompararAsesoresListener: function () {
            const self = this;

            const btnComparar = this.$el.find("#btn-comparar-asesores");
            const selectOficina = this.$el.find("#oficina-select");
            const selectCLA = this.$el.find("#cla-select");

            if (
                btnComparar.length &&
                selectOficina.length &&
                selectCLA.length
            ) {
                // Agregar event listeners para hover
                btnComparar.off("mouseenter mouseleave").on({
                    mouseenter: function () {
                        $(this).css({
                            transform: "translateY(-2px)",
                            boxShadow: "0 4px 12px rgba(184, 162, 121, 0.4)",
                        });
                    },
                    mouseleave: function () {
                        $(this).css({
                            transform: "translateY(0)",
                            boxShadow: "0 2px 8px rgba(184, 162, 121, 0.3)",
                        });
                    },
                });

                btnComparar.off("click").on("click", function () {
                    const oficinaId = selectOficina.val();
                    if (!oficinaId) {
                        Espo.Ui.warning("Por favor, selecciona una oficina");
                        return;
                    }
                    self.guardarFiltrosActuales();
                    self.getRouter().navigate(
                        "#Principal/asesores/" + oficinaId,
                        {
                            trigger: true,
                        }
                    );
                });
            }
        },

        guardarFiltrosActuales: function () {
            const selectCLA = this.$el.find("#cla-select");
            const selectOficina = this.$el.find("#oficina-select");
            const selectAsesor = this.$el.find("#asesor-select");

            this.filtrosGuardados = {
                cla: selectCLA.val(),
                oficina: selectOficina.val(),
                asesor: selectAsesor.val(),
                timestamp: Date.now(),
            };

            sessionStorage.setItem(
                "filtrosPrincipal",
                JSON.stringify(this.filtrosGuardados)
            );
        },

        cargarFiltrosGuardados: function () {
            try {
                const filtrosGuardados =
                    sessionStorage.getItem("filtrosPrincipal");
                if (filtrosGuardados) {
                    this.filtrosGuardados = JSON.parse(filtrosGuardados);
                    return true;
                }
            } catch (error) {}
            return false;
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
