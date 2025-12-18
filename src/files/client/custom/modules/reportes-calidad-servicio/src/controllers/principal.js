define("reportes-calidad-servicio:controllers/principal", [
    "controllers/base",
], function (Base) {
    return Base.extend({
        checkAccess: function () {
            console.log("🔐 checkAccess - reportesCalidadServicio");
            return true;
        },

        defaultAction: "index",

        // ✅ CORRECCIÓN: Recibir options como parámetro
        actionIndex: function (options) {
            console.log("🎯 actionIndex - Cargando vista principal");
            console.log("📦 Options:", options);

            const viewParams = {
                scope: "CCustomerSurvey",
                initialStats: this.getDefaultStats(),
            };

            this.main("reportes-calidad-servicio:views/principal", viewParams);
        },

        actionOficinas: function (options) {
            console.log("🏢 actionCompararOficinas");
            console.log("📦 Options recibidas:", options);

            // Extraer claId
            let claId;

            if (typeof options === "string") {
                claId = options;
            } else if (options && options.claId) {
                claId = options.claId;
            } else if (options && options.id) {
                claId = options.id;
            }

            console.log("🔑 CLA ID extraído en controlador:", claId);

            if (!claId) {
                console.error("❌ No se pudo extraer claId del controlador");
                Espo.Ui.error("No se especificó un CLA válido");
                this.getRouter().navigate("#Principal", { trigger: true });
                return;
            }

            // ✅ CORRECCIÓN: Pasar claId como parte de viewParams
            const viewParams = {
                claId: claId, // ✅ Esto es lo más importante
                scope: "CCustomerSurvey",
                filtrosCompletos: `null-null-${claId}-null-null`, // ✅ También pasa el filtro completo
                filtros: {
                    cla: claId,
                    anio: null,
                    oficina: null,
                    usuario: null,
                },
            };

            console.log("🎯 ViewParams para vista oficinas:", viewParams);

            // ✅ Pasar correctamente los parámetros a la vista
            this.main("reportes-calidad-servicio:views/oficinas", viewParams);
        },

        actionAsesores: function (options) {
            console.log("👥 actionCompararAsesores");
            console.log("📦 Options:", options);

            let oficinaId;

            if (typeof options === "string") {
                oficinaId = options;
            } else if (options && options.oficinaId) {
                oficinaId = options.oficinaId;
            } else if (options && options.id) {
                oficinaId = options.id;
            }

            console.log("🔑 Oficina ID final:", oficinaId);

            if (!oficinaId) {
                console.error("❌ No se pudo extraer oficinaId");
                Espo.Ui.error("No se especificó una oficina válida");
                this.getRouter().navigate("#Principal", { trigger: true });
                return;
            }

            console.log("✅ Cargando vista con oficinaId:", oficinaId);

            this.main("reportes-calidad-servicio:views/asesores", {
                oficinaId: oficinaId,
                scope: "CCustomerSurvey",
            });
        },

        actionEstadisticasAsesor: function (options) {
            console.log("📊 actionEstadisticasAsesor");
            console.log("📦 Options recibidas:", options);

            // Extraer asesorId
            let asesorId;

            if (typeof options === "string") {
                asesorId = options;
            } else if (options && options.asesorId) {
                asesorId = options.asesorId;
            } else if (options && options.id) {
                asesorId = options.id;
            }

            console.log("🔑 Asesor ID extraído:", asesorId);

            if (!asesorId) {
                console.error("❌ No se pudo extraer asesorId");
                Espo.Ui.error("No se especificó un asesor válido");
                this.getRouter().navigate("#Principal", { trigger: true });
                return;
            }

            // Pasar parámetros a la vista
            const viewParams = {
                asesorId: asesorId,
                scope: "CCustomerSurvey",
            };

            console.log(
                "🎯 ViewParams para vista estadísticas asesor:",
                viewParams
            );

            // Cargar la nueva vista
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
