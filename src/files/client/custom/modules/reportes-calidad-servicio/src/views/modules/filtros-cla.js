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

                        // ✅ NUEVO: Cargar CLA inicial automáticamente
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

        // ✅ SIMPLIFICADO: TODOS ven Territorio Nacional primero
        claSelect.append(
            $("<option></option>").val("CLA0").text("Territorio Nacional")
        );

        var clasDisponibles = [];

        // ✅ Admin y Casa Nacional ven todos los CLAs
        if (permisos.esAdministrativo || permisos.esCasaNacional) {
            clasDisponibles = this.allTeams.clas.filter(function (cla) {
                return cla.id !== "CLA0";
            });
        }
        // ✅ Gerentes, Directores, Coordinadores, Afiliados ven su CLA
        else if (
            permisos.esGerente ||
            permisos.esDirector ||
            permisos.esCoordinador ||
            permisos.esAfiliado
        ) {
            if (permisos.claUsuario) {
                clasDisponibles = this.allTeams.clas.filter(function (cla) {
                    return cla.id === permisos.claUsuario;
                });
            }
        }
        // ✅ Asesores Regulares ven su CLA
        else if (permisos.esAsesorRegular) {
            if (permisos.claUsuario) {
                clasDisponibles = this.allTeams.clas.filter(function (cla) {
                    return cla.id === permisos.claUsuario;
                });
            }
        }

        // Ordenar y agregar
        clasDisponibles.sort(function (a, b) {
            return a.name.localeCompare(b.name);
        });

        clasDisponibles.forEach(function (cla) {
            claSelect.append($("<option></option>").val(cla.id).text(cla.name));
        });

        // ✅ Seleccionar Territorio Nacional por defecto para TODOS
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

                    console.log("🔍 DEBUG - CLA seleccionado:", claId);
                    console.log("🔍 DEBUG - CLA es CLA0?:", claId === "CLA0");
                    console.log("🔍 DEBUG - CLA es null/empty?:", !claId);

                    // Actualizar filtros
                    this.filtros.cla = claId || null;
                    this.filtros.oficina = null;
                    this.filtros.asesor = null;

                    // ✅ CORRECCIÓN CRÍTICA: Asegurar que mostrarTodas sea true cuando es CLA0
                    this.filtros.mostrarTodas = !claId || claId === "CLA0";

                    console.log(
                        "🔍 DEBUG - Filtros actualizados:",
                        this.filtros
                    );
                    console.log(
                        "🔍 DEBUG - mostrarTodas:",
                        this.filtros.mostrarTodas
                    );

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

                    var permisos = this.view.permisosManager.getPermisos();

                    // ✅ CORRECCIÓN: Para asesor regular, habilitar botón de comparar oficinas cuando selecciona su CLA
                    if (claId && claId !== "CLA0") {
                        // Mostrar botón de comparar oficinas para todos
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

                        // Solo para admin, mostrar mensaje de seleccionar CLA
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

                    // ✅ Recargar estadísticas siempre
                    console.log(
                        "🔍 DEBUG - Llamando a loadStatistics con filtros:",
                        this.filtros
                    );
                    this.view.estadisticasManager.loadStatistics();
                }.bind(this)
            );
        }

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
        console.log("🔍 DEBUG getFiltros - Retornando:", this.filtros);
        return this.filtros;
    };

    FiltrosCLAManager.prototype.cargarCLAInicial = function () {
        var permisos = this.view.permisosManager.getPermisos();

        if (!permisos.permisosListo) {
            console.log("⏳ Esperando permisos...");
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
            console.warn("⚠️ Select CLA no encontrado");
            return;
        }

        // ✅ Forzar selección de Territorio Nacional
        console.log("🌎 FORZANDO selección de Territorio Nacional por defecto");

        // Asegurar que el valor esté en el select
        if (claSelect.find('option[value="CLA0"]').length > 0) {
            claSelect.val("CLA0");

            // ✅ AGREGAR: Disparar el evento change manualmente después de un breve delay
            setTimeout(function () {
                console.log("🔄 Disparando evento change para CLA0");
                claSelect.trigger("change");
            }, 500);
        } else {
            console.error("❌ ERROR: Option CLA0 no encontrada en el select");
        }
    };

    return FiltrosCLAManager;
});
