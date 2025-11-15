<?php
namespace Espo\Modules\ReportesCalidadServicio\Services;

use Espo\ORM\Entity;

class ReportesCalidadServicio extends \Espo\Services\Record
{
    /**
     * Mapeo de campos del CSV a campos de la entidad
     */
    private $fieldMapping = [
        'CLA' => 'cla',
        'ID Oficina' => 'idOficina',
        'Oficina' => 'oficina',
        'Marca temporal' => 'marcaTemporal',
        'Correo' => 'correo',
        '1. ¿Qué tipo de operación realizó?' => 'tipoOperacion',
        'ID Asesor' => 'idAsesor',
        '2. Escriba el nombre del Asesor Inmobiliario que le prestó el servicio.' => 'nombreAsesor',
        '3. Por favor, evalúe el servicio prestado por el Asesor Inmobiliario de Century 21 en cada uno de los siguientes aspectos:' => 'evaluacionGeneral',
        'Asesoría legal, fiscal y financiera' => 'asesoriaLegal',
        'Por favor continúe calificando los siguientes aspectos:' => 'calificacionContinua',
        'Presentación Personal e Imagen' => 'presentacionPersonal',
        'Manejo de los detalles' => 'manejoDetalles',
        'Puntualidad' => 'puntualidad',
        'Nivel de compromiso en el servicio' => 'nivelCompromiso',
        'Solución de problemas' => 'solucionProblemas',
        'Acompañamiento de inicio a fin' => 'acompanamiento',
        'Manejo de situaciones Imprevistas' => 'manejoImprevistas',
        'Manejo de los tiempos de la negociación' => 'manejoTiempos',
        '4. En general, ¿Cómo percibió el servicio prestado por el Asesor Inmobiliario de Century21' => 'percepcionGeneral',
        '5. ¿Cómo califica el servicio prestado por la oficina Century 21?' => 'calificacionOficina',
        '6. ¿Recomendaría el servicio de Century 21 a un amigo/familiar?' => 'recomendaria',
        '7. ¿Por cuál medio se puso en contacto con la oficina/asesor Century 21?' => 'medioContacto',
        '8. Sugerencia adicional para mejorar el servicio asesor/oficina Century 21 . Estamos seguros de que hay algo más que le hubiera gustado que hiciera asesor/oficina por usted.' => 'sugerencias',
        '9. Por favor Indique su fecha de cumpleaños.' => 'fechaCumpleanos',
        '10. Escriba su Primer Nombre y Primer Apellido.' => 'nombreCliente'
    ];

    public function importarEncuestas($data)
    {
        $encuestas = $data['encuestas'] ?? [];
        $importadas = 0;
        
        foreach ($encuestas as $encuestaData) {
            try {
                $encuesta = $this->getEntityManager()->getEntity('ReportesCalidadServicio');
                
                // Mapear los datos a la entidad
                $encuesta->set([
                    'ciudad' => $encuestaData['ciudad'] ?? null,
                    'idOficina' => $encuestaData['idOficina'] ?? null,
                    'oficina' => $encuestaData['oficina'] ?? null,
                    'fechaEncuesta' => $encuestaData['fechaEncuesta'] ?? null,
                    'email' => $encuestaData['email'] ?? null,
                    'tipoOperacion' => $encuestaData['tipoOperacion'] ?? null,
                    'idAsesor' => $encuestaData['idAsesor'] ?? null,
                    'nombreAsesor' => $encuestaData['nombreAsesor'] ?? null,
                    'puntuacionAsesoriaLegal' => $encuestaData['puntuacionAsesoriaLegal'] ?? null,
                    'puntuacionPresentacion' => $encuestaData['puntuacionPresentacion'] ?? null,
                    'puntuacionManejoDetalles' => $encuestaData['puntuacionManejoDetalles'] ?? null,
                    'puntuacionPuntualidad' => $encuestaData['puntuacionPuntualidad'] ?? null,
                    'puntuacionCompromiso' => $encuestaData['puntuacionCompromiso'] ?? null,
                    'puntuacionSolucionProblemas' => $encuestaData['puntuacionSolucionProblemas'] ?? null,
                    'puntuacionAcompanamiento' => $encuestaData['puntuacionAcompanamiento'] ?? null,
                    'puntuacionSituacionesImprevistas' => $encuestaData['puntuacionSituacionesImprevistas'] ?? null,
                    'puntuacionManejoTiempos' => $encuestaData['puntuacionManejoTiempos'] ?? null,
                    'puntuacionGeneralAsesor' => $encuestaData['puntuacionGeneralAsesor'] ?? null,
                    'puntuacionOficina' => $encuestaData['puntuacionOficina'] ?? null,
                    'recomendacion' => $encuestaData['recomendacion'] ?? null,
                    'medioContacto' => $encuestaData['medioContacto'] ?? null,
                    'sugerencias' => $encuestaData['sugerencias'] ?? null,
                    'fechaCumpleanos' => $encuestaData['fechaCumpleanos'] ?? null,
                    'nombreCliente' => $encuestaData['nombreCliente'] ?? null
                ]);
                
                $this->getEntityManager()->saveEntity($encuesta);
                $importadas++;
                
            } catch (\Exception $e) {
                $GLOBALS['log']->error("Error importing survey: " . $e->getMessage());
            }
        }
        
        return [
            'importadas' => $importadas,
            'total' => count($encuestas)
        ];
    }

    public function importFromCsv(string $fileContent): array
    {
        $imported = 0;
        $errors = [];
        $skipped = 0;

        $lines = explode("\n", $fileContent);
        $headers = str_getcsv(array_shift($lines));
        
        $this->validateHeaders($headers);

        foreach ($lines as $index => $line) {
            if (empty(trim($line))) {
                continue;
            }

            try {
                $data = str_getcsv($line);
                
                if (count($data) !== count($headers)) {
                    $skipped++;
                    $errors[] = "Línea " . ($index + 2) . ": Número de columnas incorrecto";
                    continue;
                }

                $mappedData = $this->mapCsvRowToEntity($headers, $data);
                
                $validation = $this->validateRowData($mappedData);
                if (!$validation['valid']) {
                    $skipped++;
                    $errors[] = "Línea " . ($index + 2) . ": " . implode(', ', $validation['errors']);
                    continue;
                }

                $entity = $this->entityManager->getEntity('ReportesCalidadServicio');
                
                foreach ($mappedData as $field => $value) {
                    $entity->set($field, $value);
                }

                $this->entityManager->saveEntity($entity);
                $imported++;

            } catch (\Exception $e) {
                $skipped++;
                $errors[] = "Línea " . ($index + 2) . ": " . $e->getMessage();
            }
        }

        return [
            'imported' => $imported,
            'errors' => $errors,
            'skipped' => $skipped
        ];
    }

    public function validateCsvFormat(string $fileContent): array
    {
        try {
            $lines = explode("\n", $fileContent);
            $headers = str_getcsv($lines[0]);
            
            $this->validateHeaders($headers);
            
            return [
                'valid' => true,
                'rowCount' => count(array_filter($lines, function($line) {
                    return !empty(trim($line));
                })) - 1,
                'headers' => $headers
            ];
        } catch (\Exception $e) {
            return [
                'valid' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    private function validateHeaders(array $headers): void
    {
        $requiredHeaders = [
            'Oficina',
            '1. ¿Qué tipo de operación realizó?',
            '2. Escriba el nombre del Asesor Inmobiliario que le prestó el servicio.'
        ];
        
        $missingHeaders = [];

        foreach ($requiredHeaders as $required) {
            if (!in_array($required, $headers)) {
                $missingHeaders[] = $required;
            }
        }

        if (!empty($missingHeaders)) {
            throw new \Exception('Faltan columnas requeridas: ' . implode(', ', $missingHeaders));
        }
    }

    private function mapCsvRowToEntity(array $headers, array $data): array
    {
        $mapped = [];
        
        foreach ($headers as $index => $header) {
            if (isset($this->fieldMapping[$header])) {
                $field = $this->fieldMapping[$header];
                $value = $data[$index] ?? null;
                
                $mapped[$field] = $this->normalizeValue($field, $value);
            }
        }
        
        return $mapped;
    }

    private function normalizeValue(string $field, $value)
    {
        if (empty($value) || $value === 'N/A' || $value === 'n/a') {
            return null;
        }

        $numericFields = [
            'evaluacionGeneral', 'asesoriaLegal', 'presentacionPersonal',
            'manejoDetalles', 'puntualidad', 'nivelCompromiso',
            'solucionProblemas', 'acompanamiento', 'manejoImprevistas',
            'manejoTiempos', 'percepcionGeneral', 'calificacionOficina'
        ];
        
        if (in_array($field, $numericFields)) {
            return is_numeric($value) ? (int) $value : null;
        }

        if ($field === 'recomendaria') {
            return strpos($value, 'SI') !== false;
        }

        if ($field === 'marcaTemporal' || $field === 'fechaCumpleanos') {
            return $this->parseDate($value);
        }

        if ($field === 'idOficina' || $field === 'idAsesor') {
            return is_numeric($value) ? (int) $value : null;
        }

        return trim($value);
    }

    private function parseDate($dateString)
    {
        if (empty($dateString)) {
            return null;
        }

        $formats = [
            'm/d/y H:i',
            'd/m/Y',
            'm/d/Y',
            'Y-m-d',
            'd-m-Y'
        ];

        foreach ($formats as $format) {
            $date = \DateTime::createFromFormat($format, $dateString);
            if ($date !== false) {
                return $date->format('Y-m-d H:i:s');
            }
        }
        
        return null;
    }

    private function validateRowData(array $data): array
    {
        $errors = [];

        $requiredFields = ['oficina', 'tipoOperacion', 'nombreAsesor'];
        foreach ($requiredFields as $field) {
            if (empty($data[$field])) {
                $errors[] = "Campo requerido vacío: $field";
            }
        }

        $ratingFields = [
            'evaluacionGeneral', 'asesoriaLegal', 'presentacionPersonal',
            'manejoDetalles', 'puntualidad', 'nivelCompromiso',
            'solucionProblemas', 'acompanamiento', 'manejoImprevistas',
            'manejoTiempos', 'percepcionGeneral', 'calificacionOficina'
        ];

        foreach ($ratingFields as $field) {
            if (isset($data[$field]) && $data[$field] !== null) {
                if ($data[$field] < 1 || $data[$field] > 5) {
                    $errors[] = "Calificación fuera de rango (1-5) en: $field";
                }
            }
        }

        if (!empty($data['correo']) && !filter_var($data['correo'], FILTER_VALIDATE_EMAIL)) {
            $errors[] = "Email inválido";
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }

    public function getGeneralStats(): array
    {
        $em = $this->entityManager;
        
        $total = $em->getRepository('ReportesCalidadServicio')->count();
        
        if ($total === 0) {
            return [
                'totalEncuestas' => 0,
                'promedioSatisfaccion' => 0,
                'porcentajeRecomendacion' => 0,
                'distribucionOperaciones' => [],
                'topAsesores' => []
            ];
        }
        
        $query = $em->getQueryBuilder()
            ->select()
            ->from('ReportesCalidadServicio')
            ->select(['AVG(percepcionGeneral) as avgSatisfaction'])
            ->build();
        
        $sth = $em->getQueryExecutor()->execute($query);
        $row = $sth->fetch(\PDO::FETCH_ASSOC);
        $avgSatisfaction = $row['avgSatisfaction'] ?? 0;
        
        $operacionesQuery = $em->getQueryBuilder()
            ->select()
            ->from('ReportesCalidadServicio')
            ->select(['tipoOperacion', 'COUNT(id) as total'])
            ->group('tipoOperacion')
            ->build();
        
        $sth = $em->getQueryExecutor()->execute($operacionesQuery);
        $operaciones = $sth->fetchAll(\PDO::FETCH_ASSOC);
        
        $asesoresQuery = $em->getQueryBuilder()
            ->select()
            ->from('ReportesCalidadServicio')
            ->select([
                'nombreAsesor',
                'COUNT(id) as total',
                'AVG(percepcionGeneral) as avgRating'
            ])
            ->group('nombreAsesor')
            ->order('total', 'DESC')
            ->limit(0, 5)
            ->build();
        
        $sth = $em->getQueryExecutor()->execute($asesoresQuery);
        $topAsesores = $sth->fetchAll(\PDO::FETCH_ASSOC);
        
        $recomendaciones = $em->getRepository('ReportesCalidadServicio')
            ->where(['recomendaria' => true])
            ->count();
        
        return [
            'totalEncuestas' => $total,
            'promedioSatisfaccion' => round($avgSatisfaction, 2),
            'porcentajeRecomendacion' => $total > 0 ? round(($recomendaciones / $total) * 100, 2) : 0,
            'distribucionOperaciones' => $operaciones,
            'topAsesores' => $topAsesores
        ];
    }
}