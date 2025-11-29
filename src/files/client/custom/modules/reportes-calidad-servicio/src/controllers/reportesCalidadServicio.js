define("reportes-calidad-servicio:controllers/reportesCalidadServicio", [
    "controllers/base",
], function (Base) {
    return Base.extend({

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
        }

        
    });
});
