define('reportes-calidad-servicio:views/modules/permisos', [], function () {
    
    var PermisosManager = function (view) {
        this.view = view;
        this.permisos = {
            esAdministrativo: false,
            esCasaNacional: false,
            puedeImportar: false,
            claUsuario: null,
            oficinaUsuario: null,
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
                    var defaultTeamId = userModel.get('default_team_id');
                    
                    // ✅ CORRECCIÓN: Solo verificar isAdmin() para permisos de importación
                    self.permisos.esAdministrativo = user.isAdmin();
                    self.permisos.esCasaNacional = roles.includes('casa nacional');
                    
                    // ✅ IMPORTANTE: Solo type=admin puede importar
                    self.permisos.puedeImportar = user.isAdmin();
                    
                    // Determinar CLA del usuario
                    var claPattern = /^CLA\d+$/i;
                    self.permisos.claUsuario = teamsIds.find(function (id) {
                        return claPattern.test(id);
                    }) || null;
                    
                    // Determinar oficina del usuario
                    if (defaultTeamId && 
                        !claPattern.test(defaultTeamId) && 
                        defaultTeamId.toLowerCase() !== 'venezuela') {
                        self.permisos.oficinaUsuario = defaultTeamId;
                    }
                    
                    self.permisos.permisosListo = true;
                    
                    self.aplicarRestriccionesUI();
                    resolve(self.permisos);
                }).catch(function(error) {
                    reject(error);
                });
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

    PermisosManager.prototype.puedeVerTodosCLAs = function() {
        return this.permisos.esAdministrativo || this.permisos.esCasaNacional;
    };

    PermisosManager.prototype.puedeVerTodasOficinas = function() {
        return this.permisos.esAdministrativo || this.permisos.esCasaNacional;
    };

    return PermisosManager;
});