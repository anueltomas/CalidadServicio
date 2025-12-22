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
            console.log(
                "👤 Asesor regular puro - Cargando solo SU oficina:",
                permisos.oficinaUsuario
            );

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

        // ✅ PARA OTROS ROLES CON OFICINA ESPECÍFICA
        if (!permisos.esAdministrativo && !permisos.esCasaNacional) {
            if (permisos.oficinaUsuario) {
                this.cargarOficinaEspecifica(
                    permisos.oficinaUsuario,
                    oficinaSelect
                );
                return;
            }
        }

        // ✅ ADMIN Y CASA NACIONAL: todas las oficinas del CLA
        this.cargarOficinasPorCLA(claId);

        // ✅ CORREGIDO: Para ASESOR REGULAR, cargar TODAS las oficinas de su CLA seleccionado
        if (permisos.esAsesorRegular) {
            console.log(
                "👤 Asesor regular - Cargando TODAS las oficinas del CLA:",
                claId
            );
            this.cargarOficinasPorCLA(claId);
            return;
        }

        // ✅ PARA OTROS ROLES CON OFICINA ESPECÍFICA
        if (!permisos.esAdministrativo && !permisos.esCasaNacional) {
            if (permisos.oficinaUsuario) {
                this.cargarOficinaEspecifica(
                    permisos.oficinaUsuario,
                    oficinaSelect
                );
                return;
            }
        }

        // ✅ ADMIN Y CASA NACIONAL: todas las oficinas del CLA
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
            console.log(
                "👤 Asesor regular - Cargando solo SU oficina:",
                permisos.oficinaUsuario
            );

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

        // ✅ USAR API OPTIMIZADA
        Espo.Ajax.getRequest("CCustomerSurvey/action/getOficinasByCLA", {
            claId: claId,
        })
            .then(
                function (response) {
                    if (response && response.success && response.data) {
                        var oficinas = response.data;

                        // Filtrar venezuela
                        oficinas = oficinas.filter(function (oficina) {
                            return (
                                oficina.id.toLowerCase() !== "venezuela" &&
                                (oficina.name || "").toLowerCase() !==
                                    "venezuela"
                            );
                        });

                        // Ordenar por nombre
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

                        // ✅ Si hay filtros guardados, restaurar selección
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
                console.error("Error cargando oficinas:", error);
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
                // ✅ CORRECCIÓN: Usar la API del backend en lugar de fetchAll
                Espo.Ajax.getRequest(
                    "CCustomerSurvey/action/getOficinasByCLA",
                    {
                        claId: claId,
                    }
                )
                    .then(
                        function (response) {
                            if (response && response.success) {
                                // ✅ La respuesta ya viene con las oficinas filtradas del backend
                                var oficinas = response.data || [];

                                // Filtrar venezuela por si acaso
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
                        console.error(
                            "Error cargando oficinas por CLA:",
                            error
                        );
                        resolve([]);
                    });
            }.bind(this)
        );
    };

    FiltrosOficinasManager.prototype.cargarOficinaEspecifica = function (
        oficinaId,
        oficinaSelect
    ) {
        console.log("🔍 Cargando oficina específica (Team):", oficinaId);

        // ✅ Usar Repository de EspoCRM
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

                            console.log("✅ Oficina cargada:", oficina);

                            // Limpiar y poblar select
                            oficinaSelect.empty();
                            oficinaSelect.append(
                                '<option value="' +
                                    oficina.id +
                                    '">' +
                                    oficina.name +
                                    "</option>"
                            );
                            oficinaSelect.val(oficina.id);
                            oficinaSelect.prop("disabled", false); // ✅ Habilitado para que pueda seleccionar

                            // Actualizar filtros
                            if (this.view.filtrosCLAManager) {
                                this.view.filtrosCLAManager.filtros.oficina =
                                    oficina.id;
                                this.view.filtrosCLAManager.filtros.mostrarTodas = false;
                            }

                            // ✅ Cargar asesores de la oficina automáticamente
                            if (this.view.filtrosAsesoresManager) {
                                this.view.filtrosAsesoresManager.loadAsesores(
                                    oficina.id
                                );
                            }

                            // NO recargar estadísticas aún, esperar a que seleccione asesor
                        }.bind(this)
                    )
                    .catch(
                        function (error) {
                            console.error("❌ Error cargando oficina:", error);
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

                    // Lógica de visibilidad del botón de asesores
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

                    // Actualizar filtros
                    if (
                        this.view.filtrosCLAManager &&
                        this.view.filtrosCLAManager.filtros
                    ) {
                        this.view.filtrosCLAManager.filtros.oficina =
                            oficinaId || null;
                        this.view.filtrosCLAManager.filtros.asesor = null;
                        this.view.filtrosCLAManager.filtros.mostrarTodas = false;

                        // Cargar asesores si hay oficina seleccionada
                        if (oficinaId && this.view.filtrosAsesoresManager) {
                            this.view.filtrosAsesoresManager.loadAsesores(
                                oficinaId
                            );
                        } else if (this.view.filtrosAsesoresManager) {
                            this.view.filtrosAsesoresManager.limpiarFiltros();
                        }

                        // ✅ NO recargar estadísticas aquí para asesor regular
                        // Esperar a que seleccione en el select de asesores
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

            // ✅ Validaciones
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

            console.log(
                "👥 Navegando a comparación de asesores - Oficina:",
                oficinaId
            );

            // ✅ Navegar directamente (sin guardar filtros que puedan interferir)
            try {
                self.view
                    .getRouter()
                    .navigate("#Principal/asesores/" + oficinaId, {
                        trigger: true,
                    });
            } catch (error) {
                console.error("Error navegando:", error);
                // Fallback
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
