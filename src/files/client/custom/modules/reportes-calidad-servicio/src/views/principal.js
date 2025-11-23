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
                asesoresDestacados: []
            };
            
            this.initMappings();
            this.loadStatistics();
        },

        afterRender: function () {
            console.log('✅ Vista renderizada');
            this.showLoadingState();
            this.setupEventListeners();
        },

        initMappings: function() {
            console.log('🔧 Inicializando mapeos según orden de campos de la BD...');
            
            // ✅ ORDEN EXACTO DE CAMPOS EN LA BASE DE DATOS
            this.camposOrdenBD = [
                'created_at',           // Marca temporal
                'email_address',        // Correo
                'operation_type',       // 1. ¿Qué tipo de operación realizó?
                'assigned_user_id',     // ID Asesor
                'communicationEffectiveness',  // Efectividad y regularidad en la Comunicación
                'legal_advice',         // Asesoría legal, fiscal y financiera
                'personal_presentation', // Presentación Personal e Imagen
                'detail_management',    // Manejo de los detalles
                'punctuality',          // Puntualidad
                'commitment_level',     // Nivel de compromiso en el servicio
                'problem_solving',      // Solución de problemas
                'full_support',         // Acompañamiento de inicio a fin
                'unexpected_situations', // Manejo de situaciones Imprevistas
                'negotiation_timing',   // Manejo de los tiempos de la negociación
                'general_advisor_rating', // 4. En general, ¿Cómo percibió el servicio...
                'office_rating',        // 5. ¿Cómo califica el servicio prestado por la oficina Century 21?
                'recommendation',       // 6. ¿Recomendaría el servicio de Century 21 a un amigo/familiar?
                'contact_medium',       // 7. ¿Por cuál medio se puso en contacto...
                'additional_feedback',  // 8. Sugerencia adicional...
                'client_name'           // 10. Escriba su Primer Nombre y Primer Apellido.
            ];
            
            // Mapeo de nombres CSV a nombres de campos internos
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
                'Contacto Directo': '0',
                'Familiar / Amigo': '1', 
                'Página Web Century21': '2',
                'Mercado Libre': '3',
                'Instagram': '4',
                'Facebook / Marketplace': '5',
                'Whatsapp': '6',
                'Estados de Whatsapp': '7',
                'Valla o Rótulo de Venta/Alquiler': '8',
                'Visita en oficina': '9',
                'Otro': 'contactMediumOther'
            };

            // ✅ Campos que usan escala 0-4 (donde 5 debe convertirse a 4)
            this.fieldsScale0to4 = [
                'communicationEffectiveness',
                'legalAdvice', 
                'personalPresentation',
                'detailManagement',
                'punctuality',
                'commitmentLevel',
                'problemSolving',
                'fullSupport',
                'unexpectedSituations',
                'negotiationTiming',
                'officeRating'
            ];

            console.log('✅ Mapeos inicializados correctamente');
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
            
            // Buscar cada columna del CSV
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

        // ✅ TRANSFORMACIÓN COMPLETA SIGUIENDO ORDEN DE BD
        transformRow: function(csvRow, columnMapping, lineNumber) {
            const transformed = {};
            const corrections = [];
            
            console.log(`🔄 Transformando línea ${lineNumber}...`);

            // ============================================
            // PROCESAR CADA CAMPO EN EL ORDEN CORRECTO
            // ============================================

            // 1. created_at (Marca temporal)
            if (columnMapping.createdAt && csvRow[columnMapping.createdAt]) {
                const value = csvRow[columnMapping.createdAt].trim();
                if (value) {
                    transformed.createdAt = this.transformDate(value);
                    console.log(`  ✅ createdAt: ${transformed.createdAt}`);
                }
            }

            // 2. email_address (Correo)
            if (columnMapping.emailAddress && csvRow[columnMapping.emailAddress]) {
                const value = csvRow[columnMapping.emailAddress].trim();
                if (value) {
                    transformed.emailAddress = value;
                    console.log(`  ✅ emailAddress: ${value}`);
                }
            }

            // 3. operation_type (Tipo de operación)
            if (columnMapping.operationType && csvRow[columnMapping.operationType]) {
                const value = csvRow[columnMapping.operationType].trim();
                if (value) {
                    transformed.operationType = value;
                    console.log(`  ✅ operationType: ${value}`);
                }
            }

            // 4. assigned_user_id (ID Asesor)
            if (columnMapping.assignedUserId && csvRow[columnMapping.assignedUserId]) {
                const value = csvRow[columnMapping.assignedUserId].trim();
                if (value) {
                    transformed.assignedUserId = value;
                    console.log(`  ✅ assignedUserId: ${value}`);
                }
            }

            // 5-15. Campos de calificación 0-4 CON CORRECCIÓN 5→4
            const ratingFields = [
                'communicationEffectiveness',
                'legalAdvice',
                'personalPresentation',
                'detailManagement',
                'punctuality',
                'commitmentLevel',
                'problemSolving',
                'fullSupport',
                'unexpectedSituations',
                'negotiationTiming',
                'officeRating'
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
                                console.log(`  🔧 ${field}: 5 → 4 (CORREGIDO)`);
                            } else if (numericValue >= 0 && numericValue <= 4) {
                                transformed[field] = numericValue.toString();
                                console.log(`  ✅ ${field}: ${numericValue}`);
                            }
                        }
                    }
                }
            });

            // 16. general_advisor_rating (escala 1-5, NO requiere corrección)
            if (columnMapping.generalAdvisorRating && csvRow[columnMapping.generalAdvisorRating]) {
                const value = csvRow[columnMapping.generalAdvisorRating].trim();
                if (value !== '' && value !== 'NA' && value !== 'N/A') {
                    const numericValue = parseInt(value);
                    if (!isNaN(numericValue) && numericValue >= 1 && numericValue <= 5) {
                        transformed.generalAdvisorRating = numericValue.toString();
                        console.log(`  ✅ generalAdvisorRating: ${numericValue}`);
                    }
                }
            }

            // 17. recommendation (SI = 1, NO = 0)
            if (columnMapping.recommendation && csvRow[columnMapping.recommendation]) {
                const value = csvRow[columnMapping.recommendation].trim().toLowerCase();
                if (value) {
                    // ✅ VALIDACIÓN ESTRICTA
                    const positiveValues = ['si lo recomendaría', 'si', 'sí', 'yes', '1', 'true'];
                    transformed.recommendation = positiveValues.includes(value) ? '1' : '0';
                    console.log(`  ✅ recommendation: "${csvRow[columnMapping.recommendation]}" → ${transformed.recommendation}`);
                }
            }

            // 18. contact_medium (procesamiento especial)
            if (columnMapping.contactMedium && csvRow[columnMapping.contactMedium]) {
                const value = csvRow[columnMapping.contactMedium].trim();
                if (value) {
                    const contactData = this.transformContactMedium(value);
                    transformed.contactMedium = contactData.contactMedium;
                    transformed.contactMediumOther = contactData.contactMediumOther;
                    console.log(`  ✅ contactMedium: ${JSON.stringify(contactData)}`);
                }
            }

            // 19. additional_feedback (texto libre)
            if (columnMapping.additionalFeedback && csvRow[columnMapping.additionalFeedback]) {
                const value = csvRow[columnMapping.additionalFeedback].trim();
                if (value) {
                    transformed.additionalFeedback = value;
                    console.log(`  ✅ additionalFeedback: ${value.substring(0, 50)}...`);
                }
            }

            // 20. client_name (OBLIGATORIO)
            if (columnMapping.clientName && csvRow[columnMapping.clientName]) {
                const value = csvRow[columnMapping.clientName].trim();
                if (value) {
                    transformed.clientName = value;
                    console.log(`  ✅ clientName: ${value}`);
                }
            }

            // ✅ Agregar estatus por defecto
            transformed.estatus = '2';

            console.log(`✅ Línea ${lineNumber} transformada correctamente`);

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
                console.log('📋 Primer registro:', JSON.stringify(encuestasValidadas[0], null, 2));
                
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
                        this.stats = response.data;
                        this.hasData = this.stats.totalEncuestas > 0;
                        this.isLoading = false;
                        this.updateUI();
                    } else {
                        this.handleNoData();
                    }
                })
                .catch((error) => {
                    console.error('❌ Error cargando estadísticas:', error);
                    this.handleNoData();
                });
        },

        handleNoData: function() {
            this.hasData = false;
            this.isLoading = false;
            this.updateUI();
        },

        showLoadingState: function() {
            const container = this.$el.find('#dynamic-content-container')[0];
            if (container) {
                container.innerHTML = this.getLoadingHTML();
            }
        },

        updateUI: function() {
            const container = this.$el.find('#dynamic-content-container')[0];
            if (!container) return;

            if (this.isLoading) {
                container.innerHTML = this.getLoadingHTML();
            } else if (this.hasData) {
                container.innerHTML = this.getDataHTML();
            } else {
                container.innerHTML = this.getEmptyHTML();
                setTimeout(() => this.setupEmptyEventListeners(), 100);
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
            return `
                <div class="estadisticas-principales">
                    <div class="estadistica-card verde">
                        <div class="estadistica-label">Total Encuestas</div>
                        <div class="estadistica-valor">${stats.totalEncuestas || 0}</div>
                        <div class="estadistica-desc">Base de datos</div>
                    </div>
                    <div class="estadistica-card naranja">
                        <div class="estadistica-label">Satisfacción</div>
                        <div class="estadistica-valor">${stats.satisfaccionPromedio || 0}</div>
                        <div class="estadistica-desc">Promedio / 5</div>
                    </div>
                    <div class="estadistica-card rojo">
                        <div class="estadistica-label">Recomendación</div>
                        <div class="estadistica-valor">${stats.porcentajeRecomendacion || 0}%</div>
                        <div class="estadistica-desc">Clientes satisfechos</div>
                    </div>
                </div>

                <div class="alert alert-success system-info">
                    <div class="system-status">
                        <span class="status-indicator online"></span>
                        <strong>✅ Sistema Conectado</strong>
                    </div>
                    <div class="system-details">
                        Base de datos con <strong>${stats.totalEncuestas || 0}</strong> encuestas procesadas.
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