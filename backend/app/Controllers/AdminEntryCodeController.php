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
            $db = \Config\Database::connect();

            // Query to get redeemed codes with user info and IP from security logs
            // We join with security_logs where action is 'success_redeem' and details contains the code
            $builder = $db->table('promo_codes pc');
            $builder->select('pc.id, pc.code, pc.points, pc.used_at, u.full_name as user_name, u.email as user_email, sl.ip_address');
            $builder->join('users u', 'u.id = pc.used_by', 'left');

            // Subquery or Join for IP from security_logs
            // Since sl.details contains "Code: {code}", we use LIKE or a more precise join if possible
            // Re-using the logic from RedemptionController::redeemCode where it saves: 
            // 'details' => "Code: $code"
            $builder->join('security_logs sl', "sl.user_id = pc.used_by AND sl.action = 'success_redeem' AND sl.details LIKE CONCAT('%', pc.code, '%')", 'left');

            $builder->where('pc.is_used', 1);
            $builder->orderBy('pc.used_at', 'DESC');

            // Group by to avoid duplicates if multiple logs exist for some reason
            $builder->groupBy('pc.id');

            $results = $builder->get()->getResult();

            return $this->respond($results);
        } catch (\Exception $e) {
            return $this->failServerError($e->getMessage());
        }
    }
}
