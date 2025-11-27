define('reportes-calidad-servicio:views/modules/permisos', function () {
    
    var PermisosManager = function (view) {
        this.view = view;
        this.permisos = {
            esAdministrativo: false,
            esCasaNacional: false,
            puedeImportar: false,
            claUsuario: null,
            permisosListo: false
        };
    };

    PermisosManager.prototype.cargarPermisosUsuario = function () {
        var self = this;
        return new Promise(function (resolve, reject) {
            var user = self.view.getUser();
            
            self.view.getModelFactory().create('User', function (userModel) {
                userModel.id = user.id;
                userModel.fetch({ relations: { roles: true, teams: true } }).then(function () {
                    var roles = Object.values(userModel.get('rolesNames') || {}).map(function (r) {
                        return r.toLowerCase();
                    });
                    var teamsIds = userModel.get('teamsIds') || [];
                    
                    self.permisos.esAdministrativo = roles.includes('administrativo') || 
                                                   roles.includes('administrator') || 
                                                   roles.includes('admin');
                    self.permisos.esCasaNacional = roles.includes('casa nacional');
                    self.permisos.puedeImportar = self.permisos.esAdministrativo;
                    
                    var claPattern = /^CLA\d+$/i;
                    self.permisos.claUsuario = teamsIds.find(function (id) {
                        return claPattern.test(id);
                    }) || null;
                    self.permisos.permisosListo = true;
                    
                    self.aplicarRestriccionesUI();
                    resolve(self.permisos);
                }).catch(reject);
            });
        });
    };

    PermisosManager.prototype.aplicarRestriccionesUI = function () {
        if (!this.view.$el) return;
        
        var fileSection = this.view.$el.find('.file-input-section');
        if (fileSection.length) {
            if (!this.permisos.puedeImportar) {
                fileSection.hide();
            } else {
                fileSection.show();
            }
        }
    };

    PermisosManager.prototype.getPermisos = function () {
        return this.permisos;
    };

    return PermisosManager;
});