<?php
namespace Espo\Modules\ReportesCalidadServicio\Controllers;

use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Error;

class CCustomerSurvey extends \Espo\Core\Controllers\Base
{
    public function postActionImportarEncuestas($params, $data, $request)
    {
        try {
            if (!$request->isPost()) {
                throw new BadRequest("Método no permitido");
            }
            
            error_log("🎯 === INICIO IMPORTAR ENCUESTAS ===");
            
            $entityManager = $this->getContainer()->get('entityManager');
            
            if (!$entityManager) {
                throw new Error("No se pudo obtener entityManager");
            }
            
            $data = $request->getParsedBody();
            if (is_object($data)) {
                $data = (array) $data;
            }
            
            $encuestas = $data['encuestas'] ?? $data;
            
            if (!is_array($encuestas)) {
                throw new BadRequest("Formato de datos inválido");
            }
            
            error_log("📊 Encuestas a procesar: " . count($encuestas));
            
            // DEBUG: Primera encuesta
            if (!empty($encuestas[0])) {
                error_log("🔍 PRIMERA ENCUESTA RECIBIDA:");
                error_log(json_encode($encuestas[0], JSON_PRETTY_PRINT));
            }
            
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
                    
                    error_log("📝 Procesando encuesta índice {$index}...");
                    
                    // Validar duplicados
                    if ($this->encuestaExiste($encuesta, $entityManager)) {
                        $resultado['duplicadas']++;
                        $nombreCliente = $encuesta['clientName'] ?? 'N/A';
                        $resultado['detalles'][] = "Encuesta {$nombreCliente} - DUPLICADA";
                        error_log("🔄 Duplicada omitida: " . $nombreCliente);
                        continue;
                    }
                    
                    // Guardar
                    if ($this->guardarEncuesta($encuesta, $entityManager)) {
                        $resultado['procesadas']++;
                        $nombreCliente = $encuesta['clientName'] ?? 'N/A';
                        $resultado['detalles'][] = "Encuesta {$nombreCliente} - GUARDADA";
                        error_log("✅ Guardada: " . $nombreCliente);
                    } else {
                        throw new \Exception("Error al guardar en BD");
                    }
                    
                } catch (\Exception $e) {
                    $errorMsg = "Índice {$index}: " . $e->getMessage();
                    $resultado['errores'][] = $errorMsg;
                    error_log("❌ " . $errorMsg);
                }
            }
            
            $resultado['message'] = "Completado: {$resultado['procesadas']}/{$resultado['total']} procesadas, {$resultado['duplicadas']} duplicadas";
            error_log("🎉 " . $resultado['message']);
            
            return $resultado;
            
        } catch (\Exception $e) {
            error_log("💥 ERROR: " . $e->getMessage());
            
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
            
            $entityManager = $this->getContainer()->get('entityManager');
            
            if (!$entityManager) {
                throw new Error("No se pudo obtener entityManager");
            }
            
            $stats = $this->obtenerEstadisticas($entityManager);
            
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
    
    protected function encuestaExiste($encuesta, $entityManager)
    {
        try {
            $correo = $encuesta['emailAddress'] ?? null;
            $nombreCliente = $encuesta['clientName'] ?? null;
            
            if (!$correo || !$nombreCliente) {
                return false;
            }
            
            $existe = $entityManager->getRepository('CCustomerSurvey')
                ->where([
                    'emailAddress' => $correo,
                    'clientName' => $nombreCliente
                ])
                ->findOne();
            
            return $existe !== null;
            
        } catch (\Exception $e) {
            error_log("⚠️ Error verificando duplicado: " . $e->getMessage());
            return false;
        }
    }
    
    protected function guardarEncuesta($datosEncuesta, $entityManager)
    {
        try {
            error_log("💾 === GUARDANDO ENCUESTA ===");
            
            $encuesta = $entityManager->getEntity('CCustomerSurvey');
            
            if (!$encuesta) {
                throw new \Exception("No se pudo crear entidad CCustomerSurvey");
            }
            
            // ✅ PROCESAR DATOS SEGÚN ORDEN DE BD
            $datosProcesados = [];
            
            // 1. created_at
            if (isset($datosEncuesta['createdAt']) && !empty($datosEncuesta['createdAt'])) {
                $datosProcesados['createdAt'] = $datosEncuesta['createdAt'];
            }
            
            // 2. email_address
            if (isset($datosEncuesta['emailAddress']) && !empty($datosEncuesta['emailAddress'])) {
                $datosProcesados['emailAddress'] = trim($datosEncuesta['emailAddress']);
            }
            
            // 3. operation_type
            if (isset($datosEncuesta['operationType']) && !empty($datosEncuesta['operationType'])) {
                $datosProcesados['operationType'] = trim($datosEncuesta['operationType']);
            }
            
            // 4. assigned_user_id
            if (isset($datosEncuesta['assignedUserId']) && !empty($datosEncuesta['assignedUserId'])) {
                $datosProcesados['assignedUserId'] = trim($datosEncuesta['assignedUserId']);
            }
            
            // 5-15. Campos de calificación 0-4 (YA CORREGIDOS EN FRONTEND)
            $camposCalificacion = [
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
            
            foreach ($camposCalificacion as $campo) {
                if (isset($datosEncuesta[$campo]) && $datosEncuesta[$campo] !== '' && $datosEncuesta[$campo] !== null) {
                    // ✅ Tomar valor directo (ya corregido en frontend)
                    $valor = (int)$datosEncuesta[$campo];
                    if ($valor >= 0 && $valor <= 4) {
                        $datosProcesados[$campo] = $valor;
                        error_log("  ✅ {$campo}: {$valor}");
                    }
                }
            }
            
            // 16. general_advisor_rating (escala 1-5)
            if (isset($datosEncuesta['generalAdvisorRating']) && $datosEncuesta['generalAdvisorRating'] !== '' && $datosEncuesta['generalAdvisorRating'] !== null) {
                $valor = (int)$datosEncuesta['generalAdvisorRating'];
                if ($valor >= 1 && $valor <= 5) {
                    $datosProcesados['generalAdvisorRating'] = $valor;
                    error_log("  ✅ generalAdvisorRating: {$valor}");
                }
            }
            
            // 17. recommendation (0 o 1)
            if (isset($datosEncuesta['recommendation'])) {
                $datosProcesados['recommendation'] = $datosEncuesta['recommendation'] === '1' ? '1' : '0';
                error_log("  ✅ recommendation: {$datosProcesados['recommendation']}");
            }
            
            // 18. contact_medium
            if (isset($datosEncuesta['contactMedium']) && is_array($datosEncuesta['contactMedium'])) {
                $datosProcesados['contactMedium'] = $datosEncuesta['contactMedium'];
            }
            if (isset($datosEncuesta['contactMediumOther']) && !empty($datosEncuesta['contactMediumOther'])) {
                $datosProcesados['contactMediumOther'] = $datosEncuesta['contactMediumOther'];
            }
            
            // 19. additional_feedback
            if (isset($datosEncuesta['additionalFeedback']) && !empty($datosEncuesta['additionalFeedback'])) {
                $datosProcesados['additionalFeedback'] = trim($datosEncuesta['additionalFeedback']);
            }
            
            // 20. client_name (OBLIGATORIO)
            if (isset($datosEncuesta['clientName']) && !empty($datosEncuesta['clientName'])) {
                $datosProcesados['clientName'] = trim($datosEncuesta['clientName']);
                error_log("  ✅ clientName: {$datosProcesados['clientName']}");
            }
            
            // estatus
            $datosProcesados['estatus'] = $datosEncuesta['estatus'] ?? '2';
            
            // ✅ DEBUG: Mostrar datos finales
            error_log("📤 DATOS FINALES A GUARDAR:");
            error_log(json_encode($datosProcesados, JSON_PRETTY_PRINT));
            
            // Establecer datos
            $encuesta->set($datosProcesados);
            
            // Guardar
            $entityManager->saveEntity($encuesta);
            
            error_log("🎉 ✅ Encuesta guardada con ID: " . $encuesta->get('id'));
            return true;
            
        } catch (\Exception $e) {
            error_log("💥 ❌ ERROR al guardar:");
            error_log("📝 Mensaje: " . $e->getMessage());
            error_log("📍 " . $e->getFile() . ":" . $e->getLine());
            error_log("🔍 Trace: " . $e->getTraceAsString());
            
            return false;
        }
    }
    
    protected function obtenerEstadisticas($entityManager)
    {
        try {
            // Total de encuestas
            $totalEncuestas = $entityManager->getRepository('CCustomerSurvey')
                ->where(['deleted' => false])
                ->count();

            // Calificación promedio
            $avgRating = $entityManager->getRepository('CCustomerSurvey')
                ->select(['avgRating' => 'AVG:generalAdvisorRating'])
                ->where(['deleted' => false, 'generalAdvisorRating!=' => null])
                ->findOne();

            $satisfaccionPromedio = $avgRating ? round($avgRating->get('avgRating'), 1) : 0;

            // Distribución por tipo de operación
            $tiposOperacion = $entityManager->getRepository('CCustomerSurvey')
                ->select(['operationType', 'COUNT:id'])
                ->where(['deleted' => false])
                ->groupBy('operationType')
                ->find();

            $distribucionOperaciones = [];
            foreach ($tiposOperacion as $tipo) {
                $distribucionOperaciones[$tipo->get('operationType')] = $tipo->get('COUNT:id');
            }

            // Porcentaje de recomendación
            $recomendaciones = $entityManager->getRepository('CCustomerSurvey')
                ->select(['recommendation', 'COUNT:id'])
                ->where(['deleted' => false])
                ->groupBy('recommendation')
                ->find();

            $totalRecomiendan = 0;

            foreach ($recomendaciones as $rec) {
                if ($rec->get('recommendation') === '1') {
                    $totalRecomiendan = $rec->get('COUNT:id');
                }
            }

            $porcentajeRecomendacion = $totalEncuestas > 0 ? 
                round(($totalRecomiendan / $totalEncuestas) * 100) : 0;

            return [
                'totalEncuestas' => $totalEncuestas,
                'satisfaccionPromedio' => $satisfaccionPromedio,
                'porcentajeRecomendacion' => $porcentajeRecomendacion,
                'tiposOperacion' => count($distribucionOperaciones),
                'distribucionOperaciones' => $distribucionOperaciones,
                'asesoresDestacados' => []
            ];
            
        } catch (\Exception $e) {
            error_log("❌ Error en estadísticas: " . $e->getMessage());
            return $this->obtenerEstadisticasPorDefecto();
        }
    }
    
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