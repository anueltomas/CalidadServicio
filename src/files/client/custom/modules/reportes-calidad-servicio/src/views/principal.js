define('reportes-calidad-servicio:views/principal', [
    'view',
    'reportes-calidad-servicio:views/modules/permisos',
    'reportes-calidad-servicio:views/modules/estadisticas',
    'reportes-calidad-servicio:views/modules/filtros-cla',
    'reportes-calidad-servicio:views/modules/filtros-oficinas',
    'reportes-calidad-servicio:views/modules/importador-csv',
    'reportes-calidad-servicio:views/modules/graficos'
], function (Dep, PermisosManager, EstadisticasManager, FiltrosCLAManager, FiltrosOficinasManager, ImportadorCSV, GraficosManager) {
    
    return Dep.extend({

        template: 'reportes-calidad-servicio:principal',

        setup: function () {
    console.log('🔧 Inicializando módulos...');
    
    // DEBUG: Verificar TODOS los módulos antes de inicializar
    console.log('=== VERIFICACIÓN DE MÓDULOS CARGADOS ===');
    console.log('PermisosManager:', typeof PermisosManager);
    console.log('EstadisticasManager:', typeof EstadisticasManager);
    console.log('FiltrosCLAManager:', typeof FiltrosCLAManager);
    console.log('FiltrosOficinasManager:', typeof FiltrosOficinasManager);
    console.log('ImportadorCSV:', typeof ImportadorCSV);
    console.log('GraficosManager:', typeof GraficosManager);
    console.log('====================================');
    
    // 1. PermisosManager
    if (typeof PermisosManager === 'function') {
        this.permisosManager = new PermisosManager(this);
        console.log('✅ PermisosManager inicializado');
    } else {
        console.error('❌ PermisosManager NO es una función - Módulo no cargado');
        this.permisosManager = {
            cargarPermisosUsuario: function() { 
                return Promise.reject('Módulo no cargado');
            },
            getPermisos: function() { 
                return { puedeImportar: false, permisosListo: false };
            },
            aplicarRestriccionesUI: function() {}
        };
    }
    
    // 2. EstadisticasManager
    if (typeof EstadisticasManager === 'function') {
        this.estadisticasManager = new EstadisticasManager(this);
        console.log('✅ EstadisticasManager inicializado');
    } else {
        console.error('❌ EstadisticasManager NO es una función - Módulo no cargado');
        this.estadisticasManager = {
            loadStatistics: function() { 
                console.log('Módulo de estadísticas no disponible');
            },
            showLoadingState: function() {
                var container = this.view.$el.find('#dynamic-content-container')[0];
                if (container) {
                    container.innerHTML = '<div style="padding: 40px; text-align: center; color: red;">❌ Módulo de estadísticas no cargado</div>';
                }
            },
            updateUI: function() {}
        };
    }
    
    // 3. FiltrosCLAManager
    if (typeof FiltrosCLAManager === 'function') {
        this.filtrosCLAManager = new FiltrosCLAManager(this);
        console.log('✅ FiltrosCLAManager inicializado');
    } else {
        console.error('❌ FiltrosCLAManager NO es una función - Módulo no cargado');
        this.filtrosCLAManager = {
            cargarFiltros: function() {
                console.log('Módulo de filtros CLA no disponible');
            },
            setupEventListeners: function() {},
            getFiltros: function() {
                return { cla: null, oficina: null, mostrarTodas: true };
            }
        };
    }
    
    // 4. FiltrosOficinasManager
    if (typeof FiltrosOficinasManager === 'function') {
        this.filtrosOficinasManager = new FiltrosOficinasManager(this);
        console.log('✅ FiltrosOficinasManager inicializado');
    } else {
        console.error('❌ FiltrosOficinasManager NO es una función - Módulo no cargado');
        this.filtrosOficinasManager = {
            loadOficinas: function() {
                console.log('Módulo de filtros oficinas no disponible');
            },
            setupEventListeners: function() {}
        };
    }
    
    // 5. ImportadorCSV
    if (typeof ImportadorCSV === 'function') {
        this.importadorCSV = new ImportadorCSV(this);
        console.log('✅ ImportadorCSV inicializado');
    } else {
        console.error('❌ ImportadorCSV NO es una función - Módulo no cargado');
        this.importadorCSV = {
            initMappings: function() {
                console.log('⚠️ ImportadorCSV no cargado - initMappings temporal');
                // Mapeos básicos para evitar errores
                this.camposOrdenBD = [];
                this.csvToFieldMapping = {};
            },
            actionImport: function() {
                Espo.Ui.error('❌ Módulo de importación no disponible');
            }
        };
    }
    
    // 6. GraficosManager
    if (typeof GraficosManager === 'function') {
        this.graficosManager = new GraficosManager(this);
        console.log('✅ GraficosManager inicializado');
    } else {
        console.error('❌ GraficosManager NO es una función - Módulo no cargado');
        this.graficosManager = {
            registrarPluginsChart: function() {
                console.log('Módulo de gráficos no disponible');
            },
            renderCharts: function() {
                console.log('Módulo de gráficos no disponible');
            },
            destroyCharts: function() {}
        };
    }
    
    // Estado inicial
    this.hasData = false;
    this.isLoading = true;
    this.filtros = {
        cla: null,
        oficina: null,
        mostrarTodas: true
    };
    
    console.log('=== INICIALIZACIÓN DE MÓDULOS COMPLETADA ===');
    console.log('Módulos cargados correctamente:', {
        permisos: !!this.permisosManager,
        estadisticas: !!this.estadisticasManager,
        filtrosCLA: !!this.filtrosCLAManager,
        filtrosOficinas: !!this.filtrosOficinasManager,
        importador: !!this.importadorCSV,
        graficos: !!this.graficosManager
    });
    
    // Ahora estas llamadas son seguras
    try {
        this.importadorCSV.initMappings();
        console.log('✅ Mapeos CSV inicializados');
    } catch (error) {
        console.error('❌ Error en initMappings:', error);
    }
    
    this.cargarChartJS();
    
    console.log('✅ Setup completado exitosamente');
},

        cargarChartJS: function() {
            if (typeof Chart === 'undefined') {
                var script = document.createElement('script');
                script.src = 'client/custom/modules/reportes-calidad-servicio/lib/chart.min.js';
                script.onload = function() {
                    this.graficosManager.registrarPluginsChart();
                    this.cargarPermisosYFiltros();
                }.bind(this);
                script.onerror = function() {
                    Espo.Ui.error('Error al cargar la librería de gráficos');
                    this.cargarPermisosYFiltros();
                }.bind(this);
                document.head.appendChild(script);
            } else {
                this.graficosManager.registrarPluginsChart();
                this.cargarPermisosYFiltros();
            }
        },

        cargarPermisosYFiltros: function() {
            console.log('🔄 Cargando permisos y filtros...');
            
            this.permisosManager.cargarPermisosUsuario()
                .then(function(permisos) {
                    console.log('✅ Permisos cargados:', permisos);
                    this.filtrosCLAManager.cargarFiltros();
                    
                    // ✅ O también puedes cargar estadísticas directamente aquí
                    // this.estadisticasManager.loadStatistics();
                    
                }.bind(this))
                .catch(function(error) {
                    console.error('❌ Error cargando permisos:', error);
                    // Cargar estadísticas incluso si hay error en permisos
                    console.log('📊 Cargando estadísticas sin permisos...');
                    this.estadisticasManager.loadStatistics();
                }.bind(this));
        },

        afterRender: function () {
            console.log('3. afterRender ejecutado');
            this.showLoadingState();
            this.setupEventListeners();
        },

        setupEventListeners: function() {
            const fileInput = this.$el.find('#csv-file-input')[0];
            const fileName = this.$el.find('#file-name')[0];
            
            if (fileInput && fileName) {
                fileInput.addEventListener('change', function() {
                    if (this.files && this.files[0]) {
                        fileName.textContent = this.files[0].name;
                        fileName.classList.add('has-file');
                    } else {
                        fileName.textContent = 'No se ha seleccionado ningún archivo';
                        fileName.classList.remove('has-file');
                    }
                });
            }

            // Delegar acciones a los managers correspondientes
            this.$el.find('[data-action="import"]').off('click').on('click', () => {
                this.importadorCSV.actionImport();
            });

            this.$el.find('[data-action="refresh"]').off('click').on('click', () => {
                this.estadisticasManager.loadStatistics();
            });
            
            // Event listeners para filtros
            this.filtrosCLAManager.setupEventListeners();
            this.filtrosOficinasManager.setupEventListeners();
        },

        initMappings: function() {
            this.importadorCSV.initMappings();
        },

        // Métodos de UI que pueden ser usados por todos los managers
        showLoadingState: function() {
            this.estadisticasManager.showLoadingState();
        },

        updateUI: function() {
            this.estadisticasManager.updateUI();
        },

        aplicarRestriccionesUI: function() {
            this.permisosManager.aplicarRestriccionesUI();
        }

    });
});