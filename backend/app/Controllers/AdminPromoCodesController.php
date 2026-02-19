<?php

namespace App\Controllers;

use App\Models\PromoCodeModel;
use App\Models\UserModel;
use CodeIgniter\RESTful\ResourceController;

class AdminPromoCodesController extends ResourceController
{
    public function index()
    {
        try {
            $db      = \Config\Database::connect();
            $builder = $db->table('promo_codes pc');

            // Select relevant fields
            $builder->select('pc.*, u.email as user_email, u.full_name as user_name');
            $builder->join('users u', 'u.id = pc.used_by', 'left');

            // Search Filter
            $search = $this->request->getVar('search');
            if (!empty($search)) {
                $builder->groupStart()
                    ->like('pc.code', $search)
                    ->orLike('u.email', $search)
                    ->orLike('u.full_name', $search)
                    ->groupEnd();
            }

            // Status Filter
            $status = $this->request->getVar('status');
            if ($status === 'used') {
                $builder->where('pc.is_used', 1);
            } elseif ($status === 'available') {
                $builder->where('pc.is_used', 0);
            }

            // Pagination Params
            $page    = max(1, (int) ($this->request->getVar('page') ?? 1));
            $perPage = max(1, (int) ($this->request->getVar('per_page') ?? 20));
            $offset  = ($page - 1) * $perPage;

            // Optimization: Clone builder specific for counting to avoid heavy Joins if not needed
            // If we are NOT searching, we don't need the JOINs to count the rows.
            $countBuilder = $db->table('promo_codes pc');

            // Re-apply filters manually to the count builder
            if ($status === 'used') {
                $countBuilder->where('pc.is_used', 1);
            } elseif ($status === 'available') {
                $countBuilder->where('pc.is_used', 0);
            }

            if (!empty($search)) {
                // Only join if searching (since search involves user fields)
                $countBuilder->join('users u', 'u.id = pc.used_by', 'left');
                $countBuilder->groupStart()
                    ->like('pc.code', $search)
                    ->orLike('u.email', $search)
                    ->orLike('u.full_name', $search)
                    ->groupEnd();
            }

            // Count Total (Optimized)
            // Use query caching if possible or simpler logic
            $total = $countBuilder->countAllResults();

            // Sorting for main query
            // Prioritize used_at desc for used codes/search, otherwise id desc
            if ($status === 'used' || !empty($search)) {
                $builder->orderBy('pc.used_at', 'DESC');
            } else {
                $builder->orderBy('pc.id', 'DESC');
            }

            // Fetch Data
            $data = $builder->get($perPage, $offset)->getResultArray();

            return $this->respond([
                'data'  => $data,
                'pager' => [
                    'current_page' => $page,
                    'per_page'     => $perPage,
                    'total_items'  => $total,
                    'total_pages'  => ceil($total / $perPage)
                ]
            ]);

        } catch (\Exception $e) {
            return $this->failServerError($e->getMessage());
        }
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
