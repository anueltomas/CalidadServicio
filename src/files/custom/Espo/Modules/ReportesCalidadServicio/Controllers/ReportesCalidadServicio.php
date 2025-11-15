<?php

namespace Espo\Modules\ReportesCalidadServicio\Controllers;

use Espo\Core\Api\Request;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Forbidden;

class ReportesCalidadServicio extends \Espo\Core\Templates\Controllers\Base
{
    public function postActionImportarEncuestas(Request $request)
    {
        if (!$this->acl->check($this->name, 'create')) {
            throw new Forbidden();
        }

        $data = $request->getParsedBody();

        if (empty($data)) {
            throw new BadRequest("No se proporcionaron datos.");
        }

        $result = $this->getRecordService()->importarEncuestas($data);

        return $result;
    }

    public function getActionGetStats(Request $request)
    {
        if (!$this->acl->check($this->name, 'read')) {
            throw new Forbidden();
        }

        $result = $this->getRecordService()->getStats();

        return $result;
    }
}