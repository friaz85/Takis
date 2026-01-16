<?php

namespace App\Controllers;

use CodeIgniter\RESTful\ResourceController;
use App\Models\UserModel;
use App\Models\RedemptionModel;
use App\Models\RewardModel;

class DashboardAdminController extends ResourceController
{
    public function getStats()
    {
        $db              = \Config\Database::connect();
        $userModel       = new UserModel();
        $redemptionModel = new RedemptionModel();

        // Basic Counters
        $totalUsers       = $userModel->countAllResults();
        $totalRedemptions = $redemptionModel->countAllResults();

        // Points Redeemed (estimate from completed redemptions cost)
        // Linking redemptions to rewards to sum cost
        $pointsQuery    = $db->query("SELECT SUM(r.cost) as total FROM redemptions re JOIN rewards r ON r.id = re.reward_id");
        $pointsRedeemed = $pointsQuery->getRow()->total ?? 0;

        // Top Rewards
        $topRewards = $db->query("
            SELECT r.title, COUNT(re.id) as count 
            FROM redemptions re 
            JOIN rewards r ON r.id = re.reward_id 
            GROUP BY r.id, r.title 
            ORDER BY count DESC 
            LIMIT 5
        ")->getResultArray();

        // Last 7 Days Activity
        $dailyActivity = $db->query("
            SELECT DATE(created_at) as date, COUNT(*) as count 
            FROM redemptions 
            WHERE created_at >= DATE(NOW()) - INTERVAL 7 DAY 
            GROUP BY DATE(created_at) 
            ORDER BY date ASC
        ")->getResultArray();

        // Recent Activity (Table)
        $recentActivity = $db->query("
            SELECT re.id, u.name as user, r.title as reward, re.created_at, re.status 
            FROM redemptions re 
            JOIN users u ON u.id = re.user_id 
            JOIN rewards r ON r.id = re.reward_id 
            ORDER BY re.created_at DESC 
            LIMIT 10
        ")->getResultArray();

        return $this->respond([
            'cards'       => [
                'users'       => $totalUsers,
                'redemptions' => $totalRedemptions,
                'points'      => $pointsRedeemed
            ],
            'chart'       => $dailyActivity,
            'top_rewards' => $topRewards,
            'recent'      => $recentActivity
        ]);
    }
}
