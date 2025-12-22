define("reportes-calidad-servicio:views/asesores", ["view"], function (Dep) {
    return Dep.extend({
        template: "reportes-calidad-servicio:asesores",

        setup: function () {
            try {
                console.log("👥 Vista de comparación de asesores inicializada");

                // Obtener oficinaId
                this.oficinaId =
                    this.options.oficinaId ||
                    (this.getRouter() && this.getRouter().getCurrentUrlParams
                        ? this.getRouter().getCurrentUrlParams().oficinaId
                        : null);

                this.usuarioActual = this.getUser();
                this.userId = this.usuarioActual.get("id");

                this.cargarPermisosUsuario();

                if (!this.oficinaId) {
                    console.error("❌ No se pudo obtener el ID de oficina");
                    Espo.Ui.error("No se pudo identificar la oficina");
                    if (this.getRouter()) {
                        this.getRouter().navigate("#Principal", {
                            trigger: true,
                        });
                    }
                    return;
                }

                // Colores
                this.colors = {
                    relentlessGold: "#B8A279",
                    darkGold: "#363438",
                    obsessedGrey: "#1A1A1A",
                    mediumGrey: "#666666",
                    lightGrey: "#E6E6E6",
                    primary: "#B8A279",
                    secondary: "#363438",
                    textDark: "#1A1A1A",
                    textMedium: "#666666",
                    textLight: "#999999",
                    background: "#F5F5F5",
                    white: "#FFFFFF",
                    success: "#27ae60",
                    warning: "#f39c12",
                    danger: "#e74c3c",
                };

                // Estado inicial
                this.datosAsesores = [];
                this.isLoading = true;
                this.nombreOficina = "Cargando...";
                this.nombreCla = "";
                this.claId = null;
                this.oficinasList = [];

                // Contexto de navegación
                if (this.options.claId) {
                    sessionStorage.setItem(
                        "navegacion_previa",
                        JSON.stringify({
                            vistaAnterior: "oficinas",
                            claId: this.options.claId,
                            oficinaId: this.oficinaId,
                        })
                    );
                }

                this.contextoNavegacion = this.obtenerContextoNavegacion();
            } catch (error) {
                console.error("❌ Error en setup de vista asesores:", error);
                this.mostrarErrorInicial(error);
            }
        },

        cargarPermisosUsuario: function () {
            var self = this;

            return Espo.Ajax.getRequest("CCustomerSurvey/action/getUserInfo", {
                userId: this.userId,
            })
                .then(function (response) {
                    if (response.success && response.data) {
                        self.permisosUsuario = response.data;
                        console.log(
                            "🔐 Permisos del usuario cargados:",
                            self.permisosUsuario
                        );
                        return response;
                    } else {
                        self.permisosUsuario = {
                            esAsesorRegular: false,
                            usuarioId: self.userId,
                        };
                        return response;
                    }
                })
                .catch(function (error) {
                    console.error("❌ Error cargando permisos usuario:", error);
                    self.permisosUsuario = {
                        esAsesorRegular: false,
                        usuarioId: self.userId,
                    };
                });
        },

        mostrarErrorInicial: function (error) {
            console.error("Error crítico:", error);
            setTimeout(() => {
                if (this.$el && this.$el.length) {
                    this.$el.html(`
                        <div class="alert alert-danger" style="margin: 20px; padding: 20px;">
                            <h4>Error al cargar la vista</h4>
                            <p>${error.message || "Error desconocido"}</p>
                            <button class="btn btn-default" onclick="window.location.hash='#Principal'">
                                <i class="fas fa-home"></i> Volver al inicio
                            </button>
                        </div>
                    `);
                }
            }, 100);
        },

        obtenerContextoNavegacion: function () {
            try {
                const contexto = sessionStorage.getItem("contextoNavegacion");
                if (contexto) {
                    return JSON.parse(contexto);
                }
            } catch (error) {
                console.error("Error cargando contexto:", error);
            }
            return null;
        },

        data: function () {
            return {
                oficinaId: this.oficinaId,
                isLoading: this.isLoading,
                datosAsesores: this.datosAsesores,
                nombreOficina: this.nombreOficina,
                nombreCla: this.nombreCla,
            };
        },

        afterRender: function () {
            try {
                console.log("✅ afterRender ejecutado");

                if (!this.$el || this.$el.length === 0) {
                    console.error("❌ $el no está disponible");
                    return;
                }

                this.showLoadingState();

                setTimeout(() => {
                    try {
                        this.setupEventListeners();
                        this.cargarDatosOficinaYAsesores();
                    } catch (error) {
                        console.error(
                            "❌ Error en afterRender timeout:",
                            error
                        );
                    }
                }, 50);
            } catch (error) {
                console.error("❌ Error en afterRender:", error);
            }
        },

        cargarInfoOficinaYCLA: function () {
            console.log("📊 Cargando información de oficina y CLA...");

            return Espo.Ajax.getRequest(
                "CCustomerSurvey/action/getInfoOficina",
                { oficinaId: this.oficinaId }
            )
                .then(
                    function (response) {
                        console.log("✅ Info oficina recibida:", response);

                        if (response.success && response.data) {
                            this.nombreOficina =
                                response.data.nombreOficina ||
                                `Oficina ${this.oficinaId}`;
                            this.nombreCla = response.data.nombreCla || "";
                            this.claId = response.data.claId || null;
                            this.oficinasList = response.data.oficinas || [];

                            this.actualizarHeaderInfo();
                            this.actualizarSelectorOficinas();
                        }
                    }.bind(this)
                )
                .catch(
                    function (error) {
                        console.error("❌ Error cargando info oficina:", error);
                        this.nombreOficina = `Oficina ${this.oficinaId}`;
                    }.bind(this)
                );
        },

        actualizarHeaderInfo: function () {
            try {
                const headerElement = this.$el.find("#nombre-oficina");
                const claElement = this.$el.find("#nombre-cla");

                if (headerElement.length) {
                    headerElement.text(this.nombreOficina);
                    headerElement.css("color", this.colors.secondary);
                }

                if (claElement.length && this.nombreCla) {
                    claElement.html(
                        `<i class="fas fa-users me-1" style="color: ${this.colors.primary};"></i> CLA: <strong style="color: ${this.colors.secondary};">${this.nombreCla}</strong>`
                    );
                    claElement.css("color", this.colors.textMedium);
                }
            } catch (error) {
                console.error("❌ Error en actualizarHeaderInfo:", error);
            }
        },

        actualizarSelectorOficinas: function () {
            try {
                const selectOficina = this.$el.find("#selector-oficina");

                if (!selectOficina.length || this.oficinasList.length === 0) {
                    return;
                }

                selectOficina.empty();

                this.oficinasList.forEach(
                    function (oficina) {
                        const selected =
                            oficina.id === this.oficinaId ? "selected" : "";
                        selectOficina.append(
                            `<option value="${oficina.id}" ${selected}>${oficina.name}</option>`
                        );
                    }.bind(this)
                );

                selectOficina.prop("disabled", false);
            } catch (error) {
                console.error("❌ Error en actualizarSelectorOficinas:", error);
            }
        },

        cargarDatosOficinaYAsesores: function () {
            console.log("📊 Cargando datos de oficina y asesores...");

            this.cargarInfoOficinaYCLA()
                .then(
                    function () {
                        return Espo.Ajax.getRequest(
                            "CCustomerSurvey/action/getComparacionAsesores",
                            { oficinaId: this.oficinaId }
                        );
                    }.bind(this)
                )
                .then(
                    function (response) {
                        console.log(
                            "✅ Datos de asesores recibidos:",
                            response
                        );

                        if (response.success && response.data) {
                            this.datosAsesores = response.data;
                            if (response.usuarioActualId) {
                                this.userId = response.usuarioActualId;
                            }
                        } else {
                            Espo.Ui.warning(
                                response.error ||
                                    "No se pudieron cargar los datos"
                            );
                            this.datosAsesores = [];
                        }

                        this.isLoading = false;
                        this.updateUI();
                    }.bind(this)
                )
                .catch(
                    function (error) {
                        console.error("❌ Error cargando datos:", error);
                        Espo.Ui.error("Error al conectar con el servidor");
                        this.datosAsesores = [];
                        this.isLoading = false;
                        this.updateUI();
                    }.bind(this)
                );
        },

        setupEventListeners: function () {
            try {
                console.log("🔧 Configurando event listeners");

                const volverBtn = this.$el.find('[data-action="volver"]');
                const exportarBtn = this.$el.find('[data-action="exportar"]');
                const selectorOficina = this.$el.find("#selector-oficina");

                if (volverBtn.length > 0) {
                    volverBtn.off("click").on("click", (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("🔙 Botón volver clickeado");
                        this.volverAVistaAnterior();
                    });
                }

                if (exportarBtn.length > 0) {
                    exportarBtn.off("click").on("click", (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.exportarReporte();
                    });
                }

                if (selectorOficina.length > 0) {
                    selectorOficina.off("change").on("change", (e) => {
                        const nuevaOficinaId = $(e.currentTarget).val();
                        if (
                            nuevaOficinaId &&
                            nuevaOficinaId !== this.oficinaId
                        ) {
                            selectorOficina.prop("disabled", true);
                            if (this.getRouter()) {
                                this.getRouter().navigate(
                                    `#Principal/asesores/${nuevaOficinaId}`,
                                    { trigger: true }
                                );
                            }
                        }
                    });
                }

                this.$el.off("click", ".asesor-row");
                this.$el.on("click", ".asesor-row", (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    const row = $(e.currentTarget);
                    const asesorId = row.data("id");
                    const esClickeable =
                        row.data("clicable") === true ||
                        row.data("clicable") === "true";

                    console.log(
                        "🔗 Click en fila asesor ID:",
                        asesorId,
                        "¿Clickeable?",
                        esClickeable
                    );

                    if (!esClickeable) {
                        if (
                            this.permisosUsuario &&
                            this.permisosUsuario.esAsesorRegular
                        ) {
                            Espo.Ui.info(
                                "Como asesor, solo puedes ver tus propias estadísticas."
                            );
                        }
                        return;
                    }

                    if (asesorId) {
                        this.verDetalleAsesor(asesorId);
                    }
                });

                console.log("✅ Event listeners configurados");
            } catch (error) {
                console.error("❌ Error en setupEventListeners:", error);
            }
        },

        volverAVistaAnterior: function () {
            try {
                console.log("🔙 Volviendo a vista anterior");

                if (this.contextoNavegacion) {
                    console.log(
                        "📍 Contexto encontrado:",
                        this.contextoNavegacion
                    );

                    if (
                        this.contextoNavegacion.desde ===
                            "comparacion-oficinas" &&
                        this.contextoNavegacion.claId
                    ) {
                        console.log(
                            "📍 Volviendo a oficinas del CLA:",
                            this.contextoNavegacion.claId
                        );
                        sessionStorage.removeItem("contextoNavegacion");

                        if (this.getRouter()) {
                            this.getRouter().navigate(
                                `#Principal/oficinas/${this.contextoNavegacion.claId}`,
                                { trigger: true }
                            );
                        }
                        return;
                    }
                }

                if (this.options.previousRoute) {
                    console.log(
                        "📍 Usando previousRoute:",
                        this.options.previousRoute
                    );
                    if (this.getRouter()) {
                        this.getRouter().navigate(this.options.previousRoute, {
                            trigger: true,
                        });
                    }
                    return;
                }

                const navegacionPrevia =
                    sessionStorage.getItem("navegacion_previa");
                if (navegacionPrevia) {
                    try {
                        const datos = JSON.parse(navegacionPrevia);
                        if (datos.vistaAnterior === "oficinas" && datos.claId) {
                            console.log(
                                "📍 Volviendo a oficinas:",
                                datos.claId
                            );
                            if (this.getRouter()) {
                                this.getRouter().navigate(
                                    `#Principal/oficinas/${datos.claId}`,
                                    { trigger: true }
                                );
                            }
                            return;
                        }
                    } catch (error) {
                        console.error(
                            "Error parseando navegación previa:",
                            error
                        );
                    }
                }

                console.log("📍 Último fallback: volviendo a Principal");
                if (this.getRouter()) {
                    this.getRouter().navigate("#Principal", { trigger: true });
                } else {
                    window.location.hash = "#Principal";
                }
            } catch (error) {
                console.error("❌ Error en volverAVistaAnterior:", error);
                window.location.hash = "#Principal";
            }
        },

        exportarReporte: function () {
            try {
                if (this.datosAsesores.length === 0) {
                    Espo.Ui.warning("No hay datos para exportar");
                    return;
                }

                let csv =
                    "Asesor,Encuestas Totales,Promedio General,% Desempeño\n";

                this.datosAsesores.forEach((asesor) => {
                    csv += `"${asesor.nombre}",${asesor.totalEncuestas},${asesor.promedioGeneral},${asesor.porcentaje}\n`;
                });

                const blob = new Blob([csv], {
                    type: "text/csv;charset=utf-8;",
                });
                const link = document.createElement("a");
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute(
                    "download",
                    `comparacion-asesores-${this.oficinaId}-${
                        new Date().toISOString().split("T")[0]
                    }.csv`
                );
                link.style.visibility = "hidden";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                Espo.Ui.success("Reporte exportado exitosamente");
            } catch (error) {
                console.error("❌ Error exportando reporte:", error);
                Espo.Ui.error("Error al exportar el reporte");
            }
        },

        verDetalleAsesor: function (asesorId) {
            try {
                console.log(
                    "🚀 Intentando navegar a estadísticas del asesor:",
                    asesorId
                );

                if (!asesorId) {
                    console.error("❌ ID de asesor no válido");
                    Espo.Ui.warning("No se pudo identificar el asesor");
                    return;
                }

                // ✅ CONVERTIR ID A STRING para comparación
                const asesorIdBuscado = asesorId.toString();
                let asesorSeleccionado = null;

                // Buscar el asesor en los datos
                if (this.datosAsesores && this.datosAsesores.length > 0) {
                    asesorSeleccionado = this.datosAsesores.find(
                        (asesor) =>
                            asesor &&
                            asesor.id &&
                            asesor.id.toString() === asesorIdBuscado
                    );
                }

                console.log("📊 Asesor encontrado:", asesorSeleccionado);

                // Preparar datos para navegación
                const datosAsesor = {
                    id: asesorIdBuscado,
                    nombre:
                        (asesorSeleccionado && asesorSeleccionado.nombre) ||
                        `Asesor ${asesorIdBuscado}`,
                    oficinaId: this.oficinaId,
                    oficinaNombre: this.nombreOficina || "Oficina",
                    claId: this.claId,
                    claNombre: this.nombreCla || "CLA",
                    totalEncuestas:
                        (asesorSeleccionado &&
                            asesorSeleccionado.totalEncuestas) ||
                        0,
                    promedioGeneral:
                        (asesorSeleccionado &&
                            asesorSeleccionado.promedioGeneral) ||
                        0,
                    porcentaje:
                        (asesorSeleccionado && asesorSeleccionado.porcentaje) ||
                        0,
                };

                console.log("✅ Datos preparados:", datosAsesor);

                // Guardar en sessionStorage
                sessionStorage.setItem(
                    "contextoDetalleAsesor",
                    JSON.stringify({
                        desde: "comparacion-asesores",
                        oficinaId: this.oficinaId,
                        claId: this.claId,
                        timestamp: Date.now(),
                        datosAsesor: datosAsesor,
                    })
                );

                // Navegar
                const router = this.getRouter();
                if (router) {
                    router.navigate(
                        `#Principal/estadisticasAsesor/${asesorIdBuscado}`,
                        {
                            trigger: true,
                            asesorId: asesorIdBuscado,
                            asesorNombre: datosAsesor.nombre,
                            oficinaId: this.oficinaId,
                            oficinaNombre: datosAsesor.oficinaNombre,
                            claId: this.claId,
                            claNombre: datosAsesor.claNombre,
                            previousRoute: `#Principal/asesores/${this.oficinaId}`,
                            datosAsesor: datosAsesor,
                        }
                    );
                    console.log("✅ Navegación exitosa");
                } else {
                    window.location.hash = `#Principal/estadisticasAsesor/${asesorIdBuscado}`;
                }
            } catch (error) {
                console.error("❌ Error en verDetalleAsesor:", error);
                Espo.Ui.error("Error al navegar al detalle del asesor");
            }
        },

        showLoadingState: function () {
            try {
                const container = this.$el.find("#asesores-container");
                if (container.length) {
                    container.html(`
                        <div class="text-center" style="padding: 60px;">
                            <div class="spinner-large" style="border-color: ${this.colors.lightGrey}; border-top-color: ${this.colors.primary};"></div>
                            <h4 class="mt-3" style="color: ${this.colors.secondary};">Cargando datos de asesores...</h4>
                            <p style="color: ${this.colors.textMedium};">Consultando métricas de la oficina <strong style="color: ${this.colors.primary};">${this.nombreOficina}</strong></p>
                        </div>
                    `);
                }
            } catch (error) {
                console.error("❌ Error en showLoadingState:", error);
            }
        },

        updateUI: function () {
            try {
                if (this.isLoading) {
                    this.showLoadingState();
                    return;
                }

                const container = this.$el.find("#asesores-container");
                if (container.length) {
                    container.html(this.getAsesoresHTML());
                }
            } catch (error) {
                console.error("❌ Error en updateUI:", error);
                this.mostrarErrorUI(error);
            }
        },

        mostrarErrorUI: function (error) {
            const container = this.$el.find("#asesores-container");
            if (container.length) {
                container.html(`
                    <div class="alert alert-danger" style="margin: 20px;">
                        <h4>Error al mostrar datos</h4>
                        <p>${error.message || "Error al cargar los datos"}</p>
                        <button class="btn btn-default" onclick="location.reload()">
                            <i class="fas fa-redo"></i> Reintentar
                        </button>
                        <button class="btn btn-default ml-2" data-action="volver">
                            <i class="fas fa-arrow-left"></i> Volver
                        </button>
                    </div>
                `);
            }
        },

        getAsesoresHTML: function () {
            try {
                if (this.datosAsesores.length === 0) {
                    return `
                <div class="panel panel-default" style="border-color: ${this.colors.lightGrey};">
                    <div class="panel-body text-center" style="padding: 40px;">
                        <i class="fas fa-user-tie fa-4x mb-3" style="color: ${this.colors.lightGrey};"></i>
                        <h4 style="color: ${this.colors.secondary};">No hay datos de asesores disponibles</h4>
                        <p style="color: ${this.colors.textMedium};">No se encontraron datos para la oficina <strong style="color: ${this.colors.primary};">${this.nombreOficina}</strong>.</p>
                        <button class="btn btn-default mt-2" data-action="volver" style="border-color: ${this.colors.lightGrey}; color: ${this.colors.secondary};">
                            <i class="fas fa-arrow-left me-1"></i> Volver
                        </button>
                    </div>
                </div>
            `;
                }

                var asesoresConDatos = this.datosAsesores.filter(function (
                    asesor
                ) {
                    return asesor.totalEncuestas > 0;
                });

                if (asesoresConDatos.length === 0) {
                    return `
                <div class="panel panel-default" style="border-color: ${this.colors.lightGrey};">
                    <div class="panel-body text-center" style="padding: 40px;">
                        <i class="fas fa-user-tie fa-4x mb-3" style="color: ${this.colors.lightGrey};"></i>
                        <h4 style="color: ${this.colors.secondary};">No hay asesores con datos</h4>
                        <p style="color: ${this.colors.textMedium};">Ningún asesor de esta oficina tiene encuestas completadas.</p>
                    </div>
                </div>
            `;
                }

                let html = `
            <div class="panel panel-default" style="border-color: ${
                this.colors.lightGrey
            };">
                <div class="panel-heading" style="background: linear-gradient(135deg, ${
                    this.colors.primary
                } 0%, ${
                    this.colors.secondary
                } 100%); color: white; padding: 15px; border-bottom: none;">
                    <h4 class="mb-0" style="font-weight: 600;">
                        <i class="fas fa-chart-line me-2"></i>
                        Comparación de Asesores - Oficina: ${this.nombreOficina}
                        <span class="badge" style="background-color: rgba(255,255,255,0.2); color: white; margin-left: 10px; font-weight: 500;">
                            ${asesoresConDatos.length} asesores con datos
                        </span>
                    </h4>
                    <div style="margin-top: 8px; font-size: 12px; opacity: 0.9;">
                        <i class="fas fa-info-circle me-1"></i>
                        <span id="mensaje-permisos" style="color: white;">
                            ${this.getMensajePermisos()}
                        </span>
                    </div>
                </div>
                <div class="panel-body" style="padding: 0;">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead style="background-color: ${
                                this.colors.background
                            };">
                                <tr>
                                    <th style="padding: 15px; border-bottom: 2px solid ${
                                        this.colors.lightGrey
                                    }; color: ${
                    this.colors.secondary
                }; font-weight: 600;">Asesor</th>
                                    <th style="padding: 15px; border-bottom: 2px solid ${
                                        this.colors.lightGrey
                                    }; color: ${
                    this.colors.secondary
                }; font-weight: 600;" class="text-center">Encuestas</th>
                                    <th style="padding: 15px; border-bottom: 2px solid ${
                                        this.colors.lightGrey
                                    }; color: ${
                    this.colors.secondary
                }; font-weight: 600;" class="text-center">Calificación</th>
                                    <th style="padding: 15px; border-bottom: 2px solid ${
                                        this.colors.lightGrey
                                    }; color: ${
                    this.colors.secondary
                }; font-weight: 600;">Desempeño</th>
                                </tr>
                            </thead>
                            <tbody>
        `;

                asesoresConDatos.forEach((asesor, index) => {
                    const asesorIdStr = asesor.id ? asesor.id.toString() : "";
                    const userIdStr = this.userId ? this.userId.toString() : "";
                    var esUsuarioActual = asesorIdStr === userIdStr;
                    var esClickeable = true; // Por defecto permitir

                    if (this.permisosUsuario) {
                        // ✅ NUEVA LÓGICA: Solo restringir si es asesor regular puro
                        if (this.permisosUsuario.esAsesorRegular) {
                            // Verificar si tiene roles de gestión
                            const tieneRolesGestion =
                                this.permisosUsuario.esGerente ||
                                this.permisosUsuario.esCoordinador ||
                                this.permisosUsuario.esDirector ||
                                this.permisosUsuario.esAfiliado ||
                                this.permisosUsuario.esCasaNacional;

                            // Si es asesor regular puro (sin roles de gestión), solo puede ver su perfil
                            if (!tieneRolesGestion) {
                                esClickeable = esUsuarioActual;
                            }
                        }
                    }

                    let colorBarra = this.colors.primary;
                    if (asesor.porcentaje >= 90) {
                        colorBarra = this.colors.primary;
                    } else if (asesor.porcentaje >= 80) {
                        colorBarra = this.colors.secondary;
                    } else if (asesor.porcentaje >= 70) {
                        colorBarra = this.colors.mediumGrey;
                    } else {
                        colorBarra = this.colors.lightGrey;
                    }

                    const bgColor = esUsuarioActual
                        ? `rgba(184, 162, 121, 0.1)`
                        : index % 2 === 0
                        ? this.colors.white
                        : `${this.colors.lightGrey}1A`;

                    const borderLeft = esUsuarioActual
                        ? `3px solid ${this.colors.primary}`
                        : "none";

                    html += `
                <tr class="asesor-row" 
                    data-id="${asesor.id}" 
                    data-es-usuario="${esUsuarioActual}"
                    data-clicable="${esClickeable}"
                    style="cursor: ${esClickeable ? "pointer" : "default"}; 
                           background-color: ${bgColor}; 
                           border-left: ${borderLeft};">
                    <td style="padding: 15px; color: ${
                        this.colors.secondary
                    }; font-weight: 500;">
                        <div style="display: flex; align-items: center;">
                            ${
                                esUsuarioActual
                                    ? `<i class="fas fa-user me-2" style="color: ${this.colors.primary};"></i>`
                                    : `<i class="fas fa-user-tie me-2" style="color: ${this.colors.textLight};"></i>`
                            }
                            <div>
                                ${asesor.nombre}
                                ${
                                    esUsuarioActual
                                        ? `<span class="badge badge-primary ml-2" style="background-color: ${this.colors.primary}; color: white; font-size: 10px; padding: 2px 6px;">TÚ</span>`
                                        : ""
                                }
                            </div>
                        </div>
                    </td>
                    <td class="text-center" style="padding: 15px;">
                        <span class="badge" style="background-color: ${
                            this.colors.primary
                        }; color: white; padding: 6px 10px; font-size: 12px;">
                            ${asesor.totalEncuestas || 0}
                        </span>
                    </td>
                    <td class="text-center" style="padding: 15px;">
                        <div style="color: ${
                            this.colors.secondary
                        }; font-weight: 600; font-size: 14px;">
                            ${asesor.promedioGeneral || 0}/5.0
                        </div>
                    </td>
                    <td style="padding: 15px;">
                        <div style="display: flex; align-items: center;">
                            <div class="progress" style="flex-grow: 1; height: 12px; margin-right: 15px; background-color: ${
                                this.colors.lightGrey
                            };">
                                <div class="progress-bar" style="background-color: ${colorBarra}; width: ${
                        asesor.porcentaje || 0
                    }%"></div>
                            </div>
                            <div style="color: ${colorBarra}; font-weight: 600; min-width: 45px; font-size: 13px; text-align: right;">
                                ${asesor.porcentaje || 0}%
                            </div>
                        </div>
                    </td>
                </tr>
            `;
                });

                html += `
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="panel-footer" style="background-color: ${
                    this.colors.background
                }; padding: 12px 15px; border-top: 1px solid ${
                    this.colors.lightGrey
                };">
                    <div class="row">
                        <div class="col-md-6">
                            <div style="color: ${
                                this.colors.textMedium
                            }; font-size: 12px;">
                                <i class="fas fa-info-circle me-1" style="color: ${
                                    this.colors.secondary
                                };"></i>
                                <span style="color: ${
                                    this.colors.secondary
                                }; font-weight: 600;">Leyenda:</span>
                                <span class="mx-2" style="color: ${
                                    this.colors.primary
                                }; font-weight: 500;">≥90% Excelente</span>
                                <span class="mx-2" style="color: ${
                                    this.colors.secondary
                                }; font-weight: 500;">≥80% Bueno</span>
                                <span class="mx-2" style="color: ${
                                    this.colors.mediumGrey
                                }; font-weight: 500;">≥70% Regular</span>
                                <span class="mx-2" style="color: ${
                                    this.colors.textLight
                                }; font-weight: 500;"><70% Por mejorar</span>
                            </div>
                        </div>
                        <div class="col-md-6 text-right">
                            <div style="color: ${
                                this.colors.textMedium
                            }; font-size: 12px;">
                                <i class="fas fa-info-circle me-1" style="color: ${
                                    this.colors.secondary
                                };"></i>
                                <span style="color: ${
                                    this.colors.secondary
                                }; font-weight: 600;">Tip:</span>
                                <span class="mx-2" style="color: ${
                                    this.colors.primary
                                }; font-weight: 500;">
                                    ${this.getMensajeClick()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

                return html;
            } catch (error) {
                console.error("❌ Error en getAsesoresHTML:", error);
                return `<div class="alert alert-danger">Error al generar la tabla: ${error.message}</div>`;
            }
        },

        getMensajePermisos: function () {
            if (!this.permisosUsuario) {
                return "Cargando permisos...";
            }

            if (this.permisosUsuario.esAsesorRegular) {
                return "Como asesor, solo puedes ver tus estadísticas individuales";
            } else if (
                this.permisosUsuario.esAdministrativo ||
                this.permisosUsuario.esCasaNacional
            ) {
                return "Puedes ver todas las estadísticas";
            } else if (
                this.permisosUsuario.esGerente ||
                this.permisosUsuario.esDirector ||
                this.permisosUsuario.esCoordinador ||
                this.permisosUsuario.esAfiliado
            ) {
                return "Puedes ver estadísticas de todos los asesores de tu oficina";
            }

            return "Permisos limitados";
        },

        getMensajeClick: function () {
            if (!this.permisosUsuario) {
                return "Haz clic para ver estadísticas";
            }

            if (this.permisosUsuario.esAsesorRegular) {
                return "Haz clic en TU nombre para ver tus estadísticas";
            }

            return "Haz clic en cualquier nombre para ver estadísticas detalladas";
        },

        onRemove: function () {
            try {
                this.$el.off("click", '[data-action="volver"]');
                this.$el.off("click", '[data-action="exportar"]');
                this.$el.off("change", "#selector-oficina");
                this.$el.off("click", ".asesor-row");
            } catch (error) {
                console.error("Error en onRemove:", error);
            }
        },
    });
});
