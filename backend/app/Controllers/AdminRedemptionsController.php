<?php

namespace App\Controllers;

use App\Models\RedemptionModel;
use App\Models\UserModel;
use App\Models\RewardModel;
use CodeIgniter\RESTful\ResourceController;

class AdminRedemptionsController extends ResourceController
{
    public function index()
    {
        try {
            $db      = \Config\Database::connect();
            $builder = $db->table('redemptions');

            // Select required fields for both Dashboard and Entry Codes view
            $builder->select('
                redemptions.id, 
                redemptions.created_at, 
                redemptions.status,
                users.full_name as user_name,
                users.email as user_email, 
                rewards.title as reward_name,
                rewards.type as reward_type,
                rewards.cost as points_cost
            ');
            $builder->join('users', 'users.id = redemptions.user_id', 'left');
            $builder->join('rewards', 'rewards.id = redemptions.reward_id', 'left');

            // Search Filter
            $search = $this->request->getGet('search');
            if ($search) {
                $builder->groupStart()
                    ->like('users.email', $search)
                    ->orLike('users.full_name', $search)
                    ->orLike('rewards.title', $search)
                    ->groupEnd();
            }

            // Order
            $builder->orderBy('redemptions.created_at', 'DESC');

            // Export CSV Logic
            if ($this->request->getGet('export') === 'csv') {
                $data = $builder->get()->getResultArray();

                // Helper to mask email
                $maskEmail = function ($email) {
                    if (!$email)
                        return '';
                    $parts = explode('@', $email);
                    if (count($parts) != 2)
                        return $email;
                    $name = $parts[0];
                    if (strlen($name) <= 4)
                        return str_repeat('*', strlen($name)) . '@' . $parts[1];
                    return str_repeat('*', 4) . substr($name, 4) . '@' . $parts[1];
                };

                // Generate CSV
                header('Content-Type: text/csv');
                header('Content-Disposition: attachment; filename="reporte_canjes_' . date('Y-m-d') . '.csv"');
                $out = fopen('php://output', 'w');
                fputcsv($out, ['Usuario', 'Recompensa', 'Fecha']);

                foreach ($data as $row) {
                    fputcsv($out, [
                        $maskEmail($row['user_email']),
                        $row['reward_name'],
                        date('Y-m-d', strtotime($row['created_at']))
                    ]);
                }
                fclose($out);
                exit;
            }

            // Pagination Logic
            $pageParam = $this->request->getGet('page');

            if ($pageParam === null) {
                // Return all entries when no page is specified
                $data = $builder->get()->getResultArray();
                return $this->respond($data);
            }

            $page    = (int) $pageParam;
            $perPage = (int) ($this->request->getGet('per_page') ?? 10);
            $offset  = ($page - 1) * $perPage;

            // Clone builder for counting
            $countBuilder = clone $builder;
            $total        = $countBuilder->countAllResults();

            // Fetch Data
            $data = $builder->get($perPage, $offset)->getResultArray();

            return $this->respond([
                'data'  => $data,
                'pager' => [
                    'current_page' => $page,
                    'per_page'     => $perPage,
                    'total_pages'  => ceil($total / $perPage),
                    'total_items'  => $total
                ]
            ]);

        } catch (\Exception $e) {
            log_message('error', 'AdminRedemptionsController error: ' . $e->getMessage());
            return $this->failServerError($e->getMessage());
        }
    }
}
