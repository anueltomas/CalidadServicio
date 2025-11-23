define('reportes-calidad-servicio:views/principal', ['view'], function (Dep) {
    
    return Dep.extend({

        template: 'reportes-calidad-servicio:principal',

        setup: function () {
            console.log('🚀 Iniciando vista de Calidad de Servicio');
            
            this.hasData = false;
            this.isLoading = true;
            this.stats = {
                totalEncuestas: 0,
                satisfaccionPromedio: 0,
                porcentajeRecomendacion: 0,
                tiposOperacion: 0,
                distribucionOperaciones: {},
                asesoresDestacados: [],
                promediosCategorias: {},
                distribucionCalificaciones: {},
                efectividadComunicacion: 0,
                asesoriaLegal: 0,
                presentacionPersonal: 0,
                manejoDetalles: 0,
                puntualidad: 0,
                compromiso: 0,
                solucionProblemas: 0,
                acompanamiento: 0,
                situacionesImprevistas: 0,
                tiemposNegociacion: 0,
                calificacionOficina: 0
            };
            
            this.charts = {};
            
            this.initMappings();
            
            if (typeof Chart === 'undefined') {
                console.log('📦 Cargando Chart.js...');
                var script = document.createElement('script');
                script.src = 'client/custom/modules/reportes-calidad-servicio/lib/chart.min.js';
                script.onload = function() {
                    console.log('✅ Chart.js cargado correctamente');
                    this.registrarPluginsChart();
                    this.loadStatistics();
                }.bind(this);
                script.onerror = function() {
                    console.error('❌ Error al cargar Chart.js');
                    Espo.Ui.error('Error al cargar la librería de gráficos');
                    this.loadStatistics();
                }.bind(this);
                document.head.appendChild(script);
            } else {
                this.registrarPluginsChart();
                this.loadStatistics();
            }
        },

        afterRender: function () {
            console.log('✅ Vista renderizada');
            this.showLoadingState();
            this.setupEventListeners();
        },

        registrarPluginsChart: function() {
            if (typeof Chart === 'undefined') return;

            const barLabelsPlugin = {
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
        },

        initMappings: function() {
            console.log('🔧 Inicializando mapeos según orden de campos de la BD...');
            
            this.camposOrdenBD = [
                'created_at', 'email_address', 'operation_type', 'assigned_user_id',
                'communicationEffectiveness', 'legal_advice', 'personal_presentation',
                'detail_management', 'punctuality', 'commitment_level', 'problem_solving',
                'full_support', 'unexpected_situations', 'negotiation_timing',
                'general_advisor_rating', 'office_rating', 'recommendation',
                'contact_medium', 'additional_feedback', 'client_name'
            ];
            
            this.csvToFieldMapping = {
                'Marca temporal': 'createdAt',
                'Correo': 'emailAddress',
                '1. ¿Qué tipo de operación realizó?': 'operationType',
                'ID Asesor': 'assignedUserId',
                'Efectividad y regularidad en la Comunicación': 'communicationEffectiveness',
                'Asesoría legal, fiscal y financiera': 'legalAdvice',
                'Presentación Personal e Imagen': 'personalPresentation',
                'Manejo de los detalles': 'detailManagement',
                'Puntualidad': 'punctuality',
                'Nivel de compromiso en el servicio': 'commitmentLevel',
                'Solución de problemas': 'problemSolving',
                'Acompañamiento de inicio a fin': 'fullSupport',
                'Manejo de situaciones Imprevistas': 'unexpectedSituations',
                'Manejo de los tiempos de la negociación': 'negotiationTiming',
                '4. En general, ¿Cómo percibió el servicio prestado por el Asesor Inmobiliario de Century21': 'generalAdvisorRating',
                '5. ¿Cómo califica el servicio prestado por la oficina Century 21?': 'officeRating',
                '6. ¿Recomendaría el servicio de Century 21 a un amigo/familiar?': 'recommendation',
                '7. ¿Por cuál medio se puso en contacto con la oficina/asesor Century 21?': 'contactMedium',
                '8. Sugerencia adicional para mejorar el servicio asesor/oficina Century 21 . Estamos seguros de que hay algo más que le hubiera gustado que hiciera asesor/oficina por usted.': 'additionalFeedback',
                '10. Escriba su Primer Nombre y Primer Apellido.': 'clientName'
            };

            this.contactMediumMapping = {
                'Contacto Directo': '0', 'Familiar / Amigo': '1', 'Página Web Century21': '2',
                'Mercado Libre': '3', 'Instagram': '4', 'Facebook / Marketplace': '5',
                'Whatsapp': '6', 'Estados de Whatsapp': '7', 'Valla o Rótulo de Venta/Alquiler': '8',
                'Visita en oficina': '9', 'Otro': 'contactMediumOther'
            };

            this.fieldsScale0to4 = [
                'communicationEffectiveness', 'legalAdvice', 'personalPresentation',
                'detailManagement', 'punctuality', 'commitmentLevel', 'problemSolving',
                'fullSupport', 'unexpectedSituations', 'negotiationTiming', 'officeRating'
            ];
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
                this.actionImport();
            });

            this.$el.find('[data-action="refresh"]').off('click').on('click', () => {
                this.loadStatistics();
            });
        },

        validateAndTransformCSV: function(csvData) {
            try {
                console.log('🔄 Procesando CSV con validación estricta...');
                
                const lines = csvData.split('\n').filter(line => line.trim());
                if (lines.length < 2) {
                    return {
                        success: false,
                        data: [],
                        errors: ['❌ El archivo CSV está vacío o solo contiene encabezados.'],
                        stats: { total: 0, valid: 0, invalid: 1 }
                    };
                }
                
                const headers = this.parseCSVLine(lines[0], null);
                console.log('📋 Headers encontrados:', headers);

                const columnMapping = this.findColumnsInCSV(headers);
                console.log('🎯 Mapeo de columnas:', columnMapping);

                if (!columnMapping.clientName) {
                    return {
                        success: false,
                        data: [],
                        errors: [
                            '❌ COLUMNA CRÍTICA FALTANTE:',
                            '• No se encontró: "10. Escriba su Primer Nombre y Primer Apellido."',
                            '• Esta columna es obligatoria para la importación'
                        ],
                        stats: { total: 0, valid: 0, invalid: 1 }
                    };
                }

                const transformedData = [];
                const warnings = [];
                const scaleCorrections = [];

                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i].trim()) continue;
                    
                    try {
                        const originalRow = this.parseCSVLine(lines[i], headers);
                        const transformResult = this.transformRow(originalRow, columnMapping, i + 1);
                        
                        if (transformResult.corrections.length > 0) {
                            scaleCorrections.push(...transformResult.corrections);
                        }
                        
                        transformedData.push(transformResult.data);
                        
                    } catch (error) {
                        warnings.push(`Línea ${i + 1}: ${error.message}`);
                    }
                }

                console.log(`✅ Procesados ${transformedData.length} registros`);
                console.log(`🔧 Aplicadas ${scaleCorrections.length} correcciones de escala`);
                
                return {
                    success: true,
                    data: transformedData,
                    errors: warnings,
                    scaleCorrections: scaleCorrections,
                    stats: {
                        total: lines.length - 1,
                        valid: transformedData.length,
                        invalid: warnings.length,
                        corrections: scaleCorrections.length
                    }
                };

            } catch (error) {
                console.error('💥 Error crítico:', error);
                return {
                    success: false,
                    data: [],
                    errors: [`❌ ERROR: ${error.message}`],
                    stats: { total: 0, valid: 0, invalid: 1 }
                };
            }
        },

        findColumnsInCSV: function(headers) {
            const mapping = {};
            
            Object.keys(this.csvToFieldMapping).forEach(csvColumn => {
                const fieldName = this.csvToFieldMapping[csvColumn];
                const foundColumn = headers.find(h => h.trim() === csvColumn);
                
                if (foundColumn) {
                    mapping[fieldName] = foundColumn;
                    console.log(`✅ ${fieldName} → "${foundColumn}"`);
                } else {
                    console.warn(`⚠️ ${fieldName} → NO encontrado (buscaba "${csvColumn}")`);
                }
            });
            
            return mapping;
        },

        parseCSVLine: function(line, headers) {
            const values = [];
            let currentValue = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(currentValue.trim());
                    currentValue = '';
                } else {
                    currentValue += char;
                }
            }
            values.push(currentValue.trim());
            
            if (!headers) {
                return values;
            }
            
            const result = {};
            headers.forEach((header, index) => {
                result[header] = values[index] || '';
            });
            
            return result;
        },

        transformRow: function(csvRow, columnMapping, lineNumber) {
            const transformed = {};
            const corrections = [];
            
            console.log(`🔄 Transformando línea ${lineNumber}...`);

            // 1. created_at
            if (columnMapping.createdAt && csvRow[columnMapping.createdAt]) {
                const value = csvRow[columnMapping.createdAt].trim();
                if (value) {
                    transformed.createdAt = this.transformDate(value);
                }
            }

            // 2. email_address
            if (columnMapping.emailAddress && csvRow[columnMapping.emailAddress]) {
                const value = csvRow[columnMapping.emailAddress].trim();
                if (value) {
                    transformed.emailAddress = value;
                }
            }

            // 3. operation_type
            if (columnMapping.operationType && csvRow[columnMapping.operationType]) {
                const value = csvRow[columnMapping.operationType].trim();
                if (value) {
                    transformed.operationType = value;
                }
            }

            // 4. assigned_user_id
            if (columnMapping.assignedUserId && csvRow[columnMapping.assignedUserId]) {
                const value = csvRow[columnMapping.assignedUserId].trim();
                if (value) {
                    transformed.assignedUserId = value;
                }
            }

            // 5-15. Campos de calificación 0-4 CON CORRECCIÓN 5→4
            const ratingFields = [
                'communicationEffectiveness', 'legalAdvice', 'personalPresentation',
                'detailManagement', 'punctuality', 'commitmentLevel', 'problemSolving',
                'fullSupport', 'unexpectedSituations', 'negotiationTiming', 'officeRating'
            ];

            ratingFields.forEach(field => {
                if (columnMapping[field] && csvRow[columnMapping[field]]) {
                    const value = csvRow[columnMapping[field]].trim();
                    if (value !== '' && value !== 'NA' && value !== 'N/A') {
                        const numericValue = parseInt(value);
                        if (!isNaN(numericValue)) {
                            if (numericValue === 5) {
                                transformed[field] = '4';
                                corrections.push(`Línea ${lineNumber}, ${field}: 5 → 4`);
                            } else if (numericValue >= 0 && numericValue <= 4) {
                                transformed[field] = numericValue.toString();
                            }
                        }
                    }
                }
            });

            // 16. general_advisor_rating (escala 1-5)
            if (columnMapping.generalAdvisorRating && csvRow[columnMapping.generalAdvisorRating]) {
                const value = csvRow[columnMapping.generalAdvisorRating].trim();
                if (value !== '' && value !== 'NA' && value !== 'N/A') {
                    const numericValue = parseInt(value);
                    if (!isNaN(numericValue) && numericValue >= 1 && numericValue <= 5) {
                        transformed.generalAdvisorRating = numericValue.toString();
                    }
                }
            }

            // 17. recommendation
            if (columnMapping.recommendation && csvRow[columnMapping.recommendation]) {
                const value = csvRow[columnMapping.recommendation].trim().toLowerCase();
                if (value) {
                    const positiveValues = ['si lo recomendaría', 'si', 'sí', 'yes', '1', 'true'];
                    transformed.recommendation = positiveValues.includes(value) ? '1' : '0';
                }
            }

            // 18. contact_medium
            if (columnMapping.contactMedium && csvRow[columnMapping.contactMedium]) {
                const value = csvRow[columnMapping.contactMedium].trim();
                if (value) {
                    const contactData = this.transformContactMedium(value);
                    transformed.contactMedium = contactData.contactMedium;
                    transformed.contactMediumOther = contactData.contactMediumOther;
                }
            }

            // 19. additional_feedback
            if (columnMapping.additionalFeedback && csvRow[columnMapping.additionalFeedback]) {
                const value = csvRow[columnMapping.additionalFeedback].trim();
                if (value) {
                    transformed.additionalFeedback = value;
                }
            }

            // 20. client_name (OBLIGATORIO)
            if (columnMapping.clientName && csvRow[columnMapping.clientName]) {
                const value = csvRow[columnMapping.clientName].trim();
                if (value) {
                    transformed.clientName = value;
                }
            }

            transformed.estatus = '2';

            return {
                data: transformed,
                corrections: corrections
            };
        },

        transformContactMedium: function(value) {
            const mapped = this.contactMediumMapping[value];
            if (mapped === 'contactMediumOther') {
                return { contactMedium: ['9'], contactMediumOther: value };
            } else if (mapped) {
                return { contactMedium: [mapped], contactMediumOther: '' };
            } else {
                return { contactMedium: ['9'], contactMediumOther: value };
            }
        },

        transformDate: function(value) {
            try {
                if (!value || value === 'NA' || value === 'N/A') return null;
                const [datePart, timePart] = value.split(' ');
                const [month, day, year] = datePart.split('/');
                const fullYear = year.length === 2 ? '20' + year : year;
                const dateString = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}${timePart ? 'T' + timePart : ''}`;
                const date = new Date(dateString);
                return !isNaN(date.getTime()) ? date.toISOString() : null;
            } catch (e) {
                return null;
            }
        },

        actionImport: function() {
            const fileInput = this.$el.find('#csv-file-input')[0];
            
            if (!fileInput?.files?.[0]) {
                Espo.Ui.warning('Por favor selecciona un archivo CSV primero.', null, 8000);
                return;
            }
            
            const file = fileInput.files[0];
            
            if (!file.name.endsWith('.csv')) {
                Espo.Ui.error('❌ El archivo debe ser CSV (.csv)', null, 10000);
                return;
            }
            
            console.log('📤 Procesando archivo:', file.name);
            Espo.Ui.notify('🔍 Validando estructura del CSV...', 'info', 60000);
            this.wait(true);
            
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const contenidoCSV = e.target.result;
                    const validationResult = this.validateAndTransformCSV(contenidoCSV);
                    
                    if (!validationResult.success) {
                        let errorMessage = '❌ ERROR EN CSV<br><br>';
                        errorMessage += validationResult.errors.join('<br>');
                        Espo.Ui.error(errorMessage, null, 15000);
                        this.wait(false);
                        return;
                    }
                    
                    let message = '✅ CSV VALIDADO CORRECTAMENTE<br><br>';
                    message += `<strong>Resumen:</strong><br>`;
                    message += `• Total registros: ${validationResult.stats.total}<br>`;
                    message += `• Registros válidos: ${validationResult.stats.valid}<br>`;
                    
                    if (validationResult.scaleCorrections && validationResult.scaleCorrections.length > 0) {
                        message += `• <strong>Correcciones 5→4: ${validationResult.scaleCorrections.length}</strong><br>`;
                    }
                    
                    Espo.Ui.success(message, null, 15000);
                    this.iniciarProcesoDeCarga(validationResult.data);
                    
                } catch (error) {
                    console.error('💥 Error:', error);
                    Espo.Ui.error('❌ ERROR: ' + error.message, null, 10000);
                    this.wait(false);
                }
            };
            
            reader.onerror = () => {
                Espo.Ui.error('❌ No se pudo leer el archivo', null, 10000);
                this.wait(false);
            };
            
            reader.readAsText(file, 'UTF-8');
        },

        iniciarProcesoDeCarga: async function(encuestasValidadas) {
            try {
                console.log('📤 Enviando datos al servidor...');
                
                if (!encuestasValidadas || encuestasValidadas.length === 0) {
                    throw new Error('No hay datos válidos para importar');
                }
                
                Espo.Ui.notify('📤 Importando datos...', 'info', 120000);
                
                const result = await Espo.Ajax.postRequest('CCustomerSurvey/action/importarEncuestas', {
                    encuestas: encuestasValidadas
                });
                
                console.log('📨 Respuesta del servidor:', result);
                
                if (result.success) {
                    let mensaje = `✅ IMPORTACIÓN EXITOSA<br><br>`;
                    mensaje += `<strong>Resultados:</strong><br>`;
                    mensaje += `• Registros procesados: ${result.procesadas || 0}<br>`;
                    mensaje += `• Duplicados omitidos: ${result.duplicadas || 0}<br>`;
                    mensaje += `• Errores: ${result.errores?.length || 0}<br>`;
                    
                    Espo.Ui.success(mensaje, null, 15000);
                    
                    this.$el.find('#csv-file-input').val('');
                    this.$el.find('#file-name').text('No se ha seleccionado ningún archivo').removeClass('has-file');
                    
                    setTimeout(() => {
                        this.loadStatistics();
                    }, 3000);
                    
                } else {
                    throw new Error(result.error || 'Error en el servidor');
                }
                
            } catch (error) {
                console.error('💥 Error en importación:', error);
                Espo.Ui.error('❌ ERROR: ' + error.message, null, 15000);
            } finally {
                this.wait(false);
            }
        },

        loadStatistics: function () {
            console.log('📞 Solicitando estadísticas...');
            
            this.isLoading = true;
            this.hasData = false;
            this.showLoadingState();

            Espo.Ajax.getRequest('CCustomerSurvey/action/getStats')
                .then((response) => {
                    console.log('✅ Estadísticas recibidas:', response);
                    
                    if (response && response.success && response.data) {
                        this.stats = this.procesarEstadisticasReales(response.data);
                        this.hasData = this.stats.totalEncuestas > 0;
                        this.isLoading = false;
                        this.updateUI();
                    } else {
                        console.warn('⚠️ Respuesta vacía o sin datos');
                        this.handleNoData();
                    }
                })
                .catch((error) => {
                    console.error('❌ Error cargando estadísticas:', error);
                    this.handleNoData();
                });
        },

        procesarEstadisticasReales: function(datosBackend) {
            console.log('🔄 Procesando estadísticas reales desde backend:', datosBackend);
            
            // Extraer promedios de categorías del backend
            const promediosBackend = datosBackend.promediosCategorias || {};
            
            return {
                // Datos básicos del backend
                totalEncuestas: datosBackend.totalEncuestas || 0,
                satisfaccionPromedio: datosBackend.satisfaccionPromedio || 0,
                porcentajeRecomendacion: datosBackend.porcentajeRecomendacion || 0,
                tiposOperacion: datosBackend.tiposOperacion || 0,
                distribucionOperaciones: datosBackend.distribucionOperaciones || {},
                asesoresDestacados: datosBackend.asesoresDestacados || [],
                
                // Promedios del backend
                promediosCategorias: promediosBackend,
                distribucionCalificaciones: datosBackend.distribucionCalificaciones || {},
                
                // Datos individuales para gráficos
                efectividadComunicacion: promediosBackend.communicationEffectiveness || 0,
                asesoriaLegal: promediosBackend.legalAdvice || 0,
                presentacionPersonal: promediosBackend.personalPresentation || 0,
                manejoDetalles: promediosBackend.detailManagement || 0,
                puntualidad: promediosBackend.punctuality || 0,
                compromiso: promediosBackend.commitmentLevel || 0,
                solucionProblemas: promediosBackend.problemSolving || 0,
                acompanamiento: promediosBackend.fullSupport || 0,
                situacionesImprevistas: promediosBackend.unexpectedSituations || 0,
                tiemposNegociacion: promediosBackend.negotiationTiming || 0,
                calificacionOficina: promediosBackend.officeRating || 0
            };
        },

        showLoadingState: function() {
            const container = this.$el.find('#dynamic-content-container')[0];
            if (container) {
                container.innerHTML = this.getLoadingHTML();
            }
        },

        handleNoData: function() {
            this.hasData = false;
            this.isLoading = false;
            this.updateUI();
        },

        updateUI: function() {
            const container = this.$el.find('#dynamic-content-container')[0];
            if (!container) return;

            if (this.isLoading) {
                container.innerHTML = this.getLoadingHTML();
            } else if (this.hasData) {
                container.innerHTML = this.getDataHTML();
                setTimeout(() => {
                    this.renderCharts();
                }, 100);
            } else {
                container.innerHTML = this.getEmptyHTML();
                setTimeout(() => this.setupEmptyEventListeners(), 100);
            }
        },

        renderCharts: function() {
            console.log('📊 Renderizando gráficos con datos reales...');
            
            if (typeof Chart === 'undefined') {
                console.error('❌ Chart.js no está disponible');
                this.mostrarErrorChartJS();
                return;
            }
            
            this.destroyCharts();
            
            const stats = this.stats;
            const distribucion = stats.distribucionOperaciones || {};
            
            const venta = distribucion['Venta'] || 0;
            const compra = distribucion['Compra'] || 0;
            const alquiler = distribucion['Alquiler'] || 0;
            
            try {
                this.renderDonutChart(venta, compra, alquiler);
                this.renderBarChart(venta, compra, alquiler);
                this.renderRadarChart();
                this.renderHorizontalBarChart();
                this.renderDistributionChart();
                
                console.log('✅ Todos los gráficos renderizados correctamente');
            } catch (error) {
                console.error('💥 Error al renderizar gráficos:', error);
                this.mostrarErrorChartJS();
            }
        },

        destroyCharts: function() {
            Object.values(this.charts).forEach(chart => {
                if (chart && typeof chart.destroy === 'function') {
                    chart.destroy();
                }
            });
            this.charts = {};
        },

        renderDonutChart: function(venta, compra, alquiler) {
            const ctxDonut = document.getElementById('chart-donut');
            if (ctxDonut) {
                try {
                    const total = venta + compra + alquiler;
                    const data = [venta, compra, alquiler];
                    
                    this.charts.donut = new Chart(ctxDonut, {
                        type: 'doughnut',
                        data: {
                            labels: ['Venta', 'Compra', 'Alquiler'],
                            datasets: [{
                                data: data,
                                backgroundColor: ['#2196F3', '#4CAF50', '#F44336'],
                                borderWidth: 2,
                                borderColor: '#fff'
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            cutout: '65%',
                            plugins: {
                                legend: {
                                    display: false
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            const label = context.label || '';
                                            const value = context.parsed || 0;
                                            const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
                                            return `${label}: ${value} (${percentage}%)`;
                                        }
                                    }
                                }
                            }
                        }
                    });
                    console.log('✅ Gráfico de donut creado');
                } catch (error) {
                    console.error('❌ Error creando gráfico de donut:', error);
                }
            }
        },

        renderBarChart: function(venta, compra, alquiler) {
            const ctxBarras = document.getElementById('chart-barras');
            if (ctxBarras) {
                try {
                    this.charts.barras = new Chart(ctxBarras, {
                        type: 'bar',
                        data: {
                            labels: ['Venta', 'Compra', 'Alquiler'],
                            datasets: [{
                                label: 'Cantidad',
                                data: [venta, compra, alquiler],
                                backgroundColor: ['#2196F3', '#4CAF50', '#F44336'],
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
                    console.log('✅ Gráfico de barras creado');
                } catch (error) {
                    console.error('❌ Error creando gráfico de barras:', error);
                }
            }
        },

        renderRadarChart: function() {
            const ctxRadar = document.getElementById('chart-radar');
            if (ctxRadar) {
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
                                    this.stats.efectividadComunicacion || 0,
                                    this.stats.asesoriaLegal || 0,
                                    this.stats.presentacionPersonal || 0,
                                    this.stats.manejoDetalles || 0,
                                    this.stats.puntualidad || 0,
                                    this.stats.compromiso || 0,
                                    this.stats.solucionProblemas || 0,
                                    this.stats.acompanamiento || 0,
                                    this.stats.situacionesImprevistas || 0,
                                    this.stats.tiemposNegociacion || 0,
                                    this.stats.calificacionOficina || 0
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
                                            return `${context.dataset.label}: ${context.parsed.r.toFixed(1)}/5`;
                                        }
                                    }
                                }
                            }
                        }
                    });
                    console.log('✅ Gráfico de radar creado con datos reales');
                } catch (error) {
                    console.error('❌ Error creando gráfico de radar:', error);
                }
            }
        },

        renderHorizontalBarChart: function() {
            const ctxHorizontal = document.getElementById('chart-horizontal');
            if (ctxHorizontal) {
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
                                    this.stats.efectividadComunicacion || 0,
                                    this.stats.asesoriaLegal || 0,
                                    this.stats.presentacionPersonal || 0,
                                    this.stats.manejoDetalles || 0,
                                    this.stats.puntualidad || 0,
                                    this.stats.compromiso || 0,
                                    this.stats.solucionProblemas || 0,
                                    this.stats.acompanamiento || 0,
                                    this.stats.situacionesImprevistas || 0,
                                    this.stats.tiemposNegociacion || 0,
                                    this.stats.calificacionOficina || 0
                                ],
                                backgroundColor: [
                                    '#2196F3', '#4CAF50', '#F44336', '#FF9800', '#9C27B0',
                                    '#00BCD4', '#8BC34A', '#FF5722', '#607D8B', '#795548',
                                    '#B8A279'
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
                                            return `Calificación: ${context.parsed.x.toFixed(1)}/5`;
                                        }
                                    }
                                }
                            }
                        }
                    });
                    console.log('✅ Gráfico de barras horizontales creado con datos reales');
                } catch (error) {
                    console.error('❌ Error creando gráfico de barras horizontales:', error);
                }
            }
        },

        renderDistributionChart: function() {
            const ctxDistribution = document.getElementById('chart-distribution');
            if (ctxDistribution) {
                try {
                    const distribucion = this.stats.distribucionCalificaciones || {};
                    const total = Object.values(distribucion).reduce((sum, val) => sum + val, 0);
                    
                    const data = [
                        distribucion['5'] || 0,
                        distribucion['4'] || 0,
                        distribucion['3'] || 0,
                        distribucion['2'] || 0,
                        distribucion['1'] || 0
                    ];

                    this.charts.distribution = new Chart(ctxDistribution, {
                        type: 'pie',
                        data: {
                            labels: ['Excelente (5)', 'Muy Bueno (4)', 'Bueno (3)', 'Regular (2)', 'Deficiente (1)'],
                            datasets: [{
                                data: data,
                                backgroundColor: [
                                    '#4CAF50',
                                    '#8BC34A', 
                                    '#FFC107',
                                    '#FF9800',
                                    '#F44336'
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
                                            const label = context.label || '';
                                            const value = context.parsed || 0;
                                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                            return `${label}: ${value} (${percentage}%)`;
                                        }
                                    }
                                }
                            }
                        }
                    });
                    console.log('✅ Gráfico de distribución creado con datos reales');
                } catch (error) {
                    console.error('❌ Error creando gráfico de distribución:', error);
                }
            }
        },

        mostrarErrorChartJS: function() {
            const container = this.$el.find('#dynamic-content-container')[0];
            if (container) {
                const graficosContainer = container.querySelector('.graficos-container');
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
        },

        getLoadingHTML: function() {
            return `
                <div class="loading-alert">
                    <div class="spinner-large"></div>
                    <h4>Cargando estadísticas...</h4>
                    <p class="text-muted">Conectando con el servidor...</p>
                </div>
            `;
        },

        getDataHTML: function() {
            const stats = this.stats;
            const distribucion = stats.distribucionOperaciones || {};
            
            const venta = distribucion['Venta'] || 0;
            const compra = distribucion['Compra'] || 0;
            const alquiler = distribucion['Alquiler'] || 0;
            const total = venta + compra + alquiler;
            
            const ventaPct = total > 0 ? Math.round((venta / total) * 100) : 0;
            const compraPct = total > 0 ? Math.round((compra / total) * 100) : 0;
            const alquilerPct = total > 0 ? Math.round((alquiler / total) * 100) : 0;
            
            return `
                <div class="reporte-container">
                    <!-- Información de Encuesta -->
                    <div class="info-encuesta-card">
                        <h3 class="info-title">Información de Encuesta</h3>
                        <table class="info-table">
                            <tr>
                                <td class="info-label">Total encuestados:</td>
                                <td class="info-value">${stats.totalEncuestas}</td>
                            </tr>
                            <tr>
                                <td class="info-label">Satisfacción promedio:</td>
                                <td class="info-value">${stats.satisfaccionPromedio}/5</td>
                            </tr>
                            <tr>
                                <td class="info-label">Porcentaje recomendación:</td>
                                <td class="info-value">${stats.porcentajeRecomendacion}%</td>
                            </tr>
                            <tr>
                                <td class="info-label">Fecha de Actualización:</td>
                                <td class="info-value">${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                            </tr>
                        </table>
                    </div>

                    <!-- Sección Principal -->
                    <div class="seccion-operaciones">
                        <h2 class="titulo-seccion">¿Qué tipo de operación realizó?</h2>
                        
                        <!-- Tabla de Operaciones -->
                        <div class="tabla-operaciones-card">
                            <table class="tabla-operaciones">
                                <thead>
                                    <tr>
                                        <th>Opción</th>
                                        <th>Cantidad</th>
                                        <th>Porcentaje</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Venta</td>
                                        <td>${venta}</td>
                                        <td>${ventaPct}%</td>
                                    </tr>
                                    <tr>
                                        <td>Compra</td>
                                        <td>${compra}</td>
                                        <td>${compraPct}%</td>
                                    </tr>
                                    <tr>
                                        <td>Alquiler</td>
                                        <td>${alquiler}</td>
                                        <td>${alquilerPct}%</td>
                                    </tr>
                                    <tr class="total-row">
                                        <td><strong>Total de Operaciones Individualmente:</strong></td>
                                        <td><strong>${total}</strong></td>
                                        <td><strong>100%</strong></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- Gráficos Principales -->
                        <div class="graficos-container">
                            <div class="grafico-card">
                                <h3 class="grafico-titulo">Distribución de Operaciones</h3>
                                <div class="grafico-wrapper">
                                    <canvas id="chart-donut"></canvas>
                                </div>
                                <div class="leyenda-donut">
                                    <div class="leyenda-item">
                                        <span class="leyenda-color" style="background: #2196F3;"></span>
                                        <span class="leyenda-texto">Venta (${ventaPct}%)</span>
                                    </div>
                                    <div class="leyenda-item">
                                        <span class="leyenda-color" style="background: #4CAF50;"></span>
                                        <span class="leyenda-texto">Compra (${compraPct}%)</span>
                                    </div>
                                    <div class="leyenda-item">
                                        <span class="leyenda-color" style="background: #F44336;"></span>
                                        <span class="leyenda-texto">Alquiler (${alquilerPct}%)</span>
                                    </div>
                                </div>
                            </div>

                            <div class="grafico-card">
                                <h3 class="grafico-titulo">Comparación de Operaciones</h3>
                                <div class="grafico-wrapper">
                                    <canvas id="chart-barras"></canvas>
                                </div>
                            </div>
                        </div>

                        <!-- Gráficos de Calidad de Servicio -->
                        <div class="graficos-secundarios">
                            <div class="grafico-card grande">
                                <h3 class="grafico-titulo">Evaluación por Competencias</h3>
                                <div class="grafico-wrapper">
                                    <canvas id="chart-radar"></canvas>
                                </div>
                            </div>

                            <div class="grafico-card grande">
                                <h3 class="grafico-titulo">Calificaciones Promedio por Categoría</h3>
                                <div class="grafico-wrapper">
                                    <canvas id="chart-horizontal"></canvas>
                                </div>
                            </div>

                            <div class="grafico-card">
                                <h3 class="grafico-titulo">Distribución General de Calificaciones</h3>
                                <div class="grafico-wrapper">
                                    <canvas id="chart-distribution"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

        getEmptyHTML: function() {
            return `
                <div class="empty-alert">
                    <div class="empty-icon">📊</div>
                    <h3>No hay datos disponibles</h3>
                    <p class="text-muted">Importe un archivo CSV para comenzar.</p>
                    <div style="margin-top: 20px;">
                        <button class="btn btn-primary" data-action="import-empty">
                            <span class="fas fa-upload"></span>
                            Importar Datos CSV
                        </button>
                    </div>
                </div>
            `;
        },

        setupEmptyEventListeners: function() {
            this.$el.find('[data-action="import-empty"]').off('click').on('click', () => {
                this.actionImport();
            });
        }

    });
});