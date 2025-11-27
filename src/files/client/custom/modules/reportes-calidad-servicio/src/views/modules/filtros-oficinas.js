define('reportes-calidad-servicio:views/modules/filtros-oficinas', [], function () {
    
    var FiltrosOficinasManager = function(view) {
        this.view = view;
        console.log('✅ FiltrosOficinasManager instanciado');
    };

    // ✅ MÉTODO PRINCIPAL OPTIMIZADO
    FiltrosOficinasManager.prototype.loadOficinas = function(claId) {
        console.log('🏢 Cargando oficinas para CLA:', claId);
        
        var oficinaSelect = this.view.$el.find('#oficina-select');
        
        if (!oficinaSelect.length) {
            console.error('❌ No se encontró el select de oficinas');
            return;
        }
        
        oficinaSelect.html('<option value="">Cargando oficinas...</option>');
        oficinaSelect.prop('disabled', true);
        
        // ✅ ESTRATEGIA OPTIMIZADA: Usar default_team_id que ya tienes
        this.cargarOficinasPorDefaultTeam(claId).then(function(oficinas) {
            console.log('🏢 Oficinas encontradas:', oficinas.length);
            this.poblarSelectOficinas(oficinas, oficinaSelect);
        }.bind(this)).catch(function(error) {
            console.error('❌ Error cargando oficinas:', error);
            oficinaSelect.html('<option value="">Error al cargar oficinas</option>');
            oficinaSelect.prop('disabled', false);
        }.bind(this));
    };

    // ✅ MÉTODO OPTIMIZADO: Usar default_team_id de los usuarios del CLA
    FiltrosOficinasManager.prototype.cargarOficinasPorDefaultTeam = function(claId) {
    return new Promise(function(resolve, reject) {
        console.log('🔍 Buscando oficinas via default_team_id para CLA:', claId);
        
        var maxSize = 500;
        var oficinasIds = new Set();
        var usuariosProcesados = 0;
        var usuariosDelCLA = 0;
        
        var fetchPage = function(offset) {
            this.view.getCollectionFactory().create('User', function(collection) {
                // ✅ CONFIGURACIÓN MÁXIMA - SIN FILTROS
                collection.maxSize = maxSize;
                collection.offset = offset;
                collection.orderBy = 'userName';
                collection.order = 'asc';
                
                // ✅ ELIMINAR CUALQUIER FILTRO/WHERE EXISTENTE
                collection.data = null;
                collection.where = null;
                
                console.log('📥 Cargando página de usuarios, offset:', offset);
                console.log('⚙️ Configuración collection:', {
                    maxSize: collection.maxSize,
                    offset: collection.offset,
                    data: collection.data,
                    where: collection.where
                });
                
                collection.fetch().then(function() {
                    var models = collection.models || [];
                    usuariosProcesados += models.length;
                    
                    console.log('📄 Usuarios cargados en página:', models.length);
                    console.log('📊 Total usuarios procesados:', usuariosProcesados);
                    
                    // ✅ DIAGNÓSTICO DETALLADO
                    models.forEach(function(userModel) {
                        var teamsIds = userModel.get('teamsIds') || [];
                        var defaultTeamId = userModel.get('default_team_id');
                        var userName = userModel.get('userName');
                        var isActive = userModel.get('isActive');
                        
                        console.log('👤 Usuario:', userName, 
                                  '- Activo:', isActive,
                                  '- Teams:', teamsIds, 
                                  '- Default Team:', defaultTeamId);
                        
                        if (teamsIds.includes(claId)) {
                            usuariosDelCLA++;
                            console.log('  ✅ PERTENECE AL CLA', claId);
                            
                            if (defaultTeamId && 
                                !defaultTeamId.startsWith('CLA') && 
                                defaultTeamId.toLowerCase() !== 'venezuela') {
                                
                                oficinasIds.add(defaultTeamId);
                                console.log('  🏢 OFICINA AGREGADA:', defaultTeamId);
                            } else {
                                console.log('  ❌ Default team no válido o es CLA/Venezuela');
                            }
                        } else {
                            console.log('  ❌ NO pertenece al CLA', claId);
                        }
                    });
                    
                    console.log('👥 Usuarios del CLA encontrados:', usuariosDelCLA);
                    console.log('🏢 Oficinas encontradas hasta ahora:', oficinasIds.size);
                    
                    // ✅ Verificar si hay más páginas
                    var hasMore = models.length === maxSize;
                    
                    if (hasMore) {
                        console.log('⏭️ Cargando siguiente página...');
                        setTimeout(function() {
                            fetchPage(offset + maxSize);
                        }, 50);
                    } else {
                        console.log('🏁 Carga completada:');
                        console.log('  - Total usuarios procesados:', usuariosProcesados);
                        console.log('  - Usuarios del CLA:', usuariosDelCLA);
                        console.log('  - Oficinas únicas:', oficinasIds.size);
                        
                        if (usuariosDelCLA === 0) {
                            console.log('❌ PROBLEMA: No se encontraron usuarios para el CLA', claId);
                            console.log('💡 Posibles causas:');
                            console.log('   - El CLA no tiene usuarios asignados');
                            console.log('   - Los usuarios no están activos');
                            console.log('   - Problema en la relación team_user');
                        }
                        
                        if (oficinasIds.size === 0) {
                            resolve([]);
                            return;
                        }
                        
                        // ✅ Cargar nombres de las oficinas
                        this.cargarNombresOficinas(Array.from(oficinasIds)).then(resolve).catch(reject);
                    }
                }.bind(this)).catch(function(error) {
                    console.error('❌ Error cargando página de usuarios:', error);
                    reject(error);
                });
            }.bind(this));
        }.bind(this);
        
        fetchPage(0);
    }.bind(this));
};
    // ✅ CARGAR NOMBRES DE OFICINAS (igual que antes)
    FiltrosOficinasManager.prototype.cargarNombresOficinas = function(oficinasIds) {
        return new Promise(function(resolve, reject) {
            if (!oficinasIds || oficinasIds.length === 0) {
                resolve([]);
                return;
            }
            
            console.log('🔍 Cargando nombres para', oficinasIds.length, 'oficinas');
            
            this.cargarTodosLosTeams().then(function(allTeams) {
                console.log('📚 Todos los teams disponibles:', allTeams.length);
                
                var oficinasFiltradas = allTeams.filter(function(team) {
                    return oficinasIds.includes(team.id);
                });
                
                console.log('✅ Oficinas filtradas encontradas:', oficinasFiltradas.length);
                resolve(oficinasFiltradas);
                
            }).catch(function(error) {
                console.error('❌ Error cargando todos los teams:', error);
                reject(error);
            });
            
        }.bind(this));
    };

    // ✅ CARGAR TODOS LOS TEAMS (igual que antes)
    FiltrosOficinasManager.prototype.cargarTodosLosTeams = function() {
        return new Promise(function(resolve, reject) {
            console.log('🔄 Cargando todos los teams...');
            
            var allTeams = [];
            var maxSize = 500;
            
            var fetchPage = function(offset) {
                this.view.getCollectionFactory().create('Team', function(collection) {
                    collection.maxSize = maxSize;
                    collection.offset = offset;
                    collection.orderBy = 'name';
                    collection.order = 'asc';
                    
                    collection.fetch().then(function() {
                        var models = collection.models || [];
                        
                        var teamsPage = models.map(function(teamModel) {
                            return {
                                id: teamModel.id,
                                name: teamModel.get('name')
                            };
                        });
                        
                        allTeams = allTeams.concat(teamsPage);
                        console.log('📄 Teams cargados en página:', teamsPage.length);
                        
                        if (models.length === maxSize) {
                            setTimeout(function() {
                                fetchPage(offset + maxSize);
                            }, 100);
                        } else {
                            console.log('✅ Total teams cargados:', allTeams.length);
                            resolve(allTeams);
                        }
                    }).catch(function(error) {
                        console.error('❌ Error cargando página de teams:', error);
                        reject(error);
                    });
                }.bind(this));
            }.bind(this);
            
            fetchPage(0);
        }.bind(this));
    };

    // ✅ POBLAR SELECT CON OFICINAS (igual que antes)
    FiltrosOficinasManager.prototype.poblarSelectOficinas = function(oficinas, oficinaSelect) {
        oficinaSelect.empty();
        oficinaSelect.append('<option value="">Todas las oficinas</option>');
        
        if (!oficinas || oficinas.length === 0) {
            oficinaSelect.append('<option value="" disabled>No hay oficinas para este CLA</option>');
            console.log('📭 No hay oficinas disponibles');
        } else {
            oficinas.sort(function(a, b) {
                return (a.name || '').localeCompare(b.name || '');
            });
            
            oficinas.forEach(function(oficina) {
                var displayName = oficina.name || oficina.id;
                oficinaSelect.append('<option value="' + oficina.id + '">' + displayName + '</option>');
            });
            
            console.log('✅ Select poblado con', oficinas.length, 'oficinas');
        }
        
        oficinaSelect.prop('disabled', false);
    };

    // ✅ CONFIGURAR EVENT LISTENERS (igual que antes)
    FiltrosOficinasManager.prototype.setupEventListeners = function() {
        console.log('🎯 Configurando event listeners de oficinas...');
        
        var selectOficina = this.view.$el.find('#oficina-select');
        
        if (selectOficina.length) {
            selectOficina.off('change').on('change', function(e) {
                var oficinaId = $(e.currentTarget).val();
                console.log('🔘 Oficina seleccionada:', oficinaId);
                
                if (this.view.filtrosCLAManager && this.view.filtrosCLAManager.filtros) {
                    this.view.filtrosCLAManager.filtros.oficina = oficinaId || null;
                    this.view.filtrosCLAManager.filtros.mostrarTodas = false;
                    
                    console.log('🔄 Actualizando estadísticas con filtro de oficina...');
                    if (this.view.estadisticasManager) {
                        this.view.estadisticasManager.loadStatistics();
                    }
                }
            }.bind(this));
            
            console.log('✅ Event listeners de oficinas configurados');
        } else {
            console.warn('⚠️ Select de oficinas no encontrado para event listeners');
        }
    };

    // ✅ MÉTODO PARA LIMPIAR FILTROS (igual que antes)
    FiltrosOficinasManager.prototype.limpiarFiltros = function() {
        var oficinaSelect = this.view.$el.find('#oficina-select');
        if (oficinaSelect.length) {
            oficinaSelect.val('');
            console.log('🧹 Filtro de oficinas limpiado');
        }
    };

    return FiltrosOficinasManager;
});