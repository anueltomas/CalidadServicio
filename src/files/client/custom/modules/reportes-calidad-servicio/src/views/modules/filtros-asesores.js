define("reportes-calidad-servicio:views/modules/filtros-asesores", [], function () {
    var FiltrosAsesoresManager = function (view) {
        this.view = view;
    };

    FiltrosAsesoresManager.prototype.loadAsesores = function (oficinaId) {
        var asesorSelect = this.view.$el.find("#asesor-select");

        if (!asesorSelect.length) {
            return;
        }

        asesorSelect.html('<option value="">Cargando asesores...</option>');
        asesorSelect.prop("disabled", true);

        var permisos = this.view.permisosManager.getPermisos();

        if (permisos.esAsesorRegular) {
            const tieneRolesGestion =
                permisos.esGerente ||
                permisos.esCoordinador ||
                permisos.esDirector ||
                permisos.esAfiliado ||
                permisos.esCasaNacional;

            if (tieneRolesGestion) {
                this.cargarAsesoresPorOficina(oficinaId);
            } else {
                this.cargarOpcionesAsesorRegular(asesorSelect);
            }
        } else {
            this.cargarAsesoresPorOficina(oficinaId);
        }
    };

    FiltrosAsesoresManager.prototype.cargarOpcionesAsesorRegular = function (
        asesorSelect
    ) {
        var permisos = this.view.permisosManager.getPermisos();

        asesorSelect.empty();
        asesorSelect.append(
            '<option value="">📊 Estadísticas de toda la oficina</option>'
        );

        asesorSelect.append(
            '<option value="' +
                permisos.usuarioId +
                '">👤 Mis estadísticas personales</option>'
        );

        asesorSelect.prop("disabled", false);

        asesorSelect.val("");
    };

    FiltrosAsesoresManager.prototype.cargarAsesorEspecifico = function (
        userId,
        asesorSelect
    ) {
        this.view.getModelFactory().create(
            "User",
            function (userModel) {
                userModel.id = userId;
                userModel
                    .fetch()
                    .then(
                        function () {
                            var userName =
                                userModel.get("name") || "Usuario Actual";

                            asesorSelect.empty();
                            asesorSelect.append(
                                '<option value="' +
                                    userId +
                                    '">' +
                                    userName +
                                    "</option>"
                            );
                            asesorSelect.val(userId);
                            asesorSelect.prop("disabled", true);

                            this.view.filtrosCLAManager.filtros.asesor = userId;
                            this.view.filtrosCLAManager.filtros.mostrarTodas = false;
                        }.bind(this)
                    )
                    .catch(
                        function (error) {
                            asesorSelect.html(
                                '<option value="">Error al cargar</option>'
                            );
                            asesorSelect.prop("disabled", false);
                        }.bind(this)
                    );
            }.bind(this)
        );
    };

    FiltrosAsesoresManager.prototype.cargarAsesoresPorOficina = function (
        oficinaId
    ) {
        var asesorSelect = this.view.$el.find("#asesor-select");
        var permisos = this.view.permisosManager.getPermisos();

        if (!asesorSelect.length) {
            return;
        }

        asesorSelect.html('<option value="">Cargando asesores...</option>');
        asesorSelect.prop("disabled", true);

        this.fetchUsuariosPorOficina(oficinaId)
            .then(
                function (usuarios) {
                    if (!usuarios || usuarios.length === 0) {
                        asesorSelect.html(
                            '<option value="">No hay asesores en esta oficina</option>'
                        );
                        asesorSelect.prop("disabled", true);
                        return;
                    }

                    usuarios.sort(function (a, b) {
                        return (a.name || a.userName || "").localeCompare(
                            b.name || b.userName || ""
                        );
                    });

                    asesorSelect.empty();
                    asesorSelect.append(
                        '<option value="">Todos los asesores</option>'
                    );

                    usuarios.forEach(function (usuario) {
                        var nombreCompleto =
                            usuario.name ||
                            usuario.userName ||
                            "Usuario #" + usuario.id.substring(0, 8);

                        var tieneEncuestas = usuario.encuestas > 0;
                        var indicador = tieneEncuestas
                            ? ` (${usuario.encuestas} encuestas)`
                            : " (Sin encuestas)";

                        asesorSelect.append(
                            '<option value="' +
                                usuario.id +
                                '">' +
                                nombreCompleto +
                                indicador +
                                "</option>"
                        );
                    });

                    asesorSelect.prop("disabled", false);

                    if (
                        permisos.esGerente ||
                        permisos.esDirector ||
                        permisos.esCoordinador ||
                        permisos.esAfiliado
                    ) {
                        asesorSelect.val("");
                    }
                }.bind(this)
            )
            .catch(function (error) {
                asesorSelect.html(
                    '<option value="">Error al cargar asesores</option>'
                );
                asesorSelect.prop("disabled", false);
            });
    };

    FiltrosAsesoresManager.prototype.fetchUsuariosPorOficina = function (
        oficinaId
    ) {
        return new Promise(function (resolve, reject) {
            Espo.Ajax.getRequest(
                "CCustomerSurvey/action/getAsesoresByOficina",
                {
                    oficinaId: oficinaId,
                }
            )
                .then(function (response) {
                    if (response && response.success && response.data) {
                        var usuarios = response.data.map(function (usuario) {
                            return {
                                id: usuario.id,
                                name: usuario.name,
                                userName: usuario.userName,
                                encuestas: usuario.encuestas || 0,
                            };
                        });

                        resolve(usuarios);
                    } else {
                        resolve([]);
                    }
                })
                .catch(function (error) {
                    reject(error);
                });
        });
    };

    FiltrosAsesoresManager.prototype.setupEventListeners = function () {
        var asesorSelect = this.view.$el.find("#asesor-select");

        if (asesorSelect.length) {
            asesorSelect.off("change").on(
                "change",
                function (e) {
                    var asesorId = $(e.currentTarget).val();
                    var optionText = $(e.currentTarget)
                        .find("option:selected")
                        .text();

                    if (
                        this.view.filtrosCLAManager &&
                        this.view.filtrosCLAManager.filtros
                    ) {
                        this.view.filtrosCLAManager.filtros.asesor =
                            asesorId || null;
                        this.view.filtrosCLAManager.filtros.mostrarTodas = false;

                        if (this.view.estadisticasManager) {
                            this.view.estadisticasManager.loadStatistics();
                        }

                        if (!asesorId) {
                            Espo.Ui.info(
                                "Mostrando estadísticas de toda la oficina"
                            );
                        } else {
                            Espo.Ui.info("Mostrando estadísticas personales");
                        }
                    }
                }.bind(this)
            );
        }
    };

    FiltrosAsesoresManager.prototype.limpiarFiltros = function () {
        var asesorSelect = this.view.$el.find("#asesor-select");
        if (asesorSelect.length) {
            asesorSelect.val("");
            asesorSelect.empty();
            asesorSelect.append(
                '<option value="">Seleccione una oficina primero</option>'
            );
            asesorSelect.prop("disabled", true);
        }
    };

    return FiltrosAsesoresManager;
});
