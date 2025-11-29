define('reportes-calidad-servicio:views/modules/graficos', [], function () {
    
    var GraficosManager = function(view) {
        this.view = view;
        this.charts = {};
    };

    GraficosManager.prototype.registrarPluginsChart = function() {
        if (typeof Chart === 'undefined') return;

        var barLabelsPlugin = {
            id: 'barLabels',
            afterDatasetsDraw: function(chart) {
                if (chart.config.type === 'bar') {
                    var ctx = chart.ctx;
                    
                    chart.data.datasets.forEach(function(dataset, datasetIndex) {
                        var meta = chart.getDatasetMeta(datasetIndex);
                        if (!meta.hidden) {
                            meta.data.forEach(function(element, index) {
                                var value = dataset.data[index];
                                
                                if (value > 0) {
                                    if (chart.options.indexAxis === 'y') {
                                        var textX = element.x + element.width + 8;
                                        var textY = element.y;
                                        
                                        ctx.fillStyle = '#333333';
                                        ctx.font = 'bold 13px Arial';
                                        ctx.textAlign = 'left';
                                        ctx.textBaseline = 'middle';
                                        ctx.fillText(value.toFixed(1), textX, textY);
                                    } else {
                                        var textX = element.x;
                                        var textY = element.y - 5;
                                        
                                        ctx.fillStyle = '#333333';
                                        ctx.font = 'bold 12px Arial';
                                        ctx.textAlign = 'center';
                                        ctx.textBaseline = 'bottom';
                                        ctx.fillText(value, textX, textY);
                                    }
                                }
                            });
                        }
                    });
                }
            }
        };
        
        Chart.register(barLabelsPlugin);
    };

    GraficosManager.prototype.renderCharts = function() {
        if (!this.view || !this.view.estadisticasManager) {
            return;
        }
        
        var stats = this.view.estadisticasManager.stats;
        
        if (!stats || stats.totalEncuestas === 0) {
            return;
        }
        
        if (typeof Chart === 'undefined') {
            this.mostrarErrorChartJS();
            return;
        }
        
        this.destroyCharts();
        
        var distribucion = stats.distribucionOperaciones || {};
        var promedios = stats.promediosCategorias || {};
        var distribucionCalificaciones = stats.distribucionCalificaciones || {};
        
        var venta = distribucion['Venta'] || 0;
        var compra = distribucion['Compra'] || 0;
        var alquiler = distribucion['Alquiler'] || 0;
        
        try {
            this.renderDonutChart(venta, compra, alquiler);
            this.renderBarChart(venta, compra, alquiler);
            this.renderRadarChart(promedios);
            this.renderHorizontalBarChart(promedios);
            this.renderDistributionChart(distribucionCalificaciones);
            
            // ✅ NUEVOS GRÁFICOS
            this.renderRecomendacionChart(stats.recomendacion);
            this.renderMediosContactoChart(stats.mediosContacto);
            
            if (stats.estadisticasOficinas && stats.estadisticasOficinas.length > 0) {
                this.renderOficinasChart(stats.estadisticasOficinas);
            }
            
        } catch (error) {
            this.mostrarErrorChartJS();
        }
    };

    GraficosManager.prototype.renderRecomendacionChart = function(recomendacion) {
        var ctx = document.getElementById('chart-recomendacion');
        
        if (!ctx) {
            return;
        }
        
        try {
            var si = recomendacion.si || 0;
            var no = recomendacion.no || 0;
            var total = si + no;
            var porcentajeSi = total > 0 ? Math.round((si / total) * 100) : 0;
            var porcentajeNo = total > 0 ? Math.round((no / total) * 100) : 0;
            
            this.charts.recomendacion = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Sí', 'No'],
                    datasets: [{
                        data: [si, no],
                        backgroundColor: ['#32442aff', '#666666'],
                        borderWidth: 3,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '50%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true,
                                font: {
                                    size: 13,
                                    weight: '600'
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    var label = context.label || '';
                                    var value = context.parsed || 0;
                                    var percentage = context.dataIndex === 0 ? porcentajeSi : porcentajeNo;
                                    return label + ': ' + value + ' (' + percentage + '%)';
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
        }
    };

    GraficosManager.prototype.renderMediosContactoChart = function(mediosContacto) {
        var ctx = document.getElementById('chart-medios-contacto');
        
        if (!ctx) {
            return;
        }
        
        try {
            var labels = [];
            var data = [];
            var colores = [
                '#B8A279', '#9D8B5F', '#1A1A1A', '#666666', '#E6E6E6',
                '#B8A279', '#9D8B5F', '#1A1A1A', '#666666', '#E6E6E6'
            ];
            
            Object.keys(mediosContacto).forEach(function(medio) {
                var valor = mediosContacto[medio];
                if (valor > 0) {
                    labels.push(medio);
                    data.push(valor);
                }
            });
            
            this.charts.mediosContacto = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Cantidad',
                        data: data,
                        backgroundColor: colores.slice(0, labels.length),
                        borderWidth: 0,
                        borderRadius: 6
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            beginAtZero: true,
                            grid: {
                                color: '#E6E6E6'
                            },
                            ticks: {
                                stepSize: 1
                            }
                        },
                        y: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                font: {
                                    size: 11
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return 'Contactos: ' + context.parsed.x;
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
        }
    };

    GraficosManager.prototype.renderOficinasChart = function(estadisticasOficinas) {
        var ctx = document.getElementById('chart-oficinas');
        
        if (!ctx) {
            return;
        }
        
        try {
            var labels = [];
            var dataEncuestas = [];
            var dataSatisfaccion = [];
            
            estadisticasOficinas.forEach(function(oficina) {
                labels.push(oficina.nombre);
                dataEncuestas.push(oficina.totalEncuestas);
                dataSatisfaccion.push(oficina.satisfaccionPromedio);
            });
            
            this.charts.oficinas = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Total Encuestas',
                            data: dataEncuestas,
                            backgroundColor: '#B8A279',
                            borderWidth: 0,
                            borderRadius: 6,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Satisfacción Promedio',
                            data: dataSatisfaccion,
                            backgroundColor: '#1A1A1A',
                            borderWidth: 0,
                            borderRadius: 6,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Total Encuestas',
                                font: {
                                    weight: 'bold'
                                }
                            },
                            grid: {
                                color: '#E6E6E6'
                            }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            beginAtZero: true,
                            max: 5,
                            title: {
                                display: true,
                                text: 'Satisfacción (1-5)',
                                font: {
                                    weight: 'bold'
                                }
                            },
                            grid: {
                                drawOnChartArea: false
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                font: {
                                    size: 10
                                },
                                maxRotation: 45,
                                minRotation: 45
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                usePointStyle: true,
                                padding: 15,
                                font: {
                                    size: 12,
                                    weight: '600'
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    var label = context.dataset.label || '';
                                    var value = context.parsed.y;
                                    if (context.datasetIndex === 1) {
                                        return label + ': ' + value.toFixed(1) + '/5';
                                    }
                                    return label + ': ' + value;
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
        }
    };

    GraficosManager.prototype.destroyCharts = function() {
        Object.values(this.charts).forEach(function(chart) {
            if (chart && typeof chart.destroy === 'function') {
                try {
                    chart.destroy();
                } catch (error) {
                }
            }
        });
        this.charts = {};
    };

    GraficosManager.prototype.renderDonutChart = function(venta, compra, alquiler) {
        var ctxDonut = document.getElementById('chart-donut');
        
        if (!ctxDonut) {
            return;
        }
        
        try {
            var total = venta + compra + alquiler;
            var data = [venta, compra, alquiler];
            
            this.charts.donut = new Chart(ctxDonut, {
                type: 'doughnut',
                data: {
                    labels: ['Venta', 'Compra', 'Alquiler'],
                    datasets: [{
                        data: data,
                        backgroundColor: ['#B8A279', '#9D8B5F', '#666666'],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '50%',
                    plugins: {
                        legend: {
                            display: true,
                            position: 'bottom',
                            labels: {
                                padding: 15,
                                usePointStyle: true,
                                pointStyle: 'circle',
                                font: {
                                    size: 12,
                                    weight: '600',
                                    family: "'Arial', sans-serif"
                                },
                                color: '#2c3e50',
                                generateLabels: function(chart) {
                                    var data = chart.data;
                                    if (data.labels.length && data.datasets.length) {
                                        return data.labels.map(function(label, i) {
                                            var value = data.datasets[0].data[i];
                                            var percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
                                            return {
                                                text: label + ': ' + value + ' (' + percentage + '%)',
                                                fillStyle: data.datasets[0].backgroundColor[i],
                                                hidden: false,
                                                index: i
                                            };
                                        });
                                    }
                                    return [];
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    var label = context.label || '';
                                    var value = context.parsed || 0;
                                    var percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
                                    return label + ': ' + value + ' (' + percentage + '%)';
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error renderizando gráfico donut:', error);
        }
    };

    GraficosManager.prototype.renderBarChart = function(venta, compra, alquiler) {
        var ctxBarras = document.getElementById('chart-barras');
        
        if (!ctxBarras) {
            return;
        }
        
        try {
            this.charts.barras = new Chart(ctxBarras, {
                type: 'bar',
                data: {
                    labels: ['Venta', 'Compra', 'Alquiler'],
                    datasets: [{
                        label: 'Cantidad',
                        data: [venta, compra, alquiler],
                        backgroundColor: ['#B8A279', '#9D8B5F', '#666666'],
                        borderWidth: 0,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: Math.ceil(Math.max(venta, compra, alquiler) / 5) || 1
                            },
                            grid: {
                                color: 'rgba(0,0,0,0.1)'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        } catch (error) {
        }
    };

    GraficosManager.prototype.renderRadarChart = function(promedios) {
        var ctxRadar = document.getElementById('chart-radar');
        
        if (!ctxRadar) {
            return;
        }
        
        try {
            this.charts.radar = new Chart(ctxRadar, {
                type: 'radar',
                data: {
                    labels: [
                        'Comunicación',
                        'Asesoría Legal',
                        'Presentación',
                        'Manejo Detalles',
                        'Puntualidad',
                        'Compromiso',
                        'Solución Problemas',
                        'Acompañamiento',
                        'Situaciones Imprevistas',
                        'Tiempos Negociación',
                        'Calificación Oficina'
                    ],
                    datasets: [{
                        label: 'Promedio de Calificación',
                        data: [
                            promedios.communicationEffectiveness || 0,
                            promedios.legalAdvice || 0,
                            promedios.personalPresentation || 0,
                            promedios.detailManagement || 0,
                            promedios.punctuality || 0,
                            promedios.commitmentLevel || 0,
                            promedios.problemSolving || 0,
                            promedios.fullSupport || 0,
                            promedios.unexpectedSituations || 0,
                            promedios.negotiationTiming || 0,
                            promedios.officeRating || 0
                        ],
                        backgroundColor: 'rgba(184, 162, 121, 0.2)',
                        borderColor: '#B8A279',
                        borderWidth: 2,
                        pointBackgroundColor: '#B8A279',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: '#B8A279'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        r: {
                            beginAtZero: true,
                            max: 5,
                            ticks: {
                                stepSize: 1,
                                callback: function(value) {
                                    return value.toFixed(1);
                                }
                            },
                            grid: {
                                color: 'rgba(0,0,0,0.1)'
                            },
                            pointLabels: {
                                font: {
                                    size: 11
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': ' + context.parsed.r.toFixed(1) + '/5';
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
        }
    };

    GraficosManager.prototype.renderHorizontalBarChart = function(promedios) {
        var ctxHorizontal = document.getElementById('chart-horizontal');
        
        if (!ctxHorizontal) {
            return;
        }
        
        try {
            this.charts.horizontal = new Chart(ctxHorizontal, {
                type: 'bar',
                data: {
                    labels: [
                        'Comunicación',
                        'Asesoría Legal', 
                        'Presentación Personal',
                        'Manejo de Detalles',
                        'Puntualidad',
                        'Compromiso',
                        'Solución Problemas',
                        'Acompañamiento',
                        'Situaciones Imprevistas',
                        'Tiempos Negociación',
                        'Calificación Oficina'
                    ],
                    datasets: [{
                        label: 'Calificación Promedio',
                        data: [
                            promedios.communicationEffectiveness || 0,
                            promedios.legalAdvice || 0,
                            promedios.personalPresentation || 0,
                            promedios.detailManagement || 0,
                            promedios.punctuality || 0,
                            promedios.commitmentLevel || 0,
                            promedios.problemSolving || 0,
                            promedios.fullSupport || 0,
                            promedios.unexpectedSituations || 0,
                            promedios.negotiationTiming || 0,
                            promedios.officeRating || 0
                        ],
                        backgroundColor: [
                            '#B8A279', '#9D8B5F', '#1A1A1A', '#666666', '#B8A279',
                            '#9D8B5F', '#1A1A1A', '#666666', '#B8A279', '#9D8B5F',
                            '#1A1A1A'
                        ],
                        borderWidth: 0,
                        borderRadius: 4
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            beginAtZero: true,
                            max: 5,
                            grid: {
                                color: 'rgba(0,0,0,0.1)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return value.toFixed(1);
                                }
                            }
                        },
                        y: {
                            grid: {
                                display: false
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return 'Calificación: ' + context.parsed.x.toFixed(1) + '/5';
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
        }
    };

    GraficosManager.prototype.renderDistributionChart = function(distribucionCalificaciones) {
        var ctxDistribution = document.getElementById('chart-distribution');
        
        if (!ctxDistribution) {
            return;
        }
        
        try {
            // ✅ CORRECCIÓN: Usar strings "1", "2", "3", "4", "5"
            var total = 0;
            ['1', '2', '3', '4', '5'].forEach(function(key) {
                total += (distribucionCalificaciones[key] || 0);
            });
            
            var data = [
                distribucionCalificaciones['5'] || 0,
                distribucionCalificaciones['4'] || 0,
                distribucionCalificaciones['3'] || 0,
                distribucionCalificaciones['2'] || 0,
                distribucionCalificaciones['1'] || 0
            ];

            this.charts.distribution = new Chart(ctxDistribution, {
                type: 'pie',
                data: {
                    labels: ['Excelente (5)', 'Muy Bueno (4)', 'Bueno (3)', 'Regular (2)', 'Deficiente (1)'],
                    datasets: [{
                        data: data,
                        backgroundColor: [
                            '#B8A279',  // 5 - Excelente
                            '#9D8B5F',  // 4 - Muy Bueno
                            '#666666',  // 3 - Bueno
                            '#1A1A1A',  // 2 - Regular
                            '#E6E6E6'   // 1 - Deficiente
                        ],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true,
                                font: {
                                    size: 11
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    var label = context.label || '';
                                    var value = context.parsed || 0;
                                    var percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                    return label + ': ' + value + ' (' + percentage + '%)';
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            //console.error('Error renderizando gráfico de distribución:', error);
        }
    };

    GraficosManager.prototype.mostrarErrorChartJS = function() {
        var container = this.view.$el.find('#dynamic-content-container')[0];
        if (container) {
            var graficosContainer = container.querySelector('.graficos-container');
            if (graficosContainer) {
                graficosContainer.innerHTML = `
                    <div class="empty-alert">
                        <div class="empty-icon">📊</div>
                        <h3>Error al cargar gráficos</h3>
                        <p class="text-muted">Chart.js no está disponible. Los datos se cargaron pero no se pueden mostrar los gráficos.</p>
                    </div>
                `;
            }
        }
    };

    return GraficosManager;
});