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

        // Type casting and remove sensitive data
        foreach ($users as &$user) {
            unset($user['password_hash']);
            unset($user['otp']);
            unset($user['otp_expiry']);
            $user['is_blocked'] = (int) ($user['is_blocked'] ?? 0);
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
