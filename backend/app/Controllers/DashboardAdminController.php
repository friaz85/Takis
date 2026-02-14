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

        $startDate = $this->request->getGet('start_date');
        $endDate   = $this->request->getGet('end_date');

        // Base where clauses
        $userWhere             = "1=1";
        $redemptionWhere       = "1=1";
        $redemptionWhereJoined = "1=1";
        $params                = [];

        if ($startDate && $endDate) {
            $userWhere             .= " AND created_at BETWEEN ? AND ?";
            $redemptionWhere       .= " AND created_at BETWEEN ? AND ?";
            $redemptionWhereJoined .= " AND re.created_at BETWEEN ? AND ?";
            $params                 = [$startDate . ' 00:00:00', $endDate . ' 23:59:59'];
        }

        // Basic Counters (Filtered by date if provided)
        $totalUsersQuery = $db->query("SELECT COUNT(*) as total FROM users WHERE $userWhere", $params);
        $totalUsers      = $totalUsersQuery->getRow()->total ?? 0;

        $totalRedemptionsQuery = $db->query("SELECT COUNT(*) as total FROM redemptions WHERE $redemptionWhere", $params);
        $totalRedemptions      = $totalRedemptionsQuery->getRow()->total ?? 0;

        // Points Redeemed
        $pointsQuery    = $db->query("
            SELECT SUM(r.cost) as total 
            FROM redemptions re 
            JOIN rewards r ON r.id = re.reward_id
            WHERE $redemptionWhereJoined
        ", $params);
        $pointsRedeemed = $pointsQuery->getRow()->total ?? 0;

        // Top Rewards
        $topRewards = $db->query("
            SELECT r.title, COUNT(re.id) as count 
            FROM redemptions re 
            JOIN rewards r ON r.id = re.reward_id 
            WHERE $redemptionWhereJoined
            GROUP BY r.id, r.title 
            ORDER BY count DESC 
            LIMIT 5
        ", $params)->getResultArray();

        // Chart Data (Last 7 Days)
        $dates = [];
        for ($i = 6; $i >= 0; $i--) {
            $date         = date('Y-m-d', strtotime("-$i days"));
            $dates[$date] = [
                'date'  => $date,
                'count' => 0, // Redemptions
                'users' => 0  // New Users
            ];
        }

        if ($startDate && $endDate) {
            // Range selected by user
            $redemptionsByDay = $db->query("
                SELECT DATE(created_at) as date, COUNT(*) as count 
                FROM redemptions 
                WHERE created_at BETWEEN ? AND ?
                GROUP BY DATE(created_at)
            ", $params)->getResultArray();

            $usersByDay = $db->query("
                SELECT DATE(created_at) as date, COUNT(*) as count 
                FROM users 
                WHERE created_at BETWEEN ? AND ?
                GROUP BY DATE(created_at)
            ", $params)->getResultArray();

            // For custom range, we might want to rebuild the dates array if it's large,
            // but for simplicity let's just use the results.
            $customActivity = [];
            foreach ($redemptionsByDay as $row) {
                $customActivity[$row['date']]['date']  = $row['date'];
                $customActivity[$row['date']]['count'] = (int) $row['count'];
                $customActivity[$row['date']]['users'] = 0;
            }
            foreach ($usersByDay as $row) {
                if (!isset($customActivity[$row['date']])) {
                    $customActivity[$row['date']]['date']  = $row['date'];
                    $customActivity[$row['date']]['count'] = 0;
                }
                $customActivity[$row['date']]['users'] = (int) $row['count'];
            }
            ksort($customActivity);
            $dailyActivity = array_values($customActivity);
        } else {
            // Default: Last 7 Days (Structured with zeros)
            $redemptionsByDay = $db->query("
                SELECT DATE(created_at) as date, COUNT(*) as count 
                FROM redemptions 
                WHERE created_at >= DATE(NOW()) - INTERVAL 7 DAY 
                GROUP BY DATE(created_at)
            ")->getResultArray();

            $usersByDay = $db->query("
                SELECT DATE(created_at) as date, COUNT(*) as count 
                FROM users 
                WHERE created_at >= DATE(NOW()) - INTERVAL 7 DAY 
                GROUP BY DATE(created_at)
            ")->getResultArray();

            foreach ($redemptionsByDay as $row) {
                if (isset($dates[$row['date']])) {
                    $dates[$row['date']]['count'] = (int) $row['count'];
                }
            }
            foreach ($usersByDay as $row) {
                if (isset($dates[$row['date']])) {
                    $dates[$row['date']]['users'] = (int) $row['count'];
                }
            }
            $dailyActivity = array_values($dates);
        }

        // Recent Activity (Usually we don't filter recent by date range unless requested, 
        // as "recent" means the latest overall. But let's keep it latest overall for now)
        try {
            $recentActivity = $db->query("
                SELECT l.id, 
                       COALESCE(u.full_name, 'Sistema/Anónimo') as user, 
                       l.details as reward, 
                       l.action as status, 
                       l.last_attempt as created_at 
                FROM security_logs l 
                LEFT JOIN users u ON u.id = l.user_id 
                ORDER BY l.id DESC 
                LIMIT 10
            ")->getResultArray();

            if (empty($recentActivity)) {
                $recentActivity = [
                    [
                        'id'         => 0,
                        'user'       => 'Sistema',
                        'reward'     => 'Sin actividad reciente',
                        'status'     => 'info',
                        'created_at' => date('Y-m-d H:i:s')
                    ]
                ];
            }
        } catch (\Throwable $e) {
            $recentActivity = [];
        }

        // Promo Codes Stats (Full history for these counters usually)
        // Total Visits
        $totalVisits = 0;
        try {
            $visitsQuery = $db->query("SELECT COUNT(*) as total FROM site_visits");
            $totalVisits = $visitsQuery->getRow()->total ?? 0;
        } catch (\Throwable $e) {
        }

        // Promo Codes Stats - Only count USED codes (fast with index)
        // Counting all 73M records is too slow, so we only show used codes
        $usedPromoCount = $db->query("
            SELECT COUNT(*) as used
            FROM promo_codes
            WHERE is_used = 1
        ")->getRow()->used ?? 0;

        $promoStats = [
            'total'     => $usedPromoCount, // Show only used as "total" for dashboard
            'used'      => $usedPromoCount,
            'available' => 0 // Don't count available (too slow)
        ];

        // Visit Logs (Last 50)
        $visitsLog = [];
        try {
            $visitsLog = $db->query("
                SELECT v.id, v.page_url, v.ip_address, v.created_at, u.full_name as user
                FROM site_visits v
                LEFT JOIN users u ON u.id = v.user_id
                ORDER BY v.id DESC
                LIMIT 50
            ")->getResultArray();
        } catch (\Throwable $e) {
        }

        return $this->respond([
            'cards'        => [
                'users'       => $totalUsers,
                'redemptions' => $totalRedemptions,
                'points'      => $pointsRedeemed,
                'visits'      => $totalVisits,
                'promo'       => [
                    'total'     => $promoStats['total'] ?? 0,
                    'used'      => $promoStats['used'] ?? 0,
                    'available' => $promoStats['available'] ?? 0
                ]
            ],
            'chart'        => $dailyActivity,
            'top_rewards'  => $topRewards,
            'recent'       => $recentActivity,
            'visits_log'   => $visitsLog,
            'success_rate' => $this->calculateSuccessRate($db, $startDate, $endDate, $params)
        ]);
    }

    private function calculateSuccessRate($db, $startDate, $endDate, $params)
    {
        // Count successful code entries (promo_codes with is_used = 1)
        $successfulCodes = $db->query("
            SELECT COUNT(*) as total
            FROM promo_codes
            WHERE is_used = 1
        ")->getRow()->total ?? 0;

        // Count failed attempts from security_logs
        $failedAttempts = $db->query("
            SELECT COUNT(*) as total
            FROM security_logs
            WHERE action = 'code_entry_failed'
        ")->getRow()->total ?? 0;

        $totalAttempts = $successfulCodes + $failedAttempts;

        if ($totalAttempts === 0) {
            return 0;
        }

        return round(($successfulCodes / $totalAttempts) * 100, 1);
    }
}
