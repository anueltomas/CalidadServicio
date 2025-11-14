define(['view'], function (View, $) {
    
    return Dep.extend({

        template: 'reportes-calidad-servicio:import-modal',
        
        className: 'dialog dialog-record',

        backdrop: true,

        setup: function () {
            this.buttonList = [
                {
                    name: 'import',
                    label: 'Importar',
                    style: 'primary',
                    disabled: true
                },
                {
                    name: 'cancel',
                    label: 'Cancel'
                }
            ];

            this.headerHtml = '<span class="fas fa-upload"></span> ' + 
                             this.translate('Importar Datos de Calidad', 'labels', 'ReportesCalidadServicio');

            this.fileContent = null;
            this.fileName = null;
            this.validationResult = null;
        },

        data: function () {
            return {
                fileName: this.fileName,
                validationResult: this.validationResult,
                hasFile: !!this.fileContent
            };
        },

        afterRender: function () {
            this.$fileInput = this.$el.find('input[name="csvFile"]');
            this.$fileInfo = this.$el.find('.file-info');
            this.$validationInfo = this.$el.find('.validation-info');
            this.$progressBar = this.$el.find('.progress');

            this.$fileInput.on('change', this.handleFileSelect.bind(this));
        },

        handleFileSelect: function (e) {
            const file = e.target.files[0];
            
            if (!file) {
                this.clearFile();
                return;
            }

            if (!file.name.endsWith('.csv')) {
                Espo.Ui.error(this.translate('Solo se permiten archivos CSV', 'messages', 'ReportesCalidadServicio'));
                this.clearFile();
                return;
            }

            this.fileName = file.name;
            this.showLoadingMessage();

            const reader = new FileReader();
            reader.onload = (event) => {
                this.fileContent = event.target.result;
                this.validateFile();
            };
            reader.onerror = () => {
                Espo.Ui.error(this.translate('Error al leer el archivo', 'messages', 'ReportesCalidadServicio'));
                this.clearFile();
            };
            reader.readAsText(file);
        },

        validateFile: function () {
            Espo.Ajax.postRequest('ReportesCalidadServicio/action/validateCsv', {
                fileContent: this.fileContent
            }).then((response) => {
                this.validationResult = response;
                this.hideLoadingMessage();
                
                if (response.valid) {
                    this.$validationInfo.html(
                        '<div class="alert alert-success">' +
                        '<i class="fas fa-check-circle"></i> ' +
                        'Archivo válido. Se encontraron ' + response.rowCount + ' registros.' +
                        '</div>'
                    );
                    this.enableButton('import');
                } else {
                    this.$validationInfo.html(
                        '<div class="alert alert-danger">' +
                        '<i class="fas fa-exclamation-triangle"></i> ' +
                        '<strong>Error de validación:</strong><br>' +
                        response.error +
                        '</div>'
                    );
                    this.disableButton('import');
                }
                
                this.reRender();
            }).catch(() => {
                Espo.Ui.error(this.translate('Error al validar el archivo', 'messages', 'ReportesCalidadServicio'));
                this.clearFile();
                this.hideLoadingMessage();
            });
        },

        clearFile: function () {
            this.fileContent = null;
            this.fileName = null;
            this.validationResult = null;
            this.$fileInput.val('');
            this.$validationInfo.html('');
            this.disableButton('import');
            this.reRender();
        },

        showLoadingMessage: function () {
            this.$validationInfo.html(
                '<div class="alert alert-info">' +
                '<i class="fas fa-spinner fa-spin"></i> Validando archivo...' +
                '</div>'
            );
        },

        hideLoadingMessage: function () {
            // Se reemplaza por el resultado de validación
        },

        actionImport: function () {
            if (!this.fileContent) {
                return;
            }

            this.disableButton('import');
            this.disableButton('cancel');
            
            this.$progressBar.show();
            this.$progressBar.find('.progress-bar').css('width', '0%');

            Espo.Ui.notify(this.translate('Importando...', 'messages', 'ReportesCalidadServicio'));

            // Simular progreso
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += 5;
                if (progress <= 90) {
                    this.$progressBar.find('.progress-bar').css('width', progress + '%');
                }
            }, 200);

            Espo.Ajax.postRequest('ReportesCalidadServicio/action/importCsv', {
                fileContent: this.fileContent
            }).then((response) => {
                clearInterval(progressInterval);
                this.$progressBar.find('.progress-bar').css('width', '100%');

                setTimeout(() => {
                    this.$progressBar.hide();
                    
                    let message = 'Importación completada:<br>' +
                                '<strong>' + response.imported + '</strong> registros importados';
                    
                    if (response.skipped > 0) {
                        message += '<br><strong>' + response.skipped + '</strong> registros omitidos';
                    }

                    if (response.errors.length > 0) {
                        message += '<br><br><strong>Errores:</strong><ul>';
                        response.errors.slice(0, 10).forEach(error => {
                            message += '<li>' + error + '</li>';
                        });
                        if (response.errors.length > 10) {
                            message += '<li>... y ' + (response.errors.length - 10) + ' más</li>';
                        }
                        message += '</ul>';
                    }

                    Espo.Ui.success(message, {
                        closeButton: true
                    });

                    this.trigger('imported', response);
                    this.close();
                }, 500);

            }).catch((xhr) => {
                clearInterval(progressInterval);
                this.$progressBar.hide();
                
                let errorMsg = 'Error al importar el archivo';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                
                Espo.Ui.error(errorMsg);
                this.enableButton('import');
                this.enableButton('cancel');
            });
        }
    });
});