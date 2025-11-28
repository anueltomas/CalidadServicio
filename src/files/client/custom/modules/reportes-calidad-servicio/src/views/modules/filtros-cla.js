define('reportes-calidad-servicio:views/modules/filtros-cla', [], function () {
    
    var FiltrosCLAManager = function(view) {
        this.view = view;
        this.filtros = {
            cla: null,
            oficina: null,
            mostrarTodas: true
        };
        this.allTeams = {
            clas: [],
            oficinas: []
        };
    };

    FiltrosCLAManager.prototype.cargarFiltros = function() {
        if (!this.view.permisosManager.permisos.permisosListo) {
            setTimeout(function() {
                this.cargarFiltros();
            }.bind(this), 100);
            return;
        }
        
        this.view.getCollectionFactory().create('Team', function(collection) {
            collection.maxSize = 500;
            collection.fetch().then(function() {
                this.procesarTeams(collection);
                this.populateCLASelect();

                this.view.estadisticasManager.loadStatistics();
            }.bind(this));
        }.bind(this));
    };

    FiltrosCLAManager.prototype.procesarTeams = function(collection) {
        this.allTeams.clas = [];
        this.allTeams.oficinas = [];
        
        collection.forEach(function(model) {
            var id = model.get('id');
            var name = model.get('name');
            
            if (id && id.startsWith('CLA')) {
                this.allTeams.clas.push({ id: id, name: name });
            } else {
                this.allTeams.oficinas.push({ id: id, name: name });
            }
        }.bind(this));
    };

    FiltrosCLAManager.prototype.populateCLASelect = function() {
        var claSelect = this.view.$el.find('#cla-select');
        if (!claSelect.length) {
            return;
        }
        
        claSelect.empty();
        
        var permisos = this.view.permisosManager.getPermisos();
        var clasDisponibles = this.allTeams.clas;
        
        if (!permisos.esAdministrativo && !permisos.esCasaNacional) {
            if (permisos.claUsuario) {
                clasDisponibles = clasDisponibles.filter(function(cla) {
                    return cla.id === permisos.claUsuario;
                });
            } else {
                clasDisponibles = [];
            }
        }
        
        var cla0 = clasDisponibles.find(function(cla) {
            return cla.id === 'CLA0';
        });
        
        if (cla0) {
            claSelect.append(
                $('<option></option>')
                    .val('')
                    .text('Territorio Nacional')
                    .prop('selected', true)
            );
            
            clasDisponibles = clasDisponibles.filter(function(cla) {
                return cla.id !== 'CLA0';
            });
        } else {
            claSelect.append(
                $('<option></option>')
                    .val('')
                    .text('Territorio Nacional')
                    .prop('selected', true)
            );
        }
        
        clasDisponibles.sort(function(a, b) {
            return a.name.localeCompare(b.name);
        });
        
        clasDisponibles.forEach(function(cla) {
            claSelect.append(
                $('<option></option>')
                    .val(cla.id)
                    .text(cla.name)
            );
        });
        
        claSelect.prop('disabled', false);
    };

    FiltrosCLAManager.prototype.setupEventListeners = function() {
        var claSelect = this.view.$el.find('#cla-select');
        
        if (claSelect.length) {
            claSelect.off('change');
            
            claSelect.on('change', function(e) {
                var claId = $(e.currentTarget).val();
                
                this.filtros.cla = claId || null;
                this.filtros.oficina = null;
                this.filtros.mostrarTodas = !claId;
                
                var oficinaSelect = this.view.$el.find('#oficina-select');
                oficinaSelect.val('');
                
                if (claId) {
                    if (this.view.filtrosOficinasManager && this.view.filtrosOficinasManager.loadOficinas) {
                        this.view.filtrosOficinasManager.loadOficinas(claId);
                    }
                } else {
                    oficinaSelect.empty();
                    oficinaSelect.append('<option value="">Seleccione un CLA primero</option>');
                    oficinaSelect.prop('disabled', true);
                }
                
                this.view.estadisticasManager.loadStatistics();
            }.bind(this));
        }
    };

    FiltrosCLAManager.prototype.getFiltros = function() {
        return this.filtros;
    };

    return FiltrosCLAManager;
});