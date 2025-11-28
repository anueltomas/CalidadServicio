define('reportes-calidad-servicio:views/modules/filtros-oficinas', [], function () {
    
    var FiltrosOficinasManager = function(view) {
        this.view = view;
    };

    FiltrosOficinasManager.prototype.loadOficinas = function(claId) {
        var oficinaSelect = this.view.$el.find('#oficina-select');
        
        if (!oficinaSelect.length) {
            return;
        }
        
        oficinaSelect.html('<option value="">Cargando oficinas...</option>');
        oficinaSelect.prop('disabled', true);
        
        var permisos = this.view.permisosManager.getPermisos();
        
        if (!permisos.esAdministrativo && !permisos.esCasaNacional) {
            if (permisos.oficinaUsuario) {
                this.cargarOficinaEspecifica(permisos.oficinaUsuario, oficinaSelect);
                return;
            }
        }
        
        this.cargarOficinasPorCLA(claId);
    };

    FiltrosOficinasManager.prototype.cargarOficinasPorCLA = function (claId) {
        var oficinaSelect = this.view.$el.find('#oficina-select');
    
        return Promise.all([
            this.fetchAllTeams(),
            this.fetchUsuariosPorCLA(claId)
        ]).then(function (results) {
            var teams = results[0];
            var usuariosConCLA = results[1];
            
            var claPattern = /^CLA\d+$/i;
            var oficinasIds = new Set();
            
            usuariosConCLA.forEach(function(usuario) {
                var teamsIds = usuario.teamsIds || [];
                teamsIds.forEach(function(teamId) {
                    if (!claPattern.test(teamId) && teamId.toLowerCase() !== 'venezuela') {
                        oficinasIds.add(teamId);
                    }
                });
            });
            
            var oficinas = teams.filter(function(t) {
                return oficinasIds.has(t.id);
            });
            
            oficinas.sort(function(a, b) {
                return (a.name || '').localeCompare(b.name || '');
            });
            
            oficinaSelect.html('<option value="">Todas las oficinas</option>');
            oficinas.forEach(function(oficina) {
                oficinaSelect.append('<option value="' + oficina.id + '">' + (oficina.name || oficina.id) + '</option>');
            });
            
            oficinaSelect.prop('disabled', false);
            
        }.bind(this)).catch(function (error) {
            oficinaSelect.html('<option value="">Error al cargar</option>');
            oficinaSelect.prop('disabled', false);
        });
    };

    FiltrosOficinasManager.prototype.fetchAllTeams = function () {
        return new Promise(function (resolve, reject) {
            var maxSize = 200;
            var allTeams = [];
            
            var fetchPage = function (offset) {
                this.view.getCollectionFactory().create('Team', function (collection) {
                    collection.maxSize = maxSize;
                    collection.offset = offset;
                    
                    collection.fetch().then(function () {
                        var models = collection.models || [];
                        allTeams = allTeams.concat(models.map(function(m) {
                            return {
                                id: m.id,
                                name: m.get('name')
                            };
                        }));
                        
                        if (models.length === maxSize && allTeams.length < collection.total) {
                            fetchPage(offset + maxSize);
                        } else {
                            resolve(allTeams);
                        }
                    }.bind(this)).catch(reject);
                }.bind(this));
            }.bind(this);
            
            fetchPage(0);
        }.bind(this));
    };

    FiltrosOficinasManager.prototype.fetchUsuariosPorCLA = function (claId) {
        return new Promise(function (resolve, reject) {
            var maxSize = 200;
            var allUsers = [];
            
            var fetchPage = function (offset) {
                this.view.getCollectionFactory().create('User', function (collection) {
                    collection.maxSize = maxSize;
                    collection.offset = offset;
                    collection.data = { select: 'teamsIds,teamsNames' };
                    
                    collection.fetch().then(function () {
                        var models = collection.models || [];
                        var filtered = models.filter(function(u) {
                            var teamsIds = u.get('teamsIds') || [];
                            return teamsIds.includes(claId);
                        }).map(function(m) {
                            return {
                                id: m.id,
                                teamsIds: m.get('teamsIds'),
                                teamsNames: m.get('teamsNames')
                            };
                        });
                        
                        allUsers = allUsers.concat(filtered);
                        
                        if (models.length === maxSize && (offset + maxSize) < collection.total) {
                            fetchPage(offset + maxSize);
                        } else {
                            resolve(allUsers);
                        }
                    }.bind(this)).catch(reject);
                }.bind(this));
            }.bind(this);
            
            fetchPage(0);
        }.bind(this));
    };

    FiltrosOficinasManager.prototype.cargarOficinaEspecifica = function(oficinaId, oficinaSelect) {
        this.view.getModelFactory().create('Team', function(teamModel) {
            teamModel.id = oficinaId;
            teamModel.fetch().then(function() {
                var oficina = {
                    id: teamModel.id,
                    name: teamModel.get('name') || oficinaId
                };
                
                oficinaSelect.empty();
                oficinaSelect.append('<option value="' + oficina.id + '">' + oficina.name + '</option>');
                oficinaSelect.val(oficina.id);
                oficinaSelect.prop('disabled', true);
                
                this.view.filtrosCLAManager.filtros.oficina = oficina.id;
                this.view.filtrosCLAManager.filtros.mostrarTodas = false;
                
            }.bind(this)).catch(function(error) {
                oficinaSelect.html('<option value="">Error al cargar</option>');
                oficinaSelect.prop('disabled', false);
            }.bind(this));
        }.bind(this));
    };

    FiltrosOficinasManager.prototype.poblarSelectOficinas = function(oficinas, oficinaSelect) {
        oficinaSelect.empty();
        oficinaSelect.append('<option value="">Todas las oficinas</option>');
        
        if (!oficinas || oficinas.length === 0) {
            oficinaSelect.append('<option value="" disabled>No hay oficinas para este CLA</option>');
        } else {
            oficinas.sort(function(a, b) {
                return (a.name || '').localeCompare(b.name || '');
            });
            
            oficinas.forEach(function(oficina) {
                var displayName = oficina.name || oficina.id;
                oficinaSelect.append('<option value="' + oficina.id + '">' + displayName + '</option>');
            });
        }
        
        oficinaSelect.prop('disabled', false);
    };

    FiltrosOficinasManager.prototype.setupEventListeners = function() {
        var selectOficina = this.view.$el.find('#oficina-select');
        
        if (selectOficina.length) {
            selectOficina.off('change').on('change', function(e) {
                var oficinaId = $(e.currentTarget).val();
                
                if (this.view.filtrosCLAManager && this.view.filtrosCLAManager.filtros) {
                    this.view.filtrosCLAManager.filtros.oficina = oficinaId || null;
                    this.view.filtrosCLAManager.filtros.mostrarTodas = false;
                    
                    if (this.view.estadisticasManager) {
                        this.view.estadisticasManager.loadStatistics();
                    }
                }
            }.bind(this));
        }
    };

    FiltrosOficinasManager.prototype.limpiarFiltros = function() {
        var oficinaSelect = this.view.$el.find('#oficina-select');
        if (oficinaSelect.length) {
            oficinaSelect.val('');
        }
    };

    return FiltrosOficinasManager;
});