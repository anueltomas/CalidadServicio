define("reportes-calidad-servicio:controllers/reportesCalidadServicio", [
    "controllers/base",
], function (Base) {
    return Base.extend({
        checkAccess: function () {
            return true;
        },

        defaultAction: "index",

        actionIndex: function () {
            const viewParams = {
                scope: "CCustomerSurvey",
                initialStats: this.getDefaultStats(),
                params: this.options.params || {},
                model: this.options.model || null,
                collection: this.options.collection || null,
            };

            this.main("reportes-calidad-servicio:views/principal", viewParams);
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

        // ✅ NUEVA: Acción para comparación de asesores
        actionComparacionAsesores: function (params) {
            const urlParams = new URLSearchParams(
                window.location.hash.split("?")[1] || ""
            );

            this.main(
                "reportes-calidad-servicio:views/comparacion-asesores",
                {
                    oficinaId: urlParams.get("oficina") || params.oficina,
                    claId: urlParams.get("cla") || params.cla,
                    oficinaNombre: decodeURIComponent(
                        urlParams.get("nombre") || params.nombre || "Oficina"
                    ),
                },
                function (view) {
                    view.render();
                }
            );
        },

        /* actionComparacionOficinas: function (params) {
            console.log("🔍 DEBUG: actionComparacionOficinas ejecutándose");
            console.log("🔍 DEBUG: params:", params);

            // Extraer parámetros de query string si es necesario
            const hash = window.location.hash;
            let claId = params.cla;
            let claNombre = params.nombre || "CLA";

            if (hash.includes("?")) {
                const queryString = hash.split("?")[1];
                const urlParams = new URLSearchParams(queryString);

                claId = claId || urlParams.get("cla") || "";
                claNombre = claNombre || urlParams.get("nombre") || "CLA";
            }

            this.main(
                "reportes-calidad-servicio:views/comparacion-oficinas",
                {
                    claId: claId,
                    claNombre: decodeURIComponent(claNombre),
                },
                function (view) {
                    view.render();
                }
            );
        }, */

        /* actionComparacionOficinas: function (params) {
            console.log(
                "🎯 actionComparacionOficinas EJECUTADA con params:",
                params
            );

            // Verificar que this.main existe
            console.log("this.main existe?", typeof this.main === "function");
            console.log("this:", this);

            this.main(
                "reportes-calidad-servicio:views/comparacionOficinas",
                {
                    claId: params.cla || "",
                    claNombre: decodeURIComponent(params.nombre || "CLA"),
                },
                function (view) {
                    console.log("✅ Callback de main ejecutado");
                    console.log("Vista:", view);
                    view.render();
                }
            );
        },
 */
        actionComparacionOficinas: function () {
            console.log("Estoy en actionComparacionOficinas");
            const viewParams = {
                scope: "CCustomerSurvey",
                initialStats: this.getDefaultStats(),
                params: this.options.params || {},
                model: this.options.model || null,
                collection: this.options.collection || null,
            };

            this.main(
                "reportes-calidad-servicio:views/comparacionOficinas",
                viewParams
            );
        },

        //PRUEBA
        // En tu controlador reportesCalidadServicio, agrega:
        actionTestSimple: function (params) {
            console.log("🎯 actionTestSimple EJECUTADA");
            console.log("Parámetros:", params);

            this.main(
                "reportes-calidad-servicio:views/test-simple",
                {
                    testParam: "Este es un parámetro de prueba",
                    timestamp: new Date().toISOString(),
                    params: params,
                },
                function (view) {
                    console.log("✅ Vista cargada correctamente");
                    view.render();
                }
            );
        },
    });
});
