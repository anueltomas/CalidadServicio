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
                var todasLasLineas = contenidoCSV.split('\n').filter(l => l.trim());
                
                if (todasLasLineas.length < 2) {
                    Espo.Ui.error('El archivo CSV está vacío o no tiene datos.');
                    this.wait(false);
                    return;
                }
                
                var headers = this.parsearLineaCSV(todasLasLineas[0]);
                var lineasDeDatos = todasLasLineas.slice(1);

                // Extraer preguntas del CSV
                const preguntasDelCSV = this.extraerPreguntasDeEncuesta(headers);
                
                // Procesar encuestas
                const { encuestasValidas, erroresDeFila } = this.procesarEncuestasCSV(lineasDeDatos, headers, preguntasDelCSV);

                if (erroresDeFila.length > 0) {
                    const mensajeError = 'Algunas filas del CSV fueron omitidas por errores:<br>' + erroresDeFila.join('<br>');
                    Espo.Ui.warning(mensajeError, 10000);
                }

                if (encuestasValidas.length === 0) {
                    Espo.Ui.error('No se encontraron filas de datos válidas en el archivo CSV.');
                    this.wait(false);
                    return;
                }

                // Guardar en la base de datos
                await this.guardarEncuestasEnBD(encuestasValidas);
                
                Espo.Ui.success(`Se importaron ${encuestasValidas.length} encuestas exitosamente`);
                this.wait(false);
                this.loadStatistics(); // Recargar estadísticas

            } catch (error) {
                console.error('Error en el proceso de carga:', error);
                Espo.Ui.error('Error al procesar el archivo CSV: ' + error.message);
                this.wait(false);
            }
        },

        parsearLineaCSV: function(linea) {
            // Manejar campos entre comillas que contienen comas
            const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
            const campos = [];
            let campo;
            
            while ((campo = regex.exec(linea))) {
                let valor = campo[1];
                if (valor.startsWith('"') && valor.endsWith('"')) {
                    valor = valor.substring(1, valor.length - 1).replace(/""/g, '"');
                }
                campos.push(valor.trim());
            }
            
            return campos;
        },

        extraerPreguntasDeEncuesta: function(headers) {
            const preguntas = {};
            
            // Mapear las preguntas según la estructura del CSV
            const mapeoPreguntas = {
                'CLA': 'ciudad',
                'ID Oficina': 'idOficina',
                'Oficina': 'oficina',
                'Marca temporal': 'fechaEncuesta',
                'Correo': 'email',
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

            return preguntas;
        },

        procesarEncuestasCSV: function(lineasDeDatos, headers, preguntas) {
            const encuestasValidas = [];
            const erroresDeFila = [];

            lineasDeDatos.forEach((linea, index) => {
                try {
                    const campos = this.parsearLineaCSV(linea);
                    
                    if (campos.length < Object.keys(preguntas).length) {
                        erroresDeFila.push(`Fila ${index + 2}: Número insuficiente de campos`);
                        return;
                    }

                    const encuesta = {
                        ciudad: campos[preguntas.ciudad] || '',
                        idOficina: parseInt(campos[preguntas.idOficina]) || 0,
                        oficina: campos[preguntas.oficina] || '',
                        fechaEncuesta: this.parsearFecha(campos[preguntas.fechaEncuesta]),
                        email: campos[preguntas.email] || '',
                        tipoOperacion: campos[preguntas.tipoOperacion] || '',
                        idAsesor: parseInt(campos[preguntas.idAsesor]) || 0,
                        nombreAsesor: campos[preguntas.nombreAsesor] || '',
                        puntuacionAsesoriaLegal: this.parsearPuntuacion(campos[preguntas.puntuacionAsesoriaLegal]),
                        puntuacionPresentacion: this.parsearPuntuacion(campos[preguntas.puntuacionPresentacion]),
                        puntuacionManejoDetalles: this.parsearPuntuacion(campos[preguntas.puntuacionManejoDetalles]),
                        puntuacionPuntualidad: this.parsearPuntuacion(campos[preguntas.puntuacionPuntualidad]),
                        puntuacionCompromiso: this.parsearPuntuacion(campos[preguntas.puntuacionCompromiso]),
                        puntuacionSolucionProblemas: this.parsearPuntuacion(campos[preguntas.puntuacionSolucionProblemas]),
                        puntuacionAcompanamiento: this.parsearPuntuacion(campos[preguntas.puntuacionAcompanamiento]),
                        puntuacionSituacionesImprevistas: this.parsearPuntuacion(campos[preguntas.puntuacionSituacionesImprevistas]),
                        puntuacionManejoTiempos: this.parsearPuntuacion(campos[preguntas.puntuacionManejoTiempos]),
                        puntuacionGeneralAsesor: this.parsearPuntuacion(campos[preguntas.puntuacionGeneralAsesor]),
                        puntuacionOficina: this.parsearPuntuacion(campos[preguntas.puntuacionOficina]),
                        recomendacion: campos[preguntas.recomendacion] || '',
                        medioContacto: campos[preguntas.medioContacto] || '',
                        sugerencias: campos[preguntas.sugerencias] || '',
                        fechaCumpleanos: this.parsearFechaCumpleanos(campos[preguntas.fechaCumpleanos]),
                        nombreCliente: campos[preguntas.nombreCliente] || ''
                    };

                    // Validar encuesta mínima
                    if (!encuesta.nombreAsesor && !encuesta.email) {
                        erroresDeFila.push(`Fila ${index + 2}: Faltan datos esenciales (asesor o email)`);
                        return;
                    }

                    encuestasValidas.push(encuesta);

                } catch (error) {
                    erroresDeFila.push(`Fila ${index + 2}: Error de formato - ${error.message}`);
                }
            });

            return { encuestasValidas, erroresDeFila };
        },

        parsearFecha: function(fechaStr) {
            if (!fechaStr) return null;
            
            // Formato: "12/18/24 12:37"
            const partes = fechaStr.split(' ');
            if (partes.length < 1) return null;
            
            const fechaPartes = partes[0].split('/');
            if (fechaPartes.length !== 3) return null;
            
            let año = parseInt(fechaPartes[2]);
            if (año < 100) {
                año += 2000; // Asumir siglo 21 para años de dos dígitos
            }
            
            const mes = parseInt(fechaPartes[0]) - 1;
            const dia = parseInt(fechaPartes[1]);
            
            return new Date(año, mes, dia).toISOString().split('T')[0];
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
                return null;
            }
        },

        parsearPuntuacion: function(puntuacionStr) {
            if (!puntuacionStr) return null;
            
            const puntuacion = parseFloat(puntuacionStr);
            return isNaN(puntuacion) ? null : Math.min(Math.max(puntuacion, 1), 5);
        },

        guardarEncuestasEnBD: async function(encuestas) {
            try {
                // Usar la ruta estándar sin routes.json
                const result = await Espo.Ajax.postRequest('ReportesCalidadServicio/action/importarEncuestas', {
                    encuestas: encuestas
                });
                
                if (result.errores && result.errores.length > 0) {
                    Espo.Ui.warning(`Se importaron ${result.importadas} de ${result.total} encuestas. Errores: ${result.errores.length}`);
                }
                
                Espo.Ui.success(`Encuestas importadas exitosamente: ${result.importadas}/${result.total}`);
                return true;
                
            } catch (error) {
                console.error('Error al guardar encuestas:', error);
                
                // Método de fallback
                if (error.status === 404) {
                    return await this.guardarEncuestasIndividualmente(encuestas);
                }
                
                throw new Error('Error al guardar en la base de datos: ' + (error.message || 'Error desconocido'));
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

        renderCharts: function () {
            // ... (mantener el código existente de gráficos)
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