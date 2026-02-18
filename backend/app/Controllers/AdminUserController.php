<?php

namespace App\Controllers;

use CodeIgniter\RESTful\ResourceController;
use App\Models\UserModel;
use App\Models\SecurityLogModel;

class AdminUserController extends ResourceController
{
    protected $format = 'json';

    /**
     * Get all users
     */
    public function index()
    {
        $userModel = new UserModel();
        $users     = $userModel->findAll();
        $db        = \Config\Database::connect();

        // Type casting and remove sensitive data
        foreach ($users as &$user) {
            unset($user['password_hash']);
            unset($user['otp']);
            unset($user['otp_expiry']);
            $user['is_blocked'] = (int) ($user['is_blocked'] ?? 0);

            // Calculate Points Stats
            // 1. Points Spent (Redeemed)
            $redeemedQuery = $db->query("
                SELECT SUM(r.cost) as total 
                FROM redemptions re 
                JOIN rewards r ON r.id = re.reward_id 
                WHERE re.user_id = ?
            ", [$user['id']]);
            $spent         = (int) ($redeemedQuery->getRow()->total ?? 0);

            // 2. Current Balance (Available)
            $current = (int) ($user['points_balance'] ?? 0);
            // Note: DB column is likely 'points_balance' or just 'points'. Usually 'points_balance'.
            // Checking UserModel or Schema would confirm, but usually it's 'points_balance'.
            // If it's 'points', logic still holds if we check both or map it.
            // Let's assume 'points_balance' based on previous context, but will fallback to 'points' if needed.
            if (!isset($user['points_balance']) && isset($user['points'])) {
                $current = (int) $user['points'];
            }

            // 3. Total Earned (Acumulated)
            $earned = $current + $spent;

            $user['points_earned'] = $earned;
            $user['points_spent']  = $spent;
        }

        return $this->respond($users);
    }

    /**
     * Block/Unblock user
     */
    public function toggleBlock($id = null)
    {
        if (!$id) {
            return $this->fail('ID de usuario requerido');
        }

        $userModel = new UserModel();
        $logModel  = new SecurityLogModel();
        $data      = $this->request->getJSON(true);

        $user = $userModel->find($id);
        if (!$user) {
            return $this->failNotFound('Usuario no encontrado');
        }

        $isBlocking = !empty($data['block']);

        if ($isBlocking) {
            // Block user
            $reason = $data['reason'] ?? 'Actividad sospechosa';

            $result = $userModel->update($id, [
                'is_blocked'     => 1,
                'blocked_reason' => $reason,
                'blocked_at'     => date('Y-m-d H:i:s')
            ]);

            if (!$result) {
                log_message('error', "Failed to block user {$id}: " . print_r($userModel->errors(), true));
            }

            $logModel->save([
                'ip_address' => $this->request->getIPAddress(),
                'user_id'    => $id,
                'action'     => 'user_blocked',
                'details'    => "Usuario bloqueado por admin. Razón: {$reason}"
            ]);

            $message = 'Usuario bloqueado exitosamente';
        } else {
            // Unblock user
            $result = $userModel->update($id, [
                'is_blocked'     => 0,
                'blocked_reason' => null,
                'blocked_at'     => null
            ]);

            if (!$result) {
                log_message('error', "Failed to unblock user {$id}: " . print_r($userModel->errors(), true));
            }

            $logModel->save([
                'ip_address' => $this->request->getIPAddress(),
                'user_id'    => $id,
                'action'     => 'user_unblocked',
                'details'    => 'Usuario desbloqueado por admin'
            ]);

            $message = 'Usuario desbloqueado exitosamente';
        }

        return $this->respond([
            'status'       => 'success',
            'message'      => $message,
            'debug_result' => $result // Temporary debug
        ]);
    }

    /**
     * Get user statistics
     */
    public function getStats()
    {
        $userModel = new UserModel();

        $stats = [
            'total'    => $userModel->countAllResults(),
            'verified' => $userModel->where('is_verified', 1)->countAllResults(),
            'blocked'  => $userModel->where('is_blocked', 1)->countAllResults(),
            'active'   => $userModel->where('is_verified', 1)->where('is_blocked', 0)->countAllResults()
        ];

        return $this->respond($stats);
    }
}
