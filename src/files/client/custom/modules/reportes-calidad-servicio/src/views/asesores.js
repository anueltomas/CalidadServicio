define("reportes-calidad-servicio:views/asesores", ["view"], function (Dep) {
    return Dep.extend({
        template: "reportes-calidad-servicio:asesores",

        setup: function () {
            console.log("👥 Vista de comparación de asesores inicializada");

            // Obtener oficinaId
            this.oficinaId =
                this.options.oficinaId ||
                this.getRouter().getCurrentUrlParams().oficinaId;

            if (!this.oficinaId) {
                console.error("❌ No se pudo obtener el ID de oficina");
                Espo.Ui.error("No se pudo identificar la oficina");
                this.getRouter().navigate("#Principal", { trigger: true });
                return;
            }

            // ✅ NUEVOS COLORES (copiados de oficinas.js)
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
            this.showLoadingState();
            this.setupEventListeners();
            // ✅ CAMBIAR: Usar la nueva función
            this.cargarDatosOficinaYAsesores();
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

                            // Actualizar UI con la información
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

        // ✅ 3. NUEVA FUNCIÓN: Actualizar header con información de oficina y CLA
        actualizarHeaderInfo: function () {
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
        },

        // ✅ 4. NUEVA FUNCIÓN: Actualizar selector de oficinas
        actualizarSelectorOficinas: function () {
            const selectOficina = this.$el.find("#selector-oficina");

            if (!selectOficina.length || this.oficinasList.length === 0) {
                return;
            }

            selectOficina.empty();

            // Agregar todas las oficinas del CLA
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
        },

        cargarDatosOficinaYAsesores: function () {
            console.log("📊 Cargando datos de oficina y asesores...");

            // Primero cargar info de oficina/CLA, luego asesores
            this.cargarInfoOficinaYCLA()
                .then(
                    function () {
                        // Ahora cargar asesores
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
                        console.error("❌ Error:", error);
                        Espo.Ui.error("Error al conectar con el servidor");
                        this.datosAsesores = [];
                        this.isLoading = false;
                        this.updateUI();
                    }.bind(this)
                );
        },

        setupEventListeners: function () {
            // Botón para volver
            this.$el.find('[data-action="volver"]').on("click", () => {
                this.volverAPrincipal();
            });

            // Botón para exportar
            this.$el.find('[data-action="exportar"]').on("click", () => {
                this.exportarReporte();
            });

            // ✅ CAMBIO AUTOMÁTICO: Detectar cambio en el selector y navegar automáticamente
            this.$el.find("#selector-oficina").on("change", (e) => {
                const nuevaOficinaId = $(e.currentTarget).val();

                if (nuevaOficinaId && nuevaOficinaId !== this.oficinaId) {
                    console.log(
                        "🔄 Cambio detectado en selector, navegando a oficina:",
                        nuevaOficinaId
                    );

                    // Mostrar indicador de carga
                    this.$el.find("#selector-oficina").prop("disabled", true);

                    // Navegar directamente a la nueva oficina
                    this.getRouter().navigate(
                        `#Principal/asesores/${nuevaOficinaId}`,
                        { trigger: true }
                    );
                }
            });

            this.$el.on("click", ".nombre-asesor-link", (e) => {
                e.preventDefault();
                e.stopPropagation();

                const asesorId =
                    $(e.currentTarget).data("id") ||
                    $(e.currentTarget).closest("[data-id]").data("id");
                console.log("🔗 Click en nombre de asesor - ID:", asesorId);

                if (asesorId) {
                    this.verDetalleAsesor(asesorId);
                }
            });
        },

        volverAPrincipal: function () {
            // Si tenemos claId, volver con ese filtro
            if (this.claId) {
                console.log("🔙 Volviendo a principal con CLA:", this.claId);
                // Navegar pero pasar información del CLA
                this.getRouter().navigate("#Principal", { trigger: true });
                // Aquí podrías guardar el claId en localStorage si quieres preservarlo
                if (window.localStorage) {
                    window.localStorage.setItem("lastClaId", this.claId);
                }
            } else {
                this.getRouter().navigate("#Principal", { trigger: true });
            }
        },

        cambiarOficina: function () {
            const nuevaOficinaId = this.$el.find("#selector-oficina").val();
            if (nuevaOficinaId && nuevaOficinaId !== this.oficinaId) {
                this.getRouter().navigate(
                    `#Principal/asesores/${nuevaOficinaId}`,
                    { trigger: true }
                );
            }
        },

        exportarReporte: function () {
            if (this.datosAsesores.length === 0) {
                Espo.Ui.warning("No hay datos para exportar");
                return;
            }

            let csv = "Asesor,Encuestas Totales,Promedio General,% Desempeño\n";

            this.datosAsesores.forEach((asesor) => {
                csv += `"${asesor.nombre}",${asesor.totalEncuestas},${asesor.promedioGeneral},${asesor.porcentaje}\n`;
            });

            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
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
        },

        verDetalleAsesor: function (asesorId) {
            console.log("🚀 Navegando a estadísticas del asesor:", asesorId);

            if (!asesorId) {
                console.error("❌ ID de asesor no válido");
                Espo.Ui.warning("No se pudo identificar el asesor");
                return;
            }

            // ✅ Guardar información de la oficina actual para poder volver
            if (this.oficinaId && window.localStorage) {
                window.localStorage.setItem("lastOficinaId", this.oficinaId);
                window.localStorage.setItem("lastAsesorId", asesorId);
            }

            // ✅ Navegar a la nueva vista
            try {
                const router = this.getRouter();
                if (router) {
                    router.navigate(
                        `#Principal/estadisticasAsesor/${asesorId}`,
                        {
                            trigger: true,
                            replace: false,
                        }
                    );
                    console.log("✅ Navegación iniciada");
                } else {
                    // Fallback
                    window.location.hash = `#Principal/estadisticas-asesor/${asesorId}`;
                }
            } catch (error) {
                console.error("❌ Error en navegación:", error);
                // Fallback directo
                window.location.hash = `#Principal/estadisticas-asesor/${asesorId}`;
            }
        },

        showLoadingState: function () {
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
        },

        updateUI: function () {
            if (this.isLoading) {
                this.showLoadingState();
                return;
            }

            const container = this.$el.find("#asesores-container");
            if (container.length) {
                container.html(this.getAsesoresHTML());
            }
        },

        getAsesoresHTML: function () {
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

            let html = `
    <div class="panel panel-default" style="border-color: ${this.colors.lightGrey};">
        <div class="panel-heading" style="background: linear-gradient(135deg, ${this.colors.primary} 0%, ${this.colors.secondary} 100%); color: white; padding: 15px; border-bottom: none;">
            <h4 class="mb-0" style="font-weight: 600;">
                <i class="fas fa-chart-line me-2"></i>
                Desempeño de Asesores
                <span class="badge" style="background-color: rgba(255,255,255,0.2); color: white; margin-left: 10px; font-weight: 500;">
                    ${this.datosAsesores.length} asesores
                </span>
            </h4>
        </div>
        <div class="panel-body" style="padding: 0;">
            <div class="table-responsive">
                <table class="table table-hover mb-0">
                    <thead style="background-color: ${this.colors.background};">
                        <tr>
                            <th style="padding: 15px; border-bottom: 2px solid ${this.colors.lightGrey}; color: ${this.colors.secondary}; font-weight: 600;">Asesor</th>
                            <th style="padding: 15px; border-bottom: 2px solid ${this.colors.lightGrey}; color: ${this.colors.secondary}; font-weight: 600;" class="text-center">Encuestas</th>
                            <th style="padding: 15px; border-bottom: 2px solid ${this.colors.lightGrey}; color: ${this.colors.secondary}; font-weight: 600;" class="text-center">Calificación</th>
                            <th style="padding: 15px; border-bottom: 2px solid ${this.colors.lightGrey}; color: ${this.colors.secondary}; font-weight: 600;">Desempeño</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

            this.datosAsesores.forEach((asesor, index) => {
                // Determinar color según porcentaje
                let colorBarra = this.colors.primary; // Por defecto

                if (asesor.porcentaje >= 90) {
                    colorBarra = this.colors.primary; // B8A279
                } else if (asesor.porcentaje >= 80) {
                    colorBarra = this.colors.secondary; // 363438
                } else if (asesor.porcentaje >= 70) {
                    colorBarra = this.colors.mediumGrey; // 666666
                } else {
                    colorBarra = this.colors.lightGrey; // E6E6E6
                }

                // Fondo alterno para las filas
                const bgColor =
                    index % 2 === 0
                        ? this.colors.white
                        : `${this.colors.lightGrey}1A`;

                // ✅ CORREGIDO: Agregar enlace clickeable al nombre del asesor
                html += `
        <tr class="asesor-row" data-id="${
            asesor.id
        }" style="cursor: default; background-color: ${bgColor};">
            <td style="padding: 15px; color: ${
                this.colors.secondary
            }; font-weight: 500;">
                <a href="javascript:void(0);" 
                   class="nombre-asesor-link" 
                   data-id="${asesor.id}"
                   style="color: ${
                       this.colors.secondary
                   }; text-decoration: none; cursor: pointer; display: flex; align-items: center;"
                   onmouseover="this.style.color='${
                       this.colors.primary
                   }'; this.style.textDecoration='underline';"
                   onmouseout="this.style.color='${
                       this.colors.secondary
                   }'; this.style.textDecoration='none';">
                    <i class="fas fa-user-tie me-2" style="color: ${
                        this.colors.primary
                    }; font-size: 14px;"></i>
                    ${asesor.nombre}
                    <i class="fas fa-external-link-alt ms-2" style="font-size: 11px; color: ${
                        this.colors.textLight
                    };"></i>
                </a>
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
                        <div class="progress-bar" 
                             style="background-color: ${colorBarra}; width: ${
                    asesor.porcentaje || 0
                }%">
                        </div>
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
        <div class="panel-footer" style="background-color: ${this.colors.background}; padding: 12px 15px; border-top: 1px solid ${this.colors.lightGrey};">
            <div class="row">
                <div class="col-md-6">
                    <div style="color: ${this.colors.textMedium}; font-size: 12px;">
                        <i class="fas fa-info-circle me-1" style="color: ${this.colors.secondary};"></i>
                        <span style="color: ${this.colors.secondary}; font-weight: 600;">Leyenda:</span>
                        <span class="mx-2" style="color: ${this.colors.primary}; font-weight: 500;">≥90% Excelente</span>
                        <span class="mx-2" style="color: ${this.colors.secondary}; font-weight: 500;">≥80% Bueno</span>
                        <span class="mx-2" style="color: ${this.colors.mediumGrey}; font-weight: 500;">≥70% Regular</span>
                        <span class="mx-2" style="color: ${this.colors.textLight}; font-weight: 500;"><70% Por mejorar</span>
                    </div>
                </div>
                <div class="col-md-6 text-right">
                    <div style="color: ${this.colors.textMedium}; font-size: 12px;">
                        <i class="fas fa-info-circle me-1" style="color: ${this.colors.secondary};"></i>
                        <span style="color: ${this.colors.secondary}; font-weight: 600;">Tip:</span>
                        <span class="mx-2" style="color: ${this.colors.primary}; font-weight: 500;">
                            Haz clic en el nombre de un asesor para ver sus estadísticas detalladas
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;

            return html;
        },
    });
});
