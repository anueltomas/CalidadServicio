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

        guardarEncuestasEnBD: async function(encuestasValidas) {
    try {
        console.log('💾 Iniciando guardado de datos en modo simulación...', encuestasValidas);
        
        const result = await Espo.Ajax.postRequest('ReportesCalidadServicio/action/importarEncuestas', {
            encuestas: encuestasValidas
        });
        
        console.log('📨 Respuesta del servidor:', result);
        
        this.wait(false);
        
        if (result.success) {
            // Mostrar resultados detallados
            let mensaje = `✅ ${result.message || 'Importación completada'}<br>`;
            mensaje += `<strong>Resumen:</strong><br>`;
            mensaje += `• Total en CSV: ${result.total}<br>`;
            mensaje += `• Procesadas: ${result.procesadas}<br>`;
            mensaje += `• Duplicadas omitidas: ${result.duplicadas}<br>`;
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

/**
 * Obtiene mapa de oficinas existentes
 */
obtenerMapaOficinas: async function() {
    try {
        console.log('🏢 Obteniendo mapa de oficinas...');
        
        // En una implementación real, aquí buscarías las oficinas en la BD
        // Por ahora retornamos un mapa vacío
        return {};
        
    } catch (error) {
        console.error('Error obteniendo oficinas:', error);
        return {};
    }
},

/**
 * Obtiene mapa de asesores existentes
 */
obtenerMapaAsesores: async function() {
    try {
        console.log('👤 Obteniendo mapa de asesores...');
        
        // En una implementación real, aquí buscarías los asesores en la BD
        // Por ahora retornamos un mapa vacío
        return {};
        
    } catch (error) {
        console.error('Error obteniendo asesores:', error);
        return {};
    }
},

/**
 * Guarda las encuestas en la base de datos
 */
guardarEncuestas: async function(encuestasValidas, mapaOficinas, mapaAsesores) {
    try {
        console.log('📤 Enviando encuestas al servidor...', encuestasValidas);
        
        const result = await Espo.Ajax.postRequest('ReportesCalidadServicio/action/importarEncuestas', {
            encuestas: encuestasValidas
        });
        
        console.log('📨 Respuesta del servidor:', result);
        
        if (result.success) {
            return {
                total: result.total,
                procesadas: result.procesadas,
                duplicadas: result.duplicadas,
                errores: result.errores || [],
                detalles: result.detalles || []
            };
        } else {
            throw new Error(result.error || 'Error desconocido en el servidor');
        }
        
    } catch (error) {
        console.error('💥 Error guardando encuestas:', error);
        throw error;
    }
},

        // Método de fallback para guardar encuestas individualmente
        guardarEncuestasIndividualmente: async function(encuestas) {
            console.log('Usando método de fallback para guardar encuestas individualmente');
            
            let exitosas = 0;
            let errores = [];
            
            for (let i = 0; i < encuestas.length; i++) {
                try {
                    const encuesta = encuestas[i];
                    
                    // Aquí iría la lógica para guardar cada encuesta individualmente
                    // usando la API estándar de EspoCRM si es necesario
                    console.log(`Procesando encuesta ${i + 1}/${encuestas.length}:`, encuesta.nombreCliente);
                    
                    // Simular éxito por ahora
                    exitosas++;
                    
                } catch (error) {
                    console.error(`Error en encuesta ${i + 1}:`, error);
                    errores.push(`Encuesta ${i + 1}: ${error.message}`);
                }
            }
            
            if (errores.length > 0) {
                Espo.Ui.warning(`Se procesaron ${exitosas} de ${encuestas.length} encuestas. Errores: ${errores.length}`);
            } else {
                Espo.Ui.success(`Todas las ${exitosas} encuestas procesadas exitosamente`);
            }
            
            return exitosas > 0;
        },

        // En tu principal.js - método loadStatistics corregido
        loadStatistics: function() {
            console.log('Cargando estadísticas...');
            
            Espo.Ajax.getRequest('ReportesCalidadServicio/action/getStats')
                .then(response => {
                    console.log('Estadísticas recibidas:', response);
                    
                    if (response.success && response.data) {
                        this.procesarEstadisticas(response.data);
                    } else {
                        console.error('Error en respuesta de estadísticas:', response);
                        this.mostrarEstadisticasPorDefecto();
                    }
                })
                .catch(error => {
                    console.error('Error cargando estadísticas:', error);
                    this.mostrarEstadisticasPorDefecto();
                });
        },

        procesarEstadisticas: function(data) {
    try {
        console.log('📊 Procesando estadísticas:', data);
        
        // Actualizar tarjetas de estadísticas
        this.actualizarTarjetaEstadistica('total-encuestas', data.totalEncuestas || 0);
        this.actualizarTarjetaEstadistica('satisfaccion-promedio', data.satisfaccionPromedio || 0);
        this.actualizarTarjetaEstadistica('porcentaje-recomendacion', data.porcentajeRecomendacion || 0);
        this.actualizarTarjetaEstadistica('tipos-operacion', data.tiposOperacion || 0);
        
        // Actualizar tabla de asesores destacados
        this.actualizarTablaAsesores(data.asesoresDestacados || []);
        
        // Actualizar gráficos
        this.actualizarGraficos(data.distribucionOperaciones || {});
        
    } catch (error) {
        console.error('❌ Error procesando estadísticas:', error);
        this.mostrarEstadisticasPorDefecto();
    }
},

actualizarTarjetaEstadistica: function(tipo, valor) {
    try {
        // Buscar elementos por diferentes selectores posibles
        const selectores = [
            `[data-stat="${tipo}"]`,
            `.stat-number[data-type="${tipo}"]`,
            `#${tipo}`,
            `.${tipo}`
        ];
        
        let elemento = null;
        for (const selector of selectores) {
            elemento = this.$el.find(selector)[0];
            if (elemento) break;
        }
        
        if (elemento) {
            // Formatear valores según el tipo
            let valorFormateado = valor;
            
            switch(tipo) {
                case 'satisfaccion-promedio':
                    valorFormateado = typeof valor === 'number' ? valor.toFixed(1) : '0.0';
                    break;
                case 'porcentaje-recomendacion':
                    valorFormateado = typeof valor === 'number' ? valor + '%' : '0%';
                    break;
                case 'total-encuestas':
                case 'tipos-operacion':
                    valorFormateado = valor.toString();
                    break;
            }
            
            elemento.textContent = valorFormateado;
            console.log(`✅ Actualizada tarjeta ${tipo}: ${valorFormateado}`);
        } else {
            console.warn(`⚠️ No se encontró elemento para: ${tipo}`);
        }
    } catch (error) {
        console.error(`❌ Error actualizando tarjeta ${tipo}:`, error);
    }
},

actualizarTablaAsesores: function(asesores) {
    try {
        console.log('👤 Actualizando tabla de asesores:', asesores);
        
        if (asesores.length === 0) {
            this.mostrarAsesoresPorDefecto();
        } else {
            this.renderizarAsesores(asesores);
        }
    } catch (error) {
        console.error('❌ Error actualizando tabla de asesores:', error);
        this.mostrarAsesoresPorDefecto();
    }
},

        /**
 * Renderiza la tabla de asesores destacados
 */
renderizarAsesores: function(asesores) {
    try {
        console.log('🎨 Renderizando asesores:', asesores);
        
        // Buscar la tabla de asesores
        const tablaAsesores = this.$el.find('table tbody')[0];
        
        if (!tablaAsesores) {
            console.warn('⚠️ No se encontró la tabla de asesores');
            return;
        }
        
        // Limpiar tabla existente
        tablaAsesores.innerHTML = '';
        
        // Renderizar cada asesor
        asesores.forEach((asesor, index) => {
            const fila = document.createElement('tr');
            
            // Determinar clase de nivel
            let claseNivel = 'label-warning';
            if (asesor.nivel === 'Excelente') claseNivel = 'label-success';
            if (asesor.nivel === 'Muy Bueno') claseNivel = 'label-info';
            if (asesor.nivel === 'Bueno') claseNivel = 'label-warning';
            if (asesor.nivel === 'Regular') claseNivel = 'label-default';
            if (asesor.nivel === 'Necesita Mejora') claseNivel = 'label-danger';
            
            fila.innerHTML = `
                <td><strong>${asesor.nombre || 'N/A'}</strong></td>
                <td class="text-center">
                    <span class="badge badge-primary">${asesor.totalEncuestas || 0}</span>
                </td>
                <td class="text-center">
                    <span class="badge badge-warning">
                        ${asesor.calificacionPromedio || 0}/5
                    </span>
                </td>
                <td class="text-center">
                    <span class="label ${claseNivel}">${asesor.nivel || 'N/A'}</span>
                </td>
            `;
            
            tablaAsesores.appendChild(fila);
        });
        
        console.log(`✅ Tabla de asesores actualizada con ${asesores.length} registros`);
        
    } catch (error) {
        console.error('❌ Error renderizando asesores:', error);
        throw error;
    }
},

actualizarGraficos: function(distribucion) {
    try {
        console.log('📈 Actualizando gráficos con distribución:', distribucion);
        
        if (Object.keys(distribucion).length === 0) {
            this.mostrarGraficosPorDefecto();
        } else {
            this.renderizarGraficos(distribucion);
        }
    } catch (error) {
        console.error('❌ Error actualizando gráficos:', error);
        this.mostrarGraficosPorDefecto();
    }
},

/**
 * Renderiza los gráficos con datos reales
 */
renderizarGraficos: function(distribucion) {
    try {
        console.log('🎨 Renderizando gráficos con datos reales');
        
        // Actualizar gráfico circular (pie chart)
        this.actualizarPieChart(distribucion);
        
        // Actualizar gráfico de barras
        this.actualizarBarChart(distribucion);
        
        // Actualizar porcentajes
        //this.actualizarPorcentajes(distribucion);
        
    } catch (error) {
        console.error('❌ Error renderizando gráficos:', error);
        this.mostrarGraficosPorDefecto();
    }
},

/**
 * Actualiza el gráfico circular
 */
actualizarPieChart: function(distribucion) {
    try {
        const total = Object.values(distribucion).reduce((sum, value) => sum + value, 0);
        
        // Calcular porcentajes
        const ventaPorcentaje = total > 0 ? Math.round((distribucion.Venta || 0) / total * 100) : 0;
        const compraPorcentaje = total > 0 ? Math.round((distribucion.Compra || 0) / total * 100) : 0;
        const alquilerPorcentaje = total > 0 ? Math.round((distribucion.Alquiler || 0) / total * 100) : 0;
        
        // Actualizar gráfico circular
        const pieChart = this.$el.find('.pie-chart-rcs')[0];
        if (pieChart) {
            pieChart.style.background = `conic-gradient(
                #3498db 0% ${ventaPorcentaje}%,
                #2ecc71 ${ventaPorcentaje}% ${ventaPorcentaje + compraPorcentaje}%,
                #e74c3c ${ventaPorcentaje + compraPorcentaje}% 100%
            )`;
        }
        
        // Actualizar total en el centro
        const pieTotal = this.$el.find('.pie-total-rcs')[0];
        if (pieTotal) {
            pieTotal.textContent = total;
        }
        
        console.log(`✅ Pie chart actualizado: Venta ${ventaPorcentaje}%, Compra ${compraPorcentaje}%, Alquiler ${alquilerPorcentaje}%`);
        
    } catch (error) {
        console.error('❌ Error actualizando pie chart:', error);
    }
},

/**
 * Actualiza el gráfico de barras
 */
actualizarBarChart: function(distribucion) {
    try {
        const valores = {
            Venta: distribucion.Venta || 0,
            Compra: distribucion.Compra || 0,
            Alquiler: distribucion.Alquiler || 0
        };
        
        const maxValor = Math.max(...Object.values(valores));
        const factorEscala = maxValor > 0 ? 180 / maxValor : 1; // 180px de altura máxima
        
        // Actualizar cada barra
        Object.keys(valores).forEach((operacion, index) => {
            const valor = valores[operacion];
            const altura = Math.round(valor * factorEscala);
            
            const barra = this.$el.find(`.bar-rcs.color-${operacion.toLowerCase()}-rcs`)[index];
            const valorBarra = this.$el.find(`.bar-value-rcs`)[index];
            
            if (barra) {
                barra.style.height = `${altura}px`;
            }
            
            if (valorBarra) {
                valorBarra.textContent = valor;
            }
        });
        
        console.log('✅ Bar chart actualizado:', valores);
        
    } catch (error) {
        console.error('❌ Error actualizando bar chart:', error);
    }
},

        mostrarEstadisticasPorDefecto: function() {
            console.log('Mostrando estadísticas por defecto');
            
            // Valores por defecto
            this.actualizarTarjetaEstadistica('total-encuestas', 0);
            this.actualizarTarjetaEstadistica('satisfaccion-promedio', 0);
            this.actualizarTarjetaEstadistica('porcentaje-recomendacion', 0);
            this.actualizarTarjetaEstadistica('tipos-operacion', 0);
            
            this.mostrarAsesoresPorDefecto();
            this.mostrarGraficosPorDefecto();
        },

        mostrarAsesoresPorDefecto: function() {
            // Mostrar mensaje de "No hay datos" o mantener datos estáticos
            console.log('Mostrando asesores por defecto');
        },

        mostrarGraficosPorDefecto: function() {
            // Mostrar gráficos con datos por defecto
            console.log('Mostrando gráficos por defecto');
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