define("reportes-calidad-servicio:views/modules/filtros-cla", [], function () {
    var FiltrosCLAManager = function (view) {
        this.view = view;
        this.filtros = {
            cla: null,
            oficina: null,
            asesor: null, // ✅ AGREGAR
            mostrarTodas: true,
        };
        this.allTeams = {
            clas: [],
            oficinas: [],
        };
    };

    FiltrosCLAManager.prototype.cargarFiltros = function () {
        if (!this.view.permisosManager.permisos.permisosListo) {
            setTimeout(
                function () {
                    this.cargarFiltros();
                }.bind(this),
                100
            );
            return;
        }

        this.view.getCollectionFactory().create(
            "Team",
            function (collection) {
                collection.maxSize = 500;
                collection.fetch().then(
                    function () {
                        this.procesarTeams(collection);
                        this.populateCLASelect();
                        this.view.estadisticasManager.loadStatistics();
                    }.bind(this)
                );
            }.bind(this)
        );
    };

    FiltrosCLAManager.prototype.procesarTeams = function (collection) {
        this.allTeams.clas = [];
        this.allTeams.oficinas = [];

        collection.forEach(
            function (model) {
                var id = model.get("id");
                var name = model.get("name");

                if (id && id.startsWith("CLA")) {
                    this.allTeams.clas.push({ id: id, name: name });
                } else {
                    this.allTeams.oficinas.push({ id: id, name: name });
                }
            }.bind(this)
        );
    };

    FiltrosCLAManager.prototype.populateCLASelect = function () {
        var claSelect = this.view.$el.find("#cla-select");
        if (!claSelect.length) {
            return;
        }

        claSelect.empty();

        var permisos = this.view.permisosManager.getPermisos();
        var clasDisponibles = this.allTeams.clas;

        if (!permisos.esAdministrativo && !permisos.esCasaNacional) {
            if (permisos.claUsuario) {
                clasDisponibles = clasDisponibles.filter(function (cla) {
                    return cla.id === permisos.claUsuario;
                });
            } else {
                clasDisponibles = [];
            }
        }

        var cla0 = clasDisponibles.find(function (cla) {
            return cla.id === "CLA0";
        });

        if (cla0) {
            claSelect.append(
                $("<option></option>")
                    .val("CLA0") // ✅ CAMBIO: Usar "CLA0" en lugar de ""
                    .text("Territorio Nacional")
                    .prop("selected", true)
            );

            clasDisponibles = clasDisponibles.filter(function (cla) {
                return cla.id !== "CLA0";
            });
        } else {
            claSelect.append(
                $("<option></option>")
                    .val("") // Sin CLA0, usar vacío
                    .text("Territorio Nacional")
                    .prop("selected", true)
            );
        }

        clasDisponibles.sort(function (a, b) {
            return a.name.localeCompare(b.name);
        });

        clasDisponibles.forEach(function (cla) {
            claSelect.append($("<option></option>").val(cla.id).text(cla.name));
        });

        claSelect.prop("disabled", false);
    };

    FiltrosCLAManager.prototype.setupEventListeners = function () {
        var claSelect = this.view.$el.find("#cla-select");

        if (claSelect.length) {
            claSelect.off("change");

            claSelect.on(
                "change",
                function (e) {
                    var claId = $(e.currentTarget).val();

                    // ✅ Actualizar filtros
                    this.filtros.cla = claId || null;
                    this.filtros.oficina = null;
                    this.filtros.asesor = null;
                    this.filtros.mostrarTodas = !claId || claId === "CLA0";

                    // ✅ Obtener botones
                    var btnComparacionOficinas = this.view.$el.find(
                        "#btn-comparar-oficinas"
                    );
                    var btnComparacionAsesores = this.view.$el.find(
                        "#btn-comparar-asesores"
                    );

                    var oficinaSelect = this.view.$el.find("#oficina-select");
                    var asesorSelect = this.view.$el.find("#asesor-select");

                    // Limpiar selects dependientes
                    oficinaSelect.val("");
                    asesorSelect.val("");

                    // ✅ Lógica de visibilidad de botones
                    if (claId && claId !== "CLA0") {
                        // CLA específico seleccionado
                        btnComparacionOficinas
                            .show()
                            .css("display", "inline-flex");

                        if (
                            this.view.filtrosOficinasManager &&
                            this.view.filtrosOficinasManager.loadOficinas
                        ) {
                            this.view.filtrosOficinasManager.loadOficinas(
                                claId
                            );
                        }
                    } else {
                        // Territorio Nacional o vacío
                        btnComparacionOficinas.hide();

                        oficinaSelect.empty();
                        oficinaSelect.append(
                            '<option value="">Seleccione un CLA primero</option>'
                        );
                        oficinaSelect.prop("disabled", true);
                    }

                    // ✅ Siempre ocultar botón de asesores al cambiar CLA
                    btnComparacionAsesores.hide();

                    // Limpiar select de asesores
                    if (this.view.filtrosAsesoresManager) {
                        this.view.filtrosAsesoresManager.limpiarFiltros();
                    }

                    // Recargar estadísticas
                    this.view.estadisticasManager.loadStatistics();
                }.bind(this)
            );
        }

        // ✅ NUEVO: Configurar evento del botón de comparar oficinas
        this.setupComparacionOficinas();
    };

    // ✅ NUEVO MÉTODO: Configurar botón de comparación de oficinas
    FiltrosCLAManager.prototype.setupComparacionOficinas = function () {
        var self = this;
        var btnComparar = this.view.$el.find("#btn-comparar-oficinas");
        var selectCLA = this.view.$el.find("#cla-select");

        btnComparar.off("click").on("click", function () {
            var claId = selectCLA.val();
            var claNombre = selectCLA.find("option:selected").text();

            // ✅ Validar que no sea Territorio Nacional
            if (!claId || claId === "CLA0" || claId === "") {
                Espo.Ui.warning(
                    "Por favor, selecciona un CLA específico (no Territorio Nacional)"
                );
                return;
            }

            console.log("🏢 Navegando a comparación de oficinas - CLA:", claId);

            // ✅ Guardar estado actual de filtros
            self.view.filtrosGuardados = {
                cla: claId,
                oficina: self.view.$el.find("#oficina-select").val(),
                asesor: self.view.$el.find("#asesor-select").val(),
            };

            // ✅ Navegar a la vista de comparación
            self.view
                .getRouter()
                .navigate("#Oficinas/" + claId, { trigger: true });
        });
    };

    FiltrosCLAManager.prototype.getFiltros = function () {
        return this.filtros;
    };

    return FiltrosCLAManager;
});
