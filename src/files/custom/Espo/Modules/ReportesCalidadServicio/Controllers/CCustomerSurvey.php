<?php
namespace Espo\Modules\ReportesCalidadServicio\Controllers;

use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Error;
use Espo\Core\Exceptions\Forbidden;

class CCustomerSurvey extends \Espo\Core\Controllers\Record
{
    //CORREGIDO 24-12-25
    protected function checkViewPermissions($userInfo, $claId = null, $oficinaId = null, $asesorId = null)
    {
        if (!$userInfo) {
            return false;
        }
        
        $userId = $userInfo['id'];
        $userType = $userInfo['type'] ?? 'regular';
        $userRoles = $userInfo['roles'] ?? [];
        $userCLA = $userInfo['claId'] ?? null;
        $userOficina = $userInfo['oficinaId'] ?? null;
        $isAdmin = $userInfo['isAdmin'] ?? false;
        
        // Convertir roles a minúsculas para comparación
        $rolesLower = array_map('strtolower', $userRoles);
        
        // ✅ REGLA 1: TODOS pueden ver Territorio Nacional (CLA0 o sin filtro CLA)
        if ($claId === 'CLA0' || empty($claId)) {
            return true;
        }
        
        // ✅ REGLA 2: Admin y Casa Nacional pueden ver TODO
        if ($isAdmin || in_array('casa nacional', $rolesLower)) {
            return true;
        }
        
        // ✅ REGLA 3: Roles con permisos especiales (Afiliado, Gerente, Director, Coordinador)
        $managementRoles = ['afiliado', 'gerente', 'director', 'coordinador'];
        $hasManagementRole = false;
        
        foreach ($managementRoles as $role) {
            if (in_array($role, $rolesLower)) {
                $hasManagementRole = true;
                break;
            }
        }
        
        if ($hasManagementRole) {
            // Pueden ver su CLA, su oficina, y asesores de su oficina
            if ($claId && $userCLA && $claId === $userCLA) {
                return true;
            }
            if ($oficinaId && $userOficina && $oficinaId === $userOficina) {
                return true;
            }
            if ($asesorId && $userOficina) {
                $asesorOficina = $this->getOficinaDelAsesor($asesorId);
                if ($asesorOficina && $asesorOficina === $userOficina) {
                    return true;
                }
            }
            return false;
        }
        
        // ✅ REGLA 4: Asesores Regulares (type: 'regular' y rol 'asesor')
        if ($userType === 'regular' && in_array('asesor', $rolesLower)) {
            // Pueden ver su CLA
            if ($claId && $userCLA && $claId === $userCLA) {
                return true;
            }
            // Pueden ver su oficina
            if ($oficinaId && $userOficina && $oficinaId === $userOficina) {
                return true;
            }
            // Solo pueden ver su propio detalle
            if ($asesorId && $asesorId === $userId) {
                return true;
            }
            return false;
        }
        
        // Por defecto, denegar
        return false;
    }

    
    protected function hasRole($userInfo, $roleName)
    {
        if (!$userInfo || !isset($userInfo['roles'])) {
            return false;
        }
        
        $roleNameLower = strtolower($roleName);
        return in_array($roleNameLower, $userInfo['roles']);
    }

    
    public function getActionGetUserInfo($params, $data, $request)
    {
        try {
            $userId = $request->get('userId') ?: $this->getContainer()->get('user')->get('id');
            
            $userInfo = $this->getUserFullInfo($userId);
            
            if (!$userInfo) {
                return [
                    'success' => false,
                    'error' => 'Usuario no encontrado'
                ];
            }
            
            return [
                'success' => true,
                'data' => [
                    'esAdministrativo' => $userInfo['type'] === 'admin',
                    'esCasaNacional' => $this->hasRole($userInfo, 'casa nacional'),
                    'esGerente' => $this->hasRole($userInfo, 'gerente'),
                    'esDirector' => $this->hasRole($userInfo, 'director'),
                    'esCoordinador' => $this->hasRole($userInfo, 'coordinador'),
                    'esAfiliado' => $this->hasRole($userInfo, 'afiliado'),
                    'esAsesorRegular' => $userInfo['type'] === 'regular' && !$this->hasRole($userInfo, 'admin'),
                    'puedeImportar' => $userInfo['type'] === 'admin',
                    'claUsuario' => $userInfo['claId'],
                    'oficinaUsuario' => $userInfo['oficinaId'] && $this->esTeamIdValido($userInfo['oficinaId']) 
                        ? $userInfo['oficinaId'] 
                        : null,
                    'usuarioId' => $userInfo['id'],
                    'userName' => $userInfo['name'],
                    'userType' => $userInfo['type']
                ]
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    //CORREGIDO 24-12-25
    protected function esTeamIdValido($teamId)
    {
        try {
            $entityManager = $this->getContainer()->get('entityManager');
            $pdo = $entityManager->getPDO();
            
            $sql = "SELECT COUNT(*) as count FROM team WHERE id = ? AND deleted = 0";
            $sth = $pdo->prepare($sql);
            $sth->execute([$teamId]);
            
            $row = $sth->fetch(\PDO::FETCH_ASSOC);
            return $row && $row['count'] > 0;
            
        } catch (\Exception $e) {
            return false;
        }
    }

    //CORREGIDO 24-12-25
    protected function getUserCLA($userId)
    {
        try {
            $entityManager = $this->getContainer()->get('entityManager');
            $pdo = $entityManager->getPDO();
            
            $sql = "SELECT t.id 
                    FROM team t
                    INNER JOIN team_user tu ON t.id = tu.team_id
                    WHERE tu.user_id = ?
                    AND t.id LIKE 'CLA%'
                    AND tu.deleted = 0
                    AND t.deleted = 0
                    LIMIT 1";
            
            $sth = $pdo->prepare($sql);
            $sth->execute([$userId]);
            
            $row = $sth->fetch(\PDO::FETCH_ASSOC);
            
            return $row ? $row['id'] : null;
            
        } catch (\Exception $e) {
            return null;
        }
    }

    //CORREGIDO 24-12-25
    protected function getOficinaDelAsesor($asesorId)
    {
        try {
            $entityManager = $this->getContainer()->get('entityManager');
            $pdo = $entityManager->getPDO();
            
            $sql = "SELECT t.id 
                    FROM team t
                    INNER JOIN team_user tu ON t.id = tu.team_id
                    WHERE tu.user_id = ?
                    AND t.id NOT LIKE 'CLA%'
                    AND t.id != 'venezuela'
                    AND LOWER(t.name) != 'venezuela'
                    AND tu.deleted = 0
                    AND t.deleted = 0
                    LIMIT 1";
            
            $sth = $pdo->prepare($sql);
            $sth->execute([$asesorId]);
            
            $row = $sth->fetch(\PDO::FETCH_ASSOC);
            
            return $row ? $row['id'] : null;
            
        } catch (\Exception $e) {
            return null;
        }
    }

    //CORREGIDO 24-12-25
    protected function getNombreUsuario($userId)
    {
        try {
            $entityManager = $this->getContainer()->get('entityManager');
            $pdo = $entityManager->getPDO();
            
            $sql = "SELECT user_name, first_name, last_name 
                    FROM user 
                    WHERE id = ? 
                    AND deleted = 0 
                    LIMIT 1";
            $sth = $pdo->prepare($sql);
            $sth->execute([$userId]);
            $usuario = $sth->fetch(\PDO::FETCH_ASSOC);
            
            if (!$usuario) {
                return 'Asesor #' . substr($userId, 0, 8);
            }
            
            $firstName = $usuario['first_name'] ?? '';
            $lastName = $usuario['last_name'] ?? '';
            $userName = $usuario['user_name'] ?? '';
            
            $nombreCompleto = trim($firstName . ' ' . $lastName);
            if (empty($nombreCompleto)) {
                $nombreCompleto = $userName;
            }
            if (empty($nombreCompleto)) {
                $nombreCompleto = 'Usuario #' . substr($userId, 0, 8);
            }
            
            return $nombreCompleto;
            
        } catch (\Exception $e) {
            return 'Asesor #' . substr($userId, 0, 8);
        }
    }

    //CORREGIDO
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
            
            $sql = "SELECT user_name, first_name, last_name 
                    FROM user 
                    WHERE id = ? 
                    AND deleted = 0 
                    LIMIT 1";
            $sth = $pdo->prepare($sql);
            $sth->execute([$asesorId]);
            $usuario = $sth->fetch(\PDO::FETCH_ASSOC);
            
            if (!$usuario) {
                return [
                    'success' => false,
                    'error' => 'Asesor no encontrado'
                ];
            }
            
            // Obtener CLA y oficina del asesor
            $claId = $this->getUserCLA($asesorId);
            $oficinaId = $this->getOficinaDelAsesor($asesorId);
            
            $nombreCla = '';
            $nombreOficina = '';
            
            if ($claId) {
                $sql = "SELECT name FROM team WHERE id = :claId AND deleted = 0 LIMIT 1";
                $sth = $pdo->prepare($sql);
                $sth->execute([$claId]);
                $cla = $sth->fetch(\PDO::FETCH_ASSOC);
                $nombreCla = $cla ? $cla['name'] : '';
            }
            
            if ($oficinaId) {
                $sql = "SELECT name FROM team WHERE id = :oficinaId AND deleted = 0 LIMIT 1";
                $sth = $pdo->prepare($sql);
                $sth->execute([$oficinaId]);
                $oficina = $sth->fetch(\PDO::FETCH_ASSOC);
                $nombreOficina = $oficina ? $oficina['name'] : '';
            }
            
            // Construir nombre completo
            $firstName = $usuario['first_name'] ?? '';
            $lastName = $usuario['last_name'] ?? '';
            $userName = $usuario['user_name'] ?? '';
            
            $nombreCompleto = trim($firstName . ' ' . $lastName);
            if (empty($nombreCompleto)) {
                $nombreCompleto = $userName;
            }
            if (empty($nombreCompleto)) {
                $nombreCompleto = 'Usuario #' . substr($asesorId, 0, 8);
            }
            
            return [
                'success' => true,
                'data' => [
                    'nombre' => $nombreCompleto,
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

            
            $user = $this->getContainer()->get('user');
            $userInfo = $this->getUserFullInfo($user->get('id'));
            
            if (!$userInfo || $userInfo['type'] !== 'admin') {
                return [
                    'success' => false,
                    'error' => 'No tiene permisos para importar encuestas. Solo usuarios Administradores pueden realizar esta acción.',
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
            
            // Obtener información completa del usuario
            $userInfo = $this->getUserFullInfo($userId);
            if (!$userInfo) {
                throw new Error("No se pudo obtener información del usuario");
            }
            
            // Obtener parámetros de filtro
            $claId = $request->get('claId');
            $oficinaId = $request->get('oficinaId');
            $asesorId = $request->get('asesorId');
            
            // ✅ SIMPLIFICADO: Validar permisos con la nueva función simple
            if (!$this->checkViewPermissions($userInfo, $claId, $oficinaId, $asesorId)) {
                return [
                    'success' => false,
                    'error' => 'No tiene permisos para ver estos datos',
                    'data' => $this->obtenerEstadisticasPorDefecto()
                ];
            }
            
            $mostrarTodas = ($claId === 'CLA0' || empty($claId)) && empty($oficinaId) && empty($asesorId);
            
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
                    'esAdministrativo' => $userInfo['isAdmin'],
                    'esCasaNacional' => $this->hasRole($userInfo, 'casa nacional'),
                    'esGerente' => $this->hasRole($userInfo, 'gerente'),
                    'esDirector' => $this->hasRole($userInfo, 'director'),
                    'esCoordinador' => $this->hasRole($userInfo, 'coordinador'),
                    'esAfiliado' => $this->hasRole($userInfo, 'afiliado'),
                    'esAsesorRegular' => $userInfo['type'] === 'regular',
                    'puedeImportar' => $userInfo['isAdmin'],
                    'usuarioId' => $userId,
                    'claUsuario' => $userInfo['claId'],
                    'oficinaUsuario' => $userInfo['oficinaId']
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
            
            if (!$mostrarTodas) {
        
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
                'recomendacion' => $statsContacto['recomendacion'],
                'mediosContacto' => $statsContacto['mediosContacto']
            ];
            
        } catch (\Exception $e) {
            return $this->obtenerEstadisticasPorDefecto();
        }
    }

    //CORREGIDO 24-12-25
    protected function getUserIdsByTeam($entityManager, $teamId)
    {
        try {
            $pdo = $entityManager->getPDO();
            
            // Consulta SQL directa para obtener usuarios del equipo
            $sql = "SELECT user_id FROM team_user WHERE team_id = ? AND deleted = 0";
            $sth = $pdo->prepare($sql);
            $sth->execute([$teamId]);
            
            $userIds = [];
            while ($row = $sth->fetch(\PDO::FETCH_ASSOC)) {
                $userIds[] = $row['user_id'];
            }
            
            return $userIds;
            
        } catch (\Exception $e) {
            return [];
        }
    }

    //CORREGIDO 24-12-25
    protected function getUserIdsByCLA($entityManager, $claId)
    {
        try {
            $pdo = $entityManager->getPDO();
            
            // Obtener usuarios directos del CLA
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
            
            // Eliminar duplicados y reindexar
            $userIds = array_values(array_unique($userIds));
            
            $GLOBALS['log']->debug("getUserIdsByCLA - Total usuarios únicos del CLA {$claId}: " . count($userIds));
            
            return $userIds;
            
        } catch (\Exception $e) {
            $GLOBALS['log']->error("❌ Error en getUserIdsByCLA: " . $e->getMessage());
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
            'recomendacion' => ['si' => 0, 'no' => 0],
            'mediosContacto' => []
        ];
    }

    protected function obtenerEstadisticasPorOficina($entityManager, $claId)
    {
        try {
            $userIds = $this->getUserIdsByCLA($entityManager, $claId);
            
            if (empty($userIds)) {
                return [];
            }
            
            // ✅ CORRECCIÓN CRÍTICA: Reindexar el array para índices consecutivos
            $userIds = array_values($userIds);
            
            // ✅ CORRECCIÓN: Verificar que hay userIds antes de crear placeholders
            $placeholders = implode(',', array_fill(0, count($userIds), '?'));
            
            // Obtener oficinas con sus usuarios
            $pdo = $entityManager->getPDO();
            
            $sql = "SELECT DISTINCT t.id, t.name 
                    FROM team t
                    INNER JOIN team_user tu ON t.id = tu.team_id
                    WHERE tu.user_id IN ($placeholders)
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
                    
                    if ($encuestasConRating) {
                        foreach ($encuestasConRating as $encuesta) {
                            $rating = $encuesta->get('generalAdvisorRating');
                            if ($rating !== null) {
                                $sumaRatings += (float)$rating;
                                $contadorRatings++;
                            }
                        }
                    }
                    
                    $satisfaccionPromedio = $contadorRatings > 0 ? round($sumaRatings / $contadorRatings, 1) : 0;
                    
                    // Calcular recomendación
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
                        'porcentajeRecomendacion' => $porcentajeRecomendacion
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
        
        // Mapeo de medios de contacto según el formulario
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

    //CORREGIDO 30-12-25
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
            
            $user = $this->getContainer()->get('user');
            $userId = $user->get('id');
            $userInfo = $this->getUserFullInfo($userId);
            
            if (!$userInfo) {
                return [
                    'success' => false,
                    'error' => 'No se pudo obtener información del usuario'
                ];
            }
            
            // ✅ VALIDACIÓN ESPECÍFICA PARA COMPARACIÓN DE ASESORES
            $puedeAcceder = false;
            $errorMensaje = '';
            
            // Administrativos y Casa Nacional pueden acceder a todas las oficinas
            if ($userInfo['isAdmin'] || $this->hasRole($userInfo, 'casa nacional')) {
                $puedeAcceder = true;
            }
            // Usuario con roles de gestión (gerente/director/coordinador/afiliado)
            elseif (
                $this->hasRole($userInfo, 'gerente') ||
                $this->hasRole($userInfo, 'director') ||
                $this->hasRole($userInfo, 'coordinador') ||
                $this->hasRole($userInfo, 'afiliado')
            ) {
                // ✅ SOLO puede acceder a SU oficina
                if ($oficinaId === $userInfo['oficinaId']) {
                    $puedeAcceder = true;
                } else {
                    $puedeAcceder = false;
                    $errorMensaje = 'Solo puedes ver los asesores de tu propia oficina';
                }
            }
            // Asesor regular
            elseif ($userInfo['type'] === 'regular') {
                // Solo puede acceder a SU oficina
                if ($oficinaId === $userInfo['oficinaId']) {
                    $puedeAcceder = true;
                } else {
                    $puedeAcceder = false;
                    $errorMensaje = 'Solo puedes ver tu propia información';
                }
            }
            // Otros tipos de usuario
            else {
                $puedeAcceder = false;
                $errorMensaje = 'No tienes permisos para ver esta información';
            }
            
            if (!$puedeAcceder) {
                return [
                    'success' => false,
                    'error' => $errorMensaje,
                    'data' => []
                ];
            }
            
            $entityManager = $this->getContainer()->get('entityManager');
            
            // Obtener usuarios de la oficina
            $userIds = $this->getUsuariosPorOficina($entityManager, $oficinaId);
            
            if (empty($userIds)) {
                return [
                    'success' => true,
                    'data' => [],
                    'oficinaInfo' => $this->getOficinaInfo($entityManager, $oficinaId),
                    'message' => 'No hay asesores en esta oficina'
                ];
            }
            
            $resultados = [];
            
            // ✅ MODIFICACIÓN: INCLUIR TODOS los asesores, no solo los que tienen encuestas
            foreach ($userIds as $asesorId) {
                try {
                    $nombre = $this->getNombreUsuario($asesorId);
                    
                    $stats = $this->obtenerEstadisticasAsesor($entityManager, $asesorId);
                    
                    // ✅ MODIFICACIÓN IMPORTANTE: Incluir asesor aunque tenga 0 encuestas
                    // Pero mostrar diferentes estilos según si tiene o no datos
                    $promedio = $this->calcularPromedioAsesor($stats);
                    $porcentaje = ($promedio / 5) * 100;
                    
                    $resultados[] = [
                        'id' => $asesorId,
                        'nombre' => $nombre,
                        'totalEncuestas' => $stats['totalEncuestas'],
                        'promedioGeneral' => round($promedio, 2),
                        'porcentaje' => round($porcentaje, 1),
                        'tieneEncuestas' => $stats['totalEncuestas'] > 0
                    ];
                    
                } catch (\Exception $e) {
                    continue;
                }
            }
            
            // Ordenar por porcentaje descendente (los con 0 encuestas van al final)
            usort($resultados, function($a, $b) {
                if ($a['tieneEncuestas'] && !$b['tieneEncuestas']) return -1;
                if (!$a['tieneEncuestas'] && $b['tieneEncuestas']) return 1;
                if ($a['tieneEncuestas'] && $b['tieneEncuestas']) {
                    return $b['porcentaje'] <=> $a['porcentaje'];
                }
                return 0;
            });
            
            return [
                'success' => true,
                'data' => $resultados,
                'oficinaInfo' => $this->getOficinaInfo($entityManager, $oficinaId),
                'totalAsesores' => count($resultados),
                'asesoresConDatos' => count(array_filter($resultados, function($a) { return $a['tieneEncuestas']; })),
                'usuarioActualId' => $userId,
                'esAsesorRegular' => ($userInfo['type'] === 'regular' && !$this->hasRole($userInfo, 'admin'))
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'data' => []
            ];
        }
    }

    //CORREGIDO 24-12-25
    protected function getUsuariosPorOficina($entityManager, $oficinaId)
    {
        try {
            $pdo = $entityManager->getPDO();
            
            $sql = "SELECT user_id 
                    FROM team_user 
                    WHERE team_id = ? 
                    AND deleted = 0";
            
            $sth = $pdo->prepare($sql);
            $sth->execute([$oficinaId]);
            
            $userIds = [];
            while ($row = $sth->fetch(\PDO::FETCH_ASSOC)) {
                $userIds[] = $row['user_id'];
            }
            
            return $userIds;
            
        } catch (\Exception $e) {
            return [];
        }
    }

    //CORREIGIDO 24-12-25
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
            
            // ✅ MODIFICACIÓN: Devolver estructura completa aunque sean 0
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
            
            if ($totalEncuestas > 0) {
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
            } else {
                // Si no hay encuestas, poner todos los promedios en 0
                foreach ($camposCalificacion as $campo) {
                    $promedios[$campo] = 0;
                }
            }
            
            return array_merge(
                ['totalEncuestas' => $totalEncuestas],
                $promedios
            );
            
        } catch (\Exception $e) {
            return [
                'totalEncuestas' => 0,
                'communicationEffectiveness' => 0,
                'legalAdvice' => 0,
                'businessKnowledge' => 0,
                'personalPresentation' => 0,
                'detailManagement' => 0,
                'punctuality' => 0,
                'commitmentLevel' => 0,
                'problemSolving' => 0,
                'fullSupport' => 0,
                'unexpectedSituations' => 0,
                'negotiationTiming' => 0,
                'officeRating' => 0,
                'generalAdvisorRating' => 0
            ];
        }
    }

    //CORREIGIDO 24-12-25
    protected function calcularPromedioAsesor($stats)
    {
        // Si no tiene encuestas, devolver 0
        if (!isset($stats['totalEncuestas']) || $stats['totalEncuestas'] === 0) {
            return 0;
        }
        
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
            
            $user = $this->getContainer()->get('user');
            $userId = $user->get('id');
            $userInfo = $this->getUserFullInfo($userId);
            
            if (!$userInfo) {
                return [
                    'success' => false,
                    'error' => 'No se pudo obtener información del usuario'
                ];
            }
            
            
            if ($claId === 'CLA0') {
                // Todos pueden ver Territorio Nacional
            } elseif (!$this->checkViewPermissions($userInfo, $claId)) {
                return [
                    'success' => false,
                    'error' => 'No tiene permisos para ver estas oficinas'
                ];
            }
            
            $entityManager = $this->getContainer()->get('entityManager');
            
            // Obtener estadísticas de oficinas
            $estadisticasOficinas = $this->obtenerEstadisticasPorOficina($entityManager, $claId);
            
            $resultados = [];
            
            foreach ($estadisticasOficinas as $oficina) {
                $porcentaje = ($oficina['satisfaccionPromedio'] / 5) * 100;
                
                $resultados[] = [
                    'id' => $oficina['id'] ?? '',
                    'nombre' => $oficina['nombre'] ?? '',
                    'totalEncuestas' => $oficina['totalEncuestas'] ?? 0,
                    'satisfaccionPromedio' => $oficina['satisfaccionPromedio'] ?? 0,
                    'porcentaje' => round($porcentaje, 1),
                    'porcentajeRecomendacion' => $oficina['porcentajeRecomendacion'] ?? 0
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
            
            $user = $this->getContainer()->get('user');
            $userId = $user->get('id');
            $userInfo = $this->getUserFullInfo($userId);
            
            if (!$userInfo) {
                return [
                    'success' => false,
                    'error' => 'No se pudo obtener información del usuario'
                ];
            }
            
            // ✅ VALIDAR PERMISOS
            if (!$this->checkViewPermissions($userInfo, null, null, $asesorId)) {
                return [
                    'success' => false,
                    'error' => 'No tiene permisos para ver comentarios de este asesor',
                    'comentarios' => []
                ];
            }
            
            $entityManager = $this->getContainer()->get('entityManager');
            
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
            
            // Obtener usuario actual para validar permisos
            $user = $this->getContainer()->get('user');
            $userId = $user->get('id');
            $userInfo = $this->getUserFullInfo($userId);
            
            // Validar permisos del usuario para ver este CLA
            if (!$this->checkViewPermissions($userInfo, $claId)) {
                $GLOBALS['log']->warning("🚫 Usuario sin permisos para ver oficinas del CLA: " . $claId);
                return [
                    'success' => false,
                    'error' => 'No tiene permisos para ver oficinas de este CLA',
                    'data' => []
                ];
            }
            
            // Usar método corregido con la lógica de evaluacion-general.js
            $oficinas = $this->getOficinasByCLA($entityManager, $claId);
            
            return [
                'success' => true,
                'data' => $oficinas,
                'total' => count($oficinas)
            ];
            
        } catch (\Exception $e) {
            $GLOBALS['log']->error('❌ Error en getActionGetOficinasByCLA: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'data' => []
            ];
        }
    }

    //CORREGIDO 24-12-25
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
            
            // Obtener TODOS los usuarios de la oficina
            $pdo = $entityManager->getPDO();
            
            $sql = "SELECT DISTINCT u.id, u.user_name, u.first_name, u.last_name 
                    FROM user u
                    INNER JOIN team_user tu ON u.id = tu.user_id
                    WHERE tu.team_id = ?
                    AND u.deleted = 0
                    AND u.is_active = 1
                    ORDER BY u.first_name, u.last_name, u.user_name";
            
            $sth = $pdo->prepare($sql);
            $sth->execute([$oficinaId]);
            
            $asesores = [];
            while ($row = $sth->fetch(\PDO::FETCH_ASSOC)) {
                // Construir nombre completo
                $firstName = $row['first_name'] ?? '';
                $lastName = $row['last_name'] ?? '';
                $userName = $row['user_name'] ?? '';
                
                $fullName = trim($firstName . ' ' . $lastName);
                if (empty($fullName)) {
                    $fullName = $userName;
                }
                if (empty($fullName)) {
                    $fullName = 'Usuario #' . substr($row['id'], 0, 8);
                }
                
                // ✅ MODIFICACIÓN: Contar encuestas pero INCLUIR igual al usuario
                $encuestas = $entityManager->getRepository('CCustomerSurvey')
                    ->where([
                        'assignedUserId' => $row['id'],
                        'deleted' => false,
                        'estatus' => '2'
                    ])
                    ->count();
                
                // ✅ INCLUIR TODOS los usuarios, no solo los que tienen encuestas
                $asesores[] = [
                    'id' => $row['id'],
                    'name' => $fullName,
                    'userName' => $userName,
                    'encuestas' => $encuestas
                ];
            }
            
            return [
                'success' => true,
                'data' => $asesores,
                'total' => count($asesores)
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    //CORREGIDO 30-12-25
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
            
            // ✅ Obtener usuario actual y validar permisos
            $user = $this->getContainer()->get('user');
            $userId = $user->get('id');
            $userInfo = $this->getUserFullInfo($userId);
            
            if (!$userInfo) {
                return [
                    'success' => false,
                    'error' => 'No se pudo obtener información del usuario'
                ];
            }
            
            // ✅ VALIDAR PERMISOS DE ACCESO A ESTA OFICINA
            $puedeAcceder = false;
            $errorMensaje = '';
            
            // Administrativos y Casa Nacional pueden acceder a todas
            if ($userInfo['isAdmin'] || $this->hasRole($userInfo, 'casa nacional')) {
                $puedeAcceder = true;
            }
            // Usuario con roles de gestión
            elseif (
                $this->hasRole($userInfo, 'gerente') ||
                $this->hasRole($userInfo, 'director') ||
                $this->hasRole($userInfo, 'coordinador') ||
                $this->hasRole($userInfo, 'afiliado')
            ) {
                // ✅ Solo puede acceder a SU oficina
                if ($oficinaId === $userInfo['oficinaId']) {
                    $puedeAcceder = true;
                } else {
                    $puedeAcceder = false;
                    $errorMensaje = 'Solo puedes acceder a información de tu propia oficina';
                }
            }
            // Asesor regular
            elseif ($userInfo['type'] === 'regular') {
                // Solo puede acceder a SU oficina
                if ($oficinaId === $userInfo['oficinaId']) {
                    $puedeAcceder = true;
                } else {
                    $puedeAcceder = false;
                    $errorMensaje = 'Solo puedes acceder a información de tu propia oficina';
                }
            }
            // Otros tipos de usuario
            else {
                $puedeAcceder = false;
                $errorMensaje = 'No tienes permisos para acceder a esta información';
            }
            
            if (!$puedeAcceder) {
                return [
                    'success' => false,
                    'error' => $errorMensaje
                ];
            }
            
            // 1. Obtener nombre de la oficina
            $sql = "SELECT name FROM team WHERE id = ? AND deleted = 0 LIMIT 1";
            $sth = $pdo->prepare($sql);
            $sth->execute([$oficinaId]);
            
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
            $sql = "SELECT name FROM team WHERE id = ? AND deleted = 0 LIMIT 1";
            $sth = $pdo->prepare($sql);
            $sth->execute([$claId]);
            
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

    //CORREGIDO 24-12-25
    protected function getCLADeOficina($entityManager, $oficinaId)
    {
        try {
            $pdo = $entityManager->getPDO();
            
            // Buscar usuarios de la oficina y ver a qué CLA pertenecen
            $sql = "SELECT DISTINCT t2.id, t2.name
                    FROM team_user tu1
                    INNER JOIN team_user tu2 ON tu1.user_id = tu2.user_id
                    INNER JOIN team t2 ON tu2.team_id = t2.id
                    WHERE tu1.team_id = ?
                    AND t2.id LIKE 'CLA%'
                    AND tu1.deleted = 0
                    AND tu2.deleted = 0
                    AND t2.deleted = 0
                    LIMIT 1";
            
            $sth = $pdo->prepare($sql);
            $sth->execute([$oficinaId]);
            
            $row = $sth->fetch(\PDO::FETCH_ASSOC);
            
            if ($row) {
                return $row['id'];
            }
            
            return null;
            
        } catch (\Exception $e) {
            return null;
        }
    }

    //CORREGIDO 24-12-25
    protected function getOficinaInfo($entityManager, $oficinaId)
    {
        try {
            $pdo = $entityManager->getPDO();
            
            // Nombre oficina
            $sql = "SELECT name FROM team WHERE id = ? AND deleted = 0 LIMIT 1";
            $sth = $pdo->prepare($sql);
            $sth->execute([$oficinaId]);
            
            $oficina = $sth->fetch(\PDO::FETCH_ASSOC);
            
            $nombreOficina = $oficina ? $oficina['name'] : '';
            
            // CLA
            $claId = $this->getCLADeOficina($entityManager, $oficinaId);
            
            $nombreCla = '';
            if ($claId) {
                $sql = "SELECT name FROM team WHERE id = ? AND deleted = 0 LIMIT 1";
                $sth = $pdo->prepare($sql);
                $sth->execute([$claId]);
                
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

    protected function getOficinasByCLA($entityManager, $claId)
    {
        try {
            $pdo = $entityManager->getPDO();
            
            $GLOBALS['log']->info("🔍 getOficinasByCLA iniciado para CLA: " . $claId);
            
            // PASO 1: Obtener todos los usuarios que pertenecen al CLA
            // Equivalente a: fetchUsuariosPorCLA(claId)
            $sqlUsuarios = "SELECT DISTINCT user_id 
                            FROM team_user 
                            WHERE team_id = :claId 
                            AND deleted = 0";
            
            $sthUsuarios = $pdo->prepare($sqlUsuarios);
            $sthUsuarios->bindValue(':claId', $claId);
            $sthUsuarios->execute();
            
            $usuariosDelCLA = [];
            while ($row = $sthUsuarios->fetch(\PDO::FETCH_ASSOC)) {
                $usuariosDelCLA[] = $row['user_id'];
            }
            
            $GLOBALS['log']->info("👥 Usuarios encontrados en CLA {$claId}: " . count($usuariosDelCLA));
            
            if (empty($usuariosDelCLA)) {
                $GLOBALS['log']->warning("⚠️ No se encontraron usuarios para CLA: " . $claId);
                return [];
            }
            
            // PASO 2: De esos usuarios, obtener TODOS sus teams
            // Equivalente a: var teamsIds = usuario.teamsIds || [];
            $placeholders = implode(',', array_fill(0, count($usuariosDelCLA), '?'));
            
            $sqlTeams = "SELECT DISTINCT tu.team_id, t.name, t.id
                        FROM team_user tu
                        INNER JOIN team t ON tu.team_id = t.id
                        WHERE tu.user_id IN ($placeholders)
                        AND tu.deleted = 0
                        AND t.deleted = 0";
            
            $sthTeams = $pdo->prepare($sqlTeams);
            $sthTeams->execute($usuariosDelCLA);
            
            $oficinasSet = [];
            $claPattern = '/^CLA\d+$/i';
            
            // PASO 3: Filtrar solo los teams que NO son CLAs y NO son "venezuela"
            // Equivalente a: if (!claPattern.test(teamId) && teamId.toLowerCase() !== 'venezuela')
            while ($row = $sthTeams->fetch(\PDO::FETCH_ASSOC)) {
                $teamId = $row['team_id'];
                $teamName = strtolower($row['name'] ?? '');
                $teamIdLower = strtolower($teamId);
                
                // Verificar que NO sea un CLA
                $esCLA = preg_match($claPattern, $teamId);
                
                // Verificar que NO sea venezuela (ni por ID ni por nombre)
                $esVenezuela = ($teamIdLower === 'venezuela' || $teamName === 'venezuela');
                
                // Solo agregar si NO es CLA y NO es Venezuela
                if (!$esCLA && !$esVenezuela) {
                    // Evitar duplicados usando el ID como clave
                    if (!isset($oficinasSet[$teamId])) {
                        $oficinasSet[$teamId] = [
                            'id' => $row['id'],
                            'name' => $row['name']
                        ];
                    }
                }
            }
            
            // Convertir el set a array indexado
            $oficinas = array_values($oficinasSet);
            
            // Ordenar por nombre
            usort($oficinas, function($a, $b) {
                return strcmp($a['name'], $b['name']);
            });
            
            $GLOBALS['log']->info("✅ Oficinas encontradas para CLA {$claId}: " . count($oficinas));
            
            if (count($oficinas) > 0) {
                $nombresOficinas = array_map(function($o) { return $o['name']; }, array_slice($oficinas, 0, 5));
                $GLOBALS['log']->debug("📋 Primeras oficinas: " . implode(', ', $nombresOficinas));
            }
            
            return $oficinas;
            
        } catch (\Exception $e) {
            $GLOBALS['log']->error('❌ Error en getOficinasByCLA: ' . $e->getMessage());
            $GLOBALS['log']->error('Stack trace: ' . $e->getTraceAsString());
            return [];
        }
    }

    //CORREGID 24-12-25
    protected function getUserFullInfo($userId)
    {
        try {
            $entityManager = $this->getContainer()->get('entityManager');
            $pdo = $entityManager->getPDO();
            
            $sql = "SELECT 
                        u.id,
                        u.type,
                        u.user_name as username,
                        u.first_name,
                        u.last_name,
                        GROUP_CONCAT(DISTINCT LOWER(r.name)) as roles,
                        GROUP_CONCAT(DISTINCT t.id) as team_ids,
                        GROUP_CONCAT(DISTINCT t.name) as team_names
                    FROM user u
                    LEFT JOIN role_user ru ON u.id = ru.user_id AND ru.deleted = 0
                    LEFT JOIN role r ON ru.role_id = r.id AND r.deleted = 0
                    LEFT JOIN team_user tu ON u.id = tu.user_id AND tu.deleted = 0
                    LEFT JOIN team t ON tu.team_id = t.id AND t.deleted = 0
                    WHERE u.id = ? 
                    AND u.deleted = 0
                    GROUP BY u.id
                    LIMIT 1";
            
            $sth = $pdo->prepare($sql);
            $sth->execute([$userId]);
            
            $userData = $sth->fetch(\PDO::FETCH_ASSOC);
            
            if (!$userData) {
                return null;
            }
            
            // Procesar datos
            $roles = $userData['roles'] ? explode(',', $userData['roles']) : [];
            $teamIds = $userData['team_ids'] ? explode(',', $userData['team_ids']) : [];
            $teamNames = $userData['team_names'] ? explode(',', $userData['team_names']) : [];
            
            // Construir nombre completo
            $firstName = $userData['first_name'] ?? '';
            $lastName = $userData['last_name'] ?? '';
            $userName = $userData['username'] ?? '';
            
            $fullName = trim($firstName . ' ' . $lastName);
            if (empty($fullName)) {
                $fullName = $userName;
            }

            $sqlTeams = "SELECT 
                        t.id,
                        t.name,
                        LOWER(t.name) as name_lower
                    FROM team t
                    INNER JOIN team_user tu ON t.id = tu.team_id
                    WHERE tu.user_id = ?
                    AND tu.deleted = 0
                    AND t.deleted = 0";
        
            $sthTeams = $pdo->prepare($sqlTeams);
            $sthTeams->execute([$userId]);
            
            $teamIds = [];
            $teamNames = [];
            $allTeams = [];
            
            while ($row = $sthTeams->fetch(\PDO::FETCH_ASSOC)) {
                $teamIds[] = $row['id'];
                $teamNames[] = $row['name'];
                $allTeams[] = [
                    'id' => $row['id'],
                    'name' => $row['name'],
                    'name_lower' => $row['name_lower']
                ];
            }
            
            // Determinar CLA del usuario
            $claId = null;
            $claPattern = '/^CLA\d+$/i';
            foreach ($teamIds as $index => $teamId) {
                if (preg_match($claPattern, $teamId)) {
                    $claId = $teamId;
                    break;
                }
            }
            
            // Determinar oficina del usuario (primer team que no es CLA y no es venezuela)
            $oficinaId = null;
            foreach ($teamIds as $index => $teamId) {
                if (!preg_match($claPattern, $teamId) && 
                    strtolower($teamId) !== 'venezuela' && 
                    strtolower($teamNames[$index] ?? '') !== 'venezuela') {
                    $oficinaId = $teamId;
                    break;
                }
            }
            
            return [
                'id' => $userId,
                'type' => $userData['type'] ?? 'regular',
                'name' => $fullName,
                'roles' => $roles,
                'teamIds' => $teamIds,
                'teamNames' => $teamNames,
                'claId' => $claId,
                'oficinaId' => $oficinaId,
                'isAdmin' => $this->getContainer()->get('user')->isAdmin()
            ];
            
        } catch (\Exception $e) {
            return null;
        }
    }

    //Funciones Sebastian
    public function postActionActualizarTelefono($params, $data, $request)
    {
        try {
            if (!$request->isPost()) {
                throw new BadRequest("Método no permitido");
            }
            
            $data = $request->getParsedBody();
            if (is_object($data)) {
                $data = (array) $data;
            }
            
            $surveyId = $data['surveyId'] ?? null;
            $phoneNumber = $data['phoneNumber'] ?? null;
            
            if (!$surveyId) {
                return [
                    'success' => false,
                    'error' => 'ID de encuesta no proporcionado'
                ];
            }
            
            $entityManager = $this->getContainer()->get('entityManager');
            $encuesta = $entityManager->getEntity('CCustomerSurvey', $surveyId);
            
            if (!$encuesta) {
                return [
                    'success' => false,
                    'error' => 'Encuesta no encontrada'
                ];
            }
            
            // Actualizar teléfono
            $encuesta->set('phoneNumber', $phoneNumber);
            $entityManager->saveEntity($encuesta);
            
            return [
                'success' => true,
                'message' => 'Teléfono actualizado correctamente'
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    public function getActionGetEncuestas($params, $data, $request)
    {
        try {
            $entityManager = $this->getContainer()->get('entityManager');
            
            // Obtener usuario actual
            $user = $this->getContainer()->get('user');
            $userId = $user->get('id');
            
            // Obtener información completa del usuario
            $userInfo = $this->getUserFullInfo($userId);
            if (!$userInfo) {
                throw new Error("No se pudo obtener información del usuario");
            }
            
            // ✅ Obtener filtros de la petición
            $claId = $request->get('claId');
            $oficinaId = $request->get('oficinaId');
            $asesorId = $request->get('asesorId');
            $estatus = $request->get('estatus');
            $fechaDesde = $request->get('fechaDesde');
            $fechaHasta = $request->get('fechaHasta');
            
            // ✅ IMPORTANTE: Sin filtro de estatus por defecto - mostrar TODOS
            $whereClause = [
                'deleted' => false
            ];
            
            // ✅ Aplicar filtro de estatus solo si se especifica
            if ($estatus !== null && $estatus !== '') {
                $whereClause['estatus'] = $estatus;
            }
            
            // ✅ Aplicar filtros según lo seleccionado
            if ($asesorId) {
                // Si hay asesor específico, solo ese
                $whereClause['assignedUserId'] = $asesorId;
            } elseif ($oficinaId) {
                // Si hay oficina, todos los asesores de esa oficina
                $userIds = $this->getUsuariosPorOficina($entityManager, $oficinaId);
                if (!empty($userIds)) {
                    $whereClause['assignedUserId'] = $userIds;
                } else {
                    return [
                        'success' => true,
                        'data' => [],
                        'total' => 0
                    ];
                }
            } elseif ($claId) {
                // Si hay CLA, todos los asesores de ese CLA
                $userIds = $this->getUserIdsByCLA($entityManager, $claId);
                if (!empty($userIds)) {
                    $whereClause['assignedUserId'] = $userIds;
                } else {
                    return [
                        'success' => true,
                        'data' => [],
                        'total' => 0
                    ];
                }
            } else {
                // Sin filtros específicos, aplicar restricciones por permisos
                $esAdmin = $userInfo['isAdmin'] ?? false;
                $esCasaNacional = $this->hasRole($userInfo, 'casa nacional');
                
                if (!$esAdmin && !$esCasaNacional) {
                    // Restringir por equipos del usuario
                    $userTeamIds = $userInfo['teamIds'] ?? [];
                    if (!empty($userTeamIds)) {
                        $pdo = $entityManager->getPDO();
                        $placeholders = implode(',', array_fill(0, count($userTeamIds), '?'));
                        
                        $sql = "SELECT DISTINCT user_id 
                                FROM team_user 
                                WHERE team_id IN ($placeholders) 
                                AND deleted = 0";
                        
                        $sth = $pdo->prepare($sql);
                        $sth->execute($userTeamIds);
                        
                        $allowedUserIds = [];
                        while ($row = $sth->fetch(\PDO::FETCH_ASSOC)) {
                            $allowedUserIds[] = $row['user_id'];
                        }
                        
                        if (!empty($allowedUserIds)) {
                            $whereClause['assignedUserId'] = $allowedUserIds;
                        }
                    }
                }
            }
            
            // ✅ Aplicar filtros de fecha si existen
            if ($fechaDesde) {
                $whereClause['createdAt>='] = $fechaDesde . ' 00:00:00';
            }
            if ($fechaHasta) {
                $whereClause['createdAt<='] = $fechaHasta . ' 23:59:59';
            }
            
            // Obtener encuestas
            $encuestas = $entityManager->getRepository('CCustomerSurvey')
                ->where($whereClause)
                ->order('createdAt', 'DESC')
                ->find();
            
            $resultado = [];
            
            foreach ($encuestas as $encuesta) {
                $asesorIdEncuesta = $encuesta->get('assignedUserId');
                $asesorNombre = $this->getNombreUsuario($asesorIdEncuesta);
                
                $resultado[] = [
                    'id' => $encuesta->get('id'),
                    'clientName' => $encuesta->get('clientName'),
                    'emailAddress' => $encuesta->get('emailAddress'),
                    'operationType' => $encuesta->get('operationType'),
                    'assignedUserId' => $asesorIdEncuesta,
                    'asesorNombre' => $asesorNombre,
                    'generalAdvisorRating' => $encuesta->get('generalAdvisorRating'),
                    'recommendation' => $encuesta->get('recommendation'),
                    'estatus' => $encuesta->get('estatus'),
                    'reenvios' => $encuesta->get('reenvios') ?? 0,
                    'ultimoReenvio' => $encuesta->get('ultimoReenvio'),
                    'phoneNumber' => $encuesta->get('phoneNumber'),
                    'createdAt' => $encuesta->get('createdAt')
                ];
            }
            
            return [
                'success' => true,
                'data' => $resultado,
                'total' => count($resultado)
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'data' => []
            ];
        }
    }

    public function getActionGetDetalleEncuesta($params, $data, $request)
    {
        try {
            $surveyId = $request->get('surveyId');
            
            if (!$surveyId) {
                return [
                    'success' => false,
                    'error' => 'ID de encuesta no proporcionado'
                ];
            }
            
            $entityManager = $this->getContainer()->get('entityManager');
            
            // Obtener usuario actual y validar permisos
            $user = $this->getContainer()->get('user');
            $userId = $user->get('id');
            $userInfo = $this->getUserFullInfo($userId);
            
            // Obtener encuesta
            $encuesta = $entityManager->getEntity('CCustomerSurvey', $surveyId);
            
            if (!$encuesta) {
                return [
                    'success' => false,
                    'error' => 'Encuesta no encontrada'
                ];
            }
            
            // Validar permisos de visualización
            $asesorId = $encuesta->get('assignedUserId');
            if (!$this->checkViewPermissions($userInfo, null, null, $asesorId)) {
                return [
                    'success' => false,
                    'error' => 'No tiene permisos para ver esta encuesta'
                ];
            }
            
            // Obtener información adicional
            $asesorNombre = $this->getNombreUsuario($asesorId);
            $oficinaId = $this->getOficinaDelAsesor($asesorId);
            $oficinaNombre = '';
            
            if ($oficinaId) {
                $pdo = $entityManager->getPDO();
                $sql = "SELECT name FROM team WHERE id = :oficinaId AND deleted = 0 LIMIT 1";
                $sth = $pdo->prepare($sql);
                $sth->bindValue(':oficinaId', $oficinaId);
                $sth->execute();
                $row = $sth->fetch(\PDO::FETCH_ASSOC);
                $oficinaNombre = $row ? $row['name'] : '';
            }
            
            // Construir respuesta completa
            $contactMedium = $encuesta->get('contactMedium');
            if (is_string($contactMedium)) {
                $contactMedium = json_decode($contactMedium, true);
            }
            
            $resultado = [
                'id' => $encuesta->get('id'),
                'clientName' => $encuesta->get('clientName'),
                'emailAddress' => $encuesta->get('emailAddress'),
                'phoneNumber' => $encuesta->get('phoneNumber'),
                'operationType' => $encuesta->get('operationType'),
                'assignedUserId' => $asesorId,
                'asesorNombre' => $asesorNombre,
                'oficinaId' => $oficinaId,
                'oficinaNombre' => $oficinaNombre,
                'createdAt' => $encuesta->get('createdAt'),
                'communicationEffectiveness' => $encuesta->get('communicationEffectiveness'),
                'legalAdvice' => $encuesta->get('legalAdvice'),
                'businessKnowledge' => $encuesta->get('businessKnowledge'),
                'personalPresentation' => $encuesta->get('personalPresentation'),
                'detailManagement' => $encuesta->get('detailManagement'),
                'punctuality' => $encuesta->get('punctuality'),
                'commitmentLevel' => $encuesta->get('commitmentLevel'),
                'problemSolving' => $encuesta->get('problemSolving'),
                'fullSupport' => $encuesta->get('fullSupport'),
                'unexpectedSituations' => $encuesta->get('unexpectedSituations'),
                'negotiationTiming' => $encuesta->get('negotiationTiming'),
                'officeRating' => $encuesta->get('officeRating'),
                'generalAdvisorRating' => $encuesta->get('generalAdvisorRating'),
                'recommendation' => $encuesta->get('recommendation'),
                'contactMedium' => $contactMedium,
                'contactMediumOther' => $encuesta->get('contactMediumOther'),
                'additionalFeedback' => $encuesta->get('additionalFeedback'),
                'estatus' => $encuesta->get('estatus'),
                'reenvios' => $encuesta->get('reenvios') ?? 0,
                'ultimoReenvio' => $encuesta->get('ultimoReenvio'),
                'phoneNumber' => $encuesta->get('phoneNumber'),
                'url' => $encuesta->get('url')
            ];
            
            return [
                'success' => true,
                'data' => $resultado
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    
}