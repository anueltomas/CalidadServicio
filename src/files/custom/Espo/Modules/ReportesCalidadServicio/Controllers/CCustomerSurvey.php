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
            
            $resultado = [
                'success' => true,
                'total' => count($encuestas),
                'procesadas' => 0,
                'duplicadas' => 0,
                'errores' => []
            ];
            
            foreach ($encuestas as $index => $encuesta) {
                try {
                    if (is_object($encuesta)) {
                        $encuesta = (array) $encuesta;
                    }
                    
                    // Validar duplicados
                    if ($this->encuestaExiste($encuesta, $entityManager)) {
                        $resultado['duplicadas']++;
                        continue;
                    }
                    
                    // Guardar
                    if ($this->guardarEncuesta($encuesta, $entityManager)) {
                        $resultado['procesadas']++;
                    } else {
                        throw new \Exception("Error al guardar en BD");
                    }
                    
                } catch (\Exception $e) {
                    $resultado['errores'][] = "Índice {$index}: " . $e->getMessage();
                }
            }
            
            return $resultado;
            
        } catch (\Exception $e) {
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
            // En caso de error, devolver estadísticas por defecto
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
            return false;
        }
    }
    
    protected function guardarEncuesta($datosEncuesta, $entityManager)
    {
        try {
            $encuesta = $entityManager->getEntity('CCustomerSurvey');
            
            if (!$encuesta) {
                return false;
            }
            
            $datosProcesados = [];
            
            // Campos básicos
            if (isset($datosEncuesta['createdAt']) && !empty($datosEncuesta['createdAt'])) {
                $datosProcesados['createdAt'] = $datosEncuesta['createdAt'];
            }
            
            if (isset($datosEncuesta['emailAddress']) && !empty($datosEncuesta['emailAddress'])) {
                $datosProcesados['emailAddress'] = trim($datosEncuesta['emailAddress']);
            }
            
            if (isset($datosEncuesta['operationType']) && !empty($datosEncuesta['operationType'])) {
                $datosProcesados['operationType'] = trim($datosEncuesta['operationType']);
            }
            
            if (isset($datosEncuesta['assignedUserId']) && !empty($datosEncuesta['assignedUserId'])) {
                $datosProcesados['assignedUserId'] = trim($datosEncuesta['assignedUserId']);
            }
            
            // Campos de calificación
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
                    $valor = (int)$datosEncuesta[$campo];
                    if ($valor >= 0 && $valor <= 4) {
                        $datosProcesados[$campo] = $valor;
                    }
                }
            }
            
            // General advisor rating
            if (isset($datosEncuesta['generalAdvisorRating']) && $datosEncuesta['generalAdvisorRating'] !== '' && $datosEncuesta['generalAdvisorRating'] !== null) {
                $valor = (int)$datosEncuesta['generalAdvisorRating'];
                if ($valor >= 1 && $valor <= 5) {
                    $datosProcesados['generalAdvisorRating'] = $valor;
                }
            }
            
            // Recommendation
            if (isset($datosEncuesta['recommendation'])) {
                $datosProcesados['recommendation'] = $datosEncuesta['recommendation'] === '1' ? '1' : '0';
            }
            
            // Contact medium
            if (isset($datosEncuesta['contactMedium']) && is_array($datosEncuesta['contactMedium'])) {
                $datosProcesados['contactMedium'] = $datosEncuesta['contactMedium'];
            }
            
            if (isset($datosEncuesta['contactMediumOther']) && !empty($datosEncuesta['contactMediumOther'])) {
                $datosProcesados['contactMediumOther'] = $datosEncuesta['contactMediumOther'];
            }
            
            // Additional feedback
            if (isset($datosEncuesta['additionalFeedback']) && !empty($datosEncuesta['additionalFeedback'])) {
                $datosProcesados['additionalFeedback'] = trim($datosEncuesta['additionalFeedback']);
            }
            
            // Client name (obligatorio)
            if (isset($datosEncuesta['clientName']) && !empty($datosEncuesta['clientName'])) {
                $datosProcesados['clientName'] = trim($datosEncuesta['clientName']);
            }
            
            $datosProcesados['estatus'] = $datosEncuesta['estatus'] ?? '2';
            
            $encuesta->set($datosProcesados);
            $entityManager->saveEntity($encuesta);
            
            return true;
            
        } catch (\Exception $e) {
            return false;
        }
    }
    
    protected function obtenerEstadisticas($entityManager)
    {
        try {
            // 1. Total de encuestas
            $totalEncuestas = $entityManager->getRepository('CCustomerSurvey')
                ->where(['deleted' => false])
                ->count();

            // 2. Calificación promedio general - MÉTODO SIMPLIFICADO
            $encuestasConRating = $entityManager->getRepository('CCustomerSurvey')
                ->where(['deleted' => false, 'generalAdvisorRating!=' => null])
                ->find();
            
            $sumaRatings = 0;
            $contadorRatings = 0;
            
            foreach ($encuestasConRating as $encuesta) {
                $rating = $encuesta->get('generalAdvisorRating');
                if ($rating !== null) {
                    $sumaRatings += (float)$rating;
                    $contadorRatings++;
                }
            }
            
            $satisfaccionPromedio = $contadorRatings > 0 ? round($sumaRatings / $contadorRatings, 1) : 0;

            // 3. Distribución por tipo de operación
            $distribucionOperaciones = [
                'Venta' => 0,
                'Compra' => 0, 
                'Alquiler' => 0
            ];
            
            $encuestasOperacion = $entityManager->getRepository('CCustomerSurvey')
                ->where(['deleted' => false, 'operationType!=' => null])
                ->find();
            
            foreach ($encuestasOperacion as $encuesta) {
                $operacion = $encuesta->get('operationType');
                if (isset($distribucionOperaciones[$operacion])) {
                    $distribucionOperaciones[$operacion]++;
                }
            }

            // 4. Porcentaje de recomendación
            $totalRecomiendan = $entityManager->getRepository('CCustomerSurvey')
                ->where(['deleted' => false, 'recommendation' => '1'])
                ->count();
                
            $porcentajeRecomendacion = $totalEncuestas > 0 ? 
                round(($totalRecomiendan / $totalEncuestas) * 100) : 0;

            // 5. Promedios por categoría - MÉTODO SIMPLIFICADO
            $promediosCategorias = $this->calcularPromediosCategorias($entityManager);

            // 6. Distribución de calificaciones
            $distribucionCalificaciones = $this->calcularDistribucionCalificaciones($entityManager);

            return [
                'totalEncuestas' => $totalEncuestas,
                'satisfaccionPromedio' => $satisfaccionPromedio,
                'porcentajeRecomendacion' => $porcentajeRecomendacion,
                'tiposOperacion' => count(array_filter($distribucionOperaciones)),
                'distribucionOperaciones' => $distribucionOperaciones,
                'asesoresDestacados' => [],
                'promediosCategorias' => $promediosCategorias,
                'distribucionCalificaciones' => $distribucionCalificaciones
            ];
            
        } catch (\Exception $e) {
            // Si hay error, devolver valores por defecto
            return $this->obtenerEstadisticasPorDefecto();
        }
    }
    
    protected function calcularPromediosCategorias($entityManager)
    {
        $campos = [
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

        $promedios = [];
        
        foreach ($campos as $campo) {
            try {
                // Método simplificado: obtener todas las encuestas y calcular manualmente
                $encuestasConValor = $entityManager->getRepository('CCustomerSurvey')
                    ->where(['deleted' => false, $campo . '!=' => null])
                    ->find();
                
                $suma = 0;
                $contador = 0;
                
                foreach ($encuestasConValor as $encuesta) {
                    $valor = $encuesta->get($campo);
                    if ($valor !== null) {
                        $suma += (float)$valor;
                        $contador++;
                    }
                }
                
                $promedios[$campo] = $contador > 0 ? round($suma / $contador, 1) : 0;
                
            } catch (\Exception $e) {
                $promedios[$campo] = 0;
            }
        }

        return $promedios;
    }
    
    protected function calcularDistribucionCalificaciones($entityManager)
    {
        $distribucion = [1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0];
        
        for ($i = 1; $i <= 5; $i++) {
            try {
                $count = $entityManager->getRepository('CCustomerSurvey')
                    ->where(['deleted' => false, 'generalAdvisorRating' => $i])
                    ->count();
                    
                $distribucion[$i] = $count;
                
            } catch (\Exception $e) {
                $distribucion[$i] = 0;
            }
        }

        return $distribucion;
    }
    
    protected function obtenerEstadisticasPorDefecto()
    {
        return [
            'totalEncuestas' => 0,
            'satisfaccionPromedio' => 0,
            'porcentajeRecomendacion' => 0,
            'tiposOperacion' => 0,
            'distribucionOperaciones' => ['Venta' => 0, 'Compra' => 0, 'Alquiler' => 0],
            'asesoresDestacados' => [],
            'promediosCategorias' => [
                'communicationEffectiveness' => 0,
                'legalAdvice' => 0,
                'personalPresentation' => 0,
                'detailManagement' => 0,
                'punctuality' => 0,
                'commitmentLevel' => 0,
                'problemSolving' => 0,
                'fullSupport' => 0,
                'unexpectedSituations' => 0,
                'negotiationTiming' => 0,
                'officeRating' => 0
            ],
            'distribucionCalificaciones' => [1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0]
        ];
    }
}