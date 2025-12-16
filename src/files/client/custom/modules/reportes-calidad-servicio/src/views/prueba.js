define("reportes-calidad-servicio:views/prueba", ["view"], function (Dep) {
    return Dep.extend({
        template: "reportes-calidad-servicio:prueba",

        setup: function () {
            console.log("entro a prueba");
        },
    });
});
