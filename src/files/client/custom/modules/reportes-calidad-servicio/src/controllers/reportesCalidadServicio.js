define('reportes-calidad-servicio:controllers/reportesCalidadServicio', ['controllers/base'], function (Base) {

    return Base.extend({
        
        checkAccess: function () {
            return true;
        },
        
        actionIndex: function () {
        this.main('reportes-calidad-servicio:views/principal', {}, view => view.render());
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