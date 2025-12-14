define("reportes-calidad-servicio:views/modules/filtros-asesores", [], function () {
    var FiltrosAsesoresManager = function (view) {
        this.view = view;
    };

    /**
     * Carga los asesores de una oficina específica
     */
    FiltrosAsesoresManager.prototype.loadAsesores = function (oficinaId) {
        var asesorSelect = this.view.$el.find("#asesor-select");

        if (!asesorSelect.length) {
            return;
        }

        asesorSelect.html('<option value="">Cargando asesores...</option>');
        asesorSelect.prop("disabled", true);

        var permisos = this.view.permisosManager.getPermisos();

        // Si el usuario no es admin ni casa nacional
        if (!permisos.esAdministrativo && !permisos.esCasaNacional) {
            var user = this.view.getUser();

            // Solo mostrar al usuario actual
            this.cargarAsesorEspecifico(user.id, asesorSelect);
            return;
        }

        // Si es admin o casa nacional, cargar todos los asesores de la oficina
        this.cargarAsesoresPorOficina(oficinaId);
    };

    /**
     * Carga un asesor específico (para usuarios sin permisos especiales)
     */
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

                            // Actualizar filtros
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

    /**
     * Carga todos los asesores de una oficina
     */
    FiltrosAsesoresManager.prototype.cargarAsesoresPorOficina = function (
        oficinaId
    ) {
        var asesorSelect = this.view.$el.find("#asesor-select");

        // Obtener usuarios del equipo (oficina)
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

                    // Ordenar por nombre
                    usuarios.sort(function (a, b) {
                        return (a.name || "").localeCompare(b.name || "");
                    });

                    // Poblar select
                    asesorSelect.empty();
                    asesorSelect.append(
                        '<option value="">Todos los asesores</option>'
                    );

                    usuarios.forEach(function (usuario) {
                        asesorSelect.append(
                            '<option value="' +
                                usuario.id +
                                '">' +
                                (usuario.name ||
                                    usuario.userName ||
                                    "Usuario sin nombre") +
                                "</option>"
                        );
                    });

                    asesorSelect.prop("disabled", false);
                }.bind(this)
            )
            .catch(function (error) {
                console.error("Error cargando asesores:", error);
                asesorSelect.html(
                    '<option value="">Error al cargar asesores</option>'
                );
                asesorSelect.prop("disabled", false);
            });
    };

    /**
     * Obtiene los usuarios de una oficina específica
     */
    FiltrosAsesoresManager.prototype.fetchUsuariosPorOficina = function (
        oficinaId
    ) {
        return new Promise(
            function (resolve, reject) {
                var maxSize = 200;
                var allUsers = [];

                var fetchPage = function (offset) {
                    this.view.getCollectionFactory().create(
                        "User",
                        function (collection) {
                            collection.maxSize = maxSize;
                            collection.offset = offset;
                            collection.data = {
                                select: "id,name,userName,teamsIds,teamsNames",
                            };

                            collection
                                .fetch()
                                .then(
                                    function () {
                                        var models = collection.models || [];

                                        // Filtrar usuarios que pertenecen a la oficina
                                        var filtered = models
                                            .filter(function (u) {
                                                var teamsIds =
                                                    u.get("teamsIds") || [];
                                                return teamsIds.includes(
                                                    oficinaId
                                                );
                                            })
                                            .map(function (m) {
                                                return {
                                                    id: m.id,
                                                    name: m.get("name"),
                                                    userName: m.get("userName"),
                                                    teamsIds: m.get("teamsIds"),
                                                    teamsNames:
                                                        m.get("teamsNames"),
                                                };
                                            });

                                        allUsers = allUsers.concat(filtered);

                                        if (
                                            models.length === maxSize &&
                                            offset + maxSize < collection.total
                                        ) {
                                            fetchPage(offset + maxSize);
                                        } else {
                                            resolve(allUsers);
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

    /**
     * Configura los event listeners del select de asesores
     */
    FiltrosAsesoresManager.prototype.setupEventListeners = function () {
        var asesorSelect = this.view.$el.find("#asesor-select");

        if (asesorSelect.length) {
            asesorSelect.off("change").on(
                "change",
                function (e) {
                    var asesorId = $(e.currentTarget).val();

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
                    }
                }.bind(this)
            );
        }
    };

    /**
     * Limpia el select de asesores
     */
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
