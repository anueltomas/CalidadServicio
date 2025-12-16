define("reportes-calidad-servicio:controllers/reportesCalidadServicio", [
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
        actionSaludar: function () {
            this.main("reportes-calidad-servicio:views/prueba");
        },

        actionCompararOficinas: function (options) {
            console.log("🏢 actionCompararOficinas");
            console.log("📦 Options:", options);
            console.log("📦 Type of options:", typeof options);

            // Extraer claId de diferentes formas
            let claId;

            if (typeof options === "string") {
                claId = options;
            } else if (options && options.claId) {
                claId = options.claId;
            } else if (options && options.id) {
                claId = options.id;
            }

            console.log("🔑 CLA ID final:", claId);

            if (!claId) {
                console.error("❌ No se pudo extraer claId");
                Espo.Ui.error("No se especificó un CLA válido");
                this.getRouter().navigate("#Principal", { trigger: true });
                return;
            }

            console.log("✅ Cargando vista con claId:", claId);

            // Cargar la vista con el claId
            this.main("reportes-calidad-servicio:views/oficinas", {
                claId: claId,
                scope: "CCustomerSurvey",
            });
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
