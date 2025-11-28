<?php
namespace Espo\Modules\ReportesCalidadServicio\Controllers;

use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Error;

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
            
            return [
                'success' => true,
                'data' => $stats,
                'permisos' => [
                    'esAdministrativo' => $esAdmin,
                    'esCasaNacional' => $esCasaNac,
                    'puedeImportar' => $esAdmin  // ✅ Solo admins pueden importar
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
                    // Si no hay usuarios en la oficina, retornar vacío
                    return $this->obtenerEstadisticasPorDefecto();
                }
            } elseif ($claId) {
                // CORRECCIÓN: Incluir CLA0 en el filtrado
                // Si es CLA0 (Territorio Nacional), NO aplicar filtro de usuarios
                if ($claId === 'CLA0') {
                    // No filtrar por usuarios - mostrar todas las encuestas
                    // $whereClause permanece sin assignedUserId
                } else {
                    // Filtrar por CLA específico (incluye todas las oficinas del CLA)
                    $userIds = $this->getUserIdsByCLA($entityManager, $claId);
                    if (!empty($userIds)) {
                        $whereClause['assignedUserId'] = $userIds;
                    } else {
                        // Si no hay usuarios en el CLA, retornar vacío
                        return $this->obtenerEstadisticasPorDefecto();
                    }
                }
            }
        }
        // Si $mostrarTodas es true y no hay $claId, NO se agrega filtro de assignedUserId
        
        // El resto del método permanece igual...
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
                ->where(array_merge($whereClause, [$campo . '!=' => null]))
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

protected function calcularDistribucionCalificaciones($entityManager, $whereClause)
{
    $distribucion = [1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0];
    
    for ($i = 1; $i <= 5; $i++) {
        try {
            $count = $entityManager->getRepository('CCustomerSurvey')
                ->where(array_merge($whereClause, ['generalAdvisorRating' => $i]))
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