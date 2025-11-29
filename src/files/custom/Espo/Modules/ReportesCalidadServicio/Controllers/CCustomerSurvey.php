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
            
            // ✅ Verificar si es admin por tipo
            $esAdmin = $user->isAdmin();
            
            // Obtener roles del usuario para Casa Nacional
            $roles = $this->getUserRoles($entityManager, $userId);
            $esCasaNac = $this->esCasaNacional($roles);
            
            // Obtener parámetros de filtro
            $claId = $request->get('claId');
            $oficinaId = $request->get('oficinaId');
            
            // Validar permisos según rol
            if (!$esAdmin && !$esCasaNac) {
                // Usuario regular - validar CLA
                $userTeams = $this->getUserTeams($entityManager, $userId);
                $userClaId = $this->extractCLAFromTeams($userTeams);
                
                // Si solicitan un CLA específico, verificar que sea el suyo
                if ($claId && $claId !== 'CLA0' && $claId !== $userClaId) {
                    return [
                        'success' => false,
                        'error' => 'No tiene permisos para ver este CLA',
                        'data' => $this->obtenerEstadisticasPorDefecto()
                    ];
                }
            }
            
            $mostrarTodas = empty($claId) && empty($oficinaId);
            
            $stats = $this->obtenerEstadisticas($entityManager, $claId, $oficinaId, $mostrarTodas);
            

            $estadisticasOficinas = [];
            if ($claId && $claId !== 'CLA0') {
                $estadisticasOficinas = $this->obtenerEstadisticasPorOficina($entityManager, $claId);
            }

            // Modify the return to include:
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
            
            // ✅ CORRECCIÓN: Campos de calificación (convertir de 0-4 a 1-5 y guardar como string)
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
                    // Convertir de escala 0-4 a 1-5
                    if ($valor >= 0 && $valor <= 4) {
                        $valorConvertido = $valor + 1; // 0->1, 1->2, 2->3, 3->4, 4->5
                        $datosProcesados[$campo] = (string)$valorConvertido; // ✅ Guardar como string
                    }
                }
            }
            
            // ✅ CORRECCIÓN: General advisor rating (ya viene en escala 1-5, guardar como string)
            if (isset($datosEncuesta['generalAdvisorRating']) && $datosEncuesta['generalAdvisorRating'] !== '' && $datosEncuesta['generalAdvisorRating'] !== null) {
                $valor = (int)$datosEncuesta['generalAdvisorRating'];
                if ($valor >= 1 && $valor <= 5) {
                    $datosProcesados['generalAdvisorRating'] = (string)$valor; // ✅ Guardar como string
                }
            }
            
            // ✅ CORRECCIÓN: Recommendation (guardar como string "0" o "1")
            if (isset($datosEncuesta['recommendation'])) {
                $datosProcesados['recommendation'] = $datosEncuesta['recommendation'] === '1' ? '1' : '0';
            }
            
            // ✅ CORRECCIÓN: Contact medium (guardar como array de strings)
            if (isset($datosEncuesta['contactMedium']) && is_array($datosEncuesta['contactMedium'])) {
                // Asegurar que todos los valores sean strings
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
            return false;
        }
    }
    
    protected function obtenerEstadisticas($entityManager, $claId = null, $oficinaId = null, $mostrarTodas = false)
    {
        try {
            // Construir where clause base - SIEMPRE filtrar por estatus completada (2)
            $whereClause = [
                'deleted' => false,
                'estatus' => '2'
            ];
            
            // CORRECCIÓN: Aplicar filtros cuando NO es "mostrar todas" O cuando hay un CLA específico
            if (!$mostrarTodas || $claId) {
                if ($oficinaId) {
                    // Filtrar por oficina específica
                    $userIds = $this->getUserIdsByTeam($entityManager, $oficinaId);
                    if (!empty($userIds)) {
                        $whereClause['assignedUserId'] = $userIds;
                    } else {
                        return $this->obtenerEstadisticasPorDefecto();
                    }
                } elseif ($claId) {
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
            
            // Obtener las oficinas de estos usuarios (teams que NO son CLAs)
            $sql2 = "SELECT DISTINCT tu.team_id, t.name
                    FROM team_user tu
                    INNER JOIN team t ON tu.team_id = t.id
                    WHERE tu.user_id IN (
                        SELECT user_id FROM team_user WHERE team_id = :claId AND deleted = 0
                    )
                    AND tu.team_id != :claId
                    AND t.id NOT LIKE 'CLA%'
                    AND tu.deleted = 0
                    AND t.deleted = 0";
            
            $sth2 = $pdo->prepare($sql2);
            $sth2->bindValue(':claId', $claId);
            $sth2->execute();
            
            $oficinasIds = [];
            while ($row = $sth2->fetch(\PDO::FETCH_ASSOC)) {
                $oficinasIds[] = $row['team_id'];
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
            'officeRating'
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
                'officeRating' => 0
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
                
                $totalEncuestas = $entityManager->getRepository('CCustomerSurvey')
                    ->where($whereClause)
                    ->count();
                
                if ($totalEncuestas > 0) {
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
                    
                    $estadisticasOficinas[] = [
                        'nombre' => $oficina['name'],
                        'totalEncuestas' => $totalEncuestas,
                        'satisfaccionPromedio' => $satisfaccionPromedio
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
        
        // ✅ CORRECCIÓN: Recomendación con strings "1" y "0"
        $stats['recomendacion']['si'] = $entityManager->getRepository('CCustomerSurvey')
            ->where(array_merge($whereClause, ['recommendation' => '1']))
            ->count();
            
        $stats['recomendacion']['no'] = $entityManager->getRepository('CCustomerSurvey')
            ->where(array_merge($whereClause, ['recommendation' => '0']))
            ->count();
        
        // ✅ CORRECCIÓN: Medios de contacto
        $encuestas = $entityManager->getRepository('CCustomerSurvey')
            ->where(array_merge($whereClause, ['contactMedium!=' => null]))
            ->find();
        
        $mediosMap = [
            '0' => 'Contacto Directo',
            '1' => 'Familiar/Amigo',
            '2' => 'Página Web',
            '3' => 'Mercado Libre',
            '4' => 'Instagram',
            '5' => 'Facebook',
            '6' => 'WhatsApp',
            '7' => 'Estados WhatsApp',
            '8' => 'Valla/Rótulo',
            '9' => 'Visita en oficina'
        ];
        
        // Inicializar todos los medios en 0
        foreach ($mediosMap as $nombre) {
            $stats['mediosContacto'][$nombre] = 0;
        }
        
        // Contar cada medio
        foreach ($encuestas as $encuesta) {
            $contactMedium = $encuesta->get('contactMedium');
            
            // ✅ CORRECCIÓN: Manejar tanto arrays como strings JSON
            if (is_string($contactMedium)) {
                $contactMedium = json_decode($contactMedium, true);
            }
            
            if (is_array($contactMedium)) {
                foreach ($contactMedium as $medio) {
                    // Asegurar que sea string
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

    

}