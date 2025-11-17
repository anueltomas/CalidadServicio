define('reportes-calidad-servicio:views/principal', ['view'], function (Dep) {
    
    return Dep.extend({

        template: 'reportes-calidad-servicio:principal',

        events: {
            'click [data-action="import"]': function() {
                this.actionImport();
            },
            'click [data-action="refresh"]': function() {
                this.loadStatistics();
            }
        },

        data: function () {
            return {
                stats: this.stats || {},
                hasData: this.hasData,
                isLoading: this.isLoading
            };
        },

        setup: function () {
            this.stats = {};
            this.hasData = false;
            this.isLoading = true;
            
            this.loadStatistics();
        },

        afterRender: function () {
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
                .catch((xhr) => {
                    console.error('Error loading stats:', xhr);
                    Espo.Ui.error('Error al cargar estadísticas');
                    this.isLoading = false;
                    this.reRender();
                });
        },

        actionImport: function() {
            var fileInput = this.$el.find('#csv-file-input')[0];
            
            if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
                Espo.Ui.warning('Por favor selecciona un archivo CSV primero.');
                return;
            }
            
            var file = fileInput.files[0];
            
            if (!file.name.endsWith('.csv')) {
                Espo.Ui.error('El archivo debe ser un CSV.');
                return;
            }
            
            Espo.Ui.notify('Procesando CSV...', 'info');
            this.wait(true);
            
            var reader = new FileReader();
            
            reader.onload = function(e) {
                var contenidoCSV = e.target.result;
                this.iniciarProcesoDeCarga(contenidoCSV);
            }.bind(this);
            
            reader.onerror = function() {
                Espo.Ui.error('Error al leer el archivo.');
                this.wait(false);
            }.bind(this);
            
            reader.readAsText(file, 'UTF-8');
        },

        iniciarProcesoDeCarga: async function(contenidoCSV) {
            try {
                console.log('📊 Iniciando procesamiento CSV...');
                var todasLasLineas = contenidoCSV.split('\n').filter(l => l.trim());
                
                console.log('Total de líneas en CSV:', todasLasLineas.length);
                
                if (todasLasLineas.length < 2) {
                    Espo.Ui.error('El archivo CSV está vacío o no tiene datos.');
                    this.wait(false);
                    return;
                }
                
                var headers = this.parsearLineaCSV(todasLasLineas[0]);
                var lineasDeDatos = todasLasLineas.slice(1);

                console.log('Headers detectados:', headers);
                console.log('Líneas de datos a procesar:', lineasDeDatos.length);

                // Extraer preguntas del CSV
                const preguntasDelCSV = this.extraerPreguntasDeEncuesta(headers);
                console.log('Mapeo de preguntas:', preguntasDelCSV);
                
                // Procesar encuestas
                const { encuestasValidas, erroresDeFila } = this.procesarEncuestasCSV(lineasDeDatos, headers, preguntasDelCSV);

                console.log('Resultado del procesamiento:');
                console.log('- Encuestas válidas:', encuestasValidas.length);
                console.log('- Errores de fila:', erroresDeFila.length);

                if (erroresDeFila.length > 0) {
                    // CORRECCIÓN: usar let en lugar de const
                    let mensajeError = 'Algunas filas del CSV fueron omitidas por errores:<br>' + erroresDeFila.slice(0, 10).join('<br>');
                    if (erroresDeFila.length > 10) {
                        mensajeError += `<br>... y ${erroresDeFila.length - 10} errores más`;
                    }
                    Espo.Ui.warning(mensajeError, 10000);
                }

                if (encuestasValidas.length === 0) {
                    Espo.Ui.error('No se encontraron filas de datos válidas en el archivo CSV.');
                    this.wait(false);
                    return;
                }

                console.log('Primeras 3 encuestas válidas:', encuestasValidas.slice(0, 3));

                // Verificar duplicados antes de guardar
                const encuestasUnicas = this.eliminarDuplicados(encuestasValidas);
                console.log(`Encuestas después de eliminar duplicados: ${encuestasUnicas.length} (se eliminaron ${encuestasValidas.length - encuestasUnicas.length} duplicados)`);

                // Guardar en la base de datos
                await this.guardarEncuestasEnBD(encuestasUnicas);
                
                Espo.Ui.success(`Se importaron ${encuestasUnicas.length} encuestas exitosamente`);
                this.wait(false);
                this.loadStatistics(); // Recargar estadísticas

            } catch (error) {
                console.error('Error en el proceso de carga:', error);
                // CORRECCIÓN: usar let en lugar de const
                let mensajeError = 'Error al procesar el archivo CSV: ' + error.message;
                Espo.Ui.error(mensajeError);
                this.wait(false);
            }
        },

        parsearLineaCSV: function(linea) {
            try {
                console.log('Parseando línea CSV:', linea);
                
                // Si ya es un array, devolverlo
                if (Array.isArray(linea)) return linea;
                
                // Si es string, parsear CSV
                if (typeof linea === 'string') {
                    const resultados = [];
                    let enComillas = false;
                    let campoActual = '';
                    
                    for (let i = 0; i < linea.length; i++) {
                        const char = linea[i];
                        
                        if (char === '"') {
                            enComillas = !enComillas;
                        } else if (char === ',' && !enComillas) {
                            resultados.push(campoActual.trim());
                            campoActual = '';
                        } else {
                            campoActual += char;
                        }
                    }
                    
                    // Añadir el último campo
                    resultados.push(campoActual.trim());
                    console.log('Campos parseados:', resultados);
                    return resultados;
                }
                
                return [];
            } catch (error) {
                console.error('Error parseando línea CSV:', error);
                return [];
            }
        },

        extraerPreguntasDeEncuesta: function(headers) {
            const preguntas = {};
            
            // Mapear las preguntas según la estructura del CSV
            const mapeoPreguntas = {
                'CLA': 'ciudad',
                'ID Oficina': 'idOficina',
                'Oficina': 'oficina',
                'Marca temporal': 'fechaEncuesta',
                'Correo': 'correo',
                '1. ¿Qué tipo de operación realizó?': 'tipoOperacion',
                'ID Asesor': 'idAsesor',
                '2. Escriba el nombre del Asesor Inmobiliario que le prestó el servicio.': 'nombreAsesor',
                'Asesoría legal, fiscal y financiera': 'puntuacionAsesoriaLegal',
                'Presentación Personal e Imagen': 'puntuacionPresentacion',
                'Manejo de los detalles': 'puntuacionManejoDetalles',
                'Puntualidad': 'puntuacionPuntualidad',
                'Nivel de compromiso en el servicio': 'puntuacionCompromiso',
                'Solución de problemas': 'puntuacionSolucionProblemas',
                'Acompañamiento de inicio a fin': 'puntuacionAcompanamiento',
                'Manejo de situaciones Imprevistas': 'puntuacionSituacionesImprevistas',
                'Manejo de los tiempos de la negociación': 'puntuacionManejoTiempos',
                '4. En general, ¿Cómo percibió el servicio prestado por el Asesor Inmobiliario de Century21': 'puntuacionGeneralAsesor',
                '5. ¿Cómo califica el servicio prestado por la oficina Century 21?': 'puntuacionOficina',
                '6. ¿Recomendaría el servicio de Century 21 a un amigo/familiar?': 'recomendacion',
                '7. ¿Por cuál medio se puso en contacto con la oficina/asesor Century 21?': 'medioContacto',
                '8. Sugerencia adicional para mejorar el servicio asesor/oficina Century 21 . Estamos seguros de que hay algo más que le hubiera gustado que hiciera asesor/oficina por usted.': 'sugerencias',
                '9. Por favor Indique su fecha de cumpleaños.': 'fechaCumpleanos',
                '10. Escriba su Primer Nombre y Primer Apellido.': 'nombreCliente'
            };

            headers.forEach((header, index) => {
                if (mapeoPreguntas[header]) {
                    preguntas[mapeoPreguntas[header]] = index;
                }
            });

            console.log('Preguntas extraídas:', preguntas);
            return preguntas;
        },

        procesarEncuestasCSV: function(lineasDeDatos, headers, preguntas) {
            const encuestasValidas = [];
            const erroresDeFila = [];

            console.log('🔍 Iniciando procesamiento de encuestas...');
            console.log('Total de líneas a procesar:', lineasDeDatos.length);
            console.log('Headers:', headers);
            console.log('Mapeo de preguntas:', preguntas);

            lineasDeDatos.forEach((linea, index) => {
                try {
                    console.log(`\n--- Procesando línea ${index + 1} ---`);
                    console.log('Línea original:', linea);

                    const campos = this.parsearLineaCSV(linea);
                    console.log('Campos parseados:', campos);
                    console.log('Número de campos:', campos.length);
                    console.log('Número de preguntas esperadas:', Object.keys(preguntas).length);

                    // Verificación más flexible de número de campos
                    if (campos.length < Object.keys(preguntas).length - 5) { // Más flexible
                        console.warn(`Advertencia: Línea ${index + 1} tiene menos campos de lo esperado`);
                        // Continuar procesamiento para ver qué datos podemos extraer
                    }

                    // Crear encuesta con valores por defecto más robustos
                    const encuesta = {
                        // Campo CLA
                        cla: this.obtenerValorCampo(campos, preguntas.cla, ''),
                        
                        // Información de oficina
                        idOficina: this.parsearEntero(this.obtenerValorCampo(campos, preguntas.idOficina, '0')),
                        oficina: this.obtenerValorCampo(campos, preguntas.oficina, ''),
                        
                        // Información temporal
                        marcaTemporal: this.parsearFecha(this.obtenerValorCampo(campos, preguntas.fechaEncuesta)) || new Date(),
                        
                        // INFORMACIÓN DEL CLIENTE - CORREO SIEMPRE INCLUIDO
                        correo: this.obtenerValorCampo(campos, preguntas.correo, null),
                        nombreCliente: this.obtenerValorCampo(campos, preguntas.nombreCliente, ''),
                        fechaCumpleanos: this.parsearFechaCumpleanos(this.obtenerValorCampo(campos, preguntas.fechaCumpleanos)),
                        
                        // Información de la operación
                        tipoOperacion: this.validarTipoOperacion(this.obtenerValorCampo(campos, preguntas.tipoOperacion, 'Compra')),
                        
                        // Información del asesor
                        idAsesor: this.parsearEntero(this.obtenerValorCampo(campos, preguntas.idAsesor, '0')),
                        nombreAsesor: this.obtenerValorCampo(campos, preguntas.nombreAsesor, ''),
                        
                        // Evaluaciones (con valores por defecto más flexibles)
                        evaluacionGeneral: this.parsearPuntuacion(this.obtenerValorCampo(campos, preguntas.puntuacionGeneralAsesor, '0')),
                        asesoriaLegal: this.parsearPuntuacion(this.obtenerValorCampo(campos, preguntas.puntuacionAsesoriaLegal, '0')),
                        presentacionPersonal: this.parsearPuntuacion(this.obtenerValorCampo(campos, preguntas.puntuacionPresentacion, '0')),
                        manejoDetalles: this.parsearPuntuacion(this.obtenerValorCampo(campos, preguntas.puntuacionManejoDetalles, '0')),
                        puntualidad: this.parsearPuntuacion(this.obtenerValorCampo(campos, preguntas.puntuacionPuntualidad, '0')),
                        nivelCompromiso: this.parsearPuntuacion(this.obtenerValorCampo(campos, preguntas.puntuacionCompromiso, '0')),
                        solucionProblemas: this.parsearPuntuacion(this.obtenerValorCampo(campos, preguntas.puntuacionSolucionProblemas, '0')),
                        acompanamiento: this.parsearPuntuacion(this.obtenerValorCampo(campos, preguntas.puntuacionAcompanamiento, '0')),
                        manejoImprevistas: this.parsearPuntuacion(this.obtenerValorCampo(campos, preguntas.puntuacionSituacionesImprevistas, '0')),
                        manejoTiempos: this.parsearPuntuacion(this.obtenerValorCampo(campos, preguntas.puntuacionManejoTiempos, '0')),
                        percepcionGeneral: this.parsearPuntuacion(this.obtenerValorCampo(campos, preguntas.puntuacionGeneralAsesor, '0')),
                        calificacionOficina: this.parsearPuntuacion(this.obtenerValorCampo(campos, preguntas.puntuacionOficina, '0')),
                        
                        // Recomendación y comentarios
                        recomendaria: this.parsearBooleano(this.obtenerValorCampo(campos, preguntas.recomendacion, 'false')),
                        medioContacto: this.obtenerValorCampo(campos, preguntas.medioContacto, ''),
                        sugerencias: this.obtenerValorCampo(campos, preguntas.sugerencias, '')
                    };

                    console.log('Encuesta procesada:', encuesta);

                    // Validaciones - nombreCliente SÍ es requerido
                    const erroresValidacion = this.validarEncuesta(encuesta);
                    if (erroresValidacion.length > 0) {
                        console.warn(`Errores validación línea ${index + 1}:`, erroresValidacion);
                        erroresDeFila.push(`Línea ${index + 1}: ${erroresValidacion.join(', ')}`);
                    } else {
                        console.log(`✅ Línea ${index + 1} VÁLIDA`);
                        encuestasValidas.push(encuesta);
                    }

                } catch (error) {
                    console.error(`❌ Error crítico línea ${index + 1}:`, error);
                    erroresDeFila.push(`Línea ${index + 1}: Error de formato - ${error.message}`);
                }
            });

            console.log('\n=== RESULTADO FINAL DEL PROCESAMIENTO ===');
            console.log('Encuestas válidas:', encuestasValidas.length);
            console.log('Errores:', erroresDeFila.length);
            
            if (encuestasValidas.length > 0) {
                console.log('Primeras 3 encuestas válidas:', encuestasValidas.slice(0, 3));
            }

            return { encuestasValidas, erroresDeFila };
        },

        // MÉTODOS AUXILIARES MEJORADOS
        obtenerValorCampo: function(campos, indice, valorPorDefecto = '') {
            if (indice === undefined || indice === null || indice < 0) {
                return valorPorDefecto;
            }
            if (campos[indice] === undefined || campos[indice] === null) {
                return valorPorDefecto;
            }
            const valor = campos[indice].toString().trim();
            return valor === '' ? valorPorDefecto : valor;
        },

        parsearEntero: function(valor) {
            if (valor === null || valor === undefined) return 0;
            const num = parseInt(valor.toString().replace(/[^\d-]/g, ''));
            return isNaN(num) ? 0 : num;
        },

        validarEncuesta: function(encuesta) {
            const errores = [];
            
            // CAMPOS REQUERIDOS - nombreCliente SÍ es requerido
            if (!encuesta.oficina || encuesta.oficina.trim() === '') {
                errores.push('oficina es requerida');
            }
            
            if (!encuesta.tipoOperacion || encuesta.tipoOperacion.trim() === '') {
                errores.push('tipoOperacion es requerido');
            }
            
            if (!encuesta.nombreAsesor || encuesta.nombreAsesor.trim() === '') {
                errores.push('nombreAsesor es requerido');
            }
            
            // nombreCliente SÍ es requerido
            if (!encuesta.nombreCliente || encuesta.nombreCliente.trim() === '') {
                errores.push('nombreCliente es requerido');
            }
            
            return errores;
        },

        // MÉTODO PARA ELIMINAR DUPLICADOS (SE MANTIENE)
        eliminarDuplicados: function(encuestas) {
            const vistas = new Set();
            const encuestasUnicas = [];
            const duplicados = [];

            encuestas.forEach(encuesta => {
                // Crear una clave única basada en varios campos para identificar duplicados
                const clave = this.generarClaveUnica(encuesta);
                
                if (!vistas.has(clave)) {
                    vistas.add(clave);
                    encuestasUnicas.push(encuesta);
                } else {
                    duplicados.push(encuesta);
                    console.log('📝 Encuesta duplicada detectada:', encuesta);
                }
            });

            if (duplicados.length > 0) {
                console.log(`🔄 Se encontraron ${duplicados.length} encuestas duplicadas`);
                Espo.Ui.info(`Se detectaron ${duplicados.length} encuestas duplicadas que serán omitidas`);
            }

            return encuestasUnicas;
        },

        generarClaveUnica: function(encuesta) {
            // Combinar varios campos para crear una clave única
            // Esto evita duplicados basados en la misma combinación de datos
            const camposUnicos = [
                encuesta.correo || 'sin-correo',
                encuesta.nombreCliente || 'sin-nombre',
                encuesta.nombreAsesor || 'sin-asesor',
                encuesta.oficina || 'sin-oficina',
                encuesta.tipoOperacion || 'sin-operacion',
                encuesta.marcaTemporal ? new Date(encuesta.marcaTemporal).toISOString().split('T')[0] : 'sin-fecha'
            ];
            
            return camposUnicos.join('|');
        },

        validarTipoOperacion: function(tipoOperacion) {
            const opcionesValidas = ['Compra', 'Venta', 'Alquiler'];
            const tipo = (tipoOperacion || 'Compra').trim();
            return opcionesValidas.includes(tipo) ? tipo : 'Compra';
        },

        parsearBooleano: function(valor) {
            if (typeof valor === 'boolean') return valor;
            if (typeof valor === 'string') {
                const str = valor.toLowerCase().trim();
                return str === 'true' || str === 'si' || str === 'sí' || str === '1' || str === 'yes' || str === 'verdadero';
            }
            if (typeof valor === 'number') return valor === 1;
            return false;
        },

        parsearPuntuacion: function(valor) {
            if (valor === null || valor === undefined) return 0;
            const puntuacion = parseInt(valor.toString().replace(/[^\d]/g, ''));
            if (isNaN(puntuacion)) return 0;
            return Math.max(0, Math.min(5, puntuacion));
        },

        parsearFecha: function(fechaStr) {
            if (!fechaStr) return new Date();
            
            try {
                // Intentar varios formatos de fecha
                const fecha = new Date(fechaStr);
                if (!isNaN(fecha.getTime())) {
                    return fecha;
                }
                
                // Intentar formato dd/mm/yyyy
                const partes = fechaStr.split('/');
                if (partes.length === 3) {
                    const dia = parseInt(partes[0]);
                    const mes = parseInt(partes[1]) - 1;
                    const año = parseInt(partes[2]);
                    const fechaAlt = new Date(año, mes, dia);
                    if (!isNaN(fechaAlt.getTime())) {
                        return fechaAlt;
                    }
                }
                
                return new Date();
            } catch (error) {
                console.error('Error parseando fecha:', error);
                return new Date();
            }
        },

        parsearFechaCumpleanos: function(fechaStr) {
            if (!fechaStr) return null;
            
            try {
                // Intentar varios formatos de fecha
                const fechaPartes = fechaStr.split('/');
                if (fechaPartes.length === 3) {
                    let año = parseInt(fechaPartes[2]);
                    let mes = parseInt(fechaPartes[0]) - 1;
                    let dia = parseInt(fechaPartes[1]);
                    
                    // Manejar años de 2 dígitos
                    if (año < 100) {
                        if (año < 50) {
                            año += 2000;
                        } else {
                            año += 1900;
                        }
                    }
                    
                    const fecha = new Date(año, mes, dia);
                    if (!isNaN(fecha.getTime())) {
                        return fecha.toISOString().split('T')[0];
                    }
                }
                
                return null;
            } catch (error) {
                console.error('Error parseando fecha de cumpleaños:', error);
                return null;
            }
        },

        guardarEncuestasEnBD: async function(encuestasValidas) {
            try {
                console.log('💾 Iniciando guardado de datos...', encuestasValidas);
                console.log('✅ Verificando que el campo "correo" esté presente en todas las encuestas:');
                
                // Verificar que todas las encuestas tengan el campo correo
                encuestasValidas.forEach((encuesta, index) => {
                    if (!encuesta.hasOwnProperty('correo')) {
                        console.warn(`❌ Encuesta ${index} no tiene campo correo, agregándolo...`);
                        encuesta.correo = null;
                    }
                    console.log(`Encuesta ${index} - correo:`, encuesta.correo);
                });
                
                const result = await Espo.Ajax.postRequest('ReportesCalidadServicio/action/importarEncuestas', {
                    encuestas: encuestasValidas,
                    modo: 'actualizar' // Indicar que queremos actualizar duplicados
                });
                
                console.log('📨 Respuesta del servidor:', result);
                
                this.wait(false);
                
                if (result.success) {
                    // CORRECCIÓN: usar let en lugar de const
                    let mensaje = `✅ ${result.message || 'Importación completada'}<br>`;
                    mensaje += `<strong>Resumen:</strong><br>`;
                    mensaje += `• Total en CSV: ${result.total}<br>`;
                    mensaje += `• Procesadas: ${result.procesadas}<br>`;
                    mensaje += `• Duplicadas omitidas: ${result.duplicadas}<br>`;
                    mensaje += `• Actualizadas: ${result.actualizadas || 0}<br>`;
                    mensaje += `• Errores: ${result.errores.length}`;
                    
                    if (result.errores && result.errores.length > 0) {
                        Espo.Ui.warning(mensaje, 10000);
                        console.log('❌ Errores detallados:', result.errores);
                    } else {
                        Espo.Ui.success(mensaje);
                    }
                    
                    // Mostrar detalles en consola
                    if (result.detalles) {
                        console.log('📝 Detalles de importación:', result.detalles);
                    }
                    
                } else {
                    throw new Error(result.error || 'Error desconocido en el servidor');
                }
                
                // Limpiar y recargar
                this.datosPreview = null;
                this.mostrarPreviewTabla = false;
                this.$el.find('#csv-file-input').val('');
                this.reRender();
                
                // Recargar estadísticas
                this.loadStatistics();
                
                return true;
                
            } catch (error) {
                console.error('💥 Error guardando encuestas:', error);
                this.wait(false);
                
                // CORRECCIÓN: usar let en lugar de const
                let mensajeError = 'Error al procesar las encuestas:<br>';
                
                if (error.message) {
                    mensajeError += error.message;
                } else if (error.status === 404) {
                    mensajeError += 'Endpoint no encontrado (404)';
                } else {
                    mensajeError += 'Error de conexión con el servidor';
                }
                
                Espo.Ui.error(mensajeError);
                throw error;
            }
        },

        // ... (el resto de los métodos se mantienen igual)
        renderCharts: function () {
            this.waitForChartJs(() => {
                if (this.stats.distribucionOperaciones && this.stats.distribucionOperaciones.length > 0) {
                    this.renderOperacionesChart();
                }
                if (this.stats.topAsesores && this.stats.topAsesores.length > 0) {
                    this.renderTopAsesoresChart();
                }
                this.renderSatisfaccionGauge();
            });
        },

        waitForChartJs: function(callback) {
            if (typeof Chart !== 'undefined') {
                callback();
            } else {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
                script.onload = callback;
                document.head.appendChild(script);
            }
        },

        renderOperacionesChart: function () {
            // ... (mantener código existente)
        },

        renderTopAsesoresChart: function () {
            // ... (mantener código existente)
        },

        renderSatisfaccionGauge: function () {
            // ... (mantener código existente)
        },

        onRemove: function() {
            if (this.operacionesChart) {
                this.operacionesChart.destroy();
            }
            if (this.asesoresChart) {
                this.asesoresChart.destroy();
            }
        }
    });
});