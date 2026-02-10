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
            $redemptionModel = new RedemptionModel();
            $userModel       = new UserModel();
            $rewardModel     = new RewardModel();

            // Get all redemptions with related data
            $redemptions = $redemptionModel->orderBy('created_at', 'DESC')->findAll();

            // Enrich with user and reward information
            foreach ($redemptions as &$redemption) {
                // Get user info
                if ($redemption['user_id']) {
                    $user                     = $userModel->find($redemption['user_id']);
                    $redemption['user_name']  = $user['full_name'] ?? 'Usuario';
                    $redemption['user_email'] = $user['email'] ?? '';
                }

                // Get reward info
                if ($redemption['reward_id']) {
                    $reward                    = $rewardModel->find($redemption['reward_id']);
                    $redemption['reward_name'] = $reward['title'] ?? 'Recompensa';
                    $redemption['reward_type'] = $reward['type'] ?? 'physical';
                    $redemption['points_cost'] = $reward['cost'] ?? 0;
                }
            }

            return $this->respond($redemptions);
        } catch (\Exception $e) {
            log_message('error', 'AdminRedemptionsController error: ' . $e->getMessage());
            return $this->failServerError($e->getMessage());
        }
    }
}
