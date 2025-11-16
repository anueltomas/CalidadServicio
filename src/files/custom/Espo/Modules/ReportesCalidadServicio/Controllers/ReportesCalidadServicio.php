<?php
namespace Espo\Modules\ReportesCalidadServicio\Controllers;

use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Error;

class ReportesCalidadServicio extends \Espo\Core\Controllers\Base
{
    public function postActionImportarEncuestas($params, $data, $request)
    {
        try {
            if (!$request->isPost()) {
                throw new BadRequest("Método no permitido");
            }
            
            error_log("🎯 === INICIO IMPORTAR ENCUESTAS ===");
            
            // Obtener entityManager del contenedor
            $entityManager = $this->getContainer()->get('entityManager');
            
            if (!$entityManager) {
                throw new Error("No se pudo obtener entityManager");
            }
            
            // Convertir datos
            $data = $request->getParsedBody();
            if (is_object($data)) {
                $data = (array) $data;
            }
            
            $encuestas = $data['encuestas'] ?? $data;
            
            if (!is_array($encuestas)) {
                throw new BadRequest("Formato de datos inválido. Se esperaba array de encuestas.");
            }
            
            error_log("📊 Número de encuestas a procesar: " . count($encuestas));
            
            // DEBUG: Ver la primera encuesta para conocer la estructura
            if (!empty($encuestas[0])) {
                $primeraEncuesta = $encuestas[0];
                if (is_object($primeraEncuesta)) {
                    $primeraEncuesta = (array) $primeraEncuesta;
                }
                error_log("🔍 ESTRUCTURA DE LA PRIMERA ENCUESTA:");
                error_log("Campos disponibles: " . implode(', ', array_keys($primeraEncuesta)));
                error_log("Valores: " . print_r($primeraEncuesta, true));
            }
            
            // Procesar cada encuesta
            $resultado = [
                'success' => true,
                'total' => count($encuestas),
                'procesadas' => 0,
                'duplicadas' => 0,
                'errores' => [],
                'detalles' => []
            ];
            
            foreach ($encuestas as $index => $encuesta) {
                try {
                    if (is_object($encuesta)) {
                        $encuesta = (array) $encuesta;
                    }
                    
                    error_log("🔍 Procesando encuesta {$index}: " . ($encuesta['nombreCliente'] ?? 'Sin nombre'));
                    
                    // DEBUG: Ver campos disponibles para esta encuesta
                    $camposDisponibles = array_keys($encuesta);
                    error_log("📋 Campos disponibles en encuesta {$index}: " . implode(', ', $camposDisponibles));
                    
                    // Validar campos requeridos - buscar campos alternativos
                    $camposRequeridos = $this->identificarCamposRequeridos($encuesta);
                    
                    if (empty($camposRequeridos)) {
                        throw new \Exception("No se pudieron identificar los campos requeridos en el CSV");
                    }
                    
                    $camposFaltantes = [];
                    foreach ($camposRequeridos as $campoRequerido) {
                        if (empty($encuesta[$campoRequerido])) {
                            $camposFaltantes[] = $campoRequerido;
                        }
                    }
                    
                    if (!empty($camposFaltantes)) {
                        throw new \Exception("Faltan campos requeridos: " . implode(', ', $camposFaltantes));
                    }
                    
                    // Validar duplicados
                    if ($this->encuestaExiste($encuesta, $entityManager)) {
                        $resultado['duplicadas']++;
                        $resultado['detalles'][] = "Encuesta {$encuesta['nombreCliente']} - DUPLICADA (omitida)";
                        error_log("🔄 Encuesta duplicada omitida: " . $encuesta['nombreCliente']);
                        continue;
                    }
                    
                    // Guardar en la base de datos
                    if ($this->guardarEncuesta($encuesta, $entityManager)) {
                        $resultado['procesadas']++;
                        $resultado['detalles'][] = "Encuesta {$encuesta['nombreCliente']} - GUARDADA";
                        error_log("✅ Encuesta guardada: " . $encuesta['nombreCliente']);
                    } else {
                        throw new \Exception("Error al guardar en base de datos");
                    }
                    
                } catch (\Exception $e) {
                    $errorMsg = "Índice {$index}: " . $e->getMessage();
                    $resultado['errores'][] = $errorMsg;
                    $resultado['detalles'][] = "Encuesta " . ($encuesta['nombreCliente'] ?? 'N/A') . " - ERROR: " . $e->getMessage();
                    error_log("❌ $errorMsg");
                }
            }
            
            $resultado['message'] = "Completado: {$resultado['procesadas']}/{$resultado['total']} encuestas procesadas, {$resultado['duplicadas']} duplicadas omitidas";
            error_log("🎉 " . $resultado['message']);
            
            return $resultado;
            
        } catch (\Exception $e) {
            error_log("💥 ERROR EN IMPORTAR ENCUESTAS: " . $e->getMessage());
            
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'total' => 0,
                'procesadas' => 0,
                'duplicadas' => 0,
                'errores' => [$e->getMessage()]
            ];
        }
    }
    
    public function getActionGetStats($params, $data, $request)
    {
        try {
            error_log("📈 === OBTENIENDO ESTADÍSTICAS ===");
            
            // Obtener entityManager
            $entityManager = $this->getContainer()->get('entityManager');
            
            if (!$entityManager) {
                throw new Error("No se pudo obtener entityManager");
            }
            
            $stats = $this->obtenerEstadisticas($entityManager);
            
            error_log("📊 Estadísticas obtenidas: " . print_r($stats, true));
            
            return [
                'success' => true,
                'data' => $stats
            ];
            
        } catch (\Exception $e) {
            error_log("❌ ERROR en getStats: " . $e->getMessage());
            
            return [
                'success' => true,
                'data' => $this->obtenerEstadisticasPorDefecto()
            ];
        }
    }
    
    /**
     * Identifica los campos requeridos basándose en los campos disponibles
     */
    protected function identificarCamposRequeridos($encuesta)
    {
        $camposDisponibles = array_keys($encuesta);
        
        // Buscar campos alternativos para los requeridos
        $camposRequeridos = [];
        
        // Campo para nombre del cliente
        if (in_array('nombreCliente', $camposDisponibles)) {
            $camposRequeridos[] = 'nombreCliente';
        } elseif (in_array('Nombre del Cliente', $camposDisponibles)) {
            $camposRequeridos[] = 'Nombre del Cliente';
        } elseif (in_array('nombre', $camposDisponibles)) {
            $camposRequeridos[] = 'nombre';
        } elseif (in_array('Nombre', $camposDisponibles)) {
            $camposRequeridos[] = 'Nombre';
        } elseif (in_array('Cliente', $camposDisponibles)) {
            $camposRequeridos[] = 'Cliente';
        }
        
        // Campo para correo
        if (in_array('correo', $camposDisponibles)) {
            $camposRequeridos[] = 'correo';
        } elseif (in_array('email', $camposDisponibles)) {
            $camposRequeridos[] = 'email';
        } elseif (in_array('Correo', $camposDisponibles)) {
            $camposRequeridos[] = 'Correo';
        } elseif (in_array('Email', $camposDisponibles)) {
            $camposRequeridos[] = 'Email';
        } elseif (in_array('Correo Electrónico', $camposDisponibles)) {
            $camposRequeridos[] = 'Correo Electrónico';
        }
        
        // Campo para tipo de operación
        if (in_array('tipoOperacion', $camposDisponibles)) {
            $camposRequeridos[] = 'tipoOperacion';
        } elseif (in_array('Tipo de Operación', $camposDisponibles)) {
            $camposRequeridos[] = 'Tipo de Operación';
        } elseif (in_array('tipo_operacion', $camposDisponibles)) {
            $camposRequeridos[] = 'tipo_operacion';
        } elseif (in_array('Operación', $camposDisponibles)) {
            $camposRequeridos[] = 'Operación';
        } elseif (in_array('operacion', $camposDisponibles)) {
            $camposRequeridos[] = 'operacion';
        }
        
        error_log("🎯 Campos requeridos identificados: " . implode(', ', $camposRequeridos));
        
        return $camposRequeridos;
    }
    
    /**
     * Verifica si una encuesta ya existe
     */
    protected function encuestaExiste($encuesta, $entityManager)
    {
        try {
            // Identificar campo de correo
            $campoCorreo = $this->identificarCampo($encuesta, ['correo', 'email', 'Correo', 'Email', 'Correo Electrónico']);
            $campoNombre = $this->identificarCampo($encuesta, ['nombreCliente', 'Nombre del Cliente', 'nombre', 'Nombre', 'Cliente']);
            
            $correo = $encuesta[$campoCorreo] ?? null;
            $nombreCliente = $encuesta[$campoNombre] ?? null;
            
            if (!$correo || !$nombreCliente) {
                return false;
            }
            
            // Buscar por correo y nombre (combinación única)
            $existe = $entityManager->getRepository('ReportesCalidadServicio')
                ->where([
                    'correo' => $correo,
                    'nombreCliente' => $nombreCliente
                ])
                ->findOne();
            
            $resultado = $existe !== null;
            error_log("🔎 Verificación duplicado para {$correo}: " . ($resultado ? 'EXISTE' : 'NO EXISTE'));
            
            return $resultado;
            
        } catch (\Exception $e) {
            error_log("⚠️ Error al verificar duplicado: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Guarda una encuesta en la base de datos
     */
    protected function guardarEncuesta($datosEncuesta, $entityManager)
    {
        try {
            error_log("💾 === INTENTANDO GUARDAR ENCUESTA ===");
            
            // Crear nueva entidad
            $reporte = $entityManager->getEntity('ReportesCalidadServicio');
            
            if (!$reporte) {
                throw new \Exception("No se pudo crear la entidad ReportesCalidadServicio");
            }
            
            error_log("✅ Entidad ReportesCalidadServicio creada exitosamente");
            
            // Mapear datos
            $datosMapeados = $this->mapearDatosEncuesta($datosEncuesta);
            error_log("🗂️ Datos mapeados: " . print_r($datosMapeados, true));
            
            // Establecer datos
            $reporte->set($datosMapeados);
            
            // Guardar en la base de datos
            $entityManager->saveEntity($reporte);
            
            error_log("🎉 ✅ Encuesta guardada exitosamente: " . ($datosEncuesta['nombreCliente'] ?? 'N/A'));
            return true;
            
        } catch (\Exception $e) {
            error_log("💥 ❌ ERROR al guardar encuesta:");
            error_log("📝 Mensaje: " . $e->getMessage());
            error_log("📍 Archivo: " . $e->getFile() . ":" . $e->getLine());
            error_log("🔍 Stack trace: " . $e->getTraceAsString());
            return false;
        }
    }
    
    /**
     * Mapea los datos del CSV a los campos de la entidad
     */
    protected function mapearDatosEncuesta($datosEncuesta)
    {
        // Convertir valores booleanos
        $recomendaria = false;
        $campoRecomendaria = $this->identificarCampo($datosEncuesta, ['recomendaria', 'Recomendaría', 'recomendaria', 'recomendar', 'Recomendaria']);
        if ($campoRecomendaria && isset($datosEncuesta[$campoRecomendaria])) {
            $valor = $datosEncuesta[$campoRecomendaria];
            $recomendaria = filter_var($valor, FILTER_VALIDATE_BOOLEAN) || 
                           in_array(strtolower($valor), ['si', 'sí', 'yes', 'true', '1', 'verdadero']);
        }
        
        // Convertir valores numéricos
        $convertirEntero = function($valor) {
            if ($valor === null || $valor === '') return null;
            if (is_numeric($valor)) return (int)$valor;
            if ($valor === 'NA' || $valor === 'N/A') return null;
            return null;
        };
        
        // Identificar campos principales
        $campoNombre = $this->identificarCampo($datosEncuesta, ['nombreCliente', 'Nombre del Cliente', 'nombre', 'Nombre', 'Cliente']);
        $campoCorreo = $this->identificarCampo($datosEncuesta, ['correo', 'email', 'Correo', 'Email', 'Correo Electrónico']);
        $campoTipoOperacion = $this->identificarCampo($datosEncuesta, ['tipoOperacion', 'Tipo de Operación', 'tipo_operacion', 'Operación', 'operacion']);
        
        return [
            'name' => $datosEncuesta[$campoNombre] ?? 'Encuesta ' . date('Y-m-d H:i:s'),
            'cla' => $datosEncuesta['cla'] ?? $datosEncuesta['CLA'] ?? '',
            'idOficina' => $convertirEntero($datosEncuesta['idOficina'] ?? $datosEncuesta['ID Oficina'] ?? null),
            'oficina' => $datosEncuesta['oficina'] ?? $datosEncuesta['Oficina'] ?? '',
            'marcaTemporal' => $datosEncuesta['marcaTemporal'] ?? $datosEncuesta['Marca Temporal'] ?? date('Y-m-d H:i:s'),
            'correo' => $datosEncuesta[$campoCorreo] ?? '',
            'tipoOperacion' => $datosEncuesta[$campoTipoOperacion] ?? 'Compra',
            'idAsesor' => $convertirEntero($datosEncuesta['idAsesor'] ?? $datosEncuesta['ID Asesor'] ?? null),
            'nombreAsesor' => $datosEncuesta['nombreAsesor'] ?? $datosEncuesta['Nombre Asesor'] ?? $datosEncuesta['Asesor'] ?? '',
            'evaluacionGeneral' => $convertirEntero($datosEncuesta['evaluacionGeneral'] ?? $datosEncuesta['Evaluación General'] ?? null),
            'asesoriaLegal' => $convertirEntero($datosEncuesta['asesoriaLegal'] ?? $datosEncuesta['Asesoría Legal'] ?? null),
            'presentacionPersonal' => $convertirEntero($datosEncuesta['presentacionPersonal'] ?? $datosEncuesta['Presentación Personal'] ?? null),
            'manejoDetalles' => $convertirEntero($datosEncuesta['manejoDetalles'] ?? $datosEncuesta['Manejo Detalles'] ?? null),
            'puntualidad' => $convertirEntero($datosEncuesta['puntualidad'] ?? $datosEncuesta['Puntualidad'] ?? null),
            'nivelCompromiso' => $convertirEntero($datosEncuesta['nivelCompromiso'] ?? $datosEncuesta['Nivel Compromiso'] ?? null),
            'solucionProblemas' => $convertirEntero($datosEncuesta['solucionProblemas'] ?? $datosEncuesta['Solución Problemas'] ?? null),
            'acompanamiento' => $convertirEntero($datosEncuesta['acompanamiento'] ?? $datosEncuesta['Acompañamiento'] ?? null),
            'manejoImprevistas' => $convertirEntero($datosEncuesta['manejoImprevistas'] ?? $datosEncuesta['Manejo Imprevistas'] ?? null),
            'manejoTiempos' => $convertirEntero($datosEncuesta['manejoTiempos'] ?? $datosEncuesta['Manejo Tiempos'] ?? null),
            'percepcionGeneral' => $convertirEntero($datosEncuesta['percepcionGeneral'] ?? $datosEncuesta['Percepción General'] ?? null),
            'calificacionOficina' => $convertirEntero($datosEncuesta['calificacionOficina'] ?? $datosEncuesta['Calificación Oficina'] ?? null),
            'recomendaria' => $recomendaria,
            'medioContacto' => $datosEncuesta['medioContacto'] ?? $datosEncuesta['Medio Contacto'] ?? '',
            'sugerencias' => $datosEncuesta['sugerencias'] ?? $datosEncuesta['Sugerencias'] ?? '',
            'fechaCumpleanos' => $this->formatearFecha($datosEncuesta['fechaCumpleanos'] ?? $datosEncuesta['Fecha Cumpleaños'] ?? null),
            'nombreCliente' => $datosEncuesta[$campoNombre] ?? ''
        ];
    }
    
    /**
     * Identifica un campo entre varias opciones posibles
     */
    protected function identificarCampo($datosEncuesta, $opciones)
    {
        foreach ($opciones as $opcion) {
            if (isset($datosEncuesta[$opcion])) {
                return $opcion;
            }
        }
        return null;
    }
    
    /**
     * Formatea la fecha para la base de datos
     */
    protected function formatearFecha($fecha)
    {
        if (empty($fecha)) {
            return null;
        }
        
        try {
            $timestamp = strtotime($fecha);
            if ($timestamp === false) {
                return null;
            }
            
            return date('Y-m-d', $timestamp);
        } catch (\Exception $e) {
            error_log("⚠️ Error formateando fecha: {$fecha}");
            return null;
        }
    }
    
    /**
     * Obtiene estadísticas reales de la base de datos
     */
    protected function obtenerEstadisticas($entityManager)
    {
        try {
            // Total de encuestas
            $totalEncuestas = $entityManager->getRepository('ReportesCalidadServicio')
                ->count();
            
            // Distribución por tipo de operación
            $tiposOperacion = $entityManager->getRepository('ReportesCalidadServicio')
                ->select(['tipoOperacion', 'COUNT:id'])
                ->groupBy('tipoOperacion')
                ->find();
            
            $distribucionOperaciones = [];
            foreach ($tiposOperacion as $tipo) {
                $distribucionOperaciones[$tipo->get('tipoOperacion')] = $tipo->get('COUNT:id');
            }
            
            return [
                'totalEncuestas' => $totalEncuestas,
                'satisfaccionPromedio' => 0, // Podemos calcular esto después
                'porcentajeRecomendacion' => 0, // Podemos calcular esto después
                'tiposOperacion' => count($distribucionOperaciones),
                'distribucionOperaciones' => $distribucionOperaciones,
                'asesoresDestacados' => $this->obtenerAsesoresDestacados($entityManager)
            ];
            
        } catch (\Exception $e) {
            error_log("❌ Error obteniendo estadísticas: " . $e->getMessage());
            return $this->obtenerEstadisticasPorDefecto();
        }
    }
    
    /**
     * Obtiene asesores destacados
     */
    protected function obtenerAsesoresDestacados($entityManager)
    {
        try {
            $asesores = $entityManager->getRepository('ReportesCalidadServicio')
                ->select(['nombreAsesor', 'COUNT:id', 'AVG:evaluacionGeneral'])
                ->where(['nombreAsesor!=' => ''])
                ->groupBy('nombreAsesor')
                ->order('AVG:evaluacionGeneral', 'DESC')
                ->limit(0, 5)
                ->find();
            
            $resultado = [];
            foreach ($asesores as $asesor) {
                $resultado[] = [
                    'nombre' => $asesor->get('nombreAsesor'),
                    'totalEncuestas' => $asesor->get('COUNT:id'),
                    'calificacionPromedio' => round($asesor->get('AVG:evaluacionGeneral'), 1),
                    'nivel' => $this->obtenerNivelCalificacion($asesor->get('AVG:evaluacionGeneral'))
                ];
            }
            
            return $resultado;
            
        } catch (\Exception $e) {
            error_log("❌ Error obteniendo asesores destacados: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Determina el nivel de calificación
     */
    protected function obtenerNivelCalificacion($calificacion)
    {
        if ($calificacion >= 4.5) return 'Excelente';
        if ($calificacion >= 4.0) return 'Muy Bueno';
        if ($calificacion >= 3.5) return 'Bueno';
        if ($calificacion >= 3.0) return 'Regular';
        return 'Necesita Mejora';
    }
    
    /**
     * Estadísticas por defecto
     */
    protected function obtenerEstadisticasPorDefecto()
    {
        return [
            'totalEncuestas' => 0,
            'satisfaccionPromedio' => 0,
            'porcentajeRecomendacion' => 0,
            'tiposOperacion' => 0,
            'distribucionOperaciones' => [],
            'asesoresDestacados' => []
        ];
    }
}