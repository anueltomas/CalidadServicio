define('reportes-calidad-servicio:views/modules/filtros-cla', [], function () {
    
    // ✅ DEFINIR EL CONSTRUCTOR
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
        console.log('✅ FiltrosCLAManager instanciado');
    };

    // ✅ AGREGAR MÉTODOS AL PROTOTIPO
    FiltrosCLAManager.prototype.cargarFiltros = function() {
        console.log('🔄 Cargando filtros CLA...');
        
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

                // ✅ AGREGAR ESTA LÍNEA - Cargar estadísticas después de cargar filtros
              console.log('📊 Iniciando carga de estadísticas después de filtros...');
              this.view.estadisticasManager.loadStatistics();
            }.bind(this));
        }.bind(this));
    };

    FiltrosCLAManager.prototype.procesarTeams = function(collection) {
        console.log('🏢 Procesando teams...');
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
    console.log('📋 Poblando select de CLA...');
    var claSelect = this.view.$el.find('#cla-select');
    if (!claSelect.length) {
        console.log('❌ No se encontró #cla-select');
        return;
    }
    
    claSelect.empty();
    claSelect.append('<option value="" selected>Territorio Nacional</option>');
    
    var permisos = this.view.permisosManager.getPermisos();
    var clasDisponibles = this.allTeams.clas;
    
    console.log('🎭 Permisos del usuario:', permisos);
    console.log('🏢 CLAs disponibles antes de filtrar:', clasDisponibles.length);
    
    // ✅ CORRECCIÓN: Solo aplicar restricciones si NO es administrativo NI casa nacional
    if (!permisos.esAdministrativo && !permisos.esCasaNacional) {
        console.log('🔒 Usuario regular - Aplicando restricciones...');
        if (permisos.claUsuario) {
            console.log('📌 Usuario limitado a su CLA:', permisos.claUsuario);
            clasDisponibles = clasDisponibles.filter(function(cla) {
                return cla.id === permisos.claUsuario;
            });
        } else {
            console.log('📌 Usuario sin CLA asignado');
            clasDisponibles = [];
        }
    } else {
        console.log('🌟 Usuario con permisos completos (Administrativo o Casa Nacional)');
        console.log('🏢 Mostrando todos los CLAs disponibles');
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
    console.log('✅ Select de CLA poblado con ' + clasDisponibles.length + ' opciones');
};

    // En filtros-cla.js - dentro de setupEventListeners
FiltrosCLAManager.prototype.setupEventListeners = function() {
    console.log('🎯 Configurando event listeners de CLA...');
    
    var claSelect = this.view.$el.find('#cla-select');
    console.log('🔍 Select CLA encontrado:', claSelect.length);
    
    if (claSelect.length) {
        // Remover cualquier listener previo
        claSelect.off('change');
        
        // Agregar nuevo listener
        claSelect.on('change', function(e) {
            var claId = $(e.currentTarget).val();
            console.log('🔘 CLA seleccionado:', claId);
            
            this.filtros.cla = claId || null;
            this.filtros.oficina = null;
            // CORRECCIÓN: mostrarTodas solo debe ser true cuando no hay CLA seleccionado
            this.filtros.mostrarTodas = !claId;
            
            var oficinaSelect = this.view.$el.find('#oficina-select');
            oficinaSelect.val('');
            
            console.log('🔄 Estado después de seleccionar CLA:', this.filtros);
            
            if (claId) {
                console.log('🏢 Iniciando carga de oficinas para CLA:', claId);
                if (this.view.filtrosOficinasManager && this.view.filtrosOficinasManager.loadOficinas) {
                    console.log('✅ Llamando a loadOficinas...');
                    this.view.filtrosOficinasManager.loadOficinas(claId);
                } else {
                    console.error('❌ loadOficinas no disponible en filtrosOficinasManager');
                }
            } else {
                console.log('🌍 Territorio Nacional seleccionado');
                oficinaSelect.empty();
                oficinaSelect.append('<option value="">Seleccione un CLA primero</option>');
                oficinaSelect.prop('disabled', true);
            }
            
            // Actualizar estadísticas
            console.log('📊 Actualizando estadísticas después de cambio de CLA...');
            this.view.estadisticasManager.loadStatistics();
        }.bind(this));
        
        console.log('✅ Event listeners de CLA configurados correctamente');
    } else {
        console.error('❌ No se encontró el select #cla-select');
    }
};
    FiltrosCLAManager.prototype.getFiltros = function() {
        return this.filtros;
    };

    // ✅ RETORNAR EL CONSTRUCTOR
    return FiltrosCLAManager;
});