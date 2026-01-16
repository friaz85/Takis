<?php

namespace App\Controllers;

use App\Models\RewardModel;
use App\Models\RedemptionModel;
use App\Models\UserModel;
use CodeIgniter\RESTful\ResourceController;

class AdminStatsController extends ResourceController
{
    public function getStats()
    {
        $rewardModel     = new RewardModel();
        $redemptionModel = new RedemptionModel();
        $userModel       = new UserModel();

        $totalUsers          = $userModel->countAllResults();
        $totalRedemptions    = $redemptionModel->countAllResults();
        $totalPointsInvested = $userModel->selectSum('points')->first()['points'] ?? 0;

        // Status Distribution
        $statusCounts = $redemptionModel->select('status, COUNT(*) as count')
            ->groupBy('status')
            ->findAll();

        // Stock alerts (Low stock < 5)
        $lowStock = $rewardModel->where('stock <', 5)->findAll();

        return $this->respond([
            'kpis'                => [
                'total_users'        => $totalUsers,
                'total_redemptions'  => $totalRedemptions,
                'points_circulating' => $totalPointsInvested
            ],
            'status_distribution' => $statusCounts,
            'low_stock_alerts'    => $lowStock
        ]);
    }
}
