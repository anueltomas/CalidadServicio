define('reportes-calidad-servicio:controllers/reportesCalidadServicio', ['controllers/base'], function (Base) {

    return Base.extend({
        
        defaultAction: 'index',
        
        actionIndex: function () {
            console.log('🔍 Controlador CCustomerSurvey - actionIndex ejecutado');
            console.log('🔍 Opciones recibidas:', this.options);
            
            // Enviar parámetros explícitamente a la vista
            const viewParams = {
                scope: 'CCustomerSurvey',
                initialStats: this.getDefaultStats(),
                // Incluir todos los parámetros importantes
                params: this.options.params || {},
                model: this.options.model || null,
                collection: this.options.collection || null
            };
            
            console.log('📤 Enviando parámetros a la vista:', viewParams);
            
            this.main('reportes-calidad-servicio:views/principal', viewParams);
        },

        getDefaultStats: function () {
            return {
                totalEncuestas: 0,
                satisfaccionPromedio: 0,
                porcentajeRecomendacion: 0,
                tiposOperacion: 0,
                distribucionOperaciones: {
                    'Venta': 0,
                    'Compra': 0, 
                    'Alquiler': 0
                },
                asesoresDestacados: []
            };
        },

        /* 
        
        actionTeamSelection: function () {
            this.main('reportes-calidad-servicio:views/seleccionEquipo', {}, view => view.render());
        },

        actionRoleSelection: function (params) {
            this.main('competencias:views/seleccionRol', {
                teamId: params.teamId,
                teamName: params.teamName
            }, view => view.render());
        },

        actionUserSelection: function (params) {
            this.main('competencias:views/seleccionUsuario', {
                teamId: params.teamId,
                teamName: params.teamName,
                role: params.role
            }, view => view.render());
        },

        actionSurvey: function (params) {
            this.main('competencias:views/encuesta', {
                teamId: params.teamId,
                teamName: params.teamName,
                role: params.role,
                userId: params.userId,
                userName: params.userName
            }, view => view.render());
        }, */

        actionReports: function () {
            this.main('reportes-calidad-servicio:views/reportePrincipal', {}, function (view) {
                view.render();
            });
        }

        /* actionReporteBase: function (params) {
            this.main('competencias:views/reporteBase', {
                tipo: params.tipo,
                oficinaId: params.oficinaId,
                oficinaName: params.oficinaName
            }, function (view) {
                view.render();
            });
        } */
    });
});