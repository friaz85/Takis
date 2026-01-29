<?php

namespace App\Controllers;

use App\Models\PromoCodeModel;
use App\Models\UserModel;
use CodeIgniter\RESTful\ResourceController;

class AdminPromoCodesController extends ResourceController
{
    public function index()
    {
        $promoModel = new PromoCodeModel();
        $userModel  = new UserModel();

        $codes = $promoModel->orderBy('created_at', 'DESC')->findAll();

        // Enrich with user names
        foreach ($codes as &$code) {
            if ($code['used_by']) {
                $user              = $userModel->find($code['used_by']);
                $code['user_name'] = $user['full_name'] ?? $user['email'] ?? 'Usuario';
            }
        }

        return $this->respond($codes);
    }

    public function generate()
    {
        $count  = $this->request->getVar('count');
        $points = $this->request->getVar('points') ?? 1;
        $prefix = $this->request->getVar('prefix') ?? 'TAKIS';

        if (!$count || $count < 1 || $count > 10000) {
            return $this->fail('Cantidad inválida (1-10000)');
        }

        $promoModel = new PromoCodeModel();
        $generated  = 0;

        for ($i = 0; $i < $count; $i++) {
            $code = $this->generateUniqueCode($prefix);

            $data = [
                'code'    => $code,
                'points'  => $points,
                'is_used' => 0
            ];

            if ($promoModel->save($data)) {
                $generated++;
            }
        }

        return $this->respond([
            'status'    => 'success',
            'generated' => $generated,
            'message'   => "$generated códigos generados"
        ]);
    }

    public function upload()
    {
        $file = $this->request->getFile('file');

        if (!$file || !$file->isValid()) {
            return $this->fail('Archivo inválido');
        }

        if ($file->getExtension() !== 'csv') {
            return $this->fail('Solo se permiten archivos CSV');
        }

        $promoModel = new PromoCodeModel();
        $imported   = 0;
        $errors     = [];

        if (($handle = fopen($file->getTempName(), 'r')) !== FALSE) {
            // Skip header row
            $header = fgetcsv($handle);

            while (($row = fgetcsv($handle)) !== FALSE) {
                if (count($row) < 2)
                    continue;

                $code   = trim($row[0]);
                $points = intval($row[1]);

                if (empty($code))
                    continue;

                // Check if code already exists
                if ($promoModel->where('code', $code)->first()) {
                    $errors[] = "Código duplicado: $code";
                    continue;
                }

                $data = [
                    'code'    => $code,
                    'points'  => $points > 0 ? $points : 1,
                    'is_used' => 0
                ];

                if ($promoModel->save($data)) {
                    $imported++;
                }
            }
            fclose($handle);
        }

        return $this->respond([
            'status'   => 'success',
            'imported' => $imported,
            'errors'   => $errors,
            'message'  => "$imported códigos importados"
        ]);
    }

    private function generateUniqueCode($prefix)
    {
        $promoModel = new PromoCodeModel();

        do {
            $part1 = strtoupper(substr(md5(uniqid()), 0, 3));
            $part2 = strtoupper(substr(md5(uniqid()), 0, 3));
            $code  = "$prefix-$part1-$part2";

            $exists = $promoModel->where('code', $code)->first();
        } while ($exists);

        return $code;
    }
}
