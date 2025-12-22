define("reportes-calidad-servicio:views/modules/filtros-cla", [], function () {
    var FiltrosCLAManager = function (view) {
        this.view = view;
        this.filtros = {
            cla: null,
            oficina: null,
            asesor: null,
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
                        this.cargarCLAInicial();
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

        claSelect.append(
            $("<option></option>").val("CLA0").text("Territorio Nacional")
        );

        var clasDisponibles = [];

        if (
            permisos.esAdministrativo ||
            permisos.esCasaNacional ||
            permisos.esGerente ||
            permisos.esDirector ||
            permisos.esCoordinador ||
            permisos.esAfiliado
        ) {
            clasDisponibles = this.allTeams.clas.filter(function (cla) {
                return cla.id !== "CLA0";
            });
        } else if (permisos.esAsesorRegular) {
            if (permisos.claUsuario) {
                clasDisponibles = this.allTeams.clas.filter(function (cla) {
                    return cla.id === permisos.claUsuario;
                });
            }
        }

        clasDisponibles.sort(function (a, b) {
            return a.name.localeCompare(b.name);
        });

        clasDisponibles.forEach(function (cla) {
            claSelect.append($("<option></option>").val(cla.id).text(cla.name));
        });

        claSelect.val("CLA0");
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

                    this.filtros.cla = claId || null;
                    this.filtros.oficina = null;
                    this.filtros.asesor = null;

                    this.filtros.mostrarTodas = !claId || claId === "CLA0";

                    var btnComparacionOficinas = this.view.$el.find(
                        "#btn-comparar-oficinas"
                    );
                    var btnComparacionAsesores = this.view.$el.find(
                        "#btn-comparar-asesores"
                    );
                    var oficinaSelect = this.view.$el.find("#oficina-select");
                    var asesorSelect = this.view.$el.find("#asesor-select");

                    oficinaSelect.val("");
                    asesorSelect.val("");

                    var permisos = this.view.permisosManager.getPermisos();

                    if (claId && claId !== "CLA0") {
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
                        btnComparacionOficinas.hide();

                        oficinaSelect.empty();
                        oficinaSelect.append(
                            '<option value="">Seleccione un CLA primero</option>'
                        );
                        oficinaSelect.prop("disabled", true);
                    }

                    btnComparacionAsesores.hide();

                    if (this.view.filtrosAsesoresManager) {
                        this.view.filtrosAsesoresManager.limpiarFiltros();
                    }

                    this.view.estadisticasManager.loadStatistics();
                }.bind(this)
            );
        }

        this.setupComparacionOficinas();
    };

    FiltrosCLAManager.prototype.setupComparacionOficinas = function () {
        var self = this;
        var btnComparar = this.view.$el.find("#btn-comparar-oficinas");
        var selectCLA = this.view.$el.find("#cla-select");

        btnComparar.off("click").on("click", function () {
            var claId = selectCLA.val();
            var claNombre = selectCLA.find("option:selected").text();

            if (!claId || claId === "CLA0" || claId === "") {
                Espo.Ui.warning(
                    "Por favor, selecciona un CLA específico (no Territorio Nacional)"
                );
                return;
            }

            self.view.filtrosGuardados = {
                cla: claId,
                oficina: self.view.$el.find("#oficina-select").val(),
                asesor: self.view.$el.find("#asesor-select").val(),
            };

            self.view
                .getRouter()
                .navigate("#Oficinas/" + claId, { trigger: true });
        });
    };

    FiltrosCLAManager.prototype.getFiltros = function () {
        return this.filtros;
    };

    FiltrosCLAManager.prototype.cargarCLAInicial = function () {
        var permisos = this.view.permisosManager.getPermisos();

        if (!permisos.permisosListo) {
            setTimeout(
                function () {
                    this.cargarCLAInicial();
                }.bind(this),
                200
            );
            return;
        }

        var claSelect = this.view.$el.find("#cla-select");

        if (!claSelect.length) {
            return;
        }

        if (claSelect.find('option[value="CLA0"]').length > 0) {
            claSelect.val("CLA0");

            setTimeout(function () {
                claSelect.trigger("change");
            }, 500);
        }
    };

    return FiltrosCLAManager;
});
