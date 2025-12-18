<?php
namespace Espo\Modules\ReportesCalidadServicio\Controllers;

use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Error;
use Espo\Core\Exceptions\Forbidden;

class CCustomerSurvey extends \Espo\Core\Controllers\Base
{


    // ✅ Esta función ya no se necesita para validar importación
    // pero la mantenemos por si se usa en getStats
    protected function getUserRoles($entityManager, $userId)
    {
        try {
            $pdo = $entityManager->getPDO();
            
            $sql = "SELECT r.name 
                    FROM role r
                    INNER JOIN role_user ru ON r.id = ru.role_id
                    WHERE ru.user_id = :userId 
                    AND ru.deleted = 0 
                    AND r.deleted = 0";
            
            $sth = $pdo->prepare($sql);
            $sth->bindValue(':userId', $userId);
            $sth->execute();
            
            $roles = [];
            while ($row = $sth->fetch(\PDO::FETCH_ASSOC)) {
                $roles[] = strtolower($row['name']);
            }
            
            return $roles;
            
        } catch (\Exception $e) {
            return [];
        }
    }

    protected function esAdministrativo($roles)
    {
        return in_array('administrativo', $roles) || in_array('administrator', $roles) || in_array('admin', $roles);
    }

    protected function esCasaNacional($roles)
    {
        return in_array('casa nacional', $roles);
    }

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

            // ✅ CORRECCIÓN: Validar solo si es admin (type)
            $user = $this->getContainer()->get('user');
            
            // Verificar si el usuario es admin por tipo
            if (!$user->isAdmin()) {
                return [
                    'success' => false,
                    'error' => 'No tiene permisos para importar encuestas',
                    'total' => 0,
                    'procesadas' => 0,
                    'duplicadas' => 0,
                    'errores' => ['Acceso denegado: Solo usuarios tipo Admin pueden importar']
                ];
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

                    /* $GLOBALS['log']->warning('ENCUESTA DEBUG', [
                        'createdAt' => $encuesta['createdAt'] ?? 'null',
                        'assignedUserId' => $encuesta['assignedUserId'] ?? 'null',
                        'operationType' => $encuesta['operationType'] ?? 'null',
                        'recommendation' => $encuesta['recommendation'] ?? 'null',
                        'contactMedium' => $encuesta['contactMedium'] ?? 'null'
                    ]); */
                    
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
            
            // Obtener usuario actual
            $user = $this->getContainer()->get('user');
            $userId = $user->get('id');
            
            // Verificar si es admin por tipo
            $esAdmin = $user->isAdmin();
            
            // Obtener roles del usuario para Casa Nacional
            $roles = $this->getUserRoles($entityManager, $userId);
            $esCasaNac = $this->esCasaNacional($roles);
            
            // Obtener parámetros de filtro
            $claId = $request->get('claId');
            $oficinaId = $request->get('oficinaId');
            $asesorId = $request->get('asesorId'); // ✅ NUEVO
            
            // Validar permisos según rol
            if (!$esAdmin && !$esCasaNac) {
                // Usuario regular - validar que solo vea sus propias estadísticas
                if ($asesorId && $asesorId !== $userId) {
                    return [
                        'success' => false,
                        'error' => 'No tiene permisos para ver este asesor',
                        'data' => $this->obtenerEstadisticasPorDefecto()
                    ];
                }
                
                // Si no especificó asesor, forzar a que vea solo el suyo
                if (!$asesorId) {
                    $asesorId = $userId;
                }
            }
            
            $mostrarTodas = empty($claId) && empty($oficinaId) && empty($asesorId);
            
            $stats = $this->obtenerEstadisticas($entityManager, $claId, $oficinaId, $asesorId, $mostrarTodas);
            
            $estadisticasOficinas = [];
            if ($claId && $claId !== 'CLA0') {
                $estadisticasOficinas = $this->obtenerEstadisticasPorOficina($entityManager, $claId);
            }

            return [
                'success' => true,
                'data' => array_merge($stats, [
                    'estadisticasOficinas' => $estadisticasOficinas
                ]),
                'permisos' => [
                    'esAdministrativo' => $esAdmin,
                    'esCasaNacional' => $esCasaNac,
                    'puedeImportar' => $esAdmin
                ]
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'data' => $this->obtenerEstadisticasPorDefecto()
            ];
        }
    }

    protected function getUserTeams($entityManager, $userId)
    {
        try {
            $pdo = $entityManager->getPDO();
            
            $sql = "SELECT t.id, t.name 
                    FROM team t
                    INNER JOIN team_user tu ON t.id = tu.team_id
                    WHERE tu.user_id = :userId 
                    AND tu.deleted = 0 
                    AND t.deleted = 0";
            
            $sth = $pdo->prepare($sql);
            $sth->bindValue(':userId', $userId);
            $sth->execute();
            
            $teams = [];
            while ($row = $sth->fetch(\PDO::FETCH_ASSOC)) {
                $teams[] = [
                    'id' => $row['id'],
                    'name' => $row['name']
                ];
            }
            
            return $teams;
            
        } catch (\Exception $e) {
            return [];
        }
    }

    protected function extractCLAFromTeams($teams)
    {
        $claPattern = '/^CLA\d+$/i';
        
        foreach ($teams as $team) {
            if (preg_match($claPattern, $team['id'])) {
                return $team['id'];
            }
        }
        
        return null;
    }

    
    
    protected function encuestaExiste($encuesta, $entityManager)
    {
        try {
            // ✅ CORRECCIÓN: Validación con los 3 campos
            $createdAt = $encuesta['createdAt'] ?? null;
            $assignedUserId = $encuesta['assignedUserId'] ?? null;
            $operationType = $encuesta['operationType'] ?? null;
            
            if (!$createdAt || !$assignedUserId || !$operationType) {
                return false;
            }
            
            // Normalizar fecha para comparación (solo fecha, sin hora)
            $fechaNormalizada = substr($createdAt, 0, 10); // YYYY-MM-DD
            
            // Buscar encuestas del mismo día, usuario y tipo de operación
            $encuestas = $entityManager->getRepository('CCustomerSurvey')
                ->where([
                    'assignedUserId' => $assignedUserId,
                    'operationType' => $operationType,
                    'deleted' => false
                ])
                ->find();
            
            foreach ($encuestas as $encuesta) {
                $fechaExistente = $encuesta->get('createdAt');
                if ($fechaExistente && substr($fechaExistente, 0, 10) === $fechaNormalizada) {
                    return true;
                }
            }
            
            return false;
            
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
        
        // ✅ ACTUALIZADO: Campos de calificación (reciben valores 1-5 como string)
        $camposCalificacion = [
            'communicationEffectiveness',
            'legalAdvice',
            'businessKnowledge',
            'personalPresentation',
            'detailManagement',
            'punctuality',
            'commitmentLevel',
            'problemSolving',
            'fullSupport',
            'unexpectedSituations',
            'negotiationTiming',
            'officeRating',
            'generalAdvisorRating'
        ];
        
        foreach ($camposCalificacion as $campo) {
            if (isset($datosEncuesta[$campo]) && $datosEncuesta[$campo] !== '' && $datosEncuesta[$campo] !== null) {
                $valor = (string)$datosEncuesta[$campo];
                
                // ✅ VALIDACIÓN: Solo aceptar valores entre "1" y "5"
                if (in_array($valor, ['1', '2', '3', '4', '5'], true)) {
                    $datosProcesados[$campo] = $valor;
                } else {
                    // Log de valor inválido
                    $GLOBALS['log']->warning('Valor inválido para ' . $campo . ': ' . $valor);
                }
            }
        }
        
        // Recommendation (guardar como string "0" o "1")
        if (isset($datosEncuesta['recommendation'])) {
            $datosProcesados['recommendation'] = $datosEncuesta['recommendation'] === '1' ? '1' : '0';
        }
        
        // Contact medium (guardar como array de strings)
        if (isset($datosEncuesta['contactMedium']) && is_array($datosEncuesta['contactMedium'])) {
            $datosProcesados['contactMedium'] = array_map('strval', $datosEncuesta['contactMedium']);
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
        $GLOBALS['log']->error('Error guardando encuesta: ' . $e->getMessage());
        return false;
    }
}
    
    protected function obtenerEstadisticas($entityManager, $claId = null, $oficinaId = null, $asesorId = null, $mostrarTodas = false)
    {
        try {
            // Construir where clause base - SIEMPRE filtrar por estatus completada (2)
            $whereClause = [
                'deleted' => false,
                'estatus' => '2'
            ];
            
             if (!$mostrarTodas || $claId || $oficinaId || $asesorId) {
        
                // Prioridad 1: Filtrar por asesor específico
                if ($asesorId) {
                    $whereClause['assignedUserId'] = $asesorId;
                }
                // Prioridad 2: Filtrar por oficina específica
                elseif ($oficinaId) {
                    $userIds = $this->getUserIdsByTeam($entityManager, $oficinaId);
                    if (!empty($userIds)) {
                        $whereClause['assignedUserId'] = $userIds;
                    } else {
                        return $this->obtenerEstadisticasPorDefecto();
                    }
                }
                // Prioridad 3: Filtrar por CLA
                elseif ($claId) {
                    if ($claId === 'CLA0') {
                        // No filtrar por usuarios - mostrar todas las encuestas
                    } else {
                        $userIds = $this->getUserIdsByCLA($entityManager, $claId);
                        if (!empty($userIds)) {
                            $whereClause['assignedUserId'] = $userIds;
                        } else {
                            return $this->obtenerEstadisticasPorDefecto();
                        }
                    }
                }
            }
            
            // 1. Total de encuestas
            $totalEncuestas = $entityManager->getRepository('CCustomerSurvey')
                ->where($whereClause)
                ->count();

            // 2. Calificación promedio general
            $encuestasConRating = $entityManager->getRepository('CCustomerSurvey')
                ->where(array_merge($whereClause, ['generalAdvisorRating!=' => null]))
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
                ->where(array_merge($whereClause, ['operationType!=' => null]))
                ->find();
            
            foreach ($encuestasOperacion as $encuesta) {
                $operacion = $encuesta->get('operationType');
                if (isset($distribucionOperaciones[$operacion])) {
                    $distribucionOperaciones[$operacion]++;
                }
            }

            // 4. Porcentaje de recomendación
            $totalRecomiendan = $entityManager->getRepository('CCustomerSurvey')
                ->where(array_merge($whereClause, ['recommendation' => '1']))
                ->count();
                
            $porcentajeRecomendacion = $totalEncuestas > 0 ? 
                round(($totalRecomiendan / $totalEncuestas) * 100) : 0;

            // 5. Promedios por categoría
            $promediosCategorias = $this->calcularPromediosCategorias($entityManager, $whereClause);

            // 6. Distribución de calificaciones
            $distribucionCalificaciones = $this->calcularDistribucionCalificaciones($entityManager, $whereClause);

            // ✅ 7. AGREGAR: Estadísticas de contacto y recomendación
            $statsContacto = $this->obtenerEstadisticasContactoRecomendacion($entityManager, $whereClause);

            return [
                'totalEncuestas' => $totalEncuestas,
                'satisfaccionPromedio' => $satisfaccionPromedio,
                'porcentajeRecomendacion' => $porcentajeRecomendacion,
                'tiposOperacion' => count(array_filter($distribucionOperaciones)),
                'distribucionOperaciones' => $distribucionOperaciones,
                'asesoresDestacados' => [],
                'promediosCategorias' => $promediosCategorias,
                'distribucionCalificaciones' => $distribucionCalificaciones,
                'recomendacion' => $statsContacto['recomendacion'],  // ✅ AGREGADO
                'mediosContacto' => $statsContacto['mediosContacto']   // ✅ AGREGADO
            ];
            
        } catch (\Exception $e) {
            return $this->obtenerEstadisticasPorDefecto();
        }
    }

    // Obtener IDs de usuarios por equipo (CLA u Oficina)
    protected function getUserIdsByTeam($entityManager, $teamId)
    {
        try {
            $pdo = $entityManager->getPDO();
            
            // Consulta SQL directa para obtener usuarios del equipo
            $sql = "SELECT user_id FROM team_user WHERE team_id = :teamId AND deleted = 0";
            $sth = $pdo->prepare($sql);
            $sth->bindValue(':teamId', $teamId);
            $sth->execute();
            
            $userIds = [];
            while ($row = $sth->fetch(\PDO::FETCH_ASSOC)) {
                $userIds[] = $row['user_id'];
            }
            
            return $userIds;
            
        } catch (\Exception $e) {
            return [];
        }
    }

    // NUEVA FUNCIÓN: Obtener usuarios de un CLA incluyendo todas sus oficinas
    // Obtener usuarios de un CLA incluyendo todas sus oficinas
    protected function getUserIdsByCLA($entityManager, $claId)
    {
        try {
            $pdo = $entityManager->getPDO();
            
            // Obtener todos los usuarios que pertenecen al CLA
            $sql = "SELECT DISTINCT user_id 
                    FROM team_user 
                    WHERE team_id = :claId 
                    AND deleted = 0";
            
            $sth = $pdo->prepare($sql);
            $sth->bindValue(':claId', $claId);
            $sth->execute();
            
            $userIds = [];
            while ($row = $sth->fetch(\PDO::FETCH_ASSOC)) {
                $userIds[] = $row['user_id'];
            }
            
            // Obtener las oficinas de estos usuarios (teams que NO son CLAs y NO es venezuela)
            $sql2 = "SELECT DISTINCT tu.team_id, t.name
                    FROM team_user tu
                    INNER JOIN team t ON tu.team_id = t.id
                    WHERE tu.user_id IN (
                        SELECT user_id FROM team_user WHERE team_id = :claId AND deleted = 0
                    )
                    AND tu.team_id != :claId
                    AND t.id NOT LIKE 'CLA%'
                    AND t.id != 'venezuela'
                    AND LOWER(t.name) != 'venezuela'
                    AND tu.deleted = 0
                    AND t.deleted = 0";
            
            $sth2 = $pdo->prepare($sql2);
            $sth2->bindValue(':claId', $claId);
            $sth2->execute();
            
            $oficinasIds = [];
            while ($row = $sth2->fetch(\PDO::FETCH_ASSOC)) {
                // ✅ DOBLE VERIFICACIÓN: Excluir venezuela
                if (strtolower($row['team_id']) !== 'venezuela' && strtolower($row['name']) !== 'venezuela') {
                    $oficinasIds[] = $row['team_id'];
                }
            }
            
            // Obtener usuarios de todas las oficinas encontradas
            foreach ($oficinasIds as $oficinaId) {
                $oficinaUsers = $this->getUserIdsByTeam($entityManager, $oficinaId);
                $userIds = array_merge($userIds, $oficinaUsers);
            }
            
            // Eliminar duplicados
            $userIds = array_unique($userIds);
            
            return $userIds;
            
        } catch (\Exception $e) {
            return [];
        }
    }

    protected function calcularPromediosCategorias($entityManager, $whereClause)
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
            'officeRating',
            'businessKnowledge'
        ];

        $promedios = [];
        
        foreach ($campos as $campo) {
            try {
                $encuestasConValor = $entityManager->getRepository('CCustomerSurvey')
                    ->where(array_merge($whereClause, [
                        $campo . '!=' => null,
                        $campo . '!=' => ''
                    ]))
                    ->find();
                
                $suma = 0;
                $contador = 0;
                
                foreach ($encuestasConValor as $encuesta) {
                    $valor = $encuesta->get($campo);
                    if ($valor !== null && $valor !== '') {
                        // ✅ Convertir string a float
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

    protected function calcularDistribucionCalificaciones($entityManager, $whereClause)
    {
        $distribucion = ['1' => 0, '2' => 0, '3' => 0, '4' => 0, '5' => 0];
        
        // ✅ CORRECCIÓN: Buscar por strings "1", "2", "3", "4", "5"
        for ($i = 1; $i <= 5; $i++) {
            try {
                $count = $entityManager->getRepository('CCustomerSurvey')
                    ->where(array_merge($whereClause, ['generalAdvisorRating' => (string)$i]))
                    ->count();
                    
                $distribucion[(string)$i] = $count;
                
            } catch (\Exception $e) {
                $distribucion[(string)$i] = 0;
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
                'officeRating' => 0,
                'businessKnowledge' => 0
            ],
            'distribucionCalificaciones' => ['1' => 0, '2' => 0, '3' => 0, '4' => 0, '5' => 0],
            'recomendacion' => ['si' => 0, 'no' => 0],  // ✅ AGREGADO
            'mediosContacto' => []  // ✅ AGREGADO
        ];
    }

    protected function obtenerEstadisticasPorOficina($entityManager, $claId)
    {
        try {
            $userIds = $this->getUserIdsByCLA($entityManager, $claId);
            
            if (empty($userIds)) {
                return [];
            }
            
            // Obtener oficinas con sus usuarios
            $pdo = $entityManager->getPDO();
            
            $sql = "SELECT DISTINCT t.id, t.name 
                    FROM team t
                    INNER JOIN team_user tu ON t.id = tu.team_id
                    WHERE tu.user_id IN (" . implode(',', array_fill(0, count($userIds), '?')) . ")
                    AND t.id NOT LIKE 'CLA%'
                    AND t.id != 'venezuela'
                    AND tu.deleted = 0
                    AND t.deleted = 0";
            
            $sth = $pdo->prepare($sql);
            $sth->execute($userIds);
            
            $oficinas = [];
            while ($row = $sth->fetch(\PDO::FETCH_ASSOC)) {
                $oficinas[] = [
                    'id' => $row['id'],
                    'name' => $row['name']
                ];
            }
            
            // Obtener estadísticas por oficina
            $estadisticasOficinas = [];
            
            foreach ($oficinas as $oficina) {
                $oficinaUserIds = $this->getUserIdsByTeam($entityManager, $oficina['id']);
                
                if (empty($oficinaUserIds)) {
                    continue;
                }
                
                $whereClause = [
                    'deleted' => false,
                    'estatus' => '2',
                    'assignedUserId' => $oficinaUserIds
                ];
                
                // Total de encuestas
                $totalEncuestas = $entityManager->getRepository('CCustomerSurvey')
                    ->where($whereClause)
                    ->count();
                
                if ($totalEncuestas > 0) {
                    // Satisfacción promedio
                    $encuestasConRating = $entityManager->getRepository('CCustomerSurvey')
                        ->where(array_merge($whereClause, ['generalAdvisorRating!=' => null]))
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
                    
                    // ✅ NUEVO: Porcentaje de recomendación
                    $totalRecomiendan = $entityManager->getRepository('CCustomerSurvey')
                        ->where(array_merge($whereClause, ['recommendation' => '1']))
                        ->count();
                    
                    $porcentajeRecomendacion = $totalEncuestas > 0 ? 
                        round(($totalRecomiendan / $totalEncuestas) * 100, 1) : 0;
                    
                    $estadisticasOficinas[] = [
                        'id' => $oficina['id'],
                        'nombre' => $oficina['name'],
                        'totalEncuestas' => $totalEncuestas,
                        'satisfaccionPromedio' => $satisfaccionPromedio,
                        'porcentajeRecomendacion' => $porcentajeRecomendacion // ✅ NUEVO
                    ];
                }
            }
            
            // Ordenar por satisfacción promedio descendente
            usort($estadisticasOficinas, function($a, $b) {
                return $b['satisfaccionPromedio'] <=> $a['satisfaccionPromedio'];
            });
            
            return $estadisticasOficinas;
            
        } catch (\Exception $e) {
            return [];
        }
    }

    protected function obtenerEstadisticasContactoRecomendacion($entityManager, $whereClause)
    {
        $stats = [
            'recomendacion' => [
                'si' => 0,
                'no' => 0
            ],
            'mediosContacto' => []
        ];
        
        // Recomendación
        $stats['recomendacion']['si'] = $entityManager->getRepository('CCustomerSurvey')
            ->where(array_merge($whereClause, ['recommendation' => '1']))
            ->count();
            
        $stats['recomendacion']['no'] = $entityManager->getRepository('CCustomerSurvey')
            ->where(array_merge($whereClause, ['recommendation' => '0']))
            ->count();
        
        // ✅ ACTUALIZADO: Mapeo de medios de contacto según el formulario
        $encuestas = $entityManager->getRepository('CCustomerSurvey')
            ->where(array_merge($whereClause, ['contactMedium!=' => null]))
            ->find();
        
        $mediosMap = [
            '0' => 'Familiar/Amigo',
            '1' => 'Mercado Libre',
            '2' => 'Página Web',
            '3' => 'Facebook',
            '4' => 'Estados WhatsApp',
            '5' => 'Valla/Rótulo',
            '6' => 'Instagram',
            '7' => 'Visita en oficina',
            '8' => 'Contacto Directo',
            '9' => 'Otro'
        ];
        
        // Inicializar todos los medios en 0
        foreach ($mediosMap as $nombre) {
            $stats['mediosContacto'][$nombre] = 0;
        }
        
        // Contar cada medio
        foreach ($encuestas as $encuesta) {
            $contactMedium = $encuesta->get('contactMedium');
            
            if (is_string($contactMedium)) {
                $contactMedium = json_decode($contactMedium, true);
            }
            
            if (is_array($contactMedium)) {
                foreach ($contactMedium as $medio) {
                    $medioStr = (string)$medio;
                    if (isset($mediosMap[$medioStr])) {
                        $stats['mediosContacto'][$mediosMap[$medioStr]]++;
                    }
                }
            }
        }
        
        return $stats;
    }

        public function postActionVerificarDuplicados($params, $data, $request)
    {
        try {
            if (!$request->isPost()) {
                throw new BadRequest("Método no permitido");
            }
            
            // ✅ Validar permisos - solo admin puede verificar duplicados
            $user = $this->getContainer()->get('user');
            if (!$user->isAdmin()) {
                return [
                    'success' => false,
                    'error' => 'No tiene permisos para verificar duplicados',
                    'duplicadosEncontrados' => 0,
                    'duplicados' => []
                ];
            }
            
            $entityManager = $this->getContainer()->get('entityManager');
            if (!$entityManager) {
                throw new Error("No se pudo obtener entityManager");
            }
            
            $data = $request->getParsedBody();
            if (is_object($data)) {
                $data = (array) $data;
            }
            
            $datosVerificacion = $data['datosVerificacion'] ?? [];
            
            if (!is_array($datosVerificacion)) {
                throw new BadRequest("Formato de datos inválido");
            }
            
            $duplicadosEncontrados = [];
            $detallesDuplicados = [];
            
            foreach ($datosVerificacion as $index => $dato) {
                try {
                    if (is_object($dato)) {
                        $dato = (array) $dato;
                    }
                    
                    $email = $dato['emailAddress'] ?? null;
                    $clientName = $dato['clientName'] ?? null;
                    $operationType = $dato['operationType'] ?? null;
                    $createdAt = $dato['createdAt'] ?? null;
                    $assignedUserId = $dato['assignedUserId'] ?? null;
                    
                    // Buscar duplicados usando múltiples criterios
                    $duplicado = $this->buscarDuplicadoCompleto([
                        'emailAddress' => $email,
                        'clientName' => $clientName,
                        'operationType' => $operationType,
                        'createdAt' => $createdAt,
                        'assignedUserId' => $assignedUserId
                    ], $entityManager);
                    
                    if ($duplicado) {
                        $duplicadosEncontrados[] = $duplicado;
                        $detallesDuplicados[] = [
                            'emailAddress' => $email,
                            'clientName' => $clientName,
                            'operationType' => $operationType,
                            'createdAt' => $createdAt,
                            'assignedUserId' => $assignedUserId,
                            'razon' => $duplicado['razon'],
                            'indice' => $index
                        ];
                    }
                    
                } catch (\Exception $e) {
                    // Continuar con el siguiente registro si hay error en uno
                    continue;
                }
            }
            
            return [
                'success' => true,
                'duplicadosEncontrados' => count($duplicadosEncontrados),
                'duplicados' => $duplicadosEncontrados,
                'detallesDuplicados' => $detallesDuplicados
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'duplicadosEncontrados' => 0,
                'duplicados' => [],
                'detallesDuplicados' => []
            ];
        }
    }

    // ✅ NUEVO MÉTODO PARA BÚSQUEDA COMPLETA DE DUPLICADOS
    protected function buscarDuplicadoCompleto($datos, $entityManager)
    {
        $email = $datos['emailAddress'] ?? null;
        $clientName = $datos['clientName'] ?? null;
        $operationType = $datos['operationType'] ?? null;
        $createdAt = $datos['createdAt'] ?? null;
        $assignedUserId = $datos['assignedUserId'] ?? null;
        
        // Criterio 1: Mismo email + mismo tipo operación + misma fecha (mismo día)
        if ($email && $operationType && $createdAt) {
            $fechaNormalizada = substr($createdAt, 0, 10); // YYYY-MM-DD
            
            $encuestas = $entityManager->getRepository('CCustomerSurvey')
                ->where([
                    'emailAddress' => $email,
                    'operationType' => $operationType,
                    'deleted' => false
                ])
                ->find();
            
            foreach ($encuestas as $encuesta) {
                $fechaExistente = $encuesta->get('createdAt');
                if ($fechaExistente && substr($fechaExistente, 0, 10) === $fechaNormalizada) {
                    return [
                        'emailAddress' => $encuesta->get('emailAddress'),
                        'clientName' => $encuesta->get('clientName'),
                        'operationType' => $encuesta->get('operationType'),
                        'createdAt' => $encuesta->get('createdAt'),
                        'assignedUserId' => $encuesta->get('assignedUserId'),
                        'razon' => 'Mismo email, operación y fecha'
                    ];
                }
            }
        }
        
        // Criterio 2: Mismo nombre cliente + mismo asesor + mismo tipo operación
        if ($clientName && $assignedUserId && $operationType) {
            $encuesta = $entityManager->getRepository('CCustomerSurvey')
                ->where([
                    'clientName' => $clientName,
                    'assignedUserId' => $assignedUserId,
                    'operationType' => $operationType,
                    'deleted' => false
                ])
                ->findOne();
            
            if ($encuesta) {
                return [
                    'emailAddress' => $encuesta->get('emailAddress'),
                    'clientName' => $encuesta->get('clientName'),
                    'operationType' => $encuesta->get('operationType'),
                    'createdAt' => $encuesta->get('createdAt'),
                    'assignedUserId' => $encuesta->get('assignedUserId'),
                    'razon' => 'Mismo cliente, asesor y operación'
                ];
            }
        }
        
        // Criterio 3: Mismo email + mismo asesor (más flexible)
        if ($email && $assignedUserId) {
            $encuesta = $entityManager->getRepository('CCustomerSurvey')
                ->where([
                    'emailAddress' => $email,
                    'assignedUserId' => $assignedUserId,
                    'deleted' => false
                ])
                ->findOne();
            
            if ($encuesta) {
                return [
                    'emailAddress' => $encuesta->get('emailAddress'),
                    'clientName' => $encuesta->get('clientName'),
                    'operationType' => $encuesta->get('operationType'),
                    'createdAt' => $encuesta->get('createdAt'),
                    'assignedUserId' => $encuesta->get('assignedUserId'),
                    'razon' => 'Mismo email y asesor'
                ];
            }
        }
        
        return null;
    }

    public function getActionGetComparacionAsesores($params, $data, $request)
    {
        try {
            $oficinaId = $request->get('oficinaId');
            
            if (!$oficinaId) {
                return [
                    'success' => false,
                    'error' => 'ID de oficina no proporcionado'
                ];
            }
            
            $entityManager = $this->getContainer()->get('entityManager');
            $userRepository = $entityManager->getRepository('User');
            
            // Obtener usuarios de la oficina usando team_user
            $pdo = $entityManager->getPDO();
            
            $sql = "SELECT user_id FROM team_user WHERE team_id = :oficinaId AND deleted = 0";
            $sth = $pdo->prepare($sql);
            $sth->bindValue(':oficinaId', $oficinaId);
            $sth->execute();
            
            $userIds = [];
            while ($row = $sth->fetch(\PDO::FETCH_ASSOC)) {
                $userIds[] = $row['user_id'];
            }
            
            if (empty($userIds)) {
                return [
                    'success' => true,
                    'data' => [],
                    'oficinaInfo' => $this->getOficinaInfo($entityManager, $oficinaId), // ✅ NUEVO
                    'message' => 'No hay asesores en esta oficina'
                ];
            }
            
            $resultados = [];
            
            foreach ($userIds as $userId) {
                try {
                    $user = $userRepository->where([
                        'id' => $userId,
                        'deleted' => false,
                        'isActive' => true
                    ])->findOne();
                    
                    if (!$user) {
                        continue;
                    }
                    
                    $nombre = $user->get('name');
                    
                    if (empty($nombre) || trim($nombre) === '') {
                        $firstName = $user->get('firstName') ?? '';
                        $lastName = $user->get('lastName') ?? '';
                        $nombre = trim($firstName . ' ' . $lastName);
                        
                        if (empty($nombre)) {
                            $nombre = $user->get('userName') ?? 'Usuario';
                        }
                    }
                    
                    $stats = $this->obtenerEstadisticasAsesor($entityManager, $userId);
                    
                    if ($stats['totalEncuestas'] > 0) {
                        $promedio = $this->calcularPromedioAsesor($stats);
                        $porcentaje = ($promedio / 5) * 100;
                        
                        $resultados[] = [
                            'id' => $userId,
                            'nombre' => $nombre,
                            'totalEncuestas' => $stats['totalEncuestas'],
                            'promedioGeneral' => round($promedio, 2),
                            'porcentaje' => round($porcentaje, 1)
                        ];
                    }
                    
                } catch (\Exception $e) {
                    continue;
                }
            }
            
            // Ordenar por porcentaje descendente
            usort($resultados, function($a, $b) {
                return $b['porcentaje'] <=> $a['porcentaje'];
            });
            
            return [
                'success' => true,
                'data' => $resultados,
                'oficinaInfo' => $this->getOficinaInfo($entityManager, $oficinaId), // ✅ NUEVO
                'totalAsesores' => count($resultados)
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'data' => []
            ];
        }
    }

    protected function getAsesoresConNombres($entityManager, $oficinaId)
    {
        try {
            $pdo = $entityManager->getPDO();
            
            $sql = "SELECT 
                        u.id,
                        u.name as nombre,
                        u.first_name as nombre_pila,
                        u.last_name as apellido,
                        u.user_name as usuario,
                        u.email_address as email
                    FROM user u
                    INNER JOIN team_user tu ON u.id = tu.user_id
                    WHERE tu.team_id = :oficinaId 
                    AND u.deleted = 0 
                    AND u.is_active = 1
                    AND tu.deleted = 0
                    ORDER BY u.name, u.first_name, u.last_name";
            
            $sth = $pdo->prepare($sql);
            $sth->bindValue(':oficinaId', $oficinaId);
            $sth->execute();
            
            $asesores = [];
            while ($row = $sth->fetch(\PDO::FETCH_ASSOC)) {
                // ✅ Construir nombre completo
                $nombreCompleto = '';
                
                if (!empty($row['nombre'])) {
                    $nombreCompleto = $row['nombre'];
                } else if (!empty($row['nombre_pila']) || !empty($row['apellido'])) {
                    $nombreCompleto = trim($row['nombre_pila'] . ' ' . $row['apellido']);
                } else if (!empty($row['usuario'])) {
                    $nombreCompleto = $row['usuario'];
                } else {
                    $nombreCompleto = 'Asesor #' . substr($row['id'], 0, 8);
                }
                
                $asesores[] = [
                    'id' => $row['id'],
                    'nombre' => $nombreCompleto,
                    'nombre_pila' => $row['nombre_pila'] ?? '',
                    'apellido' => $row['apellido'] ?? '',
                    'usuario' => $row['usuario'] ?? '',
                    'email' => $row['email'] ?? ''
                ];
            }
            
            return $asesores;
            
        } catch (\Exception $e) {
            // ✅ LOG del error
            $GLOBALS['log']->error('Error al obtener asesores: ' . $e->getMessage());
            return [];
        }
    }

    protected function calcularPromedioAsesor($stats)
    {
        $sumaCalificaciones = 0;
        $contador = 0;
        
        $camposCalificacion = [
            'communicationEffectiveness',
            'legalAdvice',
            'businessKnowledge',
            'personalPresentation',
            'detailManagement',
            'punctuality',
            'commitmentLevel',
            'problemSolving',
            'fullSupport',
            'unexpectedSituations',
            'negotiationTiming',
            'generalAdvisorRating'
        ];
        
        foreach ($camposCalificacion as $campo) {
            if (isset($stats[$campo]) && $stats[$campo] > 0) {
                $sumaCalificaciones += $stats[$campo];
                $contador++;
            }
        }
        
        return $contador > 0 ? ($sumaCalificaciones / $contador) : 0;
    }

    protected function getOficinaInfo($entityManager, $oficinaId)
    {
        try {
            $pdo = $entityManager->getPDO();
            
            // Nombre oficina
            $sql = "SELECT name FROM team WHERE id = :oficinaId AND deleted = 0 LIMIT 1";
            $sth = $pdo->prepare($sql);
            $sth->bindValue(':oficinaId', $oficinaId);
            $sth->execute();
            $oficina = $sth->fetch(\PDO::FETCH_ASSOC);
            
            $nombreOficina = $oficina ? $oficina['name'] : '';
            
            // CLA
            $claId = $this->getCLADeOficina($entityManager, $oficinaId);
            
            $nombreCla = '';
            if ($claId) {
                $sql = "SELECT name FROM team WHERE id = :claId AND deleted = 0 LIMIT 1";
                $sth = $pdo->prepare($sql);
                $sth->bindValue(':claId', $claId);
                $sth->execute();
                $cla = $sth->fetch(\PDO::FETCH_ASSOC);
                $nombreCla = $cla ? $cla['name'] : '';
            }
            
            return [
                'nombre' => $nombreOficina,
                'cla' => $nombreCla,
                'claId' => $claId
            ];
            
        } catch (\Exception $e) {
            return [
                'nombre' => '',
                'cla' => '',
                'claId' => null
            ];
        }
    }

    public function getActionGetComparacionOficinas($params, $data, $request)
    {
        try {
            $claId = $request->get('claId');
            
            if (!$claId) {
                return [
                    'success' => false,
                    'error' => 'ID de CLA no proporcionado'
                ];
            }
            
            $entityManager = $this->getContainer()->get('entityManager');
            
            // Obtener oficinas del CLA
            $estadisticasOficinas = $this->obtenerEstadisticasPorOficina($entityManager, $claId);
            
            $resultados = [];
            
            foreach ($estadisticasOficinas as $oficina) {
                // ✅ CORREGIDO: Obtener también el porcentaje de recomendación para cada oficina
                $recomendacionStats = $this->obtenerRecomendacionPorOficina($entityManager, $oficina['id']);
                
                // Convertir satisfacción promedio a porcentaje (5 = máximo)
                $porcentaje = ($oficina['satisfaccionPromedio'] / 5) * 100;
                
                $resultados[] = [
                    'id' => $oficina['id'] ?? '',
                    'nombre' => $oficina['nombre'] ?? '',
                    'totalEncuestas' => $oficina['totalEncuestas'] ?? 0,
                    'satisfaccionPromedio' => $oficina['satisfaccionPromedio'] ?? 0,
                    'porcentaje' => round($porcentaje, 1),
                    'porcentajeRecomendacion' => $recomendacionStats['porcentaje'] ?? 0 // ✅ NUEVO
                ];
            }
            
            return [
                'success' => true,
                'data' => $resultados
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    // ✅ NUEVO MÉTODO: Obtener porcentaje de recomendación por oficina
    protected function obtenerRecomendacionPorOficina($entityManager, $oficinaId)
    {
        try {
            // Obtener usuarios de la oficina
            $userIds = $this->getUserIdsByTeam($entityManager, $oficinaId);
            
            if (empty($userIds)) {
                return ['total' => 0, 'recomiendan' => 0, 'porcentaje' => 0];
            }
            
            $pdo = $entityManager->getPDO();
            $placeholders = implode(',', array_fill(0, count($userIds), '?'));
            
            // Contar total de encuestas con recomendación
            $sql = "SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN recommendation = '1' THEN 1 ELSE 0 END) as recomiendan
                    FROM ccustomersurvey 
                    WHERE assigned_user_id IN ($placeholders)
                    AND estatus = '2'
                    AND deleted = 0";
            
            $sth = $pdo->prepare($sql);
            $sth->execute($userIds);
            $row = $sth->fetch(\PDO::FETCH_ASSOC);
            
            $total = $row['total'] ?? 0;
            $recomiendan = $row['recomiendan'] ?? 0;
            
            $porcentaje = $total > 0 ? round(($recomiendan / $total) * 100, 1) : 0;
            
            return [
                'total' => $total,
                'recomiendan' => $recomiendan,
                'porcentaje' => $porcentaje
            ];
            
        } catch (\Exception $e) {
            return ['total' => 0, 'recomiendan' => 0, 'porcentaje' => 0];
        }
    }


    public function getActionGetComentariosAsesor($params, $data, $request)
    {
        try {
            $asesorId = $request->get('asesorId');
            
            if (!$asesorId) {
                return [
                    'success' => false,
                    'error' => 'ID de asesor no proporcionado'
                ];
            }
            
            $entityManager = $this->getContainer()->get('entityManager');
            
            // ✅ OBTENER TODOS LOS ASESORES DEL CLA (para poder filtrar por usuario según permisos)
            $user = $this->getContainer()->get('user');
            $userId = $user->get('id');
            
            // Obtener roles del usuario
            $roles = $this->getUserRoles($entityManager, $userId);
            $esAdmin = $user->isAdmin();
            $esCasaNac = $this->esCasaNacional($roles);
            
            // Validar permisos según rol
            if (!$esAdmin && !$esCasaNac) {
                // Usuario regular - solo puede ver sus propios comentarios
                if ($asesorId !== $userId) {
                    return [
                        'success' => false,
                        'error' => 'No tiene permisos para ver comentarios de este asesor',
                        'comentarios' => []
                    ];
                }
            }
            
            // ✅ ADAPTACIÓN: Obtener el CLA del asesor para validar que pertenezca al mismo CLA del usuario
            if (!$esAdmin && $esCasaNac) {
                // Si es Casa Nacional, puede ver todos los asesores de su mismo CLA
                $userCLA = $this->getUserCLA($entityManager, $userId);
                $asesorCLA = $this->getUserCLA($entityManager, $asesorId);
                
                if ($userCLA && $asesorCLA && $userCLA !== $asesorCLA) {
                    return [
                        'success' => false,
                        'error' => 'Solo puede ver asesores de su mismo CLA',
                        'comentarios' => []
                    ];
                }
            }
            
            // Obtener encuestas del asesor con comentarios
            $encuestas = $entityManager->getRepository('CCustomerSurvey')
                ->where([
                    'assignedUserId' => $asesorId,
                    'additionalFeedback!=' => null,
                    'additionalFeedback!=' => '',
                    'deleted' => false,
                    'estatus' => '2'
                ])
                ->order('createdAt', 'DESC')
                ->find();
            
            $comentarios = [];
            foreach ($encuestas as $encuesta) {
                $comentario = trim($encuesta->get('additionalFeedback'));
                if (!empty($comentario)) {
                    $comentarios[] = [
                        'clientName' => $encuesta->get('clientName') ?: 'Cliente Anónimo',
                        'comentario' => $comentario,
                        'operationType' => $encuesta->get('operationType'),
                        'fecha' => $encuesta->get('createdAt') ? 
                            date('d/m/Y', strtotime($encuesta->get('createdAt'))) : '',
                        'calificacionGeneral' => $encuesta->get('generalAdvisorRating') ?: 'No calificada'
                    ];
                }
            }
            
            return [
                'success' => true,
                'comentarios' => $comentarios,
                'total' => count($comentarios)
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'comentarios' => []
            ];
        }
    }

    protected function getUserCLA($entityManager, $userId)
    {
        try {
            $pdo = $entityManager->getPDO();
            
            $sql = "SELECT t.id 
                    FROM team t
                    INNER JOIN team_user tu ON t.id = tu.team_id
                    WHERE tu.user_id = :userId
                    AND t.id LIKE 'CLA%'
                    AND tu.deleted = 0
                    AND t.deleted = 0
                    LIMIT 1";
            
            $sth = $pdo->prepare($sql);
            $sth->bindValue(':userId', $userId);
            $sth->execute();
            
            $row = $sth->fetch(\PDO::FETCH_ASSOC);
            
            return $row ? $row['id'] : null;
            
        } catch (\Exception $e) {
            return null;
        }
    }

    protected function getUsuariosPorOficina($entityManager, $oficinaId)
    {
        try {
            $pdo = $entityManager->getPDO();
            
            $sql = "SELECT user_id 
                    FROM team_user 
                    WHERE team_id = :oficinaId 
                    AND deleted = 0";
            
            $sth = $pdo->prepare($sql);
            $sth->bindValue(':oficinaId', $oficinaId);
            $sth->execute();
            
            $userIds = [];
            while ($row = $sth->fetch(\PDO::FETCH_ASSOC)) {
                $userIds[] = $row['user_id'];
            }
            
            return $userIds;
            
        } catch (\Exception $e) {
            return [];
        }
    }

    // ✅ FUNCIÓN AUXILIAR: Obtener nombre de usuario
    protected function getNombreUsuario($entityManager, $userId)
    {
        try {
            $pdo = $entityManager->getPDO();
            
            $sql = "SELECT 
                        name,
                        first_name,
                        last_name,
                        user_name
                    FROM user 
                    WHERE id = :userId 
                    AND deleted = 0 
                    LIMIT 1";
            
            $sth = $pdo->prepare($sql);
            $sth->bindValue(':userId', $userId);
            $sth->execute();
            
            $row = $sth->fetch(\PDO::FETCH_ASSOC);
            
            if (!$row) {
                return 'Asesor #' . substr($userId, 0, 8);
            }
            
            // ✅ Priorizar: name > first_name + last_name > user_name
            if (!empty($row['name'])) {
                return $row['name'];
            }
            
            $nombreCompleto = trim(($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? ''));
            if (!empty($nombreCompleto)) {
                return $nombreCompleto;
            }
            
            if (!empty($row['user_name'])) {
                return $row['user_name'];
            }
            
            return 'Asesor #' . substr($userId, 0, 8);
            
        } catch (\Exception $e) {
            $GLOBALS['log']->error('Error al obtener nombre usuario: ' . $e->getMessage());
            return 'Asesor #' . substr($userId, 0, 8);
        }
    }

    protected function obtenerEstadisticasAsesor($entityManager, $asesorId)
    {
        try {
            $whereClause = [
                'deleted' => false,
                'estatus' => '2',
                'assignedUserId' => $asesorId
            ];
            
            // Total de encuestas
            $totalEncuestas = $entityManager->getRepository('CCustomerSurvey')
                ->where($whereClause)
                ->count();
            
            if ($totalEncuestas === 0) {
                return ['totalEncuestas' => 0];
            }
            
            // Promedios por categoría
            $camposCalificacion = [
                'communicationEffectiveness',
                'legalAdvice',
                'businessKnowledge',
                'personalPresentation',
                'detailManagement',
                'punctuality',
                'commitmentLevel',
                'problemSolving',
                'fullSupport',
                'unexpectedSituations',
                'negotiationTiming',
                'officeRating',
                'generalAdvisorRating'
            ];
            
            $promedios = [];
            
            foreach ($camposCalificacion as $campo) {
                $encuestasConValor = $entityManager->getRepository('CCustomerSurvey')
                    ->where(array_merge($whereClause, [
                        $campo . '!=' => null,
                        $campo . '!=' => ''
                    ]))
                    ->find();
                
                $suma = 0;
                $contador = 0;
                
                foreach ($encuestasConValor as $encuesta) {
                    $valor = $encuesta->get($campo);
                    if ($valor !== null && $valor !== '') {
                        $suma += (float)$valor;
                        $contador++;
                    }
                }
                
                $promedios[$campo] = $contador > 0 ? round($suma / $contador, 1) : 0;
            }
            
            return array_merge(
                ['totalEncuestas' => $totalEncuestas],
                $promedios
            );
            
        } catch (\Exception $e) {
            return ['totalEncuestas' => 0];
        }
    }

    protected function getCLADeOficina($entityManager, $oficinaId)
    {
        try {
            $pdo = $entityManager->getPDO();
            
            // Buscar usuarios de la oficina y ver a qué CLA pertenecen
            $sql = "SELECT DISTINCT t2.id, t2.name
                    FROM team_user tu1
                    INNER JOIN team_user tu2 ON tu1.user_id = tu2.user_id
                    INNER JOIN team t2 ON tu2.team_id = t2.id
                    WHERE tu1.team_id = :oficinaId
                    AND t2.id LIKE 'CLA%'
                    AND tu1.deleted = 0
                    AND tu2.deleted = 0
                    AND t2.deleted = 0
                    LIMIT 1";
            
            $sth = $pdo->prepare($sql);
            $sth->bindValue(':oficinaId', $oficinaId);
            $sth->execute();
            
            $row = $sth->fetch(\PDO::FETCH_ASSOC);
            
            if ($row) {
                $GLOBALS['log']->info("CLA encontrado para oficina $oficinaId: {$row['id']} - {$row['name']}");
                return $row['id'];
            }
            
            $GLOBALS['log']->warning("No se encontró CLA para oficina: $oficinaId");
            return null;
            
        } catch (\Exception $e) {
            $GLOBALS['log']->error('Error getCLADeOficina: ' . $e->getMessage());
            return null;
        }
    }


    public function getActionGetCLAs($params, $data, $request)
    {
        try {
            $entityManager = $this->getContainer()->get('entityManager');
            
            $pdo = $entityManager->getPDO();
            
            $sql = "SELECT id, name 
                    FROM team 
                    WHERE id LIKE 'CLA%' 
                    AND deleted = 0 
                    ORDER BY name";
            
            $sth = $pdo->prepare($sql);
            $sth->execute();
            
            $clas = [];
            while ($row = $sth->fetch(\PDO::FETCH_ASSOC)) {
                $clas[] = [
                    'id' => $row['id'],
                    'name' => $row['name']
                ];
            }
            
            return [
                'success' => true,
                'data' => $clas
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    public function getActionGetOficinasByCLA($params, $data, $request)
    {
        try {
            $claId = $request->get('claId');
            
            if (!$claId) {
                return [
                    'success' => false,
                    'error' => 'ID de CLA no proporcionado'
                ];
            }
            
            $entityManager = $this->getContainer()->get('entityManager');
            
            // Obtener usuarios del CLA
            $userIds = $this->getUserIdsByCLA($entityManager, $claId);
            
            if (empty($userIds)) {
                return [
                    'success' => true,
                    'data' => []
                ];
            }
            
            // Obtener oficinas de esos usuarios
            $pdo = $entityManager->getPDO();
            
            $placeholders = implode(',', array_fill(0, count($userIds), '?'));
            $sql = "SELECT DISTINCT t.id, t.name 
                    FROM team t
                    INNER JOIN team_user tu ON t.id = tu.team_id
                    WHERE tu.user_id IN ($placeholders)
                    AND t.id NOT LIKE 'CLA%'
                    AND t.id != 'venezuela'
                    AND LOWER(t.name) != 'venezuela'
                    AND tu.deleted = 0
                    AND t.deleted = 0
                    ORDER BY t.name";
            
            $sth = $pdo->prepare($sql);
            $sth->execute($userIds);
            
            $oficinas = [];
            while ($row = $sth->fetch(\PDO::FETCH_ASSOC)) {
                $oficinas[] = [
                    'id' => $row['id'],
                    'name' => $row['name']
                ];
            }
            
            return [
                'success' => true,
                'data' => $oficinas
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    public function getActionGetAsesoresByOficina($params, $data, $request)
    {
        try {
            $oficinaId = $request->get('oficinaId');
            
            if (!$oficinaId) {
                return [
                    'success' => false,
                    'error' => 'ID de oficina no proporcionado'
                ];
            }
            
            $entityManager = $this->getContainer()->get('entityManager');
            
            // Obtener usuarios de la oficina
            $userIds = $this->getUserIdsByTeam($entityManager, $oficinaId);
            
            if (empty($userIds)) {
                return [
                    'success' => true,
                    'data' => []
                ];
            }
            
            // Obtener información de los usuarios
            $pdo = $entityManager->getPDO();
            
            $placeholders = implode(',', array_fill(0, count($userIds), '?'));
            $sql = "SELECT id, name, email_address 
                    FROM user 
                    WHERE id IN ($placeholders)
                    AND deleted = 0
                    AND is_active = 1
                    ORDER BY name";
            
            $sth = $pdo->prepare($sql);
            $sth->execute($userIds);
            
            $asesores = [];
            while ($row = $sth->fetch(\PDO::FETCH_ASSOC)) {
                // Verificar si tiene encuestas
                $encuestas = $entityManager->getRepository('CCustomerSurvey')
                    ->where([
                        'assignedUserId' => $row['id'],
                        'deleted' => false,
                        'estatus' => '2'
                    ])
                    ->count();
                
                if ($encuestas > 0) {
                    $asesores[] = [
                        'id' => $row['id'],
                        'name' => $row['name'] ?: 'Usuario #' . substr($row['id'], 0, 8),
                        'email' => $row['email_address'],
                        'encuestas' => $encuestas
                    ];
                }
            }
            
            // Ordenar por nombre
            usort($asesores, function($a, $b) {
                return strcmp($a['name'], $b['name']);
            });
            
            return [
                'success' => true,
                'data' => $asesores
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    public function getActionGetInfoOficina($params, $data, $request)
    {
        try {
            $oficinaId = $request->get('oficinaId');
            
            if (!$oficinaId) {
                return [
                    'success' => false,
                    'error' => 'ID de oficina no proporcionado'
                ];
            }
            
            $entityManager = $this->getContainer()->get('entityManager');
            $pdo = $entityManager->getPDO();
            
            // 1. Obtener nombre de la oficina
            $sql = "SELECT name FROM team WHERE id = :oficinaId AND deleted = 0 LIMIT 1";
            $sth = $pdo->prepare($sql);
            $sth->bindValue(':oficinaId', $oficinaId);
            $sth->execute();
            $oficina = $sth->fetch(\PDO::FETCH_ASSOC);
            
            if (!$oficina) {
                return [
                    'success' => false,
                    'error' => 'Oficina no encontrada'
                ];
            }
            
            $nombreOficina = $oficina['name'];
            
            // 2. Obtener el CLA al que pertenece la oficina
            $claId = $this->getCLADeOficina($entityManager, $oficinaId);
            
            if (!$claId) {
                return [
                    'success' => false,
                    'error' => 'No se pudo determinar el CLA de esta oficina'
                ];
            }
            
            // 3. Obtener nombre del CLA
            $sql = "SELECT name FROM team WHERE id = :claId AND deleted = 0 LIMIT 1";
            $sth = $pdo->prepare($sql);
            $sth->bindValue(':claId', $claId);
            $sth->execute();
            $cla = $sth->fetch(\PDO::FETCH_ASSOC);
            
            $nombreCla = $cla ? $cla['name'] : '';
            
            // 4. Obtener todas las oficinas del CLA (para el selector)
            $oficinas = $this->getOficinasByCLA($entityManager, $claId);
            
            return [
                'success' => true,
                'data' => [
                    'nombreOficina' => $nombreOficina,
                    'nombreCla' => $nombreCla,
                    'claId' => $claId,
                    'oficinas' => $oficinas
                ]
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * ✅ FUNCIÓN AUXILIAR: Obtener oficinas de un CLA
     */
    protected function getOficinasByCLA($entityManager, $claId)
    {
        try {
            // Obtener usuarios del CLA
            $userIds = $this->getUserIdsByCLA($entityManager, $claId);
            
            if (empty($userIds)) {
                return [];
            }
            
            $pdo = $entityManager->getPDO();
            
            // Obtener oficinas de esos usuarios (excluir CLAs y venezuela)
            $placeholders = implode(',', array_fill(0, count($userIds), '?'));
            $sql = "SELECT DISTINCT t.id, t.name 
                    FROM team t
                    INNER JOIN team_user tu ON t.id = tu.team_id
                    WHERE tu.user_id IN ($placeholders)
                    AND t.id NOT LIKE 'CLA%'
                    AND t.id != 'venezuela'
                    AND LOWER(t.name) != 'venezuela'
                    AND tu.deleted = 0
                    AND t.deleted = 0
                    ORDER BY t.name";
            
            $sth = $pdo->prepare($sql);
            $sth->execute($userIds);
            
            $oficinas = [];
            while ($row = $sth->fetch(\PDO::FETCH_ASSOC)) {
                $oficinas[] = [
                    'id' => $row['id'],
                    'name' => $row['name']
                ];
            }
            
            return $oficinas;
            
        } catch (\Exception $e) {
            $GLOBALS['log']->error('Error getOficinasByCLA: ' . $e->getMessage());
            return [];
        }
    }

    public function getActionGetInfoAsesor($params, $data, $request)
    {
        try {
            $asesorId = $request->get('asesorId');
            
            if (!$asesorId) {
                return [
                    'success' => false,
                    'error' => 'ID de asesor no proporcionado'
                ];
            }
            
            $entityManager = $this->getContainer()->get('entityManager');
            $pdo = $entityManager->getPDO();
            
            // Obtener información del usuario
            $sql = "SELECT name, email_address, first_name, last_name, user_name 
                    FROM user 
                    WHERE id = :asesorId 
                    AND deleted = 0 
                    LIMIT 1";
            $sth = $pdo->prepare($sql);
            $sth->bindValue(':asesorId', $asesorId);
            $sth->execute();
            $usuario = $sth->fetch(\PDO::FETCH_ASSOC);
            
            if (!$usuario) {
                return [
                    'success' => false,
                    'error' => 'Asesor no encontrado'
                ];
            }
            
            // Obtener CLA y oficina del asesor
            $claId = $this->getUserCLA($entityManager, $asesorId);
            $oficinaId = $this->getOficinaDelAsesor($entityManager, $asesorId);
            
            $nombreCla = '';
            $nombreOficina = '';
            
            if ($claId) {
                $sql = "SELECT name FROM team WHERE id = :claId AND deleted = 0 LIMIT 1";
                $sth = $pdo->prepare($sql);
                $sth->bindValue(':claId', $claId);
                $sth->execute();
                $cla = $sth->fetch(\PDO::FETCH_ASSOC);
                $nombreCla = $cla ? $cla['name'] : '';
            }
            
            if ($oficinaId) {
                $sql = "SELECT name FROM team WHERE id = :oficinaId AND deleted = 0 LIMIT 1";
                $sth = $pdo->prepare($sql);
                $sth->bindValue(':oficinaId', $oficinaId);
                $sth->execute();
                $oficina = $sth->fetch(\PDO::FETCH_ASSOC);
                $nombreOficina = $oficina ? $oficina['name'] : '';
            }
            
            // Construir nombre completo
            $nombreCompleto = $usuario['name'];
            if (!$nombreCompleto) {
                $nombreCompleto = trim(($usuario['first_name'] ?? '') . ' ' . ($usuario['last_name'] ?? ''));
                if (!$nombreCompleto) {
                    $nombreCompleto = $usuario['user_name'] ?? 'Usuario #' . substr($asesorId, 0, 8);
                }
            }
            
            return [
                'success' => true,
                'data' => [
                    'nombre' => $nombreCompleto,
                    'email' => $usuario['email_address'] ?? '',
                    'cla' => $nombreCla,
                    'oficina' => $nombreOficina,
                    'claId' => $claId,
                    'oficinaId' => $oficinaId
                ]
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    protected function getOficinaDelAsesor($entityManager, $asesorId)
    {
        try {
            $pdo = $entityManager->getPDO();
            
            $sql = "SELECT t.id 
                    FROM team t
                    INNER JOIN team_user tu ON t.id = tu.team_id
                    WHERE tu.user_id = :asesorId
                    AND t.id NOT LIKE 'CLA%'
                    AND t.id != 'venezuela'
                    AND LOWER(t.name) != 'venezuela'
                    AND tu.deleted = 0
                    AND t.deleted = 0
                    LIMIT 1";
            
            $sth = $pdo->prepare($sql);
            $sth->bindValue(':asesorId', $asesorId);
            $sth->execute();
            
            $row = $sth->fetch(\PDO::FETCH_ASSOC);
            
            return $row ? $row['id'] : null;
            
        } catch (\Exception $e) {
            return null;
        }
    }







    

}