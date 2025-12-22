define("reportes-calidad-servicio:controllers/principal", [
    "controllers/base",
], function (Base) {
    return Base.extend({
        checkAccess: function () {
            return true;
        },

        defaultAction: "index",

        actionIndex: function (options) {
            const viewParams = {
                scope: "CCustomerSurvey",
                initialStats: this.getDefaultStats(),
                previousRoute: null,
            };

            this.main("reportes-calidad-servicio:views/principal", viewParams);
        },

        actionOficinas: function (options) {
            let claId;

            if (typeof options === "string") {
                claId = options;
            } else if (options && options.claId) {
                claId = options.claId;
            } else if (options && options.id) {
                claId = options.id;
            } else if (options && typeof options === "object") {
                claId = Object.values(options)[0];
            }

            if (!claId) {
                Espo.Ui.error("No se especificó un CLA válido");
                this.getRouter().navigate("#Principal", { trigger: true });
                return;
            }

            if (claId === "CLA0") {
                Espo.Ui.warning(
                    "No puedes comparar oficinas con Territorio Nacional"
                );
                this.getRouter().navigate("#Principal", { trigger: true });
                return;
            }

            const viewParams = {
                claId: claId,
                scope: "CCustomerSurvey",
                filtrosCompletos: `null-null-${claId}-null-null`,
                filtros: {
                    cla: claId,
                    anio: null,
                    oficina: null,
                    usuario: null,
                },
                previousRoute: "#Principal",
            };

            this.main("reportes-calidad-servicio:views/oficinas", viewParams);
        },

        actionAsesores: function (options) {
            let oficinaId;

            if (typeof options === "string") {
                oficinaId = options;
            } else if (options && options.oficinaId) {
                oficinaId = options.oficinaId;
            } else if (options && options.id) {
                oficinaId = options.id;
            }

            if (!oficinaId) {
                Espo.Ui.error("No se especificó una oficina válida");
                this.getRouter().navigate("#Principal", { trigger: true });
                return;
            }

            const viewParams = {
                oficinaId: oficinaId,
                scope: "CCustomerSurvey",
                previousRoute: "#Principal/oficinas/" + (options?.claId || ""),
            };

            this.main("reportes-calidad-servicio:views/asesores", viewParams);
        },

        actionEstadisticasAsesor: function (options) {
            let asesorId;

            if (typeof options === "string") {
                asesorId = options;
            } else if (options && options.asesorId) {
                asesorId = options.asesorId;
            } else if (options && options.id) {
                asesorId = options.id;
            }

            if (!asesorId) {
                Espo.Ui.error("No se especificó un asesor válido");
                this.getRouter().navigate("#Principal", { trigger: true });
                return;
            }

            const viewParams = {
                asesorId: asesorId,
                scope: "CCustomerSurvey",
                previousRoute:
                    "#Principal/asesores/" + (options?.oficinaId || ""),
            };

            this.main(
                "reportes-calidad-servicio:views/estadisticas-asesor",
                viewParams
            );
        },

        getDefaultStats: function () {
            return {
                totalEncuestas: 0,
                satisfaccionPromedio: 0,
                porcentajeRecomendacion: 0,
                tiposOperacion: 0,
                distribucionOperaciones: {
                    Venta: 0,
                    Compra: 0,
                    Alquiler: 0,
                },
                asesoresDestacados: [],
            };
        },
    });
});
