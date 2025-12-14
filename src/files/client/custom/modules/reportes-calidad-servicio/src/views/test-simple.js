Espo.define(
    "reportes-calidad-servicio:views/test-simple",
    ["view"],
    function (Dep) {
        return Dep.extend({
            template: "reportes-calidad-servicio:test-simple",

            events: {
                'click [data-action="volver"]': function () {
                    this.volverInicio();
                },
                'click [data-action="probar"]': function () {
                    this.probarNavegacion();
                },
            },

            setup: function () {
                console.log("🎯 Vista de prueba INICIADA");
                console.log("Opciones recibidas:", this.options);

                // Mostrar info en consola
                this.mostrarInfoDebug();
            },

            mostrarInfoDebug: function () {
                console.group("🔍 INFO DEBUG - VISTA TEST");
                console.log("1. Vista:", this.name);
                console.log("2. Template:", this.template);
                console.log("3. App disponible:", !!(window.app || Espo.app));

                var app = window.app || Espo.app;
                if (app) {
                    console.log("4. Router disponible:", !!app.router);
                    console.log(
                        "5. Rutas registradas:",
                        app.router && app.router.routes
                            ? Object.keys(app.router.routes).length
                            : 0
                    );

                    // Verificar si nuestra ruta está registrada
                    if (app.router && app.router.routes) {
                        var rutaTest = "reportes-calidad-servicio/test-simple";
                        console.log(
                            "6. ¿Ruta test registrada?:",
                            rutaTest in app.router.routes
                        );
                    }
                }
                console.groupEnd();
            },

            volverInicio: function () {
                console.log("🔙 Volviendo al inicio...");
                this.getRouter().navigate("", { trigger: true });
            },

            probarNavegacion: function () {
                console.log("🧪 Probando navegación...");

                // Probar diferentes rutas
                var rutasProbar = [
                    "",
                    "Home",
                    "reportes-calidad-servicio",
                    "reportes-calidad-servicio/test-simple?param=test",
                ];

                rutasProbar.forEach(function (ruta, index) {
                    setTimeout(function () {
                        console.log("Intentando navegar a:", ruta);
                        var app = window.app || Espo.app;
                        if (app && app.router) {
                            app.router.navigate(ruta, { trigger: true });
                        }
                    }, index * 2000);
                });
            },

            afterRender: function () {
                console.log("✅ Vista renderizada correctamente");

                // Actualizar info en la vista
                this.$el
                    .find("#params-received")
                    .text(JSON.stringify(this.options || {}));
            },
        });
    }
);
