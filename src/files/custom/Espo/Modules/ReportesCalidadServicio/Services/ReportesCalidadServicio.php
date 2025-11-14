<?php
namespace Espo\Modules\ReportesCalidadServicio\Controllers;

use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Controllers\Base;

class ReportesCalidadServicio extends Base
{
    public function actionGetStats(Request $request, Response $response): void
    {
        // Aquí va la lógica para obtener tus estadísticas.
        $response->write(['status' => 'success', 'data' => 'Estadísticas aquí']);
    }
}

