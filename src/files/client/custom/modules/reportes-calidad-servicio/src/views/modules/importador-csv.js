define("reportes-calidad-servicio:views/modules/importador-csv", [], function () {
    var ImportadorCSV = function (view) {
        this.view = view;
        this.initMappings();
    };

    ImportadorCSV.prototype.initMappings = function () {
        this.camposOrdenBD = [
            "created_at",
            "email_address",
            "operation_type",
            "assigned_user_id",
            "communicationEffectiveness",
            "legal_advice",
            "business_knowledge",
            "personal_presentation",
            "detail_management",
            "punctuality",
            "commitment_level",
            "problem_solving",
            "full_support",
            "unexpected_situations",
            "negotiation_timing",
            "general_advisor_rating",
            "office_rating",
            "recommendation",
            "contact_medium",
            "additional_feedback",
            "client_name",
        ];

        this.csvToFieldMapping = {
            "Marca temporal": "createdAt",
            Correo: "emailAddress",
            "1. ¿Qué tipo de operación realizó?": "operationType",
            "ID Asesor": "assignedUserId",

            // ✅ CORREGIDO: Agregar mapeo para la pregunta 3
            "3. Por favor, evalúe el servicio prestado por el Asesor Inmobiliario de Century 21 en cuanto a conocimiento del negocio inmobiliario":
                "businessKnowledge",

            "Efectividad y regularidad en la Comunicación":
                "communicationEffectiveness",
            "Asesoría legal, fiscal y financiera": "legalAdvice",
            "Nivel de conocimiento del negocio inmobiliario":
                "businessKnowledge", // ✅ Mantener este también por si acaso
            "Presentación Personal e Imagen": "personalPresentation",
            "Manejo de los detalles": "detailManagement",
            Puntualidad: "punctuality",
            "Nivel de compromiso en el servicio": "commitmentLevel",
            "Solución de problemas": "problemSolving",
            "Acompañamiento de inicio a fin": "fullSupport",
            "Manejo de situaciones Imprevistas": "unexpectedSituations",
            "Manejo de los tiempos de la negociación": "negotiationTiming",
            "4. En general, ¿Cómo percibió el servicio prestado por el Asesor Inmobiliario de Century21":
                "generalAdvisorRating",
            "5. ¿Cómo califica el servicio prestado por la oficina Century 21?":
                "officeRating",
            "6. ¿Recomendaría el servicio de Century 21 a un amigo/familiar?":
                "recommendation",
            "7. ¿Por cuál medio se puso en contacto con la oficina/asesor Century 21?":
                "contactMedium",
            "8. Sugerencia adicional para mejorar el servicio asesor/oficina Century 21 . Estamos seguros de que hay algo más que le hubiera gustado que hiciera asesor/oficina por usted.":
                "additionalFeedback",
            "10. Escriba su Primer Nombre y Primer Apellido.": "clientName",
        };

        this.contactMediumMapping = {
            "Familiar / Amigo": "0",
            "Mercado Libre": "1",
            "Página Web Century21": "2",
            "Facebook / Marketplace": "3",
            "Estados de Whatsapp": "4",
            "Valla o Rótulo de Venta/Alquiler": "5",
            Instagram: "6",
            "Visita en oficina": "7",
            "Contacto Directo": "8",
            Otro: "9",
        };

        this.fieldsScale1to5 = [
            "communicationEffectiveness",
            "legalAdvice",
            "businessKnowledge",
            "personalPresentation",
            "detailManagement",
            "punctuality",
            "commitmentLevel",
            "problemSolving",
            "fullSupport",
            "unexpectedSituations",
            "negotiationTiming",
            "officeRating",
            "generalAdvisorRating",
        ];

        this.escalaTextoANumero = {
            excelente: "5",
            "muy bueno": "4",
            bueno: "3",
            regular: "2",
            deficiente: "1",
            malo: "1",
        };

        this.camposCalificacion1a5 = ["generalAdvisorRating"];
        this.camposRequeridos = ["emailAddress", "clientName", "operationType"];
    };

    // FUNCIÓN SIMPLIFICADA PARA MOSTRAR MENSAJES
    ImportadorCSV.prototype.mostrarMensaje = function (
        mensaje,
        tipo,
        duracion = 15000
    ) {
        var config = {
            success: {
                icon: "fas fa-check-circle",
                color: "#27ae60",
                title: "Éxito",
            },
            error: {
                icon: "fas fa-exclamation-circle",
                color: "#e74c3c",
                title: "Error",
            },
            warning: {
                icon: "fas fa-exclamation-triangle",
                color: "#f39c12",
                title: "Advertencia",
            },
            info: {
                icon: "fas fa-info-circle",
                color: "#3498db",
                title: "Información",
            },
        };

        var tipoConfig = config[tipo] || config.info;

        // Detectar si es móvil
        var isMobile = window.innerWidth < 768;
        var width = isMobile ? "calc(100% - 20px)" : "400px";
        var maxWidth = isMobile ? "100%" : "600px";
        var top = isMobile ? "10px" : "20px";
        var right = isMobile ? "10px" : "20px";
        var fontSize = isMobile ? "12px" : "13px";
        var titleSize = isMobile ? "13px" : "14px";
        var padding = isMobile ? "15px" : "20px";

        // ✅ AGREGAR: Altura máxima y scroll para mensajes largos
        var maxHeight = isMobile ? "80vh" : "500px";

        var mensajeHTML = `
        <div class="mensaje-personalizado" style="
            position: fixed;
            top: ${top};
            right: ${right};
            z-index: 10000;
            background: white;
            border-left: 4px solid ${tipoConfig.color};
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            min-width: ${width};
            max-width: ${maxWidth};
            max-height: ${maxHeight};
            display: flex;
            flex-direction: column;
            animation: slideInRight 0.3s ease-out;
        ">
            <div style="padding: ${padding};">
                <div style="display: flex; align-items: flex-start; gap: 12px;">
                    <i class="${tipoConfig.icon}" style="color: ${
            tipoConfig.color
        }; font-size: ${
            isMobile ? "18px" : "20px"
        }; margin-top: 2px; flex-shrink: 0;"></i>
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 600; color: #2c3e50; margin-bottom: 5px; font-size: ${titleSize};">
                            ${tipoConfig.title}
                        </div>
                        <div class="mensaje-contenido" style="
                            color: #5d6d7e; 
                            font-size: ${fontSize}; 
                            line-height: 1.4; 
                            white-space: pre-line; 
                            word-break: break-word;
                            max-height: calc(${maxHeight} - 100px);
                            overflow-y: auto;
                            padding-right: 5px;
                        ">
                            ${mensaje}
                        </div>
                    </div>
                    <button class="cerrar-mensaje" style="
                        background: none;
                        border: none;
                        color: #95a5a6;
                        font-size: 18px;
                        cursor: pointer;
                        padding: 0;
                        width: 20px;
                        height: 20px;
                        flex-shrink: 0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: color 0.2s;
                    " onmouseover="this.style.color='#2c3e50'" onmouseout="this.style.color='#95a5a6'">
                        ✕
                    </button>
                </div>
            </div>
            <div class="progress-bar" style="
                height: 3px;
                background: ${tipoConfig.color};
                width: 100%;
                animation: progressBar ${duracion}ms linear;
                border-radius: 0 0 8px 8px;
            "></div>
        </div>
    `;

        // Agregar estilos CSS si no existen
        if (!$("#estilos-mensajes-personalizados").length) {
            var estilos = `
            <style id="estilos-mensajes-personalizados">
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes progressBar {
                    from { width: 100%; }
                    to { width: 0%; }
                }
                .mensaje-personalizado {
                    transition: transform 0.3s ease, opacity 0.3s ease;
                }
                .mensaje-personalizado.cerrando {
                    transform: translateX(100%);
                    opacity: 0;
                }
                
                /* Estilos para scroll */
                .mensaje-contenido::-webkit-scrollbar {
                    width: 6px;
                }
                .mensaje-contenido::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                .mensaje-contenido::-webkit-scrollbar-thumb {
                    background: #888;
                    border-radius: 10px;
                }
                .mensaje-contenido::-webkit-scrollbar-thumb:hover {
                    background: #555;
                }
                
                @media (max-width: 768px) {
                    .mensaje-personalizado {
                        left: 10px !important;
                        right: 10px !important;
                        min-width: auto !important;
                        width: auto !important;
                    }
                }
            </style>
        `;
            $("head").append(estilos);
        }

        var $mensaje = $(mensajeHTML);
        $("body").append($mensaje);

        // Event listener para botón de cerrar
        $mensaje.find(".cerrar-mensaje").on("click", function () {
            $mensaje.addClass("cerrando");
            setTimeout(function () {
                $mensaje.remove();
            }, 300);
        });

        // Auto-cerrar después de la duración
        setTimeout(function () {
            if ($mensaje.length && !$mensaje.hasClass("cerrando")) {
                $mensaje.addClass("cerrando");
                setTimeout(function () {
                    $mensaje.remove();
                }, 300);
            }
        }, duracion);
    };

    ImportadorCSV.prototype.actionImport = function () {
        if (!this.view.permisosManager.permisos.puedeImportar) {
            this.mostrarMensaje(
                "No tiene permisos para importar encuestas. Solo usuarios administrativos pueden realizar esta acción.",
                "error",
                12000
            );
            return;
        }

        var fileInput = this.view.$el.find("#csv-file-input")[0];
        if (!fileInput || !fileInput.files || !fileInput.files[0]) {
            this.mostrarMensaje(
                "Por favor selecciona un archivo CSV primero.",
                "warning",
                10000
            );
            return;
        }

        var file = fileInput.files[0];

        this.mostrarBarraProgreso();

        var reader = new FileReader();

        reader.onload = function (e) {
            try {
                var contenido = e.target.result;
                var encuestas = this.parsearCSV(contenido);

                if (encuestas.length === 0) {
                    this.ocultarBarraProgreso();
                    this.mostrarMensaje(
                        "El archivo CSV no contiene datos válidos.",
                        "warning",
                        10000
                    );
                    return;
                }

                this.enviarEncuestasAlServidor(encuestas);
            } catch (error) {
                this.ocultarBarraProgreso();
                this.mostrarMensaje(
                    "Error al procesar el archivo CSV: " + error.message,
                    "error",
                    12000
                );
            }
        }.bind(this);

        reader.onerror = function () {
            this.ocultarBarraProgreso();
            this.mostrarMensaje(
                "Error al leer el archivo CSV.",
                "error",
                12000
            );
        }.bind(this);

        reader.readAsText(file, "UTF-8");
    };

    ImportadorCSV.prototype.parsearCSV = function (contenido) {
        var lineas = contenido.split(/\r?\n/);
        var encuestas = [];
        var erroresGlobales = [];

        if (lineas.length < 2) {
            throw new Error("El archivo CSV está vacío o no tiene datos");
        }

        // Manejar BOM de UTF-8
        if (lineas[0].charCodeAt(0) === 0xfeff) {
            lineas[0] = lineas[0].substring(1);
        }

        var headers = this.parsearLineaCSV(lineas[0]);

        // Validar headers críticos
        var headersCriticos = [
            "Correo",
            "10. Escriba su Primer Nombre y Primer Apellido.",
            "1. ¿Qué tipo de operación realizó?",
        ];

        // ✅ NUEVO: Headers opcionales pero importantes
        var headersOpcionales = [
            "3. Por favor, evalúe el servicio prestado por el Asesor Inmobiliario de Century 21 en cuanto a conocimiento del negocio inmobiliario",
            "Nivel de conocimiento del negocio inmobiliario",
        ];

        var erroresHeaders = [];
        headersCriticos.forEach(function (headerCritico) {
            if (!headers.includes(headerCritico)) {
                erroresHeaders.push(
                    'Header crítico faltante: "' + headerCritico + '"'
                );
            }
        });

        // ✅ ADVERTIR: Si falta el header de businessKnowledge
        var tieneBusinessKnowledge = headersOpcionales.some(function (header) {
            return headers.includes(header);
        });

        if (!tieneBusinessKnowledge) {
            console.warn(
                '⚠️ Advertencia: No se encontró el header de "Conocimiento del negocio inmobiliario"'
            );
        }

        if (erroresHeaders.length > 0) {
            throw new Error(
                "Errores en headers del CSV:\n" + erroresHeaders.join("\n")
            );
        }

        this.actualizarProgreso(
            10,
            "Procesando " + (lineas.length - 1) + " registros..."
        );

        for (var i = 1; i < lineas.length; i++) {
            if (!lineas[i].trim()) continue;

            try {
                var valores = this.parsearLineaCSV(lineas[i]);

                if (valores.length !== headers.length) {
                    erroresGlobales.push(
                        "Línea " + (i + 1) + ": Número de columnas no coincide"
                    );
                    continue;
                }

                var encuesta = this.mapearEncuesta(headers, valores);

                if (!encuesta) {
                    erroresGlobales.push(
                        "Línea " + (i + 1) + ": No se pudo mapear la encuesta"
                    );
                    continue;
                }

                // ✅ NUEVO: Verificar errores de validación
                if (
                    encuesta._erroresValidacion &&
                    encuesta._erroresValidacion.length > 0
                ) {
                    encuesta._erroresValidacion.forEach(function (error) {
                        erroresGlobales.push("Línea " + (i + 1) + ": " + error);
                    });
                    // Eliminar el campo temporal antes de agregar
                    delete encuesta._erroresValidacion;
                }

                // Solo agregar si tiene los campos mínimos
                if (
                    encuesta.clientName &&
                    encuesta.emailAddress &&
                    encuesta.operationType
                ) {
                    encuesta.estatus = "2"; // Completada
                    encuestas.push(encuesta);
                } else {
                    erroresGlobales.push(
                        "Línea " +
                            (i + 1) +
                            ": Faltan campos requeridos (clientName, emailAddress, operationType)"
                    );
                }

                if (i % 10 === 0) {
                    var progreso = 10 + (i / (lineas.length - 1)) * 30;
                    this.actualizarProgreso(
                        progreso,
                        "Procesando registro " +
                            i +
                            " de " +
                            (lineas.length - 1)
                    );
                }
            } catch (error) {
                erroresGlobales.push("Línea " + (i + 1) + ": " + error.message);
            }
        }

        // Guardar errores para mostrar al final
        this.erroresProcesamiento = erroresGlobales;

        this.actualizarProgreso(
            40,
            "Preparando envío de " + encuestas.length + " encuestas válidas..."
        );

        // ✅ MEJORADO: Mostrar resumen de errores si existen
        if (erroresGlobales.length > 0) {
            console.warn("⚠️ Errores de validación encontrados:", {
                total: erroresGlobales.length,
                errores: erroresGlobales,
            });
        }

        return encuestas;
    };

    ImportadorCSV.prototype.parsearLineaCSV = function (linea) {
        var valores = [];
        var valorActual = "";
        var dentroComillas = false;

        for (var i = 0; i < linea.length; i++) {
            var char = linea[i];

            if (char === '"') {
                dentroComillas = !dentroComillas;
            } else if (char === "," && !dentroComillas) {
                valores.push(valorActual.trim());
                valorActual = "";
            } else {
                valorActual += char;
            }
        }

        valores.push(valorActual.trim());

        return valores.map(function (v) {
            return v.replace(/^"|"$/g, "").trim();
        });
    };

    ImportadorCSV.prototype.mapearEncuesta = function (headers, valores) {
        var encuesta = {};
        var erroresValidacion = [];

        for (var i = 0; i < headers.length; i++) {
            var header = headers[i];
            var valor = valores[i];

            var campoMapeado = this.csvToFieldMapping[header];

            if (!campoMapeado) continue;

            // Procesar según el tipo de campo
            if (campoMapeado === "createdAt") {
                encuesta[campoMapeado] = this.convertirFecha(valor);
            } else if (campoMapeado === "recommendation") {
                encuesta[campoMapeado] = this.convertirRecomendacion(valor);
            } else if (campoMapeado === "contactMedium") {
                encuesta[campoMapeado] = this.procesarContactMedium(valor);
            } else if (this.fieldsScale1to5.includes(campoMapeado)) {
                // ✅ ACTUALIZADO: Usar la función correcta para escala 1-5
                var valorNum = this.convertirEscala1a5(valor);
                if (valorNum !== null) {
                    encuesta[campoMapeado] = valorNum; // Ya es string
                } else if (valor && valor.toString().trim() !== "") {
                    // ✅ NUEVO: Registrar error de validación
                    erroresValidacion.push(
                        'Campo "' +
                            header +
                            '" tiene valor inválido: "' +
                            valor +
                            '" (debe ser 1-5 o texto: Excelente/Muy Bueno/Bueno/Regular/Deficiente)'
                    );
                }
            } else {
                // Campos de texto normales
                encuesta[campoMapeado] =
                    valor && valor.trim() !== "" ? valor.trim() : null;
            }
        }

        // ✅ NUEVO: Si hay errores de validación, agregarlos al objeto
        if (erroresValidacion.length > 0) {
            encuesta._erroresValidacion = erroresValidacion;
        }

        return encuesta;
    };

    ImportadorCSV.prototype.convertirFecha = function (fechaStr) {
        try {
            var partes = fechaStr.split(" ");
            var fecha = partes[0].split("/");
            var hora = partes[1] || "00:00:00";

            if (fecha.length === 3) {
                var dia = fecha[0].padStart(2, "0");
                var mes = fecha[1].padStart(2, "0");
                var anio = fecha[2];

                return anio + "-" + mes + "-" + dia + " " + hora;
            }
        } catch (error) {
            //console.error('Error convirtiendo fecha:', error);
        }

        return new Date().toISOString().slice(0, 19).replace("T", " ");
    };

    ImportadorCSV.prototype.convertirEscala = function (valor) {
        if (!valor || valor.toString().trim() === "") return null;

        var escalas = {
            excelente: 4,
            "muy bueno": 3,
            bueno: 2,
            regular: 1,
            deficiente: 0,
        };

        var valorLower = valor.toString().toLowerCase().trim();

        if (escalas.hasOwnProperty(valorLower)) {
            return escalas[valorLower];
        }

        var valorNum = parseInt(valor);
        if (!isNaN(valorNum) && valorNum >= 0 && valorNum <= 4) {
            return valorNum;
        }

        return null;
    };

    ImportadorCSV.prototype.convertirEscala1a5 = function (valor) {
        if (!valor || valor.toString().trim() === "") return null;

        // Intentar conversión directa a número
        var valorNum = parseInt(valor);
        if (!isNaN(valorNum) && valorNum >= 1 && valorNum <= 5) {
            return valorNum.toString(); // ✅ Retornar como string
        }

        // Intentar mapear texto a número
        var valorLower = valor.toString().toLowerCase().trim();

        if (this.escalaTextoANumero.hasOwnProperty(valorLower)) {
            return this.escalaTextoANumero[valorLower];
        }

        // ✅ NUEVO: Log de valores inválidos para debugging
        console.warn("Valor de escala inválido encontrado:", valor);

        return null;
    };

    ImportadorCSV.prototype.convertirRecomendacion = function (valor) {
        if (!valor || valor.toString().trim() === "") return "0";

        var valorStr = valor.toString().toLowerCase().trim();

        // Buscar "sí" con o sin acento, "si", o "1"
        if (
            valorStr.includes("sí") ||
            valorStr.includes("si") ||
            valorStr === "1" ||
            valorStr === "yes"
        ) {
            return "1";
        }

        return "0";
    };

    ImportadorCSV.prototype.procesarContactMedium = function (valor) {
        if (!valor || valor.toString().trim() === "") {
            return [];
        }

        // Dividir por comas
        var medios = valor.split(",").map(function (m) {
            return m.trim();
        });

        var mediosMapeados = [];

        medios.forEach(
            function (medio) {
                var medioMapeado = this.contactMediumMapping[medio];
                if (medioMapeado && medioMapeado !== "contactMediumOther") {
                    mediosMapeados.push(medioMapeado);
                }
            }.bind(this)
        );

        // Si no se encontró ningún mapeo válido, retornar array vacío
        return mediosMapeados.length > 0 ? mediosMapeados : [];
    };

    // NUEVA FUNCIÓN PARA VERIFICAR DUPLICADOS
    ImportadorCSV.prototype.verificarDuplicados = function (encuestas) {
        return new Promise(
            function (resolve, reject) {
                this.actualizarProgreso(
                    45,
                    "Verificando duplicados en la base de datos..."
                );

                // Extraer datos únicos para verificación
                var datosVerificacion = encuestas.map(function (encuesta) {
                    return {
                        emailAddress: encuesta.emailAddress,
                        clientName: encuesta.clientName,
                        operationType: encuesta.operationType,
                        createdAt: encuesta.createdAt,
                        assignedUserId: encuesta.assignedUserId,
                    };
                });

                Espo.Ajax.postRequest(
                    "CCustomerSurvey/action/verificarDuplicados",
                    {
                        datosVerificacion: datosVerificacion,
                    }
                )
                    .then(
                        function (response) {
                            if (response.success) {
                                var resultados = {
                                    encuestasUnicas: [],
                                    encuestasDuplicadas: [],
                                    totalDuplicados:
                                        response.duplicadosEncontrados || 0,
                                    detallesDuplicados:
                                        response.detallesDuplicados || [],
                                };

                                // Filtrar encuestas basándose en la respuesta del servidor
                                encuestas.forEach(
                                    function (encuesta, index) {
                                        var esDuplicado =
                                            response.duplicados &&
                                            response.duplicados.some(
                                                function (dup) {
                                                    return this.esEncuestaDuplicada(
                                                        encuesta,
                                                        dup
                                                    );
                                                }.bind(this)
                                            );

                                        if (esDuplicado) {
                                            resultados.encuestasDuplicadas.push(
                                                {
                                                    encuesta: encuesta,
                                                    razon: "Registro ya existe en la base de datos",
                                                    linea: index + 2, // +2 porque index empieza en 0 y headers en línea 1
                                                }
                                            );
                                        } else {
                                            resultados.encuestasUnicas.push(
                                                encuesta
                                            );
                                        }
                                    }.bind(this)
                                );

                                resolve(resultados);
                            } else {
                                reject(
                                    new Error(
                                        "Error al verificar duplicados: " +
                                            (response.error ||
                                                "Error desconocido")
                                    )
                                );
                            }
                        }.bind(this)
                    )
                    .catch(function (error) {
                        reject(error);
                    });
            }.bind(this)
        );
    };

    // FUNCIÓN PARA COMPARAR SI DOS ENCUESTAS SON DUPLICADOS
    ImportadorCSV.prototype.esEncuestaDuplicada = function (
        encuestaCSV,
        encuestaBD
    ) {
        // Comparar por combinación de campos únicos
        var camposComparacion = [
            "emailAddress",
            "clientName",
            "operationType",
            "assignedUserId",
        ];

        var coincidencias = 0;
        var totalCampos = 0;

        for (var i = 0; i < camposComparacion.length; i++) {
            var campo = camposComparacion[i];
            var valorCSV = encuestaCSV[campo];
            var valorBD = encuestaBD[campo];

            if (valorCSV && valorBD) {
                totalCampos++;
                if (
                    valorCSV.toString().toLowerCase().trim() ===
                    valorBD.toString().toLowerCase().trim()
                ) {
                    coincidencias++;
                }
            }
        }

        // Si hay al menos 2 coincidencias en campos críticos, considerar duplicado
        if (coincidencias >= 2) {
            return true;
        }

        // Comparación adicional por fecha (mismo día) y mismo email
        if (
            encuestaCSV.emailAddress &&
            encuestaBD.emailAddress &&
            encuestaCSV.createdAt &&
            encuestaBD.createdAt
        ) {
            var emailCoincide =
                encuestaCSV.emailAddress.toLowerCase().trim() ===
                encuestaBD.emailAddress.toLowerCase().trim();
            var fechaCSV = new Date(encuestaCSV.createdAt).toDateString();
            var fechaBD = new Date(encuestaBD.createdAt).toDateString();

            if (emailCoincide && fechaCSV === fechaBD) {
                return true;
            }
        }

        return false;
    };

    // FUNCIÓN MEJORADA PARA ENVIAR ENCUESTAS CON VERIFICACIÓN DE DUPLICADOS
    ImportadorCSV.prototype.enviarEncuestasAlServidor = function (encuestas) {
        this.actualizarProgreso(
            50,
            "Verificando duplicados antes del envío..."
        );

        // Primero verificar duplicados
        this.verificarDuplicados(encuestas)
            .then(
                function (resultados) {
                    this.actualizarProgreso(
                        60,
                        "Preparando envío de " +
                            resultados.encuestasUnicas.length +
                            " encuestas únicas..."
                    );

                    if (resultados.encuestasUnicas.length === 0) {
                        this.actualizarProgreso(
                            100,
                            "No hay datos nuevos para importar"
                        );
                        setTimeout(
                            function () {
                                this.ocultarBarraProgreso();
                                var mensaje =
                                    "❌ No se encontraron datos nuevos para importar.\n\n" +
                                    "📊 Resumen:\n" +
                                    "• Total en CSV: " +
                                    encuestas.length +
                                    "\n" +
                                    "• Duplicados detectados: " +
                                    resultados.encuestasDuplicadas.length +
                                    "\n" +
                                    "• Encuestas únicas: 0";

                                if (resultados.encuestasDuplicadas.length > 0) {
                                    mensaje +=
                                        "\n\n⚠️ Todos los registros ya existen en la base de datos.";
                                }

                                this.mostrarMensaje(mensaje, "warning", 15000);

                                // Mostrar detalles de duplicados
                                this.mostrarDetallesDuplicados(
                                    resultados.encuestasDuplicadas
                                );
                            }.bind(this),
                            1000
                        );
                        return;
                    }

                    // Enviar solo encuestas únicas al servidor
                    Espo.Ajax.postRequest(
                        "CCustomerSurvey/action/importarEncuestas",
                        {
                            encuestas: resultados.encuestasUnicas,
                            infoDuplicados: {
                                totalDetectados:
                                    resultados.encuestasDuplicadas.length,
                                duplicadosRechazados:
                                    resultados.encuestasDuplicadas,
                            },
                        }
                    )
                        .then(
                            function (response) {
                                this.actualizarProgreso(
                                    100,
                                    "Importación completada!"
                                );

                                setTimeout(
                                    function () {
                                        this.ocultarBarraProgreso();
                                        this.mostrarResumenImportacion(
                                            response,
                                            resultados,
                                            encuestas.length
                                        );
                                    }.bind(this),
                                    1000
                                );
                            }.bind(this)
                        )
                        .catch(
                            function (error) {
                                setTimeout(
                                    function () {
                                        this.ocultarBarraProgreso();
                                        this.mostrarMensaje(
                                            "Error al enviar datos al servidor: " +
                                                (error.message ||
                                                    "Error de conexión"),
                                            "error",
                                            15000
                                        );
                                    }.bind(this),
                                    1000
                                );
                            }.bind(this)
                        );
                }.bind(this)
            )
            .catch(
                function (error) {
                    setTimeout(
                        function () {
                            this.ocultarBarraProgreso();
                            this.mostrarMensaje(
                                "Error al verificar duplicados: " +
                                    error.message,
                                "error",
                                15000
                            );

                            // Opción de continuar sin verificación de duplicados
                            this.preguntarContinuarSinVerificacion(encuestas);
                        }.bind(this),
                        1000
                    );
                }.bind(this)
            );
    };

    // FUNCIÓN PARA PREGUNTAR SI CONTINUAR SIN VERIFICACIÓN DE DUPLICADOS
    ImportadorCSV.prototype.preguntarContinuarSinVerificacion = function (
        encuestas
    ) {
        var self = this;

        // Esperar un momento antes de mostrar el confirm
        setTimeout(function () {
            Espo.Ui.confirm(
                "¿Continuar con la importación sin verificación de duplicados?\n\n" +
                    "⚠️ Advertencia: Esto podría crear registros duplicados en la base de datos.",
                function (confirmado) {
                    if (confirmado) {
                        self.mostrarBarraProgreso();
                        self.actualizarProgreso(
                            50,
                            "Importando sin verificación de duplicados..."
                        );

                        // Enviar todas las encuestas sin verificación
                        Espo.Ajax.postRequest(
                            "CCustomerSurvey/action/importarEncuestas",
                            {
                                encuestas: encuestas,
                                sinVerificacion: true,
                            }
                        )
                            .then(function (response) {
                                self.actualizarProgreso(
                                    100,
                                    "Importación completada!"
                                );
                                setTimeout(function () {
                                    self.ocultarBarraProgreso();
                                    self.mostrarResumenSimple(
                                        response,
                                        encuestas.length
                                    );
                                }, 1000);
                            })
                            .catch(function (error) {
                                self.ocultarBarraProgreso();
                                self.mostrarMensaje(
                                    "Error en la importación: " + error.message,
                                    "error",
                                    15000
                                );
                            });
                    } else {
                        self.mostrarMensaje(
                            "Importación cancelada por el usuario.",
                            "info",
                            10000
                        );
                    }
                },
                {
                    confirmText: "Continuar",
                    cancelText: "Cancelar",
                    timeout: 30000,
                }
            );
        }, 1000);
    };

    // NUEVA FUNCIÓN PARA MOSTRAR RESUMEN DETALLADO
    ImportadorCSV.prototype.mostrarResumenImportacion = function (
        response,
        resultados,
        totalOriginal
    ) {
        var mensaje =
            "✅ Importación completada!\n\n" +
            "📊 Resumen de importación:\n" +
            "• Total en CSV: " +
            totalOriginal +
            "\n" +
            "• Duplicados detectados: " +
            resultados.encuestasDuplicadas.length +
            "\n" +
            "• Encuestas únicas: " +
            resultados.encuestasUnicas.length +
            "\n" +
            "• Importadas exitosamente: " +
            (response.procesadas || 0) +
            "\n" +
            "• Errores: " +
            (response.errores ? response.errores.length : 0);

        // Mostrar detalles de duplicados si existen
        if (resultados.encuestasDuplicadas.length > 0) {
            //console.warn('Registros duplicados rechazados:', resultados.encuestasDuplicadas);
        }

        // Mostrar errores de procesamiento si existen
        if (this.erroresProcesamiento && this.erroresProcesamiento.length > 0) {
            mensaje +=
                "\n\n⚠️ Errores de formato: " +
                this.erroresProcesamiento.length;
        }

        if (response.success) {
            this.mostrarMensaje(mensaje, "success", 20000);

            // Mostrar detalles de duplicados si hay pocos
            if (
                resultados.encuestasDuplicadas.length > 0 &&
                resultados.encuestasDuplicadas.length <= 10
            ) {
                this.mostrarDetallesDuplicados(resultados.encuestasDuplicadas);
            }

            // Limpiar formulario
            this.limpiarFormulario();

            // Actualizar estadísticas
            setTimeout(
                function () {
                    this.view.estadisticasManager.loadStatistics();
                }.bind(this),
                1000
            );
        } else {
            this.mostrarMensaje(
                "Error en la importación: " +
                    (response.error || "Error desconocido"),
                "error",
                15000
            );
        }
    };

    // FUNCIÓN PARA MOSTRAR DETALLES DE DUPLICADOS
    ImportadorCSV.prototype.mostrarDetallesDuplicados = function (duplicados) {
        if (duplicados.length === 0) return;

        var detalles = "📋 Detalles de duplicados rechazados:\n\n";

        duplicados.forEach(function (dup, index) {
            var encuesta = dup.encuesta;
            detalles +=
                index +
                1 +
                ". " +
                (encuesta.clientName || "Sin nombre") +
                " - " +
                (encuesta.emailAddress || "Sin email") +
                " - " +
                (encuesta.operationType || "Sin operación") +
                " (Línea " +
                (dup.linea || "?") +
                ")\n";
        });

        // Mostrar en consola para referencia completa
        //console.log('Detalles completos de duplicados:', duplicados);

        // Mostrar mensaje personalizado con detalles
        this.mostrarMensaje(detalles, "info", 25000);
    };

    // FUNCIÓN PARA MOSTRAR RESUMEN SIMPLE (cuando no hay verificación de duplicados)
    ImportadorCSV.prototype.mostrarResumenSimple = function (
        response,
        totalOriginal
    ) {
        var mensaje =
            "✅ Importación completada!\n\n" +
            "📊 Resumen:\n" +
            "• Total procesadas: " +
            totalOriginal +
            "\n" +
            "• Importadas exitosamente: " +
            (response.procesadas || 0) +
            "\n" +
            "• Errores: " +
            (response.errores ? response.errores.length : 0);

        if (response.success) {
            this.mostrarMensaje(mensaje, "success", 15000);
            this.limpiarFormulario();
            setTimeout(
                function () {
                    this.view.estadisticasManager.loadStatistics();
                }.bind(this),
                1000
            );
        } else {
            this.mostrarMensaje(
                "Error en la importación: " +
                    (response.error || "Error desconocido"),
                "error",
                15000
            );
        }
    };

    // FUNCIÓN PARA LIMPIAR FORMULARIO
    ImportadorCSV.prototype.limpiarFormulario = function () {
        var fileInput = this.view.$el.find("#csv-file-input")[0];
        if (fileInput) {
            fileInput.value = "";
        }
        var fileName = this.view.$el.find("#file-name")[0];
        if (fileName) {
            fileName.textContent = "No se ha seleccionado ningún archivo";
            fileName.classList.remove("has-file");
        }
    };

    ImportadorCSV.prototype.mostrarBarraProgreso = function () {
        var barraExistente = $("#import-progress-bar");
        if (barraExistente.length > 0) {
            barraExistente.remove();
        }

        var barraHTML =
            '<div id="import-progress-bar" style="position: fixed; top: 0; left: 0; right: 0; z-index: 9999; background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 15px 20px;">' +
            '<div style="display: flex; align-items: center; gap: 15px; max-width: 1200px; margin: 0 auto;">' +
            '<div style="flex: 1;">' +
            '<div style="display: flex; justify-content: space-between; margin-bottom: 8px; flex-wrap: wrap; gap: 5px;">' +
            '<span style="font-weight: 600; color: #2c3e50; font-size: clamp(0.85rem, 2vw, 1rem);"><i class="fas fa-upload"></i> <span class="progress-text-desktop">Importando encuestas...</span><span class="progress-text-mobile" style="display: none;">Importando...</span></span>' +
            '<span id="progress-percentage" style="font-weight: 600; color: #B8A279; font-size: clamp(0.85rem, 2vw, 1rem);">0%</span>' +
            "</div>" +
            '<div style="width: 100%; height: 20px; background: #f0f0f0; border-radius: 10px; overflow: hidden; position: relative;">' +
            '<div id="progress-bar-fill" style="width: 0%; height: 100%; background: linear-gradient(90deg, #B8A279 0%, #D4C19C 100%); transition: width 0.3s ease; border-radius: 10px;"></div>' +
            "</div>" +
            '<div id="progress-message" style="margin-top: 8px; font-size: clamp(0.75rem, 1.5vw, 0.9rem); color: #7f8c8d; word-break: break-word;">Preparando importación...</div>' +
            "</div>" +
            "</div>" +
            "</div>";

        $("body").append(barraHTML);

        // Responsive: ocultar texto largo en móviles
        if (window.innerWidth < 768) {
            $(".progress-text-desktop").hide();
            $(".progress-text-mobile").show();
        }
    };

    ImportadorCSV.prototype.actualizarProgreso = function (
        porcentaje,
        mensaje
    ) {
        var progressBar = $("#progress-bar-fill");
        var progressPercentage = $("#progress-percentage");
        var progressMessage = $("#progress-message");

        if (progressBar.length) {
            progressBar.css("width", porcentaje + "%");
        }

        if (progressPercentage.length) {
            progressPercentage.text(Math.round(porcentaje) + "%");
        }

        if (progressMessage.length && mensaje) {
            progressMessage.text(mensaje);
        }
    };

    ImportadorCSV.prototype.ocultarBarraProgreso = function () {
        var barra = $("#import-progress-bar");
        if (barra.length) {
            barra.fadeOut(300, function () {
                barra.remove();
            });
        }
    };

    return ImportadorCSV;
});
