define('custom:controllers/reportes-calidad-servicio', [
    'controller'
], function (Dep) {
    return Dep.extend({
        getStats: function () {
            // Tu lógica para obtener estadísticas
            return {
                success: true,
                data: {
                    // tus datos aquí
                }
            };
        }
    });
});