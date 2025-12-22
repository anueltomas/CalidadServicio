define("reportes-calidad-servicio:views/modules/filtros-oficinas", [], function () {
    var FiltrosOficinasManager = function (view) {
        this.view = view;
    };

    FiltrosOficinasManager.prototype.loadOficinas = function (claId) {
        var oficinaSelect = this.view.$el.find("#oficina-select");

        if (!oficinaSelect.length) {
            return;
        }

        oficinaSelect.html('<option value="">Cargando oficinas...</option>');
        oficinaSelect.prop("disabled", true);

        var permisos = this.view.permisosManager.getPermisos();

        if (permisos.esAsesorRegular) {
            if (permisos.oficinaUsuario) {
                this.cargarOficinaEspecifica(
                    permisos.oficinaUsuario,
                    oficinaSelect
                );
            } else {
                oficinaSelect.html(
                    '<option value="">No tienes oficina asignada</option>'
                );
                oficinaSelect.prop("disabled", true);
            }
            return;
        }

        if (!permisos.esAdministrativo && !permisos.esCasaNacional) {
            if (permisos.oficinaUsuario) {
                this.cargarOficinaEspecifica(
                    permisos.oficinaUsuario,
                    oficinaSelect
                );
                return;
            }
        }

        this.cargarOficinasPorCLA(claId);
    };

    FiltrosOficinasManager.prototype.cargarOficinasPorCLA = function (claId) {
        var oficinaSelect = this.view.$el.find("#oficina-select");

        if (!oficinaSelect.length) {
            return;
        }

        oficinaSelect.html('<option value="">Cargando oficinas...</option>');
        oficinaSelect.prop("disabled", true);

        var permisos = this.view.permisosManager.getPermisos();

        if (permisos.esAsesorRegular) {
            if (permisos.oficinaUsuario) {
                this.cargarOficinaEspecifica(
                    permisos.oficinaUsuario,
                    oficinaSelect
                );
            } else {
                oficinaSelect.html(
                    '<option value="">No tienes oficina asignada</option>'
                );
                oficinaSelect.prop("disabled", true);
            }
            return;
        }

        Espo.Ajax.getRequest("CCustomerSurvey/action/getOficinasByCLA", {
            claId: claId,
        })
            .then(
                function (response) {
                    if (response && response.success && response.data) {
                        var oficinas = response.data;

                        oficinas = oficinas.filter(function (oficina) {
                            return (
                                oficina.id.toLowerCase() !== "venezuela" &&
                                (oficina.name || "").toLowerCase() !==
                                    "venezuela"
                            );
                        });

                        oficinas.sort(function (a, b) {
                            return (a.name || "").localeCompare(b.name || "");
                        });

                        oficinaSelect.empty();
                        oficinaSelect.append(
                            '<option value="">Todas las oficinas</option>'
                        );

                        oficinas.forEach(function (oficina) {
                            oficinaSelect.append(
                                '<option value="' +
                                    oficina.id +
                                    '">' +
                                    (oficina.name || oficina.id) +
                                    "</option>"
                            );
                        });

                        oficinaSelect.prop("disabled", false);

                        if (
                            this.view.filtrosGuardados &&
                            this.view.filtrosGuardados.oficina
                        ) {
                            setTimeout(
                                function () {
                                    oficinaSelect
                                        .val(this.view.filtrosGuardados.oficina)
                                        .trigger("change");
                                }.bind(this),
                                100
                            );
                        }
                    } else {
                        oficinaSelect.html(
                            '<option value="">No hay oficinas disponibles</option>'
                        );
                        oficinaSelect.prop("disabled", false);
                    }
                }.bind(this)
            )
            .catch(function (error) {
                oficinaSelect.html('<option value="">Error al cargar</option>');
                oficinaSelect.prop("disabled", false);
            });
    };

    FiltrosOficinasManager.prototype.fetchAllTeams = function () {
        return new Promise(
            function (resolve, reject) {
                var maxSize = 200;
                var allTeams = [];

                var fetchPage = function (offset) {
                    this.view.getCollectionFactory().create(
                        "Team",
                        function (collection) {
                            collection.maxSize = maxSize;
                            collection.offset = offset;

                            collection
                                .fetch()
                                .then(
                                    function () {
                                        var models = collection.models || [];
                                        allTeams = allTeams.concat(
                                            models
                                                .map(function (m) {
                                                    return {
                                                        id: m.id,
                                                        name: m.get("name"),
                                                    };
                                                })
                                                .filter(function (team) {
                                                    return (
                                                        team.id.toLowerCase() !==
                                                            "venezuela" &&
                                                        (
                                                            team.name || ""
                                                        ).toLowerCase() !==
                                                            "venezuela"
                                                    );
                                                })
                                        );

                                        if (
                                            models.length === maxSize &&
                                            allTeams.length < collection.total
                                        ) {
                                            fetchPage(offset + maxSize);
                                        } else {
                                            resolve(allTeams);
                                        }
                                    }.bind(this)
                                )
                                .catch(reject);
                        }.bind(this)
                    );
                }.bind(this);

                fetchPage(0);
            }.bind(this)
        );
    };

    FiltrosOficinasManager.prototype.fetchUsuariosPorCLA = function (claId) {
        return new Promise(
            function (resolve, reject) {
                Espo.Ajax.getRequest(
                    "CCustomerSurvey/action/getOficinasByCLA",
                    {
                        claId: claId,
                    }
                )
                    .then(
                        function (response) {
                            if (response && response.success) {
                                var oficinas = response.data || [];

                                oficinas = oficinas.filter(function (oficina) {
                                    return (
                                        oficina.id.toLowerCase() !==
                                            "venezuela" &&
                                        (oficina.name || "").toLowerCase() !==
                                            "venezuela"
                                    );
                                });

                                resolve(oficinas);
                            } else {
                                resolve([]);
                            }
                        }.bind(this)
                    )
                    .catch(function (error) {
                        resolve([]);
                    });
            }.bind(this)
        );
    };

    FiltrosOficinasManager.prototype.cargarOficinaEspecifica = function (
        oficinaId,
        oficinaSelect
    ) {
        this.view.getModelFactory().create(
            "Team",
            function (teamModel) {
                teamModel.id = oficinaId;
                teamModel
                    .fetch()
                    .then(
                        function () {
                            var oficina = {
                                id: teamModel.id,
                                name: teamModel.get("name") || oficinaId,
                            };

                            oficinaSelect.empty();
                            oficinaSelect.append(
                                '<option value="' +
                                    oficina.id +
                                    '">' +
                                    oficina.name +
                                    "</option>"
                            );
                            oficinaSelect.val(oficina.id);
                            oficinaSelect.prop("disabled", false);

                            if (this.view.filtrosCLAManager) {
                                this.view.filtrosCLAManager.filtros.oficina =
                                    oficina.id;
                                this.view.filtrosCLAManager.filtros.mostrarTodas = false;
                            }

                            if (this.view.filtrosAsesoresManager) {
                                this.view.filtrosAsesoresManager.loadAsesores(
                                    oficina.id
                                );
                            }
                        }.bind(this)
                    )
                    .catch(
                        function (error) {
                            oficinaSelect.html(
                                '<option value="">Error al cargar oficina</option>'
                            );
                            oficinaSelect.prop("disabled", true);
                        }.bind(this)
                    );
            }.bind(this)
        );
    };

    FiltrosOficinasManager.prototype.poblarSelectOficinas = function (
        oficinas,
        oficinaSelect
    ) {
        oficinaSelect.empty();
        oficinaSelect.append('<option value="">Todas las oficinas</option>');

        if (!oficinas || oficinas.length === 0) {
            oficinaSelect.append(
                '<option value="" disabled>No hay oficinas para este CLA</option>'
            );
        } else {
            oficinas.sort(function (a, b) {
                return (a.name || "").localeCompare(b.name || "");
            });

            oficinas.forEach(function (oficina) {
                var displayName = oficina.name || oficina.id;
                oficinaSelect.append(
                    '<option value="' +
                        oficina.id +
                        '">' +
                        displayName +
                        "</option>"
                );
            });
        }

        oficinaSelect.prop("disabled", false);
    };

    FiltrosOficinasManager.prototype.setupEventListeners = function () {
        var selectOficina = this.view.$el.find("#oficina-select");

        if (selectOficina.length) {
            selectOficina.off("change").on(
                "change",
                function (e) {
                    var oficinaId = $(e.currentTarget).val();
                    var selectCLA = this.view.$el.find("#cla-select");
                    var claSeleccionado = selectCLA.val();

                    var btnComparacionAsesores = this.view.$el.find(
                        "#btn-comparar-asesores"
                    );
                    var btnComparacionOficinas = this.view.$el.find(
                        "#btn-comparar-oficinas"
                    );

                    if (
                        oficinaId &&
                        claSeleccionado !== "CLA0" &&
                        claSeleccionado !== ""
                    ) {
                        btnComparacionAsesores
                            .show()
                            .css("display", "inline-flex");
                        btnComparacionOficinas
                            .show()
                            .css("display", "inline-flex");
                    } else {
                        btnComparacionAsesores.hide();
                    }

                    if (
                        this.view.filtrosCLAManager &&
                        this.view.filtrosCLAManager.filtros
                    ) {
                        this.view.filtrosCLAManager.filtros.oficina =
                            oficinaId || null;
                        this.view.filtrosCLAManager.filtros.asesor = null;
                        this.view.filtrosCLAManager.filtros.mostrarTodas = false;

                        if (oficinaId && this.view.filtrosAsesoresManager) {
                            this.view.filtrosAsesoresManager.loadAsesores(
                                oficinaId
                            );
                        } else if (this.view.filtrosAsesoresManager) {
                            this.view.filtrosAsesoresManager.limpiarFiltros();
                        }

                        var permisos = this.view.permisosManager.getPermisos();
                        if (
                            !permisos.esAsesorRegular &&
                            this.view.estadisticasManager
                        ) {
                            this.view.estadisticasManager.loadStatistics();
                        }
                    }
                }.bind(this)
            );
        }

        this.setupComparacionAsesores();
    };

    FiltrosOficinasManager.prototype.setupComparacionAsesores = function () {
        var self = this;
        var btnComparar = this.view.$el.find("#btn-comparar-asesores");
        var selectOficina = this.view.$el.find("#oficina-select");
        var selectCLA = this.view.$el.find("#cla-select");

        btnComparar.off("click").on("click", function () {
            var oficinaId = selectOficina.val();
            var oficinaNombre = selectOficina.find("option:selected").text();
            var claSeleccionado = selectCLA.val();

            if (!oficinaId) {
                Espo.Ui.warning("Por favor, selecciona una oficina");
                return;
            }

            if (claSeleccionado === "CLA0" || claSeleccionado === "") {
                Espo.Ui.warning(
                    "No puedes comparar asesores con Territorio Nacional seleccionado"
                );
                return;
            }

            try {
                self.view
                    .getRouter()
                    .navigate("#Principal/asesores/" + oficinaId, {
                        trigger: true,
                    });
            } catch (error) {
                window.location.hash = "#Principal/asesores/" + oficinaId;
            }
        });
    };

    FiltrosOficinasManager.prototype.limpiarFiltros = function () {
        var oficinaSelect = this.view.$el.find("#oficina-select");
        if (oficinaSelect.length) {
            oficinaSelect.val("");
        }
    };

    return FiltrosOficinasManager;
});
