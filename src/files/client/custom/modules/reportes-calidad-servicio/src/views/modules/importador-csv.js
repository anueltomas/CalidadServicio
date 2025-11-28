define('reportes-calidad-servicio:views/modules/importador-csv', [], function () {
    
    var ImportadorCSV = function(view) {
        this.view = view;
        
        // Inicializar mapeos en el constructor si es necesario
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
            Espo.Ui.error('❌ No tiene permisos para importar encuestas. Solo usuarios administrativos pueden realizar esta acción.', null, 10000);
            return;
        }
        
        var fileInput = this.view.$el.find('#csv-file-input')[0];
        if (!fileInput || !fileInput.files || !fileInput.files[0]) {
            Espo.Ui.warning('Por favor selecciona un archivo CSV primero.', null, 8000);
            return;
        }
        
        Espo.Ui.info('Función de importación lista - Módulo cargado correctamente');
    };

    return ImportadorCSV;
});