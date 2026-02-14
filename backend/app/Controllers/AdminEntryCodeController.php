<?php

namespace App\Controllers;

use App\Models\PromoCodeModel;
use App\Models\UserModel;
use CodeIgniter\RESTful\ResourceController;

class AdminEntryCodeController extends ResourceController
{
    public function index()
    {
        try {
            $db      = \Config\Database::connect();
            $builder = $db->table('promo_codes pc');

            // Query Params
            $search = $this->request->getVar('search');
            $page   = intval($this->request->getVar('page') ?? 1);
            $limit  = intval($this->request->getVar('limit') ?? 50);
            $offset = ($page - 1) * $limit;

            $builder->select('pc.id, pc.code, pc.points, pc.used_at, pc.used_ip as ip_address, u.full_name as user_name, u.email as user_email');
            $builder->join('users u', 'u.id = pc.used_by', 'left');

            $builder->where('pc.is_used', 1);

            if (!empty($search)) {
                $builder->groupStart()
                    ->like('pc.code', $search)
                    ->orLike('u.full_name', $search)
                    ->orLike('u.email', $search)
                    ->groupEnd();
            }

            // Clone for total
            $countBuilder = clone $builder;
            $total        = $countBuilder->countAllResults(false);

            $builder->orderBy('pc.used_at', 'DESC');
            $builder->limit($limit, $offset);

            $results = $builder->get()->getResult();

            return $this->respond([
                'data'  => $results,
                'total' => $total,
                'page'  => $page,
                'limit' => $limit
            ]);
        } catch (\Exception $e) {
            return $this->failServerError($e->getMessage());
        }
    }
}
