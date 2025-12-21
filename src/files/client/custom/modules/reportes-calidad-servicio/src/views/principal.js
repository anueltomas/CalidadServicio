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
            var user = this.getUser();
            this.esAdmin = user.isAdmin();

            // 1. PermisosManager
            if (typeof PermisosManager === "function") {
                this.permisosManager = new PermisosManager(this);
                console.log("✅ DEBUG - PermisosManager inicializado");
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

            this.filtrosGuardados = null; // Para restaurar filtros al volver

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

        setupEventListeners: function () {
            const fileInput = this.$el.find("#csv-file-input")[0];
            const fileName = this.$el.find("#file-name")[0];

            // Resto del código existente...
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

            // ✅ NUEVO: Restaurar filtros si existen
            if (this.filtrosGuardados) {
                setTimeout(() => {
                    this.restaurarFiltros();
                }, 500); // Esperar a que se carguen los selects
            }
        },

        // ✅ NUEVO MÉTODO: Restaurar filtros guardados
        restaurarFiltros: function () {
            if (!this.filtrosGuardados) return;

            console.log("🔄 Restaurando filtros:", this.filtrosGuardados);

            const selectCLA = this.$el.find("#cla-select");
            const selectOficina = this.$el.find("#oficina-select");
            const selectAsesor = this.$el.find("#asesor-select");

            // Restaurar CLA
            if (this.filtrosGuardados.cla) {
                selectCLA.val(this.filtrosGuardados.cla).trigger("change");

                // Esperar a que se carguen las oficinas
                setTimeout(() => {
                    if (this.filtrosGuardados.oficina) {
                        selectOficina
                            .val(this.filtrosGuardados.oficina)
                            .trigger("change");

                        // Esperar a que se carguen los asesores
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

            // Limpiar filtros guardados después de restaurar
            // this.filtrosGuardados = null; // ✅ OPCIONAL: Descomentar si solo quieres restaurar una vez
        },

        setupCompararOficinasListener: function () {
            const self = this;

            const btnComparar = this.$el.find("#btn-comparar-oficinas");
            const selectCLA = this.$el.find("#cla-select");

            if (btnComparar.length && selectCLA.length) {
                btnComparar.off("click").on("click", function () {
                    const claId = selectCLA.val();

                    if (!claId) {
                        Espo.Ui.warning("Por favor, selecciona un CLA primero");
                        return;
                    }

                    // ✅ GUARDAR FILTROS ACTUALES ANTES DE NAVEGAR
                    self.guardarFiltrosActuales();

                    // Navegar
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
                btnComparar.off("click").on("click", function () {
                    const oficinaId = selectOficina.val();
                    const claId = selectCLA.val();

                    // Validaciones
                    if (!oficinaId) {
                        Espo.Ui.warning("Por favor, selecciona una oficina");
                        return;
                    }

                    // ✅ GUARDAR FILTROS ACTUALES ANTES DE NAVEGAR
                    self.guardarFiltrosActuales();

                    // Navegar
                    self.getRouter().navigate(
                        "#Principal/asesores/" + oficinaId,
                        { trigger: true }
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

            console.log("💾 Filtros guardados:", this.filtrosGuardados);

            // Opcional: Guardar en sessionStorage para persistencia
            sessionStorage.setItem(
                "filtrosPrincipal",
                JSON.stringify(this.filtrosGuardados)
            );
        },

        // ✅ AGREGAR: Método para cargar filtros desde sessionStorage
        cargarFiltrosGuardados: function () {
            try {
                const filtrosGuardados =
                    sessionStorage.getItem("filtrosPrincipal");
                if (filtrosGuardados) {
                    this.filtrosGuardados = JSON.parse(filtrosGuardados);
                    console.log("📂 Filtros cargados:", this.filtrosGuardados);
                    return true;
                }
            } catch (error) {
                console.error("Error cargando filtros:", error);
            }
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
