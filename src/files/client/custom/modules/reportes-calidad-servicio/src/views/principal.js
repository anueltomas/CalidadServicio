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

            // Obtener si el usuario es admin le pasamos esAdmin a principal.tpl
            var user = this.getUser();
            this.esAdmin = user.isAdmin();
    
            // 1. PermisosManager
            if (typeof PermisosManager === 'function') {
                this.permisosManager = new PermisosManager(this);
            } else {
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
            } else {
                this.estadisticasManager = {
                    loadStatistics: function() { },
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
            } else {
                this.filtrosCLAManager = {
                    cargarFiltros: function() { },
                    setupEventListeners: function() {},
                    getFiltros: function() {
                        return { cla: null, oficina: null, mostrarTodas: true };
                    }
                };
            }
            
            // 4. FiltrosOficinasManager
            if (typeof FiltrosOficinasManager === 'function') {
                this.filtrosOficinasManager = new FiltrosOficinasManager(this);
            } else {
                this.filtrosOficinasManager = {
                    loadOficinas: function() { },
                    setupEventListeners: function() {}
                };
            }
            
            // 5. ImportadorCSV
            if (typeof ImportadorCSV === 'function') {
                this.importadorCSV = new ImportadorCSV(this);
            } else {
                this.importadorCSV = {
                    initMappings: function() {
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
            } else {
                this.graficosManager = {
                    registrarPluginsChart: function() { },
                    renderCharts: function() { },
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
            
            try {
                this.importadorCSV.initMappings();
            } catch (error) {
            }
            
            this.cargarChartJS();
        },

        data: function() {
            return {
                esAdmin: this.esAdmin
            };
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
            this.permisosManager.cargarPermisosUsuario()
                .then(function(permisos) {
                    this.filtrosCLAManager.cargarFiltros();
                }.bind(this))
                .catch(function(error) {
                    this.estadisticasManager.loadStatistics();
                }.bind(this));
        },

        afterRender: function () {
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

            this.$el.find('[data-action="import"]').off('click').on('click', () => {
                this.importadorCSV.actionImport();
            });

            this.$el.find('[data-action="refresh"]').off('click').on('click', () => {
                this.estadisticasManager.loadStatistics();
            });
            
            this.filtrosCLAManager.setupEventListeners();
            this.filtrosOficinasManager.setupEventListeners();
        },

        initMappings: function() {
            this.importadorCSV.initMappings();
        },

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