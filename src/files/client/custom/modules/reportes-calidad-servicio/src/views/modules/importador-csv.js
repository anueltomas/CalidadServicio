define('reportes-calidad-servicio:views/modules/importador-csv', [], function () {
    
    var ImportadorCSV = function(view) {
        this.view = view;
        this.initMappings();
    };

    ImportadorCSV.prototype.initMappings = function() {
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

        this.fieldsScale0to4 = [
            'communicationEffectiveness', 'legalAdvice', 'personalPresentation',
            'detailManagement', 'punctuality', 'commitmentLevel', 'problemSolving',
            'fullSupport', 'unexpectedSituations', 'negotiationTiming', 'officeRating'
        ];
    };

    ImportadorCSV.prototype.actionImport = function() {
        if (!this.view.permisosManager.permisos.puedeImportar) {
            Espo.Ui.error('❌ No tiene permisos para importar encuestas. Solo usuarios administrativos pueden realizar esta acción.');
            return;
        }
        
        var fileInput = this.view.$el.find('#csv-file-input')[0];
        if (!fileInput || !fileInput.files || !fileInput.files[0]) {
            Espo.Ui.warning('Por favor selecciona un archivo CSV primero.');
            return;
        }
        
        var file = fileInput.files[0];
        
        this.mostrarBarraProgreso();
        
        var reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                var contenido = e.target.result;
                var encuestas = this.parsearCSV(contenido);
                
                if (encuestas.length === 0) {
                    this.ocultarBarraProgreso();
                    Espo.Ui.warning('El archivo CSV no contiene datos válidos.');
                    return;
                }
                
                this.enviarEncuestasAlServidor(encuestas);
                
            } catch (error) {
                this.ocultarBarraProgreso();
                Espo.Ui.error('Error al procesar el archivo CSV: ' + error.message);
            }
        }.bind(this);
        
        reader.onerror = function() {
            this.ocultarBarraProgreso();
            Espo.Ui.error('Error al leer el archivo CSV.');
        }.bind(this);
        
        reader.readAsText(file, 'UTF-8');
    };

    ImportadorCSV.prototype.mostrarBarraProgreso = function() {
        var barraExistente = $('#import-progress-bar');
        if (barraExistente.length > 0) {
            barraExistente.remove();
        }
        
        var barraHTML = '<div id="import-progress-bar" style="position: fixed; top: 0; left: 0; right: 0; z-index: 9999; background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 15px 20px;">' +
            '<div style="display: flex; align-items: center; gap: 15px; max-width: 1200px; margin: 0 auto;">' +
                '<div style="flex: 1;">' +
                    '<div style="display: flex; justify-content: space-between; margin-bottom: 8px;">' +
                        '<span style="font-weight: 600; color: #2c3e50;"><i class="fas fa-upload"></i> Importando encuestas...</span>' +
                        '<span id="progress-percentage" style="font-weight: 600; color: #B8A279;">0%</span>' +
                    '</div>' +
                    '<div style="width: 100%; height: 20px; background: #f0f0f0; border-radius: 10px; overflow: hidden; position: relative;">' +
                        '<div id="progress-bar-fill" style="width: 0%; height: 100%; background: linear-gradient(90deg, #B8A279 0%, #D4C19C 100%); transition: width 0.3s ease; border-radius: 10px;"></div>' +
                    '</div>' +
                    '<div id="progress-message" style="margin-top: 8px; font-size: 0.9em; color: #7f8c8d;">Preparando importación...</div>' +
                '</div>' +
            '</div>' +
        '</div>';
        
        $('body').append(barraHTML);
    };

    ImportadorCSV.prototype.actualizarProgreso = function(porcentaje, mensaje) {
        var progressBar = $('#progress-bar-fill');
        var progressPercentage = $('#progress-percentage');
        var progressMessage = $('#progress-message');
        
        if (progressBar.length) {
            progressBar.css('width', porcentaje + '%');
        }
        
        if (progressPercentage.length) {
            progressPercentage.text(Math.round(porcentaje) + '%');
        }
        
        if (progressMessage.length && mensaje) {
            progressMessage.text(mensaje);
        }
    };

    ImportadorCSV.prototype.ocultarBarraProgreso = function() {
        var barra = $('#import-progress-bar');
        if (barra.length) {
            barra.fadeOut(300, function() {
                barra.remove();
            });
        }
    };

    ImportadorCSV.prototype.parsearCSV = function(contenido) {
        var lineas = contenido.split(/\r?\n/);
        var encuestas = [];
        
        if (lineas.length < 2) {
            throw new Error('El archivo CSV está vacío o no tiene datos');
        }
        
        var headers = this.parsearLineaCSV(lineas[0]);
        
        this.actualizarProgreso(10, 'Procesando ' + (lineas.length - 1) + ' registros...');
        
        for (var i = 1; i < lineas.length; i++) {
            if (!lineas[i].trim()) continue;
            
            try {
                var valores = this.parsearLineaCSV(lineas[i]);
                
                if (valores.length !== headers.length) {
                    continue;
                }
                
                var encuesta = this.mapearEncuesta(headers, valores);
                
                if (encuesta && encuesta.clientName && encuesta.emailAddress) {
                    encuestas.push(encuesta);
                }
                
                if (i % 10 === 0) {
                    var progreso = 10 + ((i / (lineas.length - 1)) * 30);
                    this.actualizarProgreso(progreso, 'Procesando registro ' + i + ' de ' + (lineas.length - 1));
                }
                
            } catch (error) {
            }
        }
        
        this.actualizarProgreso(40, 'Preparando envío de ' + encuestas.length + ' encuestas...');
        
        return encuestas;
    };

    ImportadorCSV.prototype.parsearLineaCSV = function(linea) {
        var valores = [];
        var valorActual = '';
        var dentroComillas = false;
        
        for (var i = 0; i < linea.length; i++) {
            var char = linea[i];
            
            if (char === '"') {
                dentroComillas = !dentroComillas;
            } else if (char === ',' && !dentroComillas) {
                valores.push(valorActual.trim());
                valorActual = '';
            } else {
                valorActual += char;
            }
        }
        
        valores.push(valorActual.trim());
        
        return valores.map(function(v) {
            return v.replace(/^"|"$/g, '').trim();
        });
    };

    ImportadorCSV.prototype.mapearEncuesta = function(headers, valores) {
        var encuesta = {};
        
        for (var i = 0; i < headers.length; i++) {
            var header = headers[i];
            var valor = valores[i];
            
            var campoMapeado = this.csvToFieldMapping[header];
            
            if (!campoMapeado) continue;
            
            if (campoMapeado === 'createdAt') {
                encuesta[campoMapeado] = this.convertirFecha(valor);
            } else if (campoMapeado === 'recommendation') {
                encuesta[campoMapeado] = valor.toLowerCase().includes('sí') || valor.toLowerCase().includes('si') ? '1' : '0';
            } else if (campoMapeado === 'contactMedium') {
                encuesta[campoMapeado] = this.procesarContactMedium(valor);
            } else if (this.fieldsScale0to4.includes(campoMapeado)) {
                var valorNum = this.convertirEscala(valor);
                if (valorNum !== null) {
                    encuesta[campoMapeado] = valorNum;
                }
            } else if (campoMapeado === 'generalAdvisorRating') {
                var rating = parseInt(valor);
                if (rating >= 1 && rating <= 5) {
                    encuesta[campoMapeado] = rating;
                }
            } else {
                encuesta[campoMapeado] = valor;
            }
        }
        
        return encuesta;
    };

    ImportadorCSV.prototype.convertirFecha = function(fechaStr) {
        try {
            var partes = fechaStr.split(' ');
            var fecha = partes[0].split('/');
            var hora = partes[1] || '00:00:00';
            
            if (fecha.length === 3) {
                var dia = fecha[0].padStart(2, '0');
                var mes = fecha[1].padStart(2, '0');
                var anio = fecha[2];
                
                return anio + '-' + mes + '-' + dia + ' ' + hora;
            }
        } catch (error) {
        }
        
        return new Date().toISOString().slice(0, 19).replace('T', ' ');
    };

    ImportadorCSV.prototype.convertirEscala = function(valor) {
        var escalas = {
            'excelente': 4,
            'muy bueno': 3,
            'bueno': 2,
            'regular': 1,
            'deficiente': 0
        };
        
        var valorLower = valor.toLowerCase().trim();
        
        if (escalas.hasOwnProperty(valorLower)) {
            return escalas[valorLower];
        }
        
        var valorNum = parseInt(valor);
        if (!isNaN(valorNum) && valorNum >= 0 && valorNum <= 4) {
            return valorNum;
        }
        
        return null;
    };

    ImportadorCSV.prototype.procesarContactMedium = function(valor) {
        var medios = valor.split(',').map(function(m) {
            return m.trim();
        });
        
        var mediosMapeados = [];
        
        medios.forEach(function(medio) {
            var medioMapeado = this.contactMediumMapping[medio];
            if (medioMapeado && medioMapeado !== 'contactMediumOther') {
                mediosMapeados.push(medioMapeado);
            }
        }.bind(this));
        
        return mediosMapeados;
    };

    ImportadorCSV.prototype.enviarEncuestasAlServidor = function(encuestas) {
        this.actualizarProgreso(50, 'Enviando datos al servidor...');
        
        Espo.Ajax.postRequest('CCustomerSurvey/action/importarEncuestas', {
            encuestas: encuestas
        }).then(function(response) {
            this.actualizarProgreso(100, 'Importación completada!');
            
            setTimeout(function() {
                this.ocultarBarraProgreso();
                
                if (response.success) {
                    var mensaje = 'Importación exitosa!\n\n' +
                                 'Total: ' + response.total + '\n' +
                                 'Procesadas: ' + response.procesadas + '\n' +
                                 'Duplicadas: ' + response.duplicadas;
                    
                    if (response.errores && response.errores.length > 0) {
                        mensaje += '\nErrores: ' + response.errores.length;
                    }
                    
                    Espo.Ui.success(mensaje);
                    
                    var fileInput = this.view.$el.find('#csv-file-input')[0];
                    if (fileInput) {
                        fileInput.value = '';
                    }
                    var fileName = this.view.$el.find('#file-name')[0];
                    if (fileName) {
                        fileName.textContent = 'No se ha seleccionado ningún archivo';
                        fileName.classList.remove('has-file');
                    }
                    
                    setTimeout(function() {
                        this.view.estadisticasManager.loadStatistics();
                    }.bind(this), 1000);
                    
                } else {
                    Espo.Ui.error('Error en la importación: ' + (response.error || 'Error desconocido'));
                }
            }.bind(this), 1000);
            
        }.bind(this)).catch(function(error) {
            setTimeout(function() {
                this.ocultarBarraProgreso();
                Espo.Ui.error('Error al enviar datos al servidor: ' + (error.message || 'Error de conexión'));
            }.bind(this), 1000);
        }.bind(this));
    };

    return ImportadorCSV;
});