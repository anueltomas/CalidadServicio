
define(['view'], function (View, $) {
    
    return View.extend({
        
        template: 'reportes-calidad-servicio:principal',
        
        events: {
            
        },

        setup: function () {
            this.wait(true);
            this.cargarDatos();

            this.stats = {};
            this.hasData = false;
            this.isLoading = true;
            
            this.loadStatistics();
        },


        data: function () {
            return {
                totalEncuestados: "1000",
                stats: this.stats || {},
                hasData: this.hasData,
                isLoading: this.isLoading
            };
        }, 

        cargarDatos: function() {
            this.getCollectionFactory().create('Principal', function(collection) {
                collection.fetch({
                    data: {
                        maxSize: 200,
                        orderBy: 'orden',
                        order: 'asc'
                    }
                }).then(function() {
                    collection.models.forEach(function(categoria) {
                        var nombre = categoria.get('name');
                        console.log(nombre);
                        if (nombre && nombre.toLowerCase() !== 'general') {
                            this.reportOptions.push({
                                id: 'detalle-' + this.slugify(nombre),
                                label: nombre,
                                icon: 'fas fa-chart-bar'
                            });
                        }
                    }.bind(this));
                    
                    this.wait(false);
                }.bind(this)).catch(function(xhr) {
                    console.warn('No se pudieron cargar categorías. Probablemente no hay ninguna creada aún.');
                    this.wait(false);
                }.bind(this));
            }.bind(this));
        },

         afterRender: function () {
            // Vincular eventos de botones
            this.$el.find('[data-action="import"]').on('click', () => {
                this.actionImport();
            });

            this.$el.find('[data-action="refresh"]').on('click', () => {
                this.loadStatistics();
            });

            // Renderizar gráficos si hay datos
            if (this.hasData && !this.isLoading) {
                this.renderCharts();
            }
        },

        loadStatistics: function () {
            this.isLoading = true;
            this.reRender();

            Espo.Ajax.getRequest('ReportesCalidadServicio/action/getStats')
                .then((response) => {
                    this.stats = response;
                    this.hasData = response.totalEncuestas > 0;
                    this.isLoading = false;
                    this.reRender();
                })
                .catch(() => {
                    Espo.Ui.error(this.translate('Error al cargar estadísticas', 'messages', 'ReportesCalidadServicio'));
                    this.isLoading = false;
                    this.reRender();
                });
        },

        actionImport: function () {
            this.createView('importModal', 'reportes-calidad-servicio:views/import-modal', {}, (view) => {
                view.render();
                
                this.listenToOnce(view, 'imported', (result) => {
                    // Recargar estadísticas después de importar
                    this.loadStatistics();
                    
                    Espo.Ui.success(
                        this.translate('Datos importados exitosamente', 'messages', 'ReportesCalidadServicio')
                    );
                });
            });
        },

        renderCharts: function () {
            // Gráfico de distribución de operaciones
            if (this.stats.distribucionOperaciones && this.stats.distribucionOperaciones.length > 0) {
                this.renderOperacionesChart();
            }

            // Gráfico de top asesores
            if (this.stats.topAsesores && this.stats.topAsesores.length > 0) {
                this.renderTopAsesoresChart();
            }

            // Gráfico de satisfacción
            this.renderSatisfaccionGauge();
        },

        renderOperacionesChart: function () {
            const ctx = this.$el.find('#operacionesChart')[0];
            if (!ctx) return;

            const data = this.stats.distribucionOperaciones;
            const labels = data.map(item => item.tipoOperacion);
            const values = data.map(item => item['COUNT:id']);

            new Chart(ctx.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: values,
                        backgroundColor: [
                            '#FF6384',
                            '#36A2EB',
                            '#FFCE56',
                            '#4BC0C0',
                            '#9966FF'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    legend: {
                        position: 'bottom'
                    }
                }
            });
        },

        renderTopAsesoresChart: function () {
            const ctx = this.$el.find('#asesoresChart')[0];
            if (!ctx) return;

            const data = this.stats.topAsesores;
            const labels = data.map(item => item.nombreAsesor.substring(0, 20));
            const values = data.map(item => item['COUNT:id']);
            const ratings = data.map(item => parseFloat(item['AVG:percepcionGeneral']).toFixed(2));

            new Chart(ctx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Número de Encuestas',
                        data: values,
                        backgroundColor: '#36A2EB',
                        yAxisID: 'y-axis-1'
                    }, {
                        label: 'Calificación Promedio',
                        data: ratings,
                        type: 'line',
                        borderColor: '#FF6384',
                        fill: false,
                        yAxisID: 'y-axis-2'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        yAxes: [{
                            id: 'y-axis-1',
                            type: 'linear',
                            position: 'left'
                        }, {
                            id: 'y-axis-2',
                            type: 'linear',
                            position: 'right',
                            ticks: {
                                min: 0,
                                max: 5
                            }
                        }]
                    }
                }
            });
        },

        renderSatisfaccionGauge: function () {
            const satisfaction = this.stats.promedioSatisfaccion || 0;
            const percentage = (satisfaction / 5) * 100;
            
            const $gauge = this.$el.find('.satisfaction-gauge');
            if (!$gauge.length) return;

            $gauge.find('.gauge-fill').css('width', percentage + '%');
            
            // Cambiar color según el nivel
            let color = '#d9534f'; // Rojo
            if (satisfaction >= 4) {
                color = '#5cb85c'; // Verde
            } else if (satisfaction >= 3) {
                color = '#f0ad4e'; // Amarillo
            }
            
            $gauge.find('.gauge-fill').css('background-color', color);
        }
        
        
    });
});