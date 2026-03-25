<?php

namespace App\Controllers;

use App\Models\PromoCodeModel;
use App\Models\UserModel;
use CodeIgniter\RESTful\ResourceController;

class AdminPromoCodesController extends ResourceController
{
    public function index()
    {
        $db = \Config\Database::connect();
        
        // Query Params
        $status = $this->request->getVar('status') ?? 'used';
        $search = $this->request->getVar('search');
        $page   = intval($this->request->getVar('page') ?? 1);
        $limit  = intval($this->request->getVar('limit') ?? 50);
        $offset = ($page - 1) * $limit;

        // Base builder for data (join users)
        $builder = $db->table('promo_codes pc');
        $builder->select('pc.*, u.full_name as user_name, u.email as user_email');
        $builder->join('users u', 'u.id = pc.used_by', 'left');

        // Simple builder for counting (no joins for speed)
        $countBuilder = $db->table('promo_codes');

        // Apply Filters
        if ($status === 'available') {
            $builder->where('pc.is_used', 0);
            $countBuilder->where('is_used', 0);
        } elseif ($status === 'used') {
            $builder->where('pc.is_used', 1);
            $countBuilder->where('is_used', 1);
        }

        if (!empty($search)) {
            $builder->groupStart()
                ->like('pc.code', $search)
                ->orLike('u.full_name', $search)
                ->orLike('u.email', $search)
                ->groupEnd();
            
            // Search counts are expensive on 73M rows. 
            // We clone the main builder (with joins) only if searching.
            $searchCountBuilder = clone $builder;
            $total = $searchCountBuilder->countAllResults(false);
        } else {
            // Fast count using index on is_used
            $total = $countBuilder->countAllResults(false);
        }

        // Apply logic to fetch only what's needed for the grid
        $builder->orderBy('pc.used_at', 'DESC');
        $builder->limit($limit, $offset);

        $codes = $builder->get()->getResult();

        // Avoid heavy global counts on every request. 
        // Return 0 for these unless we implement a cache.
        return $this->respond([
            'data'            => $codes,
            'total'           => $total,
            'total_available' => ($status === 'available') ? $total : 0,
            'total_used'      => ($status === 'used') ? $total : 0,
            'page'            => $page,
            'limit'           => $limit
        ]);
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
