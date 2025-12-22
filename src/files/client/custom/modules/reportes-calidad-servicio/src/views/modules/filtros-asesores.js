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

        console.log("🔍 PERMISOS USUARIO:", permisos);
        console.log("🔍 ¿Es asesor regular?:", permisos.esAsesorRegular);
        console.log(
            "🔍 ¿Tiene roles de gestión?:",
            permisos.esGerente ||
                permisos.esCoordinador ||
                permisos.esDirector ||
                permisos.esAfiliado ||
                permisos.esCasaNacional
        );

        // ✅ NUEVA LÓGICA DE PERMISOS
        if (permisos.esAsesorRegular) {
            // Verificar si tiene roles de gestión
            const tieneRolesGestion =
                permisos.esGerente ||
                permisos.esCoordinador ||
                permisos.esDirector ||
                permisos.esAfiliado ||
                permisos.esCasaNacional;

            if (tieneRolesGestion) {
                console.log(
                    "🔍 Tiene roles de gestión - Cargando TODOS los asesores"
                );
                this.cargarAsesoresPorOficina(oficinaId);
            } else {
                console.log(
                    "🔍 Asesor regular sin roles de gestión - Solo mostrar sus datos"
                );
                this.cargarOpcionesAsesorRegular(asesorSelect);
            }
        } else {
            console.log(
                "🔍 NO es asesor regular - Cargando todos los asesores"
            );
            this.cargarAsesoresPorOficina(oficinaId);
        }
    };

    FiltrosAsesoresManager.prototype.cargarOpcionesAsesorRegular = function (
        asesorSelect
    ) {
        var permisos = this.view.permisosManager.getPermisos();

        // Primero mostrar "Toda la oficina" (estadísticas generales)
        asesorSelect.empty();
        asesorSelect.append(
            '<option value="">📊 Estadísticas de toda la oficina</option>'
        );

        // Luego mostrar "Ver mis estadísticas personales"
        asesorSelect.append(
            '<option value="' +
                permisos.usuarioId +
                '">👤 Mis estadísticas personales</option>'
        );

        asesorSelect.prop("disabled", false);

        // ✅ Auto-seleccionar "Toda la oficina" por defecto
        asesorSelect.val("");

        console.log("✅ Opciones cargadas para asesor regular:");
        console.log("  1. 📊 Estadísticas de toda la oficina (vacío)");
        console.log("  2. 👤 Mis estadísticas personales");
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
        var permisos = this.view.permisosManager.getPermisos();

        if (!asesorSelect.length) {
            return;
        }

        asesorSelect.html('<option value="">Cargando asesores...</option>');
        asesorSelect.prop("disabled", true);

        this.fetchUsuariosPorOficina(oficinaId)
            .then(
                function (usuarios) {
                    console.log(
                        "✅ Usuarios cargados para oficina:",
                        oficinaId,
                        usuarios
                    );

                    if (!usuarios || usuarios.length === 0) {
                        asesorSelect.html(
                            '<option value="">No hay asesores en esta oficina</option>'
                        );
                        asesorSelect.prop("disabled", true);
                        return;
                    }

                    // Ordenar por nombre
                    usuarios.sort(function (a, b) {
                        return (a.name || a.userName || "").localeCompare(
                            b.name || b.userName || ""
                        );
                    });

                    // Poblar select
                    asesorSelect.empty();
                    asesorSelect.append(
                        '<option value="">Todos los asesores</option>'
                    );

                    usuarios.forEach(function (usuario) {
                        // ✅ CORREGIR: Mostrar nombre correcto
                        var nombreCompleto =
                            usuario.name ||
                            usuario.userName ||
                            "Usuario #" + usuario.id.substring(0, 8);

                        // ✅ Si tiene encuestas, mostrarlo
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

                    // ✅ Si el usuario es gerente/director/etc, seleccionar "Todos los asesores" por defecto
                    if (
                        permisos.esGerente ||
                        permisos.esDirector ||
                        permisos.esCoordinador ||
                        permisos.esAfiliado
                    ) {
                        asesorSelect.val("");
                    }

                    console.log(
                        "✅ Select de asesores poblado con",
                        usuarios.length,
                        "opciones"
                    );
                }.bind(this)
            )
            .catch(function (error) {
                console.error("❌ Error cargando asesores:", error);
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
        console.log(
            "🔄 DEBUG - fetchUsuariosPorOficina INICIADO para oficina:",
            oficinaId
        );

        return new Promise(function (resolve, reject) {
            // ✅ USAR API DEL BACKEND EN LUGAR DE FETCH DIRECTO
            Espo.Ajax.getRequest(
                "CCustomerSurvey/action/getAsesoresByOficina",
                {
                    oficinaId: oficinaId,
                }
            )
                .then(function (response) {
                    console.log(
                        "✅ Respuesta de getAsesoresByOficina:",
                        response
                    );

                    if (response && response.success && response.data) {
                        var usuarios = response.data.map(function (usuario) {
                            return {
                                id: usuario.id,
                                name: usuario.name,
                                userName: usuario.userName,
                                encuestas: usuario.encuestas || 0,
                            };
                        });

                        console.log(
                            "✅ Usuarios encontrados:",
                            usuarios.length,
                            usuarios
                        );
                        resolve(usuarios);
                    } else {
                        console.warn(
                            "⚠️ No hay datos de asesores para la oficina:",
                            oficinaId
                        );
                        resolve([]);
                    }
                })
                .catch(function (error) {
                    console.error(
                        "❌ Error en fetchUsuariosPorOficina:",
                        error
                    );
                    reject(error);
                });
        });
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
                    var optionText = $(e.currentTarget)
                        .find("option:selected")
                        .text();

                    console.log(
                        "📊 Asesor seleccionado:",
                        asesorId || "Toda la oficina"
                    );
                    console.log("📋 Opción seleccionada:", optionText);

                    if (
                        this.view.filtrosCLAManager &&
                        this.view.filtrosCLAManager.filtros
                    ) {
                        this.view.filtrosCLAManager.filtros.asesor =
                            asesorId || null;
                        this.view.filtrosCLAManager.filtros.mostrarTodas = false;

                        // ✅ Recargar estadísticas inmediatamente
                        if (this.view.estadisticasManager) {
                            console.log("🔄 Recargando estadísticas...");
                            this.view.estadisticasManager.loadStatistics();
                        }

                        // ✅ Mostrar mensaje informativo según selección
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
