<?php
namespace Espo\Modules\ReportesCalidadServicio\Controllers;

use Espo\Core\Controllers\Base;
use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Forbidden;

class ImportCalidad extends \Espo\Core\Templates\Controllers\Base
{
    /**
     * Procesa la importación del archivo CSV
     */
    public function postActionImportCsv(Request $request): array
    {
        if (!$this->acl->checkScope('ReportesCalidadServicio', 'create')) {
            throw new Forbidden('No tienes permisos para importar datos');
        }

        $data = $request->getParsedBody();
        
        if (!isset($data->fileContent)) {
            throw new BadRequest('No se proporcionó el contenido del archivo');
        }

        $service = $this->getRecordService('ReportesCalidadServicio');
        
        try {
            $result = $service->importFromCsv($data->fileContent);
            
            return [
                'success' => true,
                'imported' => $result['imported'],
                'errors' => $result['errors'],
                'skipped' => $result['skipped']
            ];
        } catch (\Exception $e) {
            throw new BadRequest($e->getMessage());
        }
    }

    /**
     * Valida el formato del archivo antes de importar
     */
    public function postActionValidateCsv(Request $request): array
    {
        $data = $request->getParsedBody();
        
        if (!isset($data->fileContent)) {
            throw new BadRequest('No se proporcionó el contenido del archivo');
        }

        $service = $this->getRecordService('ReportesCalidadServicio');
        $validation = $service->validateCsvFormat($data->fileContent);
        
        return $validation;
    }

    /**
     * Obtiene las estadísticas generales para el dashboard
     */
    public function getActionGetStats(Request $request): array
    {
        if (!$this->acl->checkScope('ReportesCalidadServicio', 'read')) {
            throw new Forbidden('No tienes permisos para ver las estadísticas');
        }

        $service = $this->getRecordService('ReportesCalidadServicio');
        $stats = $service->getGeneralStats();
        
        return $stats;
    }
}